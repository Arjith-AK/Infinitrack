import { useEffect, useRef, useCallback, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import type { GeoCoordinate, GeneratedField, MapStyle } from '@/types';
import { calculatePolygonMetrics } from '@/utils/geo/polygonMetrics';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// 'hybrid' (satellite + Google's road/path/POI vector overlay) can render
// unrelated real-world features -- footpaths, property lines, place
// outlines -- directly on top of the ground the user is trying to mark,
// which is easy to mistake for something the app drew. Plain 'satellite'
// is pure imagery with no overlay, so nothing but the actual generated
// field lines and the drawn boundary ever appears on the map.
const MAP_TYPE_IDS: Record<MapStyle, google.maps.MapTypeId | string> = {
  satellite: 'satellite',
  terrain: 'terrain',
  street: 'roadmap',
};

// Clicking within this distance of the first vertex closes the polygon.
// A double-click also delivers two near-identical 'click' events right
// before it fires -- the same threshold is used to drop that trailing
// duplicate so it doesn't leave a zero-length edge behind.
const CLOSE_VERTEX_THRESHOLD_METERS = 1.5;

let loaderPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (!loaderPromise) {
    setOptions({ key: GOOGLE_MAPS_API_KEY, v: 'weekly', libraries: ['geometry'] });
    loaderPromise = Promise.all([importLibrary('maps'), importLibrary('geometry')]).then(() => undefined);
  }
  return loaderPromise;
}

type DrawMode =
  | 'idle'
  | 'draw_polygon'
  | 'draw_rectangle'
  | 'draw_square'
  | 'draw_circle'
  | 'draw_oval'
  | 'edit'
  | 'measure';

interface UseMapOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  center?: GeoCoordinate;
  zoom?: number;
  mapStyle?: MapStyle;
  onPolygonChange?: (coords: GeoCoordinate[] | null) => void;
  onDrawError?: (message: string) => void;
  fieldOverlay?: GeneratedField | null;
  robotPosition?: GeoCoordinate;
}

export function useMap({
  containerRef,
  center = { lat: 28.6139, lng: 77.209 },
  zoom = 18,
  mapStyle = 'satellite',
  onPolygonChange,
  onDrawError,
  fieldOverlay,
  robotPosition,
}: UseMapOptions) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const liveDrawPolygonRef = useRef<google.maps.Polygon | null>(null);
  const fieldLinesRef = useRef<google.maps.Polyline[]>([]);
  const robotMarkerRef = useRef<google.maps.Marker | null>(null);
  const measureLineRef = useRef<google.maps.Polyline | null>(null);
  const drawListenersRef = useRef<google.maps.MapsEventListener[]>([]);
  // Mutable vertex lists for the shape currently being drawn, kept in refs
  // so `undo` can pop the last point without re-wiring the click handlers.
  const activeDrawPointsRef = useRef<google.maps.LatLng[] | null>(null);
  const activeMeasurePointsRef = useRef<google.maps.LatLng[] | null>(null);
  // Points at the currently active draw/measure session's `finish` callback,
  // so a toolbar button can close the shape without relying on the user
  // double-clicking (a fragile gesture at tight zoom levels).
  const activeFinishRef = useRef<(() => void) | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [drawMode, setDrawMode] = useState<DrawMode>('idle');
  const [measuredDistance, setMeasuredDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(
    GOOGLE_MAPS_API_KEY
      ? null
      : 'Google Maps API key is not configured. Set VITE_GOOGLE_MAPS_API_KEY in your .env file.',
  );

  const onPolygonChangeRef = useRef(onPolygonChange);
  onPolygonChangeRef.current = onPolygonChange;
  const onDrawErrorRef = useRef(onDrawError);
  onDrawErrorRef.current = onDrawError;

  const emitPolygonChange = useCallback(() => {
    const polygon = polygonRef.current;
    if (!polygon) {
      onPolygonChangeRef.current?.(null);
      return;
    }
    const coords: GeoCoordinate[] = [];
    polygon.getPath().forEach((latLng) => coords.push({ lat: latLng.lat(), lng: latLng.lng() }));
    onPolygonChangeRef.current?.(coords);
  }, []);

  const attachPolygonListeners = useCallback(
    (polygon: google.maps.Polygon) => {
      const path = polygon.getPath();
      google.maps.event.addListener(path, 'insert_at', emitPolygonChange);
      google.maps.event.addListener(path, 'set_at', emitPolygonChange);
      google.maps.event.addListener(path, 'remove_at', emitPolygonChange);
    },
    [emitPolygonChange],
  );

  const stopActiveDrawing = useCallback(() => {
    drawListenersRef.current.forEach((listener) => listener.remove());
    drawListenersRef.current = [];
    mapRef.current?.setOptions({ disableDoubleClickZoom: false });
  }, []);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || !containerRef.current || mapRef.current) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        const map = new google.maps.Map(containerRef.current, {
          center,
          zoom,
          mapTypeId: MAP_TYPE_IDS[mapStyle],
          disableDefaultUI: false,
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
          zoomControl: true,
          scaleControl: true,
        });

        const robotMarker = new google.maps.Marker({
          position: center,
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
        });

        mapRef.current = map;
        robotMarkerRef.current = robotMarker;
        setIsReady(true);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load Google Maps');
      });

    return () => {
      cancelled = true;
    };
  }, [containerRef, center.lat, center.lng, zoom, mapStyle]);

  useEffect(() => {
    if (!isReady || !mapRef.current) return;

    fieldLinesRef.current.forEach((line) => line.setMap(null));
    fieldLinesRef.current = [];

    if (!fieldOverlay) return;

    fieldLinesRef.current = fieldOverlay.lines.map(
      (line) =>
        new google.maps.Polyline({
          path: line.coordinates.map((c) => ({ lat: c.lat, lng: c.lng })),
          map: mapRef.current!,
          strokeColor: '#ffffff',
          strokeOpacity: 0.9,
          strokeWeight: 2,
        }),
    );
  }, [fieldOverlay, isReady]);

  useEffect(() => {
    if (!isReady || !robotMarkerRef.current || !robotPosition) return;
    robotMarkerRef.current.setPosition(robotPosition);
  }, [robotPosition, isReady]);

  const startDrawPolygon = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Arming the tool must not destroy an already-finished polygon -- a
    // stray re-click of "Draw Polygon" (easy to do out of habit) used to
    // wipe the selection and its metrics instantly, silently re-disabling
    // "Generate Layout" with no feedback. The existing polygon now stays on
    // the map and `metrics` stays valid until the user actually places the
    // first point of a new one.
    stopActiveDrawing();
    liveDrawPolygonRef.current?.setMap(null);
    liveDrawPolygonRef.current = null;
    activeDrawPointsRef.current = null;
    measureLineRef.current?.setMap(null);
    measureLineRef.current = null;
    activeMeasurePointsRef.current = null;
    activeFinishRef.current = null;
    setMeasuredDistance(null);

    map.setOptions({ disableDoubleClickZoom: true });

    const points: google.maps.LatLng[] = [];
    activeDrawPointsRef.current = points;
    const livePolygon = new google.maps.Polygon({
      map,
      paths: points,
      fillColor: '#3b82f6',
      fillOpacity: 0.15,
      strokeColor: '#3b82f6',
      strokeWeight: 2,
      clickable: false,
    });
    liveDrawPolygonRef.current = livePolygon;

    const finish = () => {
      stopActiveDrawing();
      activeDrawPointsRef.current = null;
      liveDrawPolygonRef.current = null;
      activeFinishRef.current = null;
      if (points.length < 3) {
        livePolygon.setMap(null);
        setDrawMode('idle');
        onDrawErrorRef.current?.('Add at least 3 points before finishing a polygon.');
        return;
      }
      livePolygon.setEditable(true);
      polygonRef.current = livePolygon;
      attachPolygonListeners(livePolygon);
      emitPolygonChange();
      setDrawMode('edit');
    };

    const clickListener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const latLng = e.latLng;

      if (
        points.length >= 3 &&
        google.maps.geometry.spherical.computeDistanceBetween(latLng, points[0]) <
          CLOSE_VERTEX_THRESHOLD_METERS
      ) {
        finish();
        return;
      }

      if (points.length === 0 && polygonRef.current) {
        polygonRef.current.setMap(null);
        polygonRef.current = null;
        onPolygonChangeRef.current?.(null);
      }

      points.push(latLng);
      livePolygon.setPath(points);
    });

    const dblClickListener = map.addListener('dblclick', () => {
      if (points.length >= 4) {
        const last = points[points.length - 1];
        const prev = points[points.length - 2];
        if (google.maps.geometry.spherical.computeDistanceBetween(last, prev) < CLOSE_VERTEX_THRESHOLD_METERS) {
          points.pop();
          livePolygon.setPath(points);
        }
      }
      finish();
    });

    drawListenersRef.current = [clickListener, dblClickListener];
    activeFinishRef.current = finish;
    setDrawMode('draw_polygon');
  }, [attachPolygonListeners, emitPolygonChange, stopActiveDrawing]);

  // Shared plumbing for the fixed-shape tools (rectangle/square/circle/oval):
  // click once to place the first corner/center, move the mouse for a live
  // preview, click again to commit. `computePath` turns those two raw clicks
  // into the shape's vertex ring; everything else about wiring up the draw
  // session is identical across shapes.
  const startTwoPointShape = useCallback(
    (computePath: (p1: google.maps.LatLng, p2: google.maps.LatLng) => google.maps.LatLng[], mode: DrawMode) => {
      const map = mapRef.current;
      if (!map) return;

      stopActiveDrawing();
      liveDrawPolygonRef.current?.setMap(null);
      liveDrawPolygonRef.current = null;
      activeDrawPointsRef.current = null;
      measureLineRef.current?.setMap(null);
      measureLineRef.current = null;
      activeMeasurePointsRef.current = null;
      activeFinishRef.current = null;
      setMeasuredDistance(null);

      map.setOptions({ disableDoubleClickZoom: true });

      let firstPoint: google.maps.LatLng | null = null;
      let livePolygon: google.maps.Polygon | null = null;

      const clickListener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;

        if (!firstPoint) {
          // Only now commit to replacing an already-finished shape -- arming
          // the tool shouldn't destroy the existing selection by itself.
          polygonRef.current?.setMap(null);
          polygonRef.current = null;
          onPolygonChangeRef.current?.(null);

          firstPoint = e.latLng;
          livePolygon = new google.maps.Polygon({
            map,
            paths: [],
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            strokeColor: '#3b82f6',
            strokeWeight: 2,
            clickable: false,
          });
          liveDrawPolygonRef.current = livePolygon;
          return;
        }

        const path = computePath(firstPoint, e.latLng);
        livePolygon!.setPath(path);
        stopActiveDrawing();
        liveDrawPolygonRef.current = null;
        livePolygon!.setEditable(true);
        polygonRef.current = livePolygon!;
        attachPolygonListeners(livePolygon!);
        emitPolygonChange();
        setDrawMode('edit');
      });

      const moveListener = map.addListener('mousemove', (e: google.maps.MapMouseEvent) => {
        if (!firstPoint || !livePolygon || !e.latLng) return;
        livePolygon.setPath(computePath(firstPoint, e.latLng));
      });

      drawListenersRef.current = [clickListener, moveListener];
      setDrawMode(mode);
    },
    [attachPolygonListeners, emitPolygonChange, stopActiveDrawing],
  );

  const startDrawRectangle = useCallback(() => {
    startTwoPointShape(
      (p1, p2) => [
        new google.maps.LatLng(p1.lat(), p1.lng()),
        new google.maps.LatLng(p1.lat(), p2.lng()),
        new google.maps.LatLng(p2.lat(), p2.lng()),
        new google.maps.LatLng(p2.lat(), p1.lng()),
      ],
      'draw_rectangle',
    );
  }, [startTwoPointShape]);

  const startDrawSquare = useCallback(() => {
    startTwoPointShape((p1, p2) => {
      const dNS = google.maps.geometry.spherical.computeDistanceBetween(
        p1,
        new google.maps.LatLng(p2.lat(), p1.lng()),
      );
      const dEW = google.maps.geometry.spherical.computeDistanceBetween(
        p1,
        new google.maps.LatLng(p1.lat(), p2.lng()),
      );
      const side = Math.max(dNS, dEW, 0.5);
      const headingNS = p2.lat() >= p1.lat() ? 0 : 180;
      const headingEW = p2.lng() >= p1.lng() ? 90 : 270;

      const c2 = google.maps.geometry.spherical.computeOffset(p1, side, headingNS);
      const c4 = google.maps.geometry.spherical.computeOffset(p1, side, headingEW);
      const c3 = google.maps.geometry.spherical.computeOffset(c2, side, headingEW);
      return [p1, c4, c3, c2];
    }, 'draw_square');
  }, [startTwoPointShape]);

  const startDrawCircle = useCallback(() => {
    startTwoPointShape((p1, p2) => {
      const radius = Math.max(google.maps.geometry.spherical.computeDistanceBetween(p1, p2), 0.5);
      const segments = 64;
      const points: google.maps.LatLng[] = [];
      for (let i = 0; i < segments; i++) {
        points.push(google.maps.geometry.spherical.computeOffset(p1, radius, (i / segments) * 360));
      }
      return points;
    }, 'draw_circle');
  }, [startTwoPointShape]);

  const startDrawOval = useCallback(() => {
    startTwoPointShape((p1, p2) => {
      const dNS = google.maps.geometry.spherical.computeDistanceBetween(
        p1,
        new google.maps.LatLng(p2.lat(), p1.lng()),
      );
      const dEW = google.maps.geometry.spherical.computeDistanceBetween(
        p1,
        new google.maps.LatLng(p1.lat(), p2.lng()),
      );
      const semiMinor = Math.max(dNS / 2, 0.5);
      const semiMajor = Math.max(dEW / 2, 0.5);

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(p1);
      bounds.extend(p2);
      const center = bounds.getCenter();

      const segments = 64;
      const points: google.maps.LatLng[] = [];
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * 2 * Math.PI;
        const y = semiMinor * Math.sin(t);
        const x = semiMajor * Math.cos(t);
        const afterNS = google.maps.geometry.spherical.computeOffset(center, Math.abs(y), y >= 0 ? 0 : 180);
        points.push(google.maps.geometry.spherical.computeOffset(afterNS, Math.abs(x), x >= 0 ? 90 : 270));
      }
      return points;
    }, 'draw_oval');
  }, [startTwoPointShape]);

  const startEdit = useCallback(() => {
    stopActiveDrawing();
    activeFinishRef.current = null;
    if (polygonRef.current) {
      polygonRef.current.setEditable(true);
      setDrawMode('edit');
    }
  }, [stopActiveDrawing]);

  const clearDraw = useCallback(() => {
    stopActiveDrawing();
    activeDrawPointsRef.current = null;
    activeMeasurePointsRef.current = null;
    activeFinishRef.current = null;
    polygonRef.current?.setMap(null);
    polygonRef.current = null;
    liveDrawPolygonRef.current?.setMap(null);
    liveDrawPolygonRef.current = null;
    measureLineRef.current?.setMap(null);
    measureLineRef.current = null;
    setMeasuredDistance(null);
    setDrawMode('idle');
    onPolygonChangeRef.current?.(null);
  }, [stopActiveDrawing]);

  // Removes the last placed vertex while a polygon or measurement is being
  // actively drawn. Outside of active drawing there is nothing to step
  // back through, so it falls back to clearing the finished shape (the
  // toolbar's dedicated Clear button does the same thing explicitly).
  const undo = useCallback(() => {
    if (drawMode === 'draw_polygon' && activeDrawPointsRef.current) {
      const points = activeDrawPointsRef.current;
      points.pop();
      liveDrawPolygonRef.current?.setPath(points);
      return;
    }
    if (drawMode === 'measure' && activeMeasurePointsRef.current) {
      const points = activeMeasurePointsRef.current;
      points.pop();
      measureLineRef.current?.setPath(points);
      return;
    }
    clearDraw();
  }, [drawMode, clearDraw]);

  // Explicitly closes the polygon/measurement currently being drawn, using
  // whatever points have been placed so far. Exists so finishing never
  // depends solely on a double-click landing correctly, which is easy to
  // miss (or mis-time) especially at a tight zoom level.
  const finishActiveDrawing = useCallback(() => {
    activeFinishRef.current?.();
  }, []);

  const locateRobot = useCallback(() => {
    if (robotPosition && mapRef.current) {
      mapRef.current.panTo(robotPosition);
      mapRef.current.setZoom(19);
    }
  }, [robotPosition]);

  const locateUser = useCallback(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      mapRef.current?.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      mapRef.current?.setZoom(19);
    });
  }, []);

  const setMapStyle = useCallback((style: MapStyle) => {
    mapRef.current?.setMapTypeId(MAP_TYPE_IDS[style]);
  }, []);

  const measureDistance = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    stopActiveDrawing();
    measureLineRef.current?.setMap(null);
    measureLineRef.current = null;
    activeMeasurePointsRef.current = null;
    liveDrawPolygonRef.current?.setMap(null);
    liveDrawPolygonRef.current = null;
    activeDrawPointsRef.current = null;
    activeFinishRef.current = null;
    setMeasuredDistance(null);

    map.setOptions({ disableDoubleClickZoom: true });

    const points: google.maps.LatLng[] = [];
    activeMeasurePointsRef.current = points;
    const liveLine = new google.maps.Polyline({
      map,
      path: points,
      strokeColor: '#f59e0b',
      strokeWeight: 2,
      clickable: false,
    });
    measureLineRef.current = liveLine;

    const finish = () => {
      stopActiveDrawing();
      activeMeasurePointsRef.current = null;
      activeFinishRef.current = null;
      if (points.length < 2) {
        liveLine.setMap(null);
        measureLineRef.current = null;
      } else {
        setMeasuredDistance(google.maps.geometry.spherical.computeLength(points));
      }
      setDrawMode('idle');
    };

    const clickListener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      points.push(e.latLng);
      liveLine.setPath(points);
    });

    const dblClickListener = map.addListener('dblclick', () => {
      if (points.length >= 3) {
        const last = points[points.length - 1];
        const prev = points[points.length - 2];
        if (google.maps.geometry.spherical.computeDistanceBetween(last, prev) < CLOSE_VERTEX_THRESHOLD_METERS) {
          points.pop();
          liveLine.setPath(points);
        }
      }
      finish();
    });

    drawListenersRef.current = [clickListener, dblClickListener];
    activeFinishRef.current = finish;
    setDrawMode('measure');
  }, [stopActiveDrawing]);

  return {
    map: mapRef.current,
    isReady,
    error,
    drawMode,
    measuredDistance,
    startDrawPolygon,
    startDrawRectangle,
    startDrawSquare,
    startDrawCircle,
    startDrawOval,
    startEdit,
    clearDraw,
    undo,
    finishActiveDrawing,
    locateRobot,
    locateUser,
    setMapStyle,
    measureDistance,
  };
}

export function usePolygonMetrics(coords: GeoCoordinate[] | null) {
  if (!coords || coords.length < 3) return null;
  return calculatePolygonMetrics(coords);
}

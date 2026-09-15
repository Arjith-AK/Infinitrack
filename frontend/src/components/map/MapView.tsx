import { useRef } from 'react';
import {
  HiOutlinePencil,
  HiOutlineCursorClick,
  HiOutlineRefresh,
  HiOutlineTrash,
  HiOutlineScale,
  HiOutlineLocationMarker,
  HiOutlineGlobeAlt,
  HiOutlineCheck,
} from 'react-icons/hi';
import { Button } from '@/components/ui/Button';
import { useMap } from '@/hooks/useMap';
import { formatDistance } from '@/utils';
import type { GeoCoordinate, GeneratedField, MapStyle } from '@/types';

interface MapViewProps {
  onPolygonChange?: (coords: GeoCoordinate[] | null) => void;
  onDrawError?: (message: string) => void;
  fieldOverlay?: GeneratedField | null;
  robotPosition?: GeoCoordinate;
  mapStyle?: MapStyle;
  className?: string;
}

export function MapView({
  onPolygonChange,
  onDrawError,
  fieldOverlay,
  robotPosition,
  mapStyle = 'satellite',
  className,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
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
    measureDistance,
  } = useMap({
    containerRef,
    onPolygonChange,
    onDrawError,
    fieldOverlay,
    robotPosition,
    mapStyle,
  });

  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
      <div ref={containerRef} className="absolute inset-0 rounded-xl overflow-hidden" />

      {!error && (
        <div className="absolute top-3 left-14 flex flex-wrap gap-1.5 z-10 max-w-[calc(100%-20.5rem)]">
          <MapToolButton icon={<HiOutlinePencil />} label="Draw Polygon" onClick={startDrawPolygon} />
          <MapToolButton icon={<ShapeIcon className="w-4 h-2.5" />} label="Draw Rectangle" onClick={startDrawRectangle} />
          <MapToolButton icon={<ShapeIcon className="w-3 h-3" />} label="Draw Square" onClick={startDrawSquare} />
          <MapToolButton icon={<ShapeIcon className="w-3 h-3 rounded-full" />} label="Draw Circle" onClick={startDrawCircle} />
          <MapToolButton icon={<ShapeIcon className="w-4 h-2.5 rounded-full" />} label="Draw Oval" onClick={startDrawOval} />
          {(drawMode === 'draw_polygon' || drawMode === 'measure') && (
            <MapToolButton icon={<HiOutlineCheck />} label="Finish" onClick={finishActiveDrawing} variant="success" />
          )}
          <MapToolButton icon={<HiOutlineCursorClick />} label="Edit Points" onClick={startEdit} />
          <MapToolButton icon={<HiOutlineRefresh />} label="Undo" onClick={undo} />
          <MapToolButton icon={<HiOutlineTrash />} label="Clear" onClick={clearDraw} variant="danger" />
          <MapToolButton icon={<HiOutlineScale />} label="Measure" onClick={measureDistance} />
          <MapToolButton icon={<HiOutlineLocationMarker />} label="Center Robot" onClick={locateRobot} />
          <MapToolButton icon={<HiOutlineGlobeAlt />} label="Locate Me" onClick={locateUser} />
        </div>
      )}

      {measuredDistance != null && (
        <div className="absolute top-14 left-14 z-10 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-card border border-white/10 text-white backdrop-blur-xl">
          Measured: {formatDistance(measuredDistance)}
        </div>
      )}

      {drawMode === 'draw_polygon' && (
        <div className="absolute top-14 left-14 z-10 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-card border border-white/10 text-white backdrop-blur-xl">
          Click to add points, then click Finish (or double-click) to close the polygon
        </div>
      )}
      {drawMode === 'measure' && (
        <div className="absolute top-14 left-14 z-10 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-card border border-white/10 text-white backdrop-blur-xl">
          Click to add points, then click Finish (or double-click) to complete the measurement
        </div>
      )}
      {drawMode === 'draw_rectangle' && (
        <div className="absolute top-14 left-14 z-10 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-card border border-white/10 text-white backdrop-blur-xl">
          Click one corner, then click the opposite corner to complete the rectangle
        </div>
      )}
      {drawMode === 'draw_square' && (
        <div className="absolute top-14 left-14 z-10 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-card border border-white/10 text-white backdrop-blur-xl">
          Click one corner, then click again to set the size of the square
        </div>
      )}
      {drawMode === 'draw_circle' && (
        <div className="absolute top-14 left-14 z-10 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-card border border-white/10 text-white backdrop-blur-xl">
          Click the center, then click again to set the radius
        </div>
      )}
      {drawMode === 'draw_oval' && (
        <div className="absolute top-14 left-14 z-10 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-card border border-white/10 text-white backdrop-blur-xl">
          Click one corner of the bounding box, then click the opposite corner to complete the oval
        </div>
      )}

      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-dark/80 rounded-xl p-6">
          <div className="text-center max-w-sm">
            <p className="text-sm font-medium text-white/70">Map unavailable</p>
            <p className="text-xs text-white/40 mt-1">{error}</p>
          </div>
        </div>
      ) : (
        !isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-dark/80 rounded-xl">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-white/50">Loading map...</p>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function ShapeIcon({ className }: { className: string }) {
  return <div className={`border-2 border-current shrink-0 ${className}`} />;
}

function MapToolButton({
  icon,
  label,
  onClick,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'danger' | 'success';
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
        backdrop-blur-xl border transition-all duration-200
        ${variant === 'danger'
          ? 'bg-red-600/80 border-red-500/30 text-white hover:bg-red-500'
          : variant === 'success'
            ? 'bg-emerald-600/80 border-emerald-500/30 text-white hover:bg-emerald-500'
            : 'bg-surface-card border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
        }`}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

export function MapToolbar({
  onDrawPolygon,
  onEdit,
  onUndo,
  onClear,
  onMeasure,
  onLocateRobot,
  onLocateUser,
}: {
  onDrawPolygon: () => void;
  onEdit: () => void;
  onUndo: () => void;
  onClear: () => void;
  onMeasure: () => void;
  onLocateRobot: () => void;
  onLocateUser: () => void;
}) {
  const tools = [
    { icon: HiOutlinePencil, label: 'Draw Polygon', action: onDrawPolygon },
    { icon: HiOutlineCursorClick, label: 'Edit Points', action: onEdit },
    { icon: HiOutlineRefresh, label: 'Undo', action: onUndo },
    { icon: HiOutlineTrash, label: 'Clear', action: onClear },
    { icon: HiOutlineScale, label: 'Measure', action: onMeasure },
    { icon: HiOutlineLocationMarker, label: 'Center Robot', action: onLocateRobot },
    { icon: HiOutlineGlobeAlt, label: 'Locate Me', action: onLocateUser },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tools.map((tool) => (
        <Button key={tool.label} variant="secondary" size="sm" onClick={tool.action} icon={<tool.icon className="w-4 h-4" />}>
          {tool.label}
        </Button>
      ))}
    </div>
  );
}

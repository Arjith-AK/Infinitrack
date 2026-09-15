import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppSettings,
  GeneratedField,
  GeoCoordinate,
  Job,
  Mission,
  PolygonMetrics,
  SportType,
  ThemeMode,
} from '@/types';
import { generateId } from '@/utils';
import {
  calculateMissionStats,
  fieldLinesToWaypoints,
  generateField,
} from '@/utils/field/fieldGenerator';
import { traceImageToPaths, type NormalizedPoint } from '@/utils/image/imageTracer';

export type CustomLayoutStatus = 'idle' | 'loading' | 'ready' | 'error';

interface MissionState {
  selectedSport: SportType;
  polygon: GeoCoordinate[] | null;
  metrics: PolygonMetrics | null;
  generatedField: GeneratedField | null;
  currentMission: Mission | null;
  jobs: Job[];
  lineWidth: number;
  fieldType: string;
  powderFlow: number;
  drivingSpeed: number;
  customLayoutImage: string | null;
  customLayoutPaths: NormalizedPoint[][] | null;
  customLayoutStatus: CustomLayoutStatus;
  customLayoutError: string | null;
  setSport: (sport: SportType) => void;
  setPolygon: (coords: GeoCoordinate[] | null, metrics: PolygonMetrics | null) => void;
  setCustomLayoutImage: (file: File) => Promise<void>;
  clearCustomLayoutImage: () => void;
  generateLayout: () => void;
  previewMission: () => Mission | null;
  uploadMission: () => Mission | null;
  saveJob: (name: string, groundName: string) => Job | null;
  deleteJob: (id: string) => void;
  duplicateJob: (id: string) => Job | null;
  renameJob: (id: string, name: string) => void;
  loadJob: (id: string) => void;
  setMissionStatus: (status: Mission['status']) => void;
  setFieldSettings: (settings: Partial<Pick<MissionState, 'lineWidth' | 'fieldType' | 'powderFlow' | 'drivingSpeed'>>) => void;
  clearMission: () => void;
}

export const useMissionStore = create<MissionState>()(
  persist(
    (set, get) => ({
      selectedSport: 'football',
      polygon: null,
      metrics: null,
      generatedField: null,
      currentMission: null,
      jobs: [],
      lineWidth: 12,
      fieldType: 'Full Size',
      powderFlow: 70,
      drivingSpeed: 60,
      customLayoutImage: null,
      customLayoutPaths: null,
      customLayoutStatus: 'idle',
      customLayoutError: null,

      setSport: (sport) => set({ selectedSport: sport, generatedField: null }),

      setPolygon: (coords, metrics) =>
        set({ polygon: coords, metrics, generatedField: null }),

      setCustomLayoutImage: async (file: File) => {
        const previousUrl = get().customLayoutImage;
        const previewUrl = URL.createObjectURL(file);
        set({
          customLayoutImage: previewUrl,
          customLayoutStatus: 'loading',
          customLayoutError: null,
          customLayoutPaths: null,
          generatedField: null,
        });
        if (previousUrl) URL.revokeObjectURL(previousUrl);

        try {
          const paths = await traceImageToPaths(file);
          if (paths.length === 0) {
            set({
              customLayoutStatus: 'error',
              customLayoutError: 'No clear lines were found in that image. Try a higher-contrast diagram.',
            });
            return;
          }
          set({ customLayoutPaths: paths, customLayoutStatus: 'ready' });
        } catch (e) {
          set({
            customLayoutStatus: 'error',
            customLayoutError: e instanceof Error ? e.message : 'Could not process that image.',
          });
        }
      },

      clearCustomLayoutImage: () => {
        const previousUrl = get().customLayoutImage;
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        set({
          customLayoutImage: null,
          customLayoutPaths: null,
          customLayoutStatus: 'idle',
          customLayoutError: null,
          generatedField: null,
        });
      },

      generateLayout: () => {
        const { selectedSport, metrics, customLayoutPaths } = get();
        if (!metrics) return;

        // Keep the generated ground clear of the drawn boundary rather than
        // touching or overlapping it -- treat the drawn area as the outer
        // limit, with a buffer strip left empty all the way around.
        const BOUNDARY_MARGIN_M = 2;
        const field = generateField(
          selectedSport,
          metrics.centroid,
          Math.max(metrics.length - BOUNDARY_MARGIN_M * 2, 1),
          Math.max(metrics.width - BOUNDARY_MARGIN_M * 2, 1),
          metrics.orientation,
          selectedSport === 'custom' ? (customLayoutPaths ?? undefined) : undefined,
        );
        set({ generatedField: field });
      },

      previewMission: () => {
        const { selectedSport, polygon, generatedField, powderFlow, drivingSpeed } = get();
        if (!polygon || !generatedField) return null;

        const speed = drivingSpeed / 100 * 2;
        const waypoints = fieldLinesToWaypoints(generatedField, speed, powderFlow);
        const stats = calculateMissionStats(waypoints, speed, powderFlow);

        const mission: Mission = {
          id: generateId(),
          name: `${selectedSport}-mission-${Date.now()}`,
          sport: selectedSport,
          groundName: 'Field Area',
          polygon,
          field: generatedField,
          waypoints,
          distance: stats.distance,
          estimatedTime: stats.estimatedTime,
          batteryUsage: stats.batteryUsage,
          powderUsage: stats.powderUsage,
          numberOfTurns: stats.numberOfTurns,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({ currentMission: mission });
        return mission;
      },

      uploadMission: () => {
        const mission = get().previewMission();
        if (!mission) return null;
        const uploaded = { ...mission, status: 'ready' as const, updatedAt: new Date().toISOString() };
        set({ currentMission: uploaded });
        return uploaded;
      },

      saveJob: (name, groundName) => {
        const { currentMission, selectedSport } = get();
        const mission = currentMission ?? get().previewMission();
        if (!mission) return null;

        const job: Job = {
          id: generateId(),
          name,
          groundName,
          sport: selectedSport,
          mission: { ...mission, name },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({ jobs: [job, ...state.jobs] }));
        return job;
      },

      deleteJob: (id) =>
        set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) })),

      duplicateJob: (id) => {
        const job = get().jobs.find((j) => j.id === id);
        if (!job) return null;
        const duplicate: Job = {
          ...job,
          id: generateId(),
          name: `${job.name} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ jobs: [duplicate, ...state.jobs] }));
        return duplicate;
      },

      renameJob: (id, name) =>
        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === id ? { ...j, name, updatedAt: new Date().toISOString() } : j)),
        })),

      loadJob: (id) => {
        const job = get().jobs.find((j) => j.id === id);
        if (!job) return;
        set({
          selectedSport: job.sport,
          polygon: job.mission.polygon,
          generatedField: job.mission.field,
          currentMission: job.mission,
        });
      },

      setMissionStatus: (status) =>
        set((state) => ({
          currentMission: state.currentMission
            ? { ...state.currentMission, status, updatedAt: new Date().toISOString() }
            : null,
        })),

      setFieldSettings: (settings) => set(settings),

      clearMission: () =>
        set({
          polygon: null,
          metrics: null,
          generatedField: null,
          currentMission: null,
        }),
    }),
    {
      name: 'infintrack-mission',
      partialize: (state) => ({ jobs: state.jobs }),
    },
  ),
);

interface SettingsState {
  settings: AppSettings;
  setTheme: (theme: ThemeMode) => void;
  setUnits: (units: 'metric' | 'imperial') => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  units: 'metric',
  lineWidth: 12,
  fieldType: 'Full Size',
  powderFlow: 70,
  drivingSpeed: 60,
  mapStyle: 'satellite',
  language: 'en',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      setTheme: (theme) =>
        set((state) => ({ settings: { ...state.settings, theme } })),
      setUnits: (units) =>
        set((state) => ({ settings: { ...state.settings, units } })),
      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),
    }),
    { name: 'infintrack-settings' },
  ),
);

interface UIState {
  sidebarCollapsed: boolean;
  activeModal: string | null;
  notifications: import('@/types').Notification[];
  toggleSidebar: () => void;
  setActiveModal: (modal: string | null) => void;
  addNotification: (notification: Omit<import('@/types').Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  activeModal: null,
  notifications: [],
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setActiveModal: (modal) => set({ activeModal: modal }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: generateId(),
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));

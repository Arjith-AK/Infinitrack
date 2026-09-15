import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageLoader, StartupScreen } from '@/components/ui/Loading';
import { useAuthStore } from '@/stores/authStore';
import { useState, useEffect } from 'react';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const DrivePage = lazy(() => import('@/pages/DrivePage'));
const GpsPage = lazy(() => import('@/pages/GpsPage'));
const TeachPage = lazy(() => import('@/pages/TeachPage'));
const ReplayPage = lazy(() => import('@/pages/ReplayPage'));
const JobsPage = lazy(() => import('@/pages/JobsPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const DiagnosticsPage = lazy(() => import('@/pages/DiagnosticsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function LazyFeaturePage({ name }: { name: string }) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import('@/pages/FeaturePages').then((mod) => {
      const comp = (mod as unknown as Record<string, React.ComponentType>)[name];
      setComponent(() => comp);
    });
  }, [name]);

  if (!Component) return <PageLoader />;
  return <Component />;
}

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function StartupWrapper() {
  const [started, setStarted] = useState(true);
  if (!started) return <StartupScreen onComplete={() => setStarted(true)} />;
  return <Outlet />;
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const shellRoutes = [
  { path: 'dashboard', element: <DashboardPage /> },
  { path: 'drive', element: <DrivePage /> },
  { path: 'gps', element: <GpsPage /> },
  { path: 'teach', element: <TeachPage /> },
  { path: 'replay', element: <ReplayPage /> },
  { path: 'jobs', element: <JobsPage /> },
  { path: 'reports', element: <ReportsPage /> },
  { path: 'diagnostics', element: <DiagnosticsPage /> },
  { path: 'settings', element: <SettingsPage /> },
  { path: 'calibration/robot', element: <LazyFeaturePage name="RobotCalibrationPage" /> },
  { path: 'calibration/camera', element: <LazyFeaturePage name="CameraPage" /> },
  { path: 'calibration/gps', element: <LazyFeaturePage name="GpsCalibrationPage" /> },
  { path: 'calibration/powder', element: <LazyFeaturePage name="PowderCalibrationPage" /> },
  { path: 'calibration/motor', element: <LazyFeaturePage name="MotorCalibrationPage" /> },
  { path: 'mission/planner', element: <LazyFeaturePage name="MissionPlannerPage" /> },
  { path: 'mission/preview', element: <LazyFeaturePage name="MissionPreviewPage" /> },
  { path: 'live-robot', element: <LazyFeaturePage name="LiveRobotPage" /> },
  { path: 'firmware', element: <LazyFeaturePage name="FirmwareUpdatePage" /> },
  { path: 'users', element: <LazyFeaturePage name="UserManagementPage" /> },
  { path: 'notifications', element: <LazyFeaturePage name="NotificationsPage" /> },
  { path: 'history', element: <LazyFeaturePage name="HistoryPage" /> },
  { path: 'analytics', element: <LazyFeaturePage name="AnalyticsPage" /> },
  { path: 'ai-assistant', element: <LazyFeaturePage name="AiAssistantPage" /> },
  { path: 'maintenance', element: <LazyFeaturePage name="MaintenancePage" /> },
  { path: 'help', element: <LazyFeaturePage name="HelpPage" /> },
  { path: 'about', element: <LazyFeaturePage name="AboutPage" /> },
  { path: 'profile', element: <LazyFeaturePage name="ProfilePage" /> },
  { path: 'network', element: <LazyFeaturePage name="NetworkPage" /> },
  { path: 'logs', element: <LazyFeaturePage name="LogsPage" /> },
  { path: 'field-templates', element: <LazyFeaturePage name="FieldTemplatesPage" /> },
  { path: 'saved-grounds', element: <LazyFeaturePage name="SavedGroundsPage" /> },
  { path: 'custom-sports', element: <LazyFeaturePage name="CustomSportsPage" /> },
  { path: 'robot-health', element: <LazyFeaturePage name="RobotHealthPage" /> },
  { path: 'manual-control', element: <LazyFeaturePage name="ManualControlPage" /> },
  { path: 'autonomous-control', element: <LazyFeaturePage name="AutonomousControlPage" /> },
  { path: 'remote-camera', element: <LazyFeaturePage name="RemoteCameraPage" /> },
  { path: 'compass', element: <LazyFeaturePage name="CompassPage" /> },
  { path: 'battery', element: <LazyFeaturePage name="BatteryPage" /> },
  { path: 'weather', element: <LazyFeaturePage name="WeatherPage" /> },
  { path: 'map-export', element: <LazyFeaturePage name="MapExportPage" /> },
  { path: 'geojson-import', element: <LazyFeaturePage name="GeoJsonImportPage" /> },
  { path: 'polygon-editor', element: <LazyFeaturePage name="PolygonEditorPage" /> },
  { path: 'route-optimizer', element: <LazyFeaturePage name="RouteOptimizerPage" /> },
  { path: 'waypoint-editor', element: <LazyFeaturePage name="WaypointEditorPage" /> },
  { path: 'mission-queue', element: <LazyFeaturePage name="MissionQueuePage" /> },
  { path: 'fleet-ready', element: <LazyFeaturePage name="FleetReadyPage" /> },
];

export const router = createBrowserRouter([
  {
    element: <StartupWrapper />,
    children: [
      {
        path: '/login',
        element: (
          <SuspenseWrapper>
            <LoginPage />
          </SuspenseWrapper>
        ),
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppShell />,
            children: shellRoutes.map((route) => ({
              path: route.path,
              element: <SuspenseWrapper>{route.element}</SuspenseWrapper>,
            })),
          },
        ],
      },
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);

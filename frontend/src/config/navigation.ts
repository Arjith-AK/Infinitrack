import {
  HiOutlineHome,
  HiOutlineMap,
  HiOutlinePlay,
  HiOutlineAcademicCap,
  HiOutlineRefresh,
  HiOutlineBriefcase,
  HiOutlineDocumentReport,
  HiOutlineCog,
  HiOutlineChip,
  HiOutlineCamera,
  HiOutlineLocationMarker,
  HiOutlineBeaker,
  HiOutlineLightningBolt,
  HiOutlineClipboardList,
  HiOutlineEye,
  HiOutlineDownload,
  HiOutlineBell,
  HiOutlineClock,
  HiOutlineChartBar,
  HiOutlineChat,
  HiOutlineQuestionMarkCircle,
  HiOutlineInformationCircle,
  HiOutlineUser,
  HiOutlineWifi,
  HiOutlineDocumentText,
  HiOutlineTemplate,
  HiOutlineGlobeAlt,
  HiOutlinePuzzle,
  HiOutlineHeart,
  HiOutlineHand,
  HiOutlineStatusOnline,
  HiOutlineVideoCamera,
  HiOutlineCloud,
  HiOutlineUpload,
  HiOutlineCode,
  HiOutlinePencil,
  HiOutlineTrendingUp,
  HiOutlineFlag,
  HiOutlineViewList,
  HiOutlineTruck,
} from 'react-icons/hi';
import type { IconType } from 'react-icons';

export interface NavItem {
  path: string;
  label: string;
  icon: IconType;
  group?: string;
}

export const mainNavItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
  { path: '/drive', label: 'Drive', icon: HiOutlinePlay },
  { path: '/teach', label: 'Teach', icon: HiOutlineAcademicCap },
  { path: '/replay', label: 'Replay', icon: HiOutlineRefresh },
  { path: '/gps', label: 'GPS', icon: HiOutlineMap },
  { path: '/jobs', label: 'Jobs', icon: HiOutlineBriefcase },
  { path: '/reports', label: 'Reports', icon: HiOutlineDocumentReport },
  { path: '/diagnostics', label: 'Diagnostics', icon: HiOutlineChip },
  { path: '/settings', label: 'Settings', icon: HiOutlineCog },
];

export const allRoutes: NavItem[] = [
  ...mainNavItems,
  { path: '/login', label: 'Login', icon: HiOutlineUser, group: 'auth' },
  { path: '/calibration/robot', label: 'Robot Calibration', icon: HiOutlineCog, group: 'calibration' },
  { path: '/calibration/camera', label: 'Camera', icon: HiOutlineCamera, group: 'calibration' },
  { path: '/calibration/gps', label: 'GPS Calibration', icon: HiOutlineLocationMarker, group: 'calibration' },
  { path: '/calibration/powder', label: 'Powder Calibration', icon: HiOutlineBeaker, group: 'calibration' },
  { path: '/calibration/motor', label: 'Motor Calibration', icon: HiOutlineLightningBolt, group: 'calibration' },
  { path: '/mission/planner', label: 'Mission Planner', icon: HiOutlineClipboardList, group: 'mission' },
  { path: '/mission/preview', label: 'Mission Preview', icon: HiOutlineEye, group: 'mission' },
  { path: '/live-robot', label: 'Live Robot', icon: HiOutlineStatusOnline, group: 'mission' },
  { path: '/firmware', label: 'Firmware Update', icon: HiOutlineDownload, group: 'system' },
  { path: '/users', label: 'User Management', icon: HiOutlineUser, group: 'system' },
  { path: '/notifications', label: 'Notifications', icon: HiOutlineBell, group: 'system' },
  { path: '/history', label: 'History', icon: HiOutlineClock, group: 'system' },
  { path: '/analytics', label: 'Analytics', icon: HiOutlineChartBar, group: 'system' },
  { path: '/ai-assistant', label: 'AI Assistant', icon: HiOutlineChat, group: 'system' },
  { path: '/maintenance', label: 'Robot Maintenance', icon: HiOutlineCog, group: 'system' },
  { path: '/help', label: 'Help', icon: HiOutlineQuestionMarkCircle, group: 'system' },
  { path: '/about', label: 'About', icon: HiOutlineInformationCircle, group: 'system' },
  { path: '/profile', label: 'Profile', icon: HiOutlineUser, group: 'system' },
  { path: '/network', label: 'Network', icon: HiOutlineWifi, group: 'system' },
  { path: '/logs', label: 'Logs', icon: HiOutlineDocumentText, group: 'system' },
  { path: '/field-templates', label: 'Field Templates', icon: HiOutlineTemplate, group: 'fields' },
  { path: '/saved-grounds', label: 'Saved Grounds', icon: HiOutlineGlobeAlt, group: 'fields' },
  { path: '/custom-sports', label: 'Custom Sports', icon: HiOutlinePuzzle, group: 'fields' },
  { path: '/robot-health', label: 'Robot Health', icon: HiOutlineHeart, group: 'control' },
  { path: '/manual-control', label: 'Manual Control', icon: HiOutlineHand, group: 'control' },
  { path: '/autonomous-control', label: 'Autonomous Control', icon: HiOutlineStatusOnline, group: 'control' },
  { path: '/remote-camera', label: 'Remote Camera', icon: HiOutlineVideoCamera, group: 'control' },
  { path: '/compass', label: 'Compass', icon: HiOutlineLocationMarker, group: 'telemetry' },
  { path: '/battery', label: 'Battery', icon: HiOutlineLightningBolt, group: 'telemetry' },
  { path: '/weather', label: 'Weather', icon: HiOutlineCloud, group: 'telemetry' },
  { path: '/map-export', label: 'Map Export', icon: HiOutlineUpload, group: 'map' },
  { path: '/geojson-import', label: 'GeoJSON Import', icon: HiOutlineCode, group: 'map' },
  { path: '/polygon-editor', label: 'Polygon Editor', icon: HiOutlinePencil, group: 'map' },
  { path: '/route-optimizer', label: 'Route Optimizer', icon: HiOutlineTrendingUp, group: 'map' },
  { path: '/waypoint-editor', label: 'Waypoint Editor', icon: HiOutlineFlag, group: 'map' },
  { path: '/mission-queue', label: 'Mission Queue', icon: HiOutlineViewList, group: 'mission' },
  { path: '/fleet-ready', label: 'Fleet Ready', icon: HiOutlineTruck, group: 'mission' },
];

export function getPageTitle(path: string): string {
  const item = allRoutes.find((r) => r.path === path);
  return item?.label ?? 'InfiniTrack';
}

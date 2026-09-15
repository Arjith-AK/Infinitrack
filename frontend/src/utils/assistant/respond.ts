import type { RobotTelemetry, SportType } from '@/types';
import { SPORT_DIMENSIONS } from '@/utils/field/fieldGenerator';
import { formatDistance, getSportLabel } from '@/utils';

const SPORT_KEYWORDS: Record<string, SportType> = {
  football: 'football',
  soccer: 'football',
  hockey: 'hockey',
  cricket: 'cricket',
  tennis: 'tennis',
  volleyball: 'volleyball',
  basketball: 'basketball',
};

function findSport(message: string): SportType | null {
  for (const [keyword, sport] of Object.entries(SPORT_KEYWORDS)) {
    if (message.includes(keyword)) return sport;
  }
  return null;
}

export function getAssistantReply(message: string, telemetry: RobotTelemetry): string {
  const text = message.toLowerCase().trim();

  const sport = findSport(text);
  if (sport && (text.includes('dimension') || text.includes('size') || text.includes('field') || SPORT_KEYWORDS[sport])) {
    const dims = SPORT_DIMENSIONS[sport];
    if (dims) {
      return `A regulation ${getSportLabel(sport)} field is ${formatDistance(dims.length)} × ${formatDistance(dims.width)}. Select "${getSportLabel(sport)}" in GPS Mode and I'll generate the full line layout for you.`;
    }
  }

  if (text.includes('battery')) {
    return `The robot is at ${telemetry.battery.toFixed(0)}% battery${telemetry.batteryCharging ? ' and currently charging' : ''}.`;
  }

  if (text.includes('gps') || text.includes('satellite') || text.includes('accuracy')) {
    return `GPS is locked with ${telemetry.satellites} satellites at ${telemetry.gpsAccuracy.toFixed(2)}m accuracy (${telemetry.gpsSignal} signal).`;
  }

  if (text.includes('powder')) {
    return `Powder hopper is at ${telemetry.powderLevel.toFixed(0)}%, flow rate set to ${telemetry.powderFlow}%.`;
  }

  if (text.includes('status') || text.includes('robot')) {
    return `Robot ${telemetry.robotId} is currently "${telemetry.status}" running firmware ${telemetry.firmware}.`;
  }

  if (text.includes('mission') || text.includes('job') || text.includes('marking')) {
    return 'Draw a field boundary in GPS Mode, generate a layout, then preview and upload the mission before starting it.';
  }

  if (text.includes('help') || text.length === 0) {
    return "I can help with field dimensions (try \"football field size\"), robot status, battery, GPS accuracy, and powder levels.";
  }

  return "I'm not sure about that yet. Try asking about field dimensions, robot status, battery, GPS, or powder levels.";
}

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { PolygonMetrics } from '@/types';
import { formatArea, formatDistance } from '@/utils';

interface MeasurementPanelProps {
  metrics: PolygonMetrics | null;
  onAddToJobs?: () => void;
  addToJobsDisabled?: boolean;
}

export function MeasurementPanel({ metrics, onAddToJobs, addToJobsDisabled }: MeasurementPanelProps) {
  if (!metrics) {
    return (
      <Card className="w-64" title="Selected Area">
        <p className="text-sm text-white/40">Draw a polygon on the map to see measurements</p>
      </Card>
    );
  }

  const items = [
    { label: 'Area', value: formatArea(metrics.area) },
    { label: 'Perimeter', value: formatDistance(metrics.perimeter) },
    { label: 'Length', value: formatDistance(metrics.length) },
    { label: 'Width', value: formatDistance(metrics.width) },
    { label: 'Orientation', value: `${metrics.orientation.toFixed(1)}°` },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <Card className="w-64" title="Selected Area">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex justify-between items-center">
              <span className="text-sm text-white/50">{item.label}</span>
              <span className="text-sm font-semibold text-white">{item.value}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-white/10">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Centroid</p>
            <p className="text-xs font-mono text-white/60">
              {metrics.centroid.lat.toFixed(6)}, {metrics.centroid.lng.toFixed(6)}
            </p>
          </div>
          {onAddToJobs && (
            <Button className="w-full" size="sm" onClick={onAddToJobs} disabled={addToJobsDisabled}>
              Add To Jobs
            </Button>
          )}
          {onAddToJobs && addToJobsDisabled && (
            <p className="text-[10px] text-white/30 text-center -mt-1">Generate a layout first</p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export function SportSelector({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (sport: string) => void;
}) {
  const sports = [
    { id: 'football', label: 'Football', icon: '⚽' },
    { id: 'cricket', label: 'Cricket', icon: '🏏' },
    { id: 'hockey', label: 'Hockey', icon: '🏑' },
    { id: 'tennis', label: 'Tennis', icon: '🎾' },
    { id: 'volleyball', label: 'Volleyball', icon: '🏐' },
    { id: 'basketball', label: 'Basketball', icon: '🏀' },
    { id: 'athletics', label: 'Athletics', icon: '🏃' },
    { id: 'custom', label: 'Custom', icon: '📐' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {sports.map((sport) => (
        <button
          key={sport.id}
          onClick={() => onSelect(sport.id)}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200
            ${selected === sport.id
              ? 'bg-brand-600/20 border-brand-500/50 text-brand-400'
              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
        >
          <span className="text-xl">{sport.icon}</span>
          <span className="text-[10px] font-medium">{sport.label}</span>
        </button>
      ))}
    </div>
  );
}

export function CustomLayoutUpload({
  imageUrl,
  status,
  pathCount,
  error,
  onUpload,
  onClear,
}: {
  imageUrl: string | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  pathCount: number;
  error: string | null;
  onUpload: (file: File) => void;
  onClear: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2 pt-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = '';
        }}
      />
      <Button
        variant="secondary"
        className="w-full"
        loading={status === 'loading'}
        onClick={() => fileInputRef.current?.click()}
      >
        {status === 'loading' ? 'Analyzing image...' : imageUrl ? 'Replace Layout Image' : 'Upload Layout Image'}
      </Button>

      {imageUrl && (
        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
          <img src={imageUrl} alt="Uploaded layout" className="w-12 h-12 object-cover rounded-md border border-white/10" />
          <div className="flex-1 min-w-0">
            {status === 'ready' && (
              <p className="text-xs text-emerald-400">
                {pathCount} line{pathCount === 1 ? '' : 's'} detected
              </p>
            )}
            {status === 'loading' && <p className="text-xs text-white/50">Analyzing...</p>}
            {status === 'error' && <p className="text-xs text-red-400 truncate">{error ?? 'Could not read image'}</p>}
          </div>
          <button onClick={onClear} className="text-xs text-white/40 hover:text-white/80 shrink-0">
            Remove
          </button>
        </div>
      )}
      <p className="text-[10px] text-white/30">
        Upload a clear, high-contrast diagram of the layout. Lines are traced automatically and fitted to your drawn area.
      </p>
    </div>
  );
}

export function MissionPreviewCard({
  totalLines,
  distance,
  estimatedTime,
  powderRequired,
}: {
  totalLines: number;
  distance: number;
  estimatedTime: number;
  powderRequired: number;
}) {
  return (
    <Card title="Mission Preview" padding="sm">
      <div className="grid grid-cols-4 gap-2">
        <PreviewStat label="Total Lines" value={String(totalLines)} />
        <PreviewStat label="Distance" value={`${distance.toFixed(1)}m`} />
        <PreviewStat label="Est. Time" value={`${Math.round(estimatedTime / 60)} min`} />
        <PreviewStat label="Powder" value={`${powderRequired.toFixed(1)} kg`} />
      </div>
    </Card>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-lg px-2 py-1 text-center">
      <p className="text-[10px] text-white/40 uppercase">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}

export function MissionFlowSteps({
  steps,
  activeStep,
}: {
  steps: { label: string; image?: string }[];
  activeStep: number;
}) {
  return (
    <div className="flex items-center gap-3">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-2">
          <div
            className={`w-20 h-11 px-2 rounded-lg border flex items-center justify-center text-center text-xs leading-tight
              ${i <= activeStep ? 'border-brand-500/50 bg-brand-600/10 text-brand-400' : 'border-white/10 bg-white/5 text-white/30'}`}
          >
            {step.label}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-6 h-0.5 ${i < activeStep ? 'bg-brand-500' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

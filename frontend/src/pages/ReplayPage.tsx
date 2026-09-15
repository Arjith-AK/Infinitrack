import { useState } from 'react';
import { PageHeader } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/Gauge';
import { useMissionStore } from '@/stores';
import { useUIStore } from '@/stores';

export default function ReplayPage() {
  const jobs = useMissionStore((s) => s.jobs);
  const addNotification = useUIStore((s) => s.addNotification);
  const [replaying, setReplaying] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const startReplay = (jobId: string) => {
    setReplaying(jobId);
    setProgress(0);
    addNotification({ title: 'Replay Started', message: 'Robot is replaying saved mission', type: 'info' });

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setReplaying(null);
          addNotification({ title: 'Replay Complete', message: 'Mission replay finished', type: 'success' });
          return 100;
        }
        return p + 2;
      });
    }, 200);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Replay Mode" subtitle="Load and replay saved missions automatically" />

      {jobs.length === 0 ? (
        <Card padding="md">
          <p className="text-white/40">No saved missions to replay. Save a job first in GPS Mode or Jobs.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card key={job.id} padding="md">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{job.name}</h3>
                  <p className="text-sm text-white/40">{job.mission.waypoints.length} waypoints · {job.sport}</p>
                </div>
                <Button
                  variant={replaying === job.id ? 'warning' : 'primary'}
                  onClick={() => startReplay(job.id)}
                  disabled={replaying !== null && replaying !== job.id}
                >
                  {replaying === job.id ? 'Replaying...' : 'Start Replay'}
                </Button>
              </div>
              {replaying === job.id && (
                <ProgressBar value={progress} label="Replay Progress" />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

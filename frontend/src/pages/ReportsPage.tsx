import { PageHeader } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Loading';
import { useMissionStore } from '@/stores';
import { formatDate, formatArea, formatDistance, formatDuration } from '@/utils';

export default function ReportsPage() {
  const jobs = useMissionStore((s) => s.jobs);

  const handleGeneratePdf = (jobName: string) => {
    const content = `InfiniTrack Mission Report\nJob: ${jobName}\nGenerated: ${new Date().toISOString()}`;
    const blob = new Blob([content], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${jobName.replace(/\s+/g, '-')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Generate and download mission reports" />

      {jobs.length === 0 ? (
        <Card>
          <EmptyState title="No Reports Available" description="Complete a mission to generate reports" />
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card key={job.id} padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">{job.name}</h3>
                    <Badge variant="success">Completed</Badge>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <ReportField label="Ground" value={job.groundName} />
                    <ReportField label="Date" value={formatDate(job.createdAt)} />
                    <ReportField label="Area" value={formatArea(job.mission.polygon.length * 1000)} />
                    <ReportField label="Distance" value={formatDistance(job.mission.distance)} />
                    <ReportField label="Time" value={formatDuration(job.mission.estimatedTime)} />
                    <ReportField label="Powder" value={`${job.mission.powderUsage.toFixed(1)} kg`} />
                    <ReportField label="Battery" value={`${job.mission.batteryUsage.toFixed(0)}%`} />
                    <ReportField label="Accuracy" value="0.8m" />
                  </div>
                </div>
                <Button onClick={() => handleGeneratePdf(job.name)}>Generate PDF</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/40 text-xs">{label}</p>
      <p className="text-white font-medium">{value}</p>
    </div>
  );
}

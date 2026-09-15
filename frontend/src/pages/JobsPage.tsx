import { useState } from 'react';
import { HiOutlineSearch, HiOutlineDownload, HiOutlineDuplicate, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi';
import { PageHeader } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Loading';
import { useMissionStore } from '@/stores';
import { useUIStore } from '@/stores';
import { formatDate, formatDistance, getSportLabel, downloadJson } from '@/utils';

export default function JobsPage() {
  const { jobs, deleteJob, duplicateJob, renameJob, loadJob } = useMissionStore();
  const addNotification = useUIStore((s) => s.addNotification);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const filtered = jobs.filter(
    (j) =>
      j.name.toLowerCase().includes(search.toLowerCase()) ||
      j.groundName.toLowerCase().includes(search.toLowerCase()),
  );

  const handleExport = (job: (typeof jobs)[0]) => {
    downloadJson(job, `${job.name.replace(/\s+/g, '-')}.json`);
    addNotification({ title: 'Exported', message: `Job "${job.name}" exported`, type: 'success' });
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameJob(id, editName.trim());
      addNotification({ title: 'Renamed', message: 'Job renamed successfully', type: 'success' });
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        subtitle="Manage saved field marking jobs"
        action={
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs..."
              className="input-field pl-10 w-64"
            />
          </div>
        }
      />

      {filtered.length === 0 ? (
        <Card>
          <EmptyState title="No Jobs Found" description="Create jobs in GPS Mode by drawing a field and clicking Add To Jobs" />
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((job) => (
            <Card key={job.id} padding="md" hover>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {editingId === job.id ? (
                    <div className="flex gap-2">
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                      <Button size="sm" onClick={() => handleRename(job.id)}>Save</Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{job.name}</h3>
                        <Badge variant="info">{getSportLabel(job.sport)}</Badge>
                      </div>
                      <p className="text-sm text-white/40 mt-1">
                        {job.groundName} · {formatDistance(job.mission.distance)} · {formatDate(job.createdAt)}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => loadJob(job.id)}>Load</Button>
                  <Button size="sm" variant="ghost" icon={<HiOutlinePencil />} onClick={() => { setEditingId(job.id); setEditName(job.name); }} />
                  <Button size="sm" variant="ghost" icon={<HiOutlineDuplicate />} onClick={() => duplicateJob(job.id)} />
                  <Button size="sm" variant="ghost" icon={<HiOutlineDownload />} onClick={() => handleExport(job)} />
                  <Button size="sm" variant="ghost" icon={<HiOutlineTrash />} onClick={() => deleteJob(job.id)} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

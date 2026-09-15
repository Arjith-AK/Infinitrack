import { PageHeader } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Loading';
import type { IconType } from 'react-icons';

interface FeaturePageProps {
  title: string;
  subtitle?: string;
  icon?: IconType;
  children?: React.ReactNode;
  action?: React.ReactNode;
}

export function FeaturePage({ title, subtitle, icon: Icon, children, action }: FeaturePageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} action={action} />
      {children ?? (
        <Card>
          <EmptyState
            icon={Icon ? <Icon className="w-12 h-12" /> : undefined}
            title={title}
            description={`${title} module is ready. Connect your robot to begin.`}
          />
        </Card>
      )}
    </div>
  );
}

export function FeatureGrid({ items }: { items: { label: string; value: string; status?: string }[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <Card key={item.label} padding="sm">
          <p className="text-xs text-white/50 uppercase tracking-wider">{item.label}</p>
          <p className="text-lg font-semibold text-white mt-1">{item.value}</p>
          {item.status && <p className="text-xs text-emerald-400 mt-1">{item.status}</p>}
        </Card>
      ))}
    </div>
  );
}

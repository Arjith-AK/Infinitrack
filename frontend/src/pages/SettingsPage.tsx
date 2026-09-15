import { PageHeader } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, Slider } from '@/components/ui/Input';
import { useSettingsStore, useMissionStore } from '@/stores';

export default function SettingsPage() {
  const { settings, setTheme, setUnits, updateSettings } = useSettingsStore();
  const { lineWidth, fieldType, powderFlow, drivingSpeed, setFieldSettings } = useMissionStore();

  const sections = [
    {
      title: 'Display',
      content: (
        <div className="space-y-4">
          <Select
            label="Theme"
            value={settings.theme}
            onChange={(e) => setTheme(e.target.value as 'dark' | 'light' | 'system')}
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
              { value: 'system', label: 'System' },
            ]}
          />
          <Select
            label="Units"
            value={settings.units}
            onChange={(e) => setUnits(e.target.value as 'metric' | 'imperial')}
            options={[
              { value: 'metric', label: 'Metric (m, m²)' },
              { value: 'imperial', label: 'Imperial (ft, ac)' },
            ]}
          />
          <Select
            label="Map Style"
            value={settings.mapStyle}
            onChange={(e) => updateSettings({ mapStyle: e.target.value as 'satellite' | 'terrain' | 'street' })}
            options={[
              { value: 'satellite', label: 'Satellite' },
              { value: 'terrain', label: 'Terrain' },
              { value: 'street', label: 'Street' },
            ]}
          />
        </div>
      ),
    },
    {
      title: 'Field Defaults',
      content: (
        <div className="space-y-4">
          <Select
            label="Line Width"
            value={String(lineWidth)}
            onChange={(e) => setFieldSettings({ lineWidth: Number(e.target.value) })}
            options={[
              { value: '10', label: '10 cm' },
              { value: '12', label: '12 cm' },
              { value: '15', label: '15 cm' },
            ]}
          />
          <Select
            label="Field Type"
            value={fieldType}
            onChange={(e) => setFieldSettings({ fieldType: e.target.value })}
            options={[
              { value: 'Full Size', label: 'Full Size' },
              { value: 'Half Size', label: 'Half Size' },
            ]}
          />
          <Slider label="Powder Flow" value={powderFlow} onChange={(v) => setFieldSettings({ powderFlow: v })} />
          <Slider label="Driving Speed" value={drivingSpeed} onChange={(v) => setFieldSettings({ drivingSpeed: v })} />
        </div>
      ),
    },
    {
      title: 'Robot',
      content: (
        <div className="space-y-3">
          <SettingLink label="Robot Calibration" path="/calibration/robot" />
          <SettingLink label="GPS Calibration" path="/calibration/gps" />
          <SettingLink label="Motor Calibration" path="/calibration/motor" />
          <SettingLink label="Powder Calibration" path="/calibration/powder" />
          <SettingLink label="Camera Settings" path="/calibration/camera" />
          <SettingLink label="Network" path="/network" />
          <SettingLink label="Firmware Update" path="/firmware" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Configure robot and application preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sections.map((section) => (
          <Card key={section.title} title={section.title} padding="md">
            {section.content}
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button>Save Settings</Button>
      </div>
    </div>
  );
}

function SettingLink({ label, path }: { label: string; path: string }) {
  return (
    <a
      href={path}
      className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
    >
      <span className="text-sm text-white/80">{label}</span>
      <span className="text-white/30">→</span>
    </a>
  );
}

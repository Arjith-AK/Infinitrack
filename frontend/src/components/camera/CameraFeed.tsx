import { useEffect, useRef, useState } from 'react';
import { HiOutlineCamera, HiOutlineVideoCamera } from 'react-icons/hi';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils';

interface CameraFeedProps {
  label?: string;
  className?: string;
  showControls?: boolean;
}

export function CameraFeed({
  label = 'Live Camera Stream',
  className,
  showControls = false,
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera not supported');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStreaming(true);
        setError(null);
      } catch {
        setError('Camera unavailable');
      }
    }

    start();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `infintrack-capture-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  return (
    <div className={cn('relative aspect-video bg-black/50 overflow-hidden', className)}>
      {streaming ? (
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white/30 text-sm">{error ?? label}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      <div className="absolute top-2 left-2">
        <Badge variant={streaming ? 'error' : 'default'} dot>
          {streaming ? 'LIVE' : 'OFFLINE'}
        </Badge>
      </div>
      {showControls && streaming && (
        <div className="absolute bottom-2 right-2 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={<HiOutlineCamera className="w-4 h-4" />}
            onClick={handleCapture}
          />
          <Button
            size="sm"
            variant={recording ? 'danger' : 'secondary'}
            icon={<HiOutlineVideoCamera className="w-4 h-4" />}
            onClick={() => setRecording((r) => !r)}
          />
        </div>
      )}
    </div>
  );
}

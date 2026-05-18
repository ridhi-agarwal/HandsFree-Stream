import { useEffect, useRef, useState } from 'react';

const STATUS_COLORS = {
  idle: 'text-neutral-400',
  requesting: 'text-amber-400',
  streaming: 'text-emerald-400',
  error: 'text-red-400',
};

export default function WebcamView() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState({ cameras: [], mics: [] });

  async function refreshDevices() {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        cameras: all.filter((d) => d.kind === 'videoinput'),
        mics: all.filter((d) => d.kind === 'audioinput'),
      });
    } catch {
      // ignore until permission is granted
    }
  }

  async function start() {
    setError(null);
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus('streaming');
      refreshDevices();
    } catch (err) {
      setError(err.message || String(err));
      setStatus('error');
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('idle');
  }

  useEffect(() => {
    refreshDevices();
    return () => stop();
  }, []);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={status === 'streaming' ? stop : start}
          className="rounded-md bg-sky-600 hover:bg-sky-500 active:bg-sky-700 px-4 py-2 text-sm font-medium transition-colors"
        >
          {status === 'streaming' ? 'Stop Camera' : 'Start Camera'}
        </button>
        <span className={`text-xs uppercase tracking-wide ${STATUS_COLORS[status]}`}>
          {status}
        </span>
      </div>

      <div className="aspect-video w-full max-w-3xl overflow-hidden rounded-lg border border-neutral-800 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400">Error: {error}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-400">
        <DeviceList title="Cameras" items={devices.cameras} />
        <DeviceList title="Microphones" items={devices.mics} />
      </div>
    </section>
  );
}

function DeviceList({ title, items }) {
  return (
    <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">{title}</p>
      {items.length === 0 ? (
        <p className="text-neutral-500 italic">none detected</p>
      ) : (
        <ul className="space-y-1">
          {items.map((d) => (
            <li key={d.deviceId} className="truncate">
              {d.label || `(unlabeled ${d.deviceId.slice(0, 8)})`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

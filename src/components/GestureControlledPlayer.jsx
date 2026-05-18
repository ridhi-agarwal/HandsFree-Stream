import { useEffect, useRef, useState } from 'react';
import { VideoPlayer } from './VideoPlayer/index.js';
import { useHandTracker } from '../hooks/useHandTracker.js';
import { useGestureControls } from '../hooks/useGestureControls.js';

const GESTURE_LABEL = {
  open_palm: 'Pause',
  closed_fist: 'Play',
  swipe_left: '◀ -10s',
  swipe_right: '+10s ▶',
  two_fingers_up: 'Volume +',
};

export default function GestureControlledPlayer({
  src,
  poster,
  showCameraPreview = true,
  actions,
  ...playerProps
}) {
  const playerRef = useRef(null);
  const camVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streamReady, setStreamReady] = useState(false);
  const [lastGesture, setLastGesture] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    let stream = null;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const v = camVideoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => {});
          setStreamReady(true);
        }
      } catch (e) {
        setError(e.message || String(e));
      }
    })();

    return () => {
      active = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const onGesture = useGestureControls(playerRef, {
    actions,
    onGesture: (g) => setLastGesture(g),
  });

  useHandTracker({
    videoRef: camVideoRef,
    canvasRef,
    mirrored: true,
    enabled: streamReady,
    onGesture,
  });

  return (
    <div className="flex flex-col gap-3">
      <VideoPlayer
        ref={playerRef}
        src={src}
        poster={poster}
        className="aspect-video w-full max-w-3xl rounded-lg"
        {...playerProps}
      />

      <div className="flex items-start gap-3">
        <div
          className={`relative aspect-video w-56 overflow-hidden rounded-md border border-neutral-800 bg-black ${
            showCameraPreview ? '' : 'sr-only'
          }`}
          aria-hidden={!showCameraPreview}
        >
          <video
            ref={camVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full -scale-x-100 object-cover opacity-80"
          />
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100"
          />
          <div className="absolute bottom-1 left-1 right-1 rounded bg-black/70 px-2 py-0.5 text-center text-[11px] font-medium text-white">
            {GESTURE_LABEL[lastGesture] ?? (streamReady ? 'Show a gesture' : 'Waking camera…')}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">Camera error: {error}</p>}
      </div>
    </div>
  );
}

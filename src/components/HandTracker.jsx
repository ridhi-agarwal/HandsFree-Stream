import { useCallback, useEffect, useRef, useState } from 'react';
import { useHandTracker } from '../hooks/useHandTracker.js';
import { acquireCamera } from '../lib/cameraStream.js';

export default function HandTracker({
  onGesture,
  mirrored = true,
  showPreview = true,
  className = '',
  status,
  debug = false,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streamReady, setStreamReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const handle = acquireCamera({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
      audio: false,
    });

    handle.promise
      .then(async (stream) => {
        if (!active || !stream) return;
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream;
        await v.play().catch(() => {});
        if (active) setStreamReady(true);
      })
      .catch((e) => {
        if (!active) return;
        const name = e?.name;
        const friendly =
          name === 'NotReadableError'
            ? 'Camera is in use by another app or tab. Close it and reload.'
            : name === 'NotAllowedError'
            ? 'Camera permission was denied.'
            : name === 'NotFoundError'
            ? 'No camera detected.'
            : e?.message || String(e);
        setError(friendly);
      });

    return () => {
      active = false;
      handle.release();
    };
  }, []);

  const cbRef = useRef(onGesture);
  cbRef.current = onGesture;
  const handleGesture = useCallback((g) => cbRef.current?.(g), []);

  useHandTracker({
    videoRef,
    canvasRef,
    mirrored,
    enabled: streamReady,
    debug,
    onGesture: handleGesture,
  });

  return (
    <div
      aria-hidden={!showPreview}
      className={`relative aspect-square w-full overflow-hidden rounded-full border border-[#c7c7bf] bg-[#ececed] ${
        showPreview ? '' : 'sr-only'
      } ${className}`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100"
      />
      {(status || error) && (
        <div
          className="absolute bottom-3 left-3 right-3 rounded-full bg-[#161715]/75 px-3 py-1 text-center text-[11px] font-medium text-white"
          style={{ fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace' }}
        >
          {error ? `Camera: ${error}` : status}
        </div>
      )}
    </div>
  );
}

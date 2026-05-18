import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

const PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
};

function buildEmbedUrl(videoId, { autoplay, start }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams({
    enablejsapi: '1',
    autoplay: autoplay ? '1' : '0',
    playsinline: '1',
    modestbranding: '1',
    rel: '0',
    start: String(Math.max(0, Math.floor(start) || 0)),
    origin,
    widgetid: '1',
  });
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params}`;
}

export const YouTubePlayer = forwardRef(function YouTubePlayer(
  {
    videoId,
    start = 0,
    autoplay = false,
    className = '',
    onReady,
    onStateChange,
    onError,
  },
  ref
) {
  const iframeRef = useRef(null);
  const [ready, setReady] = useState(false);
  const stateRef = useRef({
    playerState: PLAYER_STATE.UNSTARTED,
    currentTime: 0,
    duration: 0,
    volume: 100,
    muted: false,
  });

  const post = useCallback((message) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage(JSON.stringify(message), '*');
    } catch (e) {
      console.error('[YouTubePlayer] postMessage failed', e);
    }
  }, []);

  const command = useCallback(
    (func, args = []) => post({ event: 'command', func, args }),
    [post]
  );

  useEffect(() => {
    function onMessage(e) {
      const src = iframeRef.current?.contentWindow;
      if (!src || e.source !== src) return;

      let data;
      try {
        data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (!data || typeof data !== 'object') return;

      switch (data.event) {
        case 'onReady':
          setReady(true);
          onReady?.(data);
          break;
        case 'onStateChange':
          stateRef.current.playerState = data.info;
          onStateChange?.(data);
          break;
        case 'onError':
          console.error('[YouTubePlayer] onError', data.info);
          onError?.({ data: data.info });
          break;
        case 'infoDelivery': {
          const i = data.info;
          if (!i) break;
          if (typeof i.currentTime === 'number') stateRef.current.currentTime = i.currentTime;
          if (typeof i.duration === 'number') stateRef.current.duration = i.duration;
          if (typeof i.volume === 'number') stateRef.current.volume = i.volume;
          if (typeof i.muted === 'boolean') stateRef.current.muted = i.muted;
          break;
        }
        default:
          break;
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onReady, onStateChange, onError]);

  const handleIframeLoad = useCallback(() => {
    post({ event: 'listening', id: 1, channel: 'widget' });
    ['onReady', 'onStateChange', 'onError', 'infoDelivery'].forEach((evt) =>
      command('addEventListener', [evt])
    );
  }, [post, command]);

  useEffect(() => {
    setReady(false);
    stateRef.current = {
      playerState: PLAYER_STATE.UNSTARTED,
      currentTime: 0,
      duration: 0,
      volume: 100,
      muted: false,
    };
  }, [videoId]);

  useImperativeHandle(
    ref,
    () => ({
      play: () => command('playVideo'),
      pause: () => command('pauseVideo'),
      toggle: () => {
        if (stateRef.current.playerState === PLAYER_STATE.PLAYING) command('pauseVideo');
        else command('playVideo');
      },
      seekTo: (s) => command('seekTo', [Math.max(0, s), true]),
      seekBy: (delta) =>
        command('seekTo', [Math.max(0, stateRef.current.currentTime + delta), true]),
      seekForward: (s = 10) =>
        command('seekTo', [stateRef.current.currentTime + s, true]),
      seekBackward: (s = 10) =>
        command('seekTo', [Math.max(0, stateRef.current.currentTime - s), true]),
      setVolume: (v) => {
        const next = clamp01(v);
        command('setVolume', [next * 100]);
        if (next > 0) command('unMute');
      },
      volumeBy: (delta) => {
        const next = clamp01(stateRef.current.volume / 100 + delta);
        command('setVolume', [next * 100]);
        if (next > 0) command('unMute');
      },
      volumeUp: (s = 0.1) => {
        const next = clamp01(stateRef.current.volume / 100 + s);
        command('setVolume', [next * 100]);
        command('unMute');
      },
      volumeDown: (s = 0.1) => {
        const next = clamp01(stateRef.current.volume / 100 - s);
        command('setVolume', [next * 100]);
      },
      setMuted: (m) => command(m ? 'mute' : 'unMute'),
      toggleMute: () => command(stateRef.current.muted ? 'unMute' : 'mute'),
      setPlaybackRate: (r) => command('setPlaybackRate', [r]),
      getCurrentTime: () => stateRef.current.currentTime,
      getDuration: () => stateRef.current.duration,
      getVolume: () => stateRef.current.volume / 100,
      isMuted: () => stateRef.current.muted,
      isPaused: () => stateRef.current.playerState !== PLAYER_STATE.PLAYING,
      getElement: () => iframeRef.current,
    }),
    [command]
  );

  if (!videoId) {
    return <div className={`bg-black ${className}`} />;
  }

  const src = buildEmbedUrl(videoId, { autoplay, start });

  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <iframe
        key={videoId}
        ref={iframeRef}
        src={src}
        title="YouTube player"
        className="absolute inset-0 h-full w-full border-0"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen; accelerometer; gyroscope"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        onLoad={handleIframeLoad}
      />
      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-neutral-500">
          Loading YouTube…
        </div>
      )}
    </div>
  );
});

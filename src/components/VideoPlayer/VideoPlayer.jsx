import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';
import { useVideoPlayer } from './useVideoPlayer.js';
import { Controls } from './Controls.jsx';

export const VideoPlayer = forwardRef(function VideoPlayer(
  {
    src,
    poster,
    autoPlay = false,
    loop = false,
    muted = false,
    controls = true,
    seekStep = 10,
    className = '',
    videoClassName = 'h-full w-full object-contain',
    crossOrigin,
    preload = 'metadata',
    onPlay,
    onPause,
    onEnded,
    onTimeUpdate,
    onError,
    onReady,
  },
  ref
) {
  const videoRef = useRef(null);
  const state = useVideoPlayer(videoRef);

  const play = useCallback(() => videoRef.current?.play(), []);
  const pause = useCallback(() => videoRef.current?.pause(), []);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) v.play();
    else v.pause();
  }, []);

  const seekTo = useCallback((seconds) => {
    const v = videoRef.current;
    if (!v) return;
    const max = Number.isFinite(v.duration) ? v.duration : seconds;
    v.currentTime = Math.max(0, Math.min(seconds, max));
  }, []);

  const seekBy = useCallback(
    (delta) => {
      const v = videoRef.current;
      if (!v) return;
      seekTo((v.currentTime || 0) + delta);
    },
    [seekTo]
  );

  const setVolume = useCallback((vol) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = Math.max(0, Math.min(1, vol));
    if (v.muted && vol > 0) v.muted = false;
  }, []);

  const volumeBy = useCallback(
    (delta) => {
      const v = videoRef.current;
      if (!v) return;
      setVolume((v.volume ?? 1) + delta);
    },
    [setVolume]
  );

  const setMuted = useCallback((value) => {
    const v = videoRef.current;
    if (v) v.muted = Boolean(value);
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (v) v.muted = !v.muted;
  }, []);

  const setPlaybackRate = useCallback((rate) => {
    const v = videoRef.current;
    if (v) v.playbackRate = rate;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      play,
      pause,
      toggle,
      seekTo,
      seekBy,
      seekForward: (s = seekStep) => seekBy(s),
      seekBackward: (s = seekStep) => seekBy(-s),
      setVolume,
      volumeBy,
      volumeUp: (step = 0.1) => volumeBy(step),
      volumeDown: (step = 0.1) => volumeBy(-step),
      setMuted,
      toggleMute,
      setPlaybackRate,
      getCurrentTime: () => videoRef.current?.currentTime ?? 0,
      getDuration: () => videoRef.current?.duration ?? 0,
      getVolume: () => videoRef.current?.volume ?? 1,
      isMuted: () => videoRef.current?.muted ?? false,
      isPaused: () => videoRef.current?.paused ?? true,
      getElement: () => videoRef.current,
    }),
    [
      play,
      pause,
      toggle,
      seekTo,
      seekBy,
      setVolume,
      volumeBy,
      setMuted,
      toggleMute,
      setPlaybackRate,
      seekStep,
    ]
  );

  return (
    <div
      className={`group relative overflow-hidden bg-black ${className}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ') {
          e.preventDefault();
          toggle();
        } else if (e.key === 'ArrowRight') {
          seekBy(seekStep);
        } else if (e.key === 'ArrowLeft') {
          seekBy(-seekStep);
        } else if (e.key === 'm' || e.key === 'M') {
          toggleMute();
        }
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
        preload={preload}
        crossOrigin={crossOrigin}
        className={videoClassName}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onLoadedMetadata={(e) => onReady?.(e.currentTarget.duration)}
        onTimeUpdate={(e) => onTimeUpdate?.(e.currentTarget.currentTime)}
        onError={onError}
      />

      {controls && (
        <Controls
          state={state}
          onTogglePlay={toggle}
          onSeekBy={seekBy}
          onSeekTo={seekTo}
          onToggleMute={toggleMute}
          seekStep={seekStep}
        />
      )}
    </div>
  );
});

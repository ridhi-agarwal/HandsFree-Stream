import { useEffect, useState } from 'react';

const INITIAL = {
  isPlaying: false,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  ended: false,
};

export function useVideoPlayer(videoRef) {
  const [state, setState] = useState(INITIAL);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const patch = (next) => setState((s) => ({ ...s, ...next }));

    const handlers = {
      play: () => patch({ isPlaying: true, ended: false }),
      pause: () => patch({ isPlaying: false }),
      ended: () => patch({ isPlaying: false, ended: true }),
      timeupdate: () => patch({ currentTime: video.currentTime }),
      loadedmetadata: () => patch({ duration: video.duration || 0 }),
      durationchange: () => patch({ duration: video.duration || 0 }),
      waiting: () => patch({ isBuffering: true }),
      playing: () => patch({ isBuffering: false }),
      volumechange: () => patch({ volume: video.volume, muted: video.muted }),
      emptied: () => setState(INITIAL),
    };

    for (const [event, fn] of Object.entries(handlers)) {
      video.addEventListener(event, fn);
    }

    patch({
      currentTime: video.currentTime,
      duration: Number.isFinite(video.duration) ? video.duration : 0,
      volume: video.volume,
      muted: video.muted,
      isPlaying: !video.paused,
    });

    return () => {
      for (const [event, fn] of Object.entries(handlers)) {
        video.removeEventListener(event, fn);
      }
    };
  }, [videoRef]);

  return state;
}

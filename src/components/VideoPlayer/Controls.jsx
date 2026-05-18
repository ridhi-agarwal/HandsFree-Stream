import { formatTime } from './formatTime.js';

export function Controls({ state, onTogglePlay, onSeekBy, onSeekTo, onToggleMute, seekStep }) {
  const { isPlaying, isBuffering, currentTime, duration, muted } = state;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  function handleScrub(e) {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeekTo(Math.max(0, Math.min(1, ratio)) * duration);
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
      <div
        className="pointer-events-auto h-1.5 w-full cursor-pointer rounded-full bg-white/20"
        onClick={handleScrub}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={duration || 0}
        aria-valuenow={currentTime}
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="pointer-events-auto flex items-center gap-2 text-xs text-white">
        <IconButton onClick={() => onSeekBy(-seekStep)} label={`Rewind ${seekStep}s`}>
          ⏪ {seekStep}s
        </IconButton>

        <IconButton onClick={onTogglePlay} label={isPlaying ? 'Pause' : 'Play'} primary>
          {isBuffering ? '…' : isPlaying ? '❚❚' : '►'}
        </IconButton>

        <IconButton onClick={() => onSeekBy(seekStep)} label={`Forward ${seekStep}s`}>
          {seekStep}s ⏩
        </IconButton>

        <span className="ml-2 font-mono tabular-nums text-white/80">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div className="flex-1" />

        <IconButton onClick={onToggleMute} label={muted ? 'Unmute' : 'Mute'}>
          {muted ? '🔇' : '🔊'}
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({ onClick, label, primary, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={
        primary
          ? 'rounded bg-white/15 px-3 py-1 font-medium hover:bg-white/25'
          : 'rounded px-2 py-1 hover:bg-white/10'
      }
    >
      {children}
    </button>
  );
}

import { useState } from 'react';
import { parseYouTubeUrl } from '../lib/youtubeUrl.js';

const MONO = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace',
};

export default function YouTubeUrlInput({ onSubmit, defaultValue = '', placeholder }) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    const parsed = parseYouTubeUrl(value);
    if (!parsed) {
      setError('That doesn’t look like a YouTube URL.');
      return;
    }
    setError(null);
    onSubmit(parsed);
  }

  function handleChange(e) {
    setValue(e.target.value);
    if (error) setError(null);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
      <label
        htmlFor="video-url"
        className="text-[15px] uppercase tracking-[0.18em] text-[#1b1c1a]"
        style={MONO}
      >
        Video URL
      </label>

      <div className="flex items-end gap-4">
        <div className="flex-1 border-b-[1.6px] border-[#c7c7bf] focus-within:border-[#161715] transition-colors">
          <input
            id="video-url"
            type="url"
            value={value}
            onChange={handleChange}
            placeholder={placeholder ?? 'Paste YouTube or video URL here...'}
            aria-invalid={!!error}
            aria-describedby={error ? 'yt-url-error' : undefined}
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent px-1 py-4 text-[16px] text-[#161715] placeholder:text-[rgba(27,28,26,0.5)] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={!value.trim()}
          className="flex shrink-0 items-center gap-3 rounded-[4px] px-8 py-4 text-[15px] uppercase tracking-[0.12em] text-[#1b1c1a] transition-opacity hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-40"
          style={MONO}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
          Stream
        </button>
      </div>

      {error && (
        <p id="yt-url-error" role="alert" className="text-[13px] text-red-600" style={MONO}>
          {error}
        </p>
      )}
    </form>
  );
}

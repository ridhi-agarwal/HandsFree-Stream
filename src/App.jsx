import { useCallback, useRef, useState } from 'react';
import { YouTubePlayer } from './components/YouTubePlayer.jsx';
import YouTubeUrlInput from './components/YouTubeUrlInput.jsx';
import HandTracker from './components/HandTracker.jsx';
import { useGestureControls } from './hooks/useGestureControls.js';
import { useVoiceCommands } from './hooks/useVoiceCommands.js';

const SERIF = { fontFamily: 'Georgia, "Times New Roman", serif' };
const MONO = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace',
};

const GESTURE_LABEL = {
  open_palm: 'Pause',
  closed_fist: 'Play',
  swipe_left: '◀ −10s',
  swipe_right: '+10s ▶',
  two_fingers_up: 'Volume +',
};

function HandIcon({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 11V6a2 2 0 0 0-4 0v5" />
      <path d="M14 10V4a2 2 0 0 0-4 0v6" />
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 13" />
    </svg>
  );
}

function MicIcon({ className }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

export default function App() {
  const playerRef = useRef(null);
  const [video, setVideo] = useState(null);
  const [lastGesture, setLastGesture] = useState(null);
  const [playerError, setPlayerError] = useState(null);
  const [lastVoice, setLastVoice] = useState(null);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [mode, setMode] = useState('gesture');

  const onGesture = useGestureControls(playerRef, {
    onGesture: (g) => setLastGesture(g),
  });

  const voice = useVoiceCommands(playerRef, {
    onCommand: ({ phrase }) => setLastVoice(phrase),
    onTranscript: ({ transcript, isFinal }) => {
      if (isFinal) setVoiceTranscript(transcript);
    },
  });

  const handleSubmit = useCallback((parsed) => {
    setPlayerError(null);
    setVideo(parsed);
  }, []);

  const handleBack = useCallback(() => {
    setVideo(null);
    setPlayerError(null);
  }, []);

  const handlePlayerError = useCallback((event) => {
    const code = event?.data;
    let msg;
    if (code == null) {
      msg =
        'Player failed to load. The video may be region-blocked, removed, or your network/CSP is blocking the embed. Check the dev console for details.';
    } else if (code === 2) {
      msg = 'Invalid video ID.';
    } else if (code === 5) {
      msg = 'HTML5 playback error — try a different video.';
    } else if (code === 100) {
      msg = 'Video not found or set to private.';
    } else if (code === 101 || code === 150) {
      msg = 'The uploader has disabled embedding for this video. Try another.';
    } else {
      msg = `Player error (code ${code}).`;
    }
    setPlayerError(msg);
  }, []);

  // ---- Entry screen ---------------------------------------------------------
  if (!video) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f5] px-6 text-[#161715]">
        <div className="flex w-full max-w-[768px] flex-col gap-5">
          <div className="mb-3 flex flex-col items-center gap-8 text-center">
            <h1
              className="text-[48px] font-bold leading-[56px] tracking-[-0.96px] text-[#161715]"
              style={SERIF}
            >
              Watch Without Touching.
            </h1>
            <p
              className="max-w-[576px] text-[18px] leading-[28px] text-[#464742]"
              style={SERIF}
            >
              Experience seamless, hands-free video streaming. Paste a link and
              control playback with kinetic precision or simple voice commands.
            </p>
          </div>

          <YouTubeUrlInput onSubmit={handleSubmit} />

          {playerError && (
            <p role="alert" className="text-[13px] text-red-600" style={MONO}>
              {playerError}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ---- Player screens -------------------------------------------------------
  const gestureMode = mode === 'gesture';

  return (
    <div className="min-h-screen bg-[#faf9f5] px-12 py-12 text-[#161715]">
      {/* Top bar */}
      <div className="mb-7 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-[15px] uppercase tracking-[0.14em] text-[#1b1c1a] transition-opacity hover:opacity-60"
          style={MONO}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </button>

        <div className="inline-flex items-center gap-1 rounded-full border border-[#dcdcd5] bg-white p-1.5">
          <button
            onClick={() => setMode('gesture')}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] transition-colors ${
              gestureMode
                ? 'bg-[#161715] text-white'
                : 'text-[#1b1c1a] hover:opacity-60'
            }`}
          >
            <HandIcon className="h-[18px] w-[18px]" />
            Gesture Control
          </button>
          <button
            onClick={() => setMode('voice')}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] transition-colors ${
              !gestureMode
                ? 'bg-[#161715] text-white'
                : 'text-[#1b1c1a] hover:opacity-60'
            }`}
          >
            <MicIcon className="h-[18px] w-[18px]" />
            Voice Control
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_220px]">
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-[#ececed]">
          <YouTubePlayer
            ref={playerRef}
            videoId={video.id}
            start={video.start}
            className="h-full w-full"
            onError={handlePlayerError}
          />
        </div>

        {gestureMode ? (
          <aside className="flex flex-col gap-4">
            <p
              className="text-center text-[13px] uppercase tracking-[0.18em] text-[#1b1c1a]"
              style={MONO}
            >
              Camera Feed
            </p>
            <HandTracker
              onGesture={onGesture}
              debug
              status={
                lastGesture
                  ? GESTURE_LABEL[lastGesture] ?? lastGesture
                  : 'Show a gesture'
              }
            />
            <p
              className="mt-2 text-[13px] uppercase tracking-[0.18em] text-[#1b1c1a]"
              style={MONO}
            >
              Available Gestures
            </p>
            <GestureLegend />
          </aside>
        ) : (
          /* Voice mode: HandTracker is unmounted, so the camera is released
             (no consumer left → cameraStream stops the tracks). */
          <VoiceStatus
            supported={voice.supported}
            listening={voice.listening}
            error={voice.error}
            lastCommand={lastVoice}
            transcript={voiceTranscript}
          />
        )}
      </div>

      {playerError && (
        <p role="alert" className="mt-5 text-[13px] text-red-600" style={MONO}>
          {playerError}
        </p>
      )}
    </div>
  );
}

function GestureLegend() {
  const rows = [
    ['▶', 'Open palm to pause'],
    ['❚❚', 'Close fist to play'],
    ['»', 'Swipe right · +10s'],
    ['«', 'Swipe left · −10s'],
    ['+', 'Two fingers up · Volume'],
  ];
  return (
    <ul className="flex flex-col gap-3">
      {rows.map(([sym, label]) => (
        <li key={label} className="flex items-center gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#ececed] text-[12px] text-[#161715]"
            style={MONO}
            aria-hidden="true"
          >
            {sym}
          </span>
          <span className="text-[15px] text-[#464742]">{label}</span>
        </li>
      ))}
    </ul>
  );
}

function VoiceStatus({ supported, listening, error, lastCommand, transcript }) {
  const statusText = !supported
    ? 'Voice Unsupported'
    : error
    ? String(error)
    : listening
    ? 'Voice Listening'
    : 'Voice Idle';

  const rows = [
    ['▶', 'Play'],
    ['❚❚', 'Pause'],
    ['»', 'Forward'],
    ['«', 'Backward'],
    ['⊘', 'Mute'],
  ];

  return (
    <aside className="flex flex-col items-center gap-4">
      <p
        className="text-[14px] uppercase tracking-[0.12em] text-[#1b1c1a]"
        style={MONO}
      >
        {statusText}
      </p>
      <p
        className="min-h-[20px] text-[14px] uppercase tracking-[0.12em] text-[#1b1c1a]"
        style={MONO}
      >
        {transcript ? `“${transcript}”` : '“—”'}
      </p>
      <p
        className="w-full text-center text-[14px] uppercase tracking-[0.12em] text-[#1b1c1a]"
        style={MONO}
      >
        Last - {lastCommand ?? '—'}
      </p>
      <ul className="mt-1 flex w-full flex-col gap-2">
        {rows.map(([sym, label]) => (
          <li key={label} className="flex h-8 items-center gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] text-[#1b1c1a]"
              style={MONO}
              aria-hidden="true"
            >
              {sym}
            </span>
            <span className="text-[14px] text-[#1b1c1a]">{label}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

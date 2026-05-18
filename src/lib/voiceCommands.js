export const DEFAULT_VOICE_COMMANDS = {
  play: { type: 'play' },
  resume: { type: 'play' },
  start: { type: 'play' },

  pause: { type: 'pause' },
  stop: { type: 'pause' },
  hold: { type: 'pause' },

  forward: { type: 'seekBy', delta: 10 },
  ahead: { type: 'seekBy', delta: 10 },
  next: { type: 'seekBy', delta: 10 },
  skip: { type: 'seekBy', delta: 10 },

  backward: { type: 'seekBy', delta: -10 },
  back: { type: 'seekBy', delta: -10 },
  rewind: { type: 'seekBy', delta: -10 },
  previous: { type: 'seekBy', delta: -10 },

  mute: { type: 'mute' },
  silence: { type: 'mute' },
  unmute: { type: 'unmute' },

  louder: { type: 'volumeBy', delta: 0.1 },
  'volume up': { type: 'volumeBy', delta: 0.1 },
  quieter: { type: 'volumeBy', delta: -0.1 },
  'volume down': { type: 'volumeBy', delta: -0.1 },
};

const PUNCT_RE = /[.,!?;:"'()]/g;
const ESCAPE_RE = /[-\\^$*+?.()|[\]{}]/g;

function normalize(s) {
  return s.toLowerCase().replace(PUNCT_RE, '').replace(/\s+/g, ' ').trim();
}

export function parseCommand(transcript, commands = DEFAULT_VOICE_COMMANDS) {
  const text = normalize(transcript || '');
  if (!text) return null;

  if (commands[text]) return { phrase: text, action: commands[text] };

  const keys = Object.keys(commands).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const escaped = key.replace(ESCAPE_RE, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`).test(text)) {
      return { phrase: key, action: commands[key] };
    }
  }
  return null;
}

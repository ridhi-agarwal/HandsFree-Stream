import { useCallback, useEffect, useRef, useState } from 'react';
import { applyAction } from '../lib/gestureActions.js';
import { DEFAULT_VOICE_COMMANDS, parseCommand } from '../lib/voiceCommands.js';

const RECOGNITION_CTOR =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition || null
    : null;

const HARD_FLOOR_MS = 250;

export function useVoiceCommands(
  playerRef,
  {
    enabled = true,
    lang = 'en-US',
    commands = DEFAULT_VOICE_COMMANDS,
    minConfidence = 0.55,
    cooldownMs = 800,
    onCommand,
    onTranscript,
    onError,
  } = {}
) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const supported = RECOGNITION_CTOR !== null;

  const recRef = useRef(null);
  const lastTriggerRef = useRef({ phrase: null, t: 0 });
  const latestRef = useRef({ commands, onCommand, onTranscript, onError });
  latestRef.current = { commands, onCommand, onTranscript, onError };

  useEffect(() => {
    if (!supported || !enabled) return;

    const rec = new RECOGNITION_CTOR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    rec.maxAlternatives = 3;
    recRef.current = rec;

    let stopped = false;
    let restartTimer = null;

    const handleResult = (event) => {
      const { commands: cmdMap, onCommand: cb, onTranscript: tcb } =
        latestRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];

        let best = result[0];
        for (let j = 1; j < result.length; j++) {
          if ((result[j].confidence || 0) > (best.confidence || 0)) {
            best = result[j];
          }
        }
        const transcript = (best.transcript || '').trim();
        const confidence = best.confidence || 0;

        tcb?.({ transcript, isFinal: result.isFinal, confidence });

        if (!result.isFinal) continue;
        if (confidence < minConfidence) continue;

        const parsed = parseCommand(transcript, cmdMap);
        if (!parsed) continue;

        const now = performance.now();
        const last = lastTriggerRef.current;
        if (now - last.t < HARD_FLOOR_MS) continue;
        if (last.phrase === parsed.phrase && now - last.t < cooldownMs) continue;

        lastTriggerRef.current = { phrase: parsed.phrase, t: now };
        const applied = applyAction(playerRef.current, parsed.action);
        cb?.({ ...parsed, transcript, confidence, applied });
      }
    };

    const handleEnd = () => {
      if (stopped) {
        setListening(false);
        return;
      }
      restartTimer = setTimeout(() => {
        try { rec.start(); } catch {}
      }, 250);
    };

    const handleError = (e) => {
      const code = e.error;
      latestRef.current.onError?.(e);
      if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'audio-capture') {
        stopped = true;
        setError(code);
        setListening(false);
        return;
      }
      if (code !== 'no-speech' && code !== 'aborted') setError(code);
    };

    const handleStart = () => {
      setListening(true);
      setError(null);
    };

    rec.addEventListener('result', handleResult);
    rec.addEventListener('end', handleEnd);
    rec.addEventListener('error', handleError);
    rec.addEventListener('start', handleStart);

    try { rec.start(); } catch (e) { console.error('[voice] start failed', e); }

    return () => {
      stopped = true;
      clearTimeout(restartTimer);
      rec.removeEventListener('result', handleResult);
      rec.removeEventListener('end', handleEnd);
      rec.removeEventListener('error', handleError);
      rec.removeEventListener('start', handleStart);
      try { rec.abort(); } catch {}
      recRef.current = null;
    };
  }, [enabled, lang, minConfidence, cooldownMs, supported, playerRef]);

  const start = useCallback(() => {
    try { recRef.current?.start(); } catch {}
  }, []);
  const stop = useCallback(() => {
    try { recRef.current?.abort(); } catch {}
  }, []);

  return { listening, error, supported, start, stop };
}

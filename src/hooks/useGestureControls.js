import { useCallback, useRef } from 'react';
import { DEFAULT_GESTURE_ACTIONS, applyAction } from '../lib/gestureActions.js';

export function useGestureControls(
  playerRef,
  { actions = DEFAULT_GESTURE_ACTIONS, onGesture } = {}
) {
  const latest = useRef({ actions, onGesture });
  latest.current = { actions, onGesture };

  return useCallback(
    (gesture) => {
      const { actions: map, onGesture: cb } = latest.current;
      const action = map[gesture];
      const applied = applyAction(playerRef.current, action);
      cb?.(gesture, action, applied);
    },
    [playerRef]
  );
}

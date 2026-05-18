export const DEFAULT_GESTURE_ACTIONS = {
  open_palm:      { type: 'pause' },
  closed_fist:    { type: 'play' },
  swipe_right:    { type: 'seekBy', delta: 10 },
  swipe_left:     { type: 'seekBy', delta: -10 },
  two_fingers_up: { type: 'volumeBy', delta: 0.1 },
};

export function applyAction(player, action) {
  if (!player || !action) return false;
  switch (action.type) {
    case 'play':     player.play(); return true;
    case 'pause':    player.pause(); return true;
    case 'toggle':   player.toggle(); return true;
    case 'seekBy':   player.seekBy(action.delta); return true;
    case 'volumeBy': player.volumeBy(action.delta); return true;
    case 'setVolume': player.setVolume(action.value); return true;
    case 'mute': player.setMuted(true); return true;
    case 'unmute': player.setMuted(false); return true;
    case 'toggleMute': player.toggleMute(); return true;
    default: return false;
  }
}

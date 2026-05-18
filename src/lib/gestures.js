const WRIST = 0;
const THUMB = { mcp: 2, ip: 3, tip: 4 };
const INDEX = { mcp: 5, pip: 6, tip: 8 };
const MIDDLE = { mcp: 9, pip: 10, tip: 12 };
const RING = { mcp: 13, pip: 14, tip: 16 };
const PINKY = { mcp: 17, pip: 18, tip: 20 };

const FINGERS = { index: INDEX, middle: MIDDLE, ring: RING, pinky: PINKY };

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function fingerRatio(lm, finger) {
  const tipToMcp = dist(lm[finger.tip], lm[finger.mcp]);
  const pipToMcp = dist(lm[finger.pip], lm[finger.mcp]);
  return pipToMcp > 0 ? tipToMcp / pipToMcp : 0;
}

function thumbRatio(lm) {
  const tipToMcp = dist(lm[THUMB.tip], lm[THUMB.mcp]);
  const ipToMcp = dist(lm[THUMB.ip], lm[THUMB.mcp]);
  return ipToMcp > 0 ? tipToMcp / ipToMcp : 0;
}

function isFingerExtended(lm, finger) {
  return fingerRatio(lm, finger) > 1.6;
}

function isFingerCurled(lm, finger) {
  return fingerRatio(lm, finger) < 1.2;
}

function isThumbExtended(lm) {
  return thumbRatio(lm) > 1.5;
}

function isPointingUp(lm, finger) {
  return lm[finger.tip].y < lm[finger.mcp].y - 0.05;
}

export function detectStaticGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;

  const ext = {};
  const curl = {};
  for (const [name, def] of Object.entries(FINGERS)) {
    ext[name] = isFingerExtended(landmarks, def);
    curl[name] = isFingerCurled(landmarks, def);
  }
  const extCount = Object.values(ext).filter(Boolean).length;
  const curlCount = Object.values(curl).filter(Boolean).length;
  const thumbExt = isThumbExtended(landmarks);

  if (extCount === 4) return 'open_palm';
  if (extCount === 0 && curlCount >= 2) return 'closed_fist';

  if (ext.index && ext.middle && curl.ring && curl.pinky) {
    if (isPointingUp(landmarks, INDEX) && isPointingUp(landmarks, MIDDLE)) {
      return 'two_fingers_up';
    }
  }

  return null;
}

export function analyzeHand(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;
  const out = { ratios: {}, extended: {}, curled: {} };
  for (const [name, def] of Object.entries(FINGERS)) {
    out.ratios[name] = +fingerRatio(landmarks, def).toFixed(2);
    out.extended[name] = isFingerExtended(landmarks, def);
    out.curled[name] = isFingerCurled(landmarks, def);
  }
  out.thumbRatio = +thumbRatio(landmarks).toFixed(2);
  out.thumbExtended = isThumbExtended(landmarks);
  out.gesture = detectStaticGesture(landmarks);
  return out;
}

export function palmCenter(landmarks) {
  const a = landmarks[WRIST];
  const b = landmarks[MIDDLE.mcp];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export class SwipeDetector {
  constructor({ windowMs = 450, threshold = 0.18, cooldownMs = 600 } = {}) {
    this.windowMs = windowMs;
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
    this.history = [];
    this.lastEmit = 0;
  }

  push(x, t) {
    this.history.push({ x, t });
    const cutoff = t - this.windowMs;
    while (this.history.length && this.history[0].t < cutoff) {
      this.history.shift();
    }
  }

  detect(t) {
    if (t - this.lastEmit < this.cooldownMs) return null;
    if (this.history.length < 3) return null;

    const first = this.history[0];
    const last = this.history[this.history.length - 1];
    const dx = last.x - first.x;
    const dt = last.t - first.t;
    if (dt <= 0) return null;

    const velocity = dx / dt;
    if (Math.abs(dx) < this.threshold) return null;
    if (Math.abs(velocity) < 0.0004) return null;

    this.lastEmit = t;
    this.history = [];
    return dx > 0 ? 'swipe_right' : 'swipe_left';
  }

  peek() {
    if (this.history.length < 2) return null;
    const first = this.history[0];
    const last = this.history[this.history.length - 1];
    return { dx: last.x - first.x, dt: last.t - first.t, n: this.history.length };
  }

  reset() {
    this.history = [];
  }
}

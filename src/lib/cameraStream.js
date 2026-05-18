let activeStream = null;
let pendingPromise = null;
const consumers = new Set();

function stopStream(s) {
  if (!s) return;
  s.getTracks().forEach((t) => {
    try { t.stop(); } catch {}
  });
}

async function requestStream(constraints, retries = 2) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      lastErr = e;
      if (e?.name !== 'NotReadableError' || i === retries) throw e;
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw lastErr;
}

export function acquireCamera(constraints) {
  const token = Symbol('camera-consumer');
  consumers.add(token);

  let promise;
  if (activeStream && activeStream.active) {
    promise = Promise.resolve(activeStream);
  } else if (pendingPromise) {
    promise = pendingPromise;
  } else {
    pendingPromise = requestStream(constraints)
      .then((s) => {
        pendingPromise = null;
        if (consumers.size === 0) {
          stopStream(s);
          return null;
        }
        activeStream = s;
        return s;
      })
      .catch((e) => {
        pendingPromise = null;
        throw e;
      });
    promise = pendingPromise;
  }

  let released = false;
  return {
    promise,
    release() {
      if (released) return;
      released = true;
      consumers.delete(token);
      if (consumers.size === 0 && activeStream) {
        stopStream(activeStream);
        activeStream = null;
      }
    },
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    stopStream(activeStream);
    activeStream = null;
    consumers.clear();
  });
}

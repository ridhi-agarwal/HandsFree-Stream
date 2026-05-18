import { useCallback, useEffect } from 'react';

export function useIPC() {
  const invoke = useCallback((channel, ...args) => {
    if (!window.api?.invoke) {
      return Promise.reject(new Error('IPC bridge unavailable (running outside Electron?)'));
    }
    return window.api.invoke(channel, ...args);
  }, []);

  const subscribe = useCallback((channel, listener) => {
    if (!window.api?.on) return () => {};
    return window.api.on(channel, listener);
  }, []);

  return { invoke, subscribe };
}

export function useIPCEvent(channel, listener) {
  useEffect(() => {
    if (!window.api?.on) return;
    return window.api.on(channel, listener);
  }, [channel, listener]);
}

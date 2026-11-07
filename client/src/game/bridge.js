/**
 * Tiny event bridge so the Phaser scene and React can talk.
 *
 * Phaser emits game events here ("interact:seat", "interact:tv",
 * "interact:arcade"); React subscribes and, when it needs to, emits commands
 * back on the same bridge. `on` returns its own unsubscribe function.
 */

export function createEventBridge() {
  const listeners = new Map();

  function on(event, handler) {
    if (!listeners.has(event)) listeners.set(event, new Set());

    listeners.get(event).add(handler);
    return () => off(event, handler);
  }

  function off(event, handler) {
    const handlers = listeners.get(event);
    if (!handlers) return;

    handlers.delete(handler);
    if (handlers.size === 0) listeners.delete(event);
  }

  function emit(event, payload) {
    const handlers = listeners.get(event);
    if (!handlers) return;

    // Copy first: a handler may unsubscribe while we iterate.
    for (const handler of [...handlers]) {
      handler(payload);
    }
  }

  return { on, off, emit };
}

export const gameBridge = createEventBridge();

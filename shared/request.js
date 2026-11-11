export function retryDelay(failures, base = 60000, maximum = 300000) {
  return Math.min(maximum, base * 2 ** Math.max(0, failures - 1));
}

// Bound read operations even when the HA transport never settles. A timeout
// releases the caller; it does not cancel an underlying HA WebSocket request.
export async function requestWithTimeout(work, milliseconds = 15000) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(work),
      new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Request timeout')), milliseconds); }),
    ]);
  } finally { clearTimeout(timer); }
}

// HA unsubscribe callbacks may throw or return a rejected promise while the
// connection is closing. Teardown must still release the other resources.
export function stopSubscription(unsubscribe) {
  if (typeof unsubscribe !== 'function') return;
  try { Promise.resolve(unsubscribe()).catch(() => {}); } catch {}
}

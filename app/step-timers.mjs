export const MAX_SECONDS = 86400;

export function validateTimers(manifest, stepCount) {
  if (!manifest || manifest.version !== 1 || !Array.isArray(manifest.timers)) return ['Ogiltig timers.json'];
  const ids = new Set();
  return manifest.timers.flatMap(timer => {
    const valid = timer && /^[a-z][a-z0-9-]{0,63}$/.test(timer.id) && !ids.has(timer.id)
      && Number.isInteger(timer.step) && timer.step >= 1 && timer.step <= stepCount
      && typeof timer.label === 'string' && timer.label.trim().length > 0 && timer.label.length <= 100
      && Number.isInteger(timer.seconds) && timer.seconds >= 10 && timer.seconds <= MAX_SECONDS
      && (timer.note === undefined || (typeof timer.note === 'string' && timer.note.length <= 200));
    if (timer) ids.add(timer.id);
    return valid ? [] : ['Ogiltig eller duplicerad steg-timer'];
  });
}

export function timerKey(recipeId, timer) {
  return `carnet-timer-v1:${encodeURIComponent(recipeId)}:${timer.id}:${timer.seconds}`;
}

export function decodeTimer(raw, now = Date.now()) {
  try {
    const timer = JSON.parse(raw);
    if (!timer || !['ready','running','paused'].includes(timer.status)) return null;
    if (!Number.isInteger(timer.seconds) || timer.seconds < 1 || timer.seconds > MAX_SECONDS) return null;
    if (timer.status === 'running' && (!Number.isSafeInteger(timer.deadline) || timer.deadline > now + MAX_SECONDS * 1000)) return null;
    return timer;
  } catch { return null; }
}

export function remainingSeconds(timer, now) {
  return timer.status === 'running' ? Math.max(0, Math.ceil((timer.deadline - now) / 1000)) : timer.seconds;
}

export function changeTimer(timer, action, now, initialSeconds) {
  const remaining = remainingSeconds(timer, now);
  if (action === 'reset') return { status:'ready', seconds:initialSeconds };
  if (timer.status === 'running' && remaining === 0) return timer;
  if (action === 'start') return { status:'running', seconds:remaining, deadline:now + remaining * 1000 };
  if (action === 'pause') return { status:'paused', seconds:remaining };
  // At a boundary, use the interval in the direction of the adjustment.
  // Stop at the next boundary even when a running timer is between intervals.
  const increasing = action === 'plus';
  const lowerBand = increasing ? remaining < 120 : remaining <= 120;
  const middleBand = increasing ? remaining < 300 : remaining <= 300;
  const delta = lowerBand ? 10 : middleBand ? 30 : 60;
  const boundary = increasing ? (lowerBand ? 120 : middleBand ? 300 : MAX_SECONDS)
    : (lowerBand ? 10 : middleBand ? 120 : 300);
  const adjusted = increasing ? Math.min(boundary, remaining + delta) : Math.max(boundary, remaining - delta);
  const seconds = Math.max(10, Math.min(MAX_SECONDS, adjusted));
  return {status:timer.status, seconds, ...(timer.status === 'running' ? {deadline:now + seconds * 1000} : {})};
}

export function formatTimer(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
}

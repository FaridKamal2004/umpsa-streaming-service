export const STORAGE_KEY = 'umpsa-stream:v2';
export const freshState = () => ({ name: 'Guest', saved: [], progress: {} });
export function sanitizeState(value, validIds) {
  const state = freshState();
  if (!value || typeof value !== 'object') return state;
  if (typeof value.name === 'string' && value.name.trim()) state.name = value.name.trim().slice(0, 32);
  if (Array.isArray(value.saved)) state.saved = [...new Set(value.saved.filter(id => validIds.includes(id)))];
  for (const [id, item] of Object.entries(value.progress || {})) {
    if (validIds.includes(id) && Number.isFinite(item?.seconds) && item.seconds >= 0 && Number.isFinite(item.duration) && item.duration > 0) {
      state.progress[id] = { seconds: Math.min(item.seconds, item.duration), duration: item.duration };
    }
  }
  return state;
}
export function loadState(storage, ids) {
  try { return sanitizeState(JSON.parse(storage.getItem(STORAGE_KEY)), ids); }
  catch { return freshState(); }
}
export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}
export function toggleSaved(state, id, ids) {
  if (!ids.includes(id)) return state;
  return { ...state, saved: state.saved.includes(id) ? state.saved.filter(x => x !== id) : [...state.saved, id] };
}
export function recordProgress(state, id, seconds, duration, ids) {
  if (!ids.includes(id) || !Number.isFinite(seconds) || seconds < 0 || !Number.isFinite(duration) || duration <= 0) return state;
  return { ...state, progress: { ...state.progress, [id]: { seconds: Math.min(seconds, duration), duration } } };
}
export function isInProgress(item) { return Boolean(item && item.seconds > 0 && item.seconds / item.duration < 0.95); }

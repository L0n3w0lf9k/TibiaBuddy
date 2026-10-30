import { useEffect, useState } from 'react';
import type { AppState } from './types';

export type ThemePreference = 'light' | 'dark' | 'system';
const validTheme = (value: unknown): ThemePreference => value === 'light' || value === 'dark' ? value : 'system';
function cachedTheme(): ThemePreference {
  try { return validTheme(localStorage.getItem('tibia-buddy-theme')); } catch { return 'system'; }
}
export function useAppliedTheme(state: AppState | null) {
  const [deviceDark, setDeviceDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [initialTheme] = useState(cachedTheme);
  const preference = state ? validTheme(state.preferences.theme) : initialTheme;
  const resolved = preference === 'system' ? deviceDark ? 'dark' : 'light' : preference;
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const changed = () => setDeviceDark(media.matches);
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
    try { localStorage.setItem('tibia-buddy-theme', preference); } catch { /* IndexedDB remains the journal's source of truth. */ }
  }, [preference, resolved]);
  return resolved;
}

import { useEffect } from 'react';
import { useSettings } from './store';

/** Mirrors theme/accent/minimalist settings onto <html> data attributes (see index.css). */
export function useApplyTheme(): void {
  const theme = useSettings((s) => s.theme);
  const accent = useSettings((s) => s.accent);
  const minimalist = useSettings((s) => s.minimalist);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      root.dataset.theme = dark ? 'dark' : 'light';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b1020' : '#1d4ed8');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  useEffect(() => {
    document.documentElement.dataset.minimal = String(minimalist);
  }, [minimalist]);
}

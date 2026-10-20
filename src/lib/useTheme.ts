import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('bvp-theme') as Theme) || 'system';
    } catch {
      return 'system';
    }
  });

  useEffect(() => {
    apply(theme);
  }, [theme]);

  function setTheme(next: Theme) {
    setThemeState(next);
    try {
      localStorage.setItem('bvp-theme', next);
    } catch {
      /* ignore */
    }
  }

  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const effective: 'light' | 'dark' = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  function toggle() {
    setTheme(effective === 'dark' ? 'light' : 'dark');
  }

  return { theme, effective, setTheme, toggle };
}

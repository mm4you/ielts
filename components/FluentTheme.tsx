'use client';

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { createDOMRenderer, RendererProvider, renderToStyleElements } from '@griffel/react';
import { FluentProvider, SSRProvider, webLightTheme, webDarkTheme, type Theme } from '@fluentui/react-components';

const ThemeContext = createContext({ dark: false, toggle: () => {} });
export const useAppTheme = () => useContext(ThemeContext);

const light: Theme = { ...webLightTheme, colorBrandBackground: '#0f6cbd', colorBrandBackgroundHover: '#115ea3', colorBrandBackgroundPressed: '#0f548c', colorBrandForeground1: '#0f6cbd', colorBrandForegroundLink: '#0f6cbd', borderRadiusMedium:'8px', fontFamilyBase: '"Segoe UI", system-ui, -apple-system, sans-serif' };
const darkTheme: Theme = { ...webDarkTheme, borderRadiusMedium:'8px', fontFamilyBase: light.fontFamilyBase };

function getDarkTheme() {
  const stored = localStorage.getItem('theme');
  return stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
}
function subscribeTheme(callback: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  window.addEventListener('storage', callback);
  window.addEventListener('app-theme-change', callback);
  media.addEventListener('change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('app-theme-change', callback);
    media.removeEventListener('change', callback);
  };
}
function flushRenderer(renderer: ReturnType<typeof createDOMRenderer>) {
  const styles = renderToStyleElements(renderer);
  renderer.stylesheets = {};
  return styles;
}

export default function FluentTheme({ children }: { children: React.ReactNode }) {
  const [renderer] = useState(() => createDOMRenderer());
  const dark = useSyncExternalStore(subscribeTheme, getDarkTheme, () => false);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  function toggle() {
    localStorage.setItem('theme', dark ? 'light' : 'dark');
    window.dispatchEvent(new Event('app-theme-change'));
  }
  useServerInsertedHTML(() => {
    const styles = flushRenderer(renderer);
    return <>{styles}</>;
  });
  return <RendererProvider renderer={renderer}><SSRProvider><ThemeContext.Provider value={{ dark, toggle }}><FluentProvider theme={dark ? darkTheme : light} className="fluent-root">{children}</FluentProvider></ThemeContext.Provider></SSRProvider></RendererProvider>;
}

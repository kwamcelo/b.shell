import { useEffect, useState } from 'react'
import t from '../i18n/strings.fr'

const KEY = 'theme-preference'
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

const currentTheme = () => document.documentElement.dataset.theme ?? (darkQuery().matches ? 'dark' : 'light')

export default function ThemeToggle() {
  const [theme, setTheme] = useState(currentTheme)

  // Follow the phone's light/dark switch until a theme is picked here.
  useEffect(() => {
    const query = darkQuery()
    const follow = () => setTheme(currentTheme())
    query.addEventListener('change', follow)
    return () => query.removeEventListener('change', follow)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // The theme still applies for this visit.
    }
    setTheme(next)
  }

  return (
    <button className="icon-btn" onClick={toggle} aria-label={theme === 'dark' ? t.toLight : t.toDark}>
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="5" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="1" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" /><line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" /><line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79z" fill="currentColor" />
        </svg>
      )}
    </button>
  )
}

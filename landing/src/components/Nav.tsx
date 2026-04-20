import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../hooks/useTheme'

type FeatureItem = { id: string; label: string }

const CORE_FEATURES: FeatureItem[] = [
  { id: 'sorting', label: 'Sort' },
  { id: 'filtering', label: 'Filter' },
  { id: 'pagination', label: 'Paginate' },
  { id: 'server-side', label: 'Client / server' },
  { id: 'columns', label: 'Columns' },
  { id: 'responsive', label: 'Responsive' },
]

const ADVANCED_FEATURES: FeatureItem[] = [
  { id: 'headless', label: 'Headless' },
  { id: 'theming', label: 'Theming' },
  { id: 'views', label: 'Views' },
  { id: 'rich-content', label: 'Rich cells' },
  { id: 'accessibility', label: 'Accessibility' },
]

const ALL_FEATURES = [...CORE_FEATURES, ...ADVANCED_FEATURES]

export function Nav() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const { theme, toggleTheme } = useTheme()

  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  // Track which feature section is in view
  useEffect(() => {
    const targets = ALL_FEATURES
      .map((f) => document.getElementById(f.id))
      .filter((el): el is HTMLElement => el !== null)

    if (targets.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActiveId(visible.target.id)
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  // Escape closes whichever is open; restore focus to trigger for dropdown
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (dropdownOpen) {
        setDropdownOpen(false)
        triggerRef.current?.focus()
      }
      if (sheetOpen) setSheetOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [dropdownOpen, sheetOpen])

  // Body scroll lock while mobile sheet is open
  useEffect(() => {
    if (!sheetOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [sheetOpen])

  const featureSectionActive = activeId != null && ALL_FEATURES.some((f) => f.id === activeId)

  return (
    <nav className="nav">
      <div className="container nav-container">
        <a href="#" className="nav-brand" aria-label="Lattice home">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="4" y="4" width="24" height="24" rx="4" stroke="#818cf8" strokeWidth="2" />
            <line x1="4" y1="12" x2="28" y2="12" stroke="#818cf8" strokeWidth="1.5" />
            <line x1="4" y1="20" x2="28" y2="20" stroke="#818cf8" strokeWidth="1.5" />
            <line x1="14" y1="4" x2="14" y2="28" stroke="#818cf8" strokeWidth="1.5" />
            <line x1="22" y1="4" x2="22" y2="28" stroke="#818cf8" strokeWidth="1.5" />
          </svg>
          lattice
        </a>

        <div className="nav-links">
          <div className="nav-dropdown">
            <button
              ref={triggerRef}
              type="button"
              className="nav-dropdown-trigger"
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
              data-active={featureSectionActive || undefined}
              onClick={() => setDropdownOpen((v) => !v)}
            >
              Features
              <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="2 4 6 8 10 4" />
              </svg>
            </button>
            {dropdownOpen && (
              <div
                ref={dropdownRef}
                className="nav-dropdown-panel"
                role="menu"
                aria-label="Features"
              >
                <div className="nav-dropdown-group">
                  <div className="nav-dropdown-group-label">Core</div>
                  {CORE_FEATURES.map((f) => (
                    <a
                      key={f.id}
                      href={`#${f.id}`}
                      role="menuitem"
                      className="nav-dropdown-item"
                      aria-current={activeId === f.id ? 'location' : undefined}
                      onClick={() => setDropdownOpen(false)}
                    >
                      {f.label}
                    </a>
                  ))}
                </div>
                <div className="nav-dropdown-group">
                  <div className="nav-dropdown-group-label">Advanced</div>
                  {ADVANCED_FEATURES.map((f) => (
                    <a
                      key={f.id}
                      href={`#${f.id}`}
                      role="menuitem"
                      className="nav-dropdown-item"
                      aria-current={activeId === f.id ? 'location' : undefined}
                      onClick={() => setDropdownOpen(false)}
                    >
                      {f.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <a href="#playground" className="nav-link">Playground</a>
          <a href="#quickstart" className="nav-link">Docs</a>

          <a
            className="nav-ai-download"
            href={`${import.meta.env.BASE_URL}AI_GUIDE.md`}
            download="lattice-ai-guide.md"
            title="Download the AI implementation guide — drop it into Claude, ChatGPT, Cursor, or any LLM so it can build Lattice tables without guessing."
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            AI guide
          </a>

          <a
            href="https://github.com/motiondesignlv/ReactZero-Lattice"
            target="_blank"
            rel="noreferrer"
            className="nav-icon-link"
            aria-label="GitHub"
            title="GitHub"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.73.5.67 5.56.67 11.83c0 5.01 3.24 9.25 7.74 10.75.57.1.78-.25.78-.55 0-.27-.01-.99-.02-1.94-3.15.68-3.81-1.52-3.81-1.52-.52-1.31-1.27-1.66-1.27-1.66-1.03-.71.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.73 2.66 1.23 3.31.94.1-.73.4-1.23.72-1.51-2.52-.29-5.17-1.26-5.17-5.6 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.44.11-3 0 0 .96-.31 3.14 1.16a10.9 10.9 0 0 1 5.72 0c2.18-1.47 3.14-1.16 3.14-1.16.62 1.56.23 2.71.11 3 .73.79 1.17 1.8 1.17 3.04 0 4.35-2.66 5.31-5.19 5.59.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.21.66.79.55 4.49-1.5 7.73-5.74 7.73-10.75C23.33 5.56 18.27.5 12 .5z" />
            </svg>
          </a>

          <button
            type="button"
            className="nav-icon-link nav-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
                <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
                <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
                <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className="nav-hamburger"
            aria-label={sheetOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sheetOpen}
            aria-controls="nav-mobile-sheet"
            onClick={() => setSheetOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {sheetOpen ? (
                <>
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="7" x2="21" y2="7" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="17" x2="21" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        id="nav-mobile-sheet"
        className="nav-mobile-sheet"
        data-open={sheetOpen || undefined}
        aria-hidden={!sheetOpen}
      >
        <div className="container nav-mobile-sheet-inner">
          <div className="nav-mobile-group-label">Features</div>
          {ALL_FEATURES.map((f) => (
            <a
              key={f.id}
              href={`#${f.id}`}
              className="nav-mobile-item"
              aria-current={activeId === f.id ? 'location' : undefined}
              onClick={() => setSheetOpen(false)}
            >
              {f.label}
            </a>
          ))}
          <div className="nav-mobile-divider" />
          <a href="#playground" className="nav-mobile-item" onClick={() => setSheetOpen(false)}>Playground</a>
          <a href="#quickstart" className="nav-mobile-item" onClick={() => setSheetOpen(false)}>Docs</a>
          <a
            href={`${import.meta.env.BASE_URL}AI_GUIDE.md`}
            download="lattice-ai-guide.md"
            className="nav-mobile-item"
            onClick={() => setSheetOpen(false)}
          >
            AI guide
          </a>
          <a
            href="https://github.com/motiondesignlv/ReactZero-Lattice"
            target="_blank"
            rel="noreferrer"
            className="nav-mobile-item"
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  )
}

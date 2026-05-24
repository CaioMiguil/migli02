import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, LayoutGrid } from 'lucide-react'
import { NAV_LINKS } from '@lib/constants'
import Button from '@components/ui/Button'
import Logo from '@components/brand/Logo'
import { useAuth } from '@hooks/useAuth'
import LoginModal from '@components/auth/LoginModal'

export default function Nav({ onOpenDashboard }) {
  const [scrolled, setScrolled] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, cloudOn, signOut } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close user menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const onClick = () => setMenuOpen(false)
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [menuOpen])

  const initial = (user?.email || '?').slice(0, 1).toUpperCase()

  return (
    <>
      <motion.nav
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="fixed inset-x-0 top-0 z-[1000] flex items-center justify-between px-6 md:px-12 py-5 backdrop-blur-xl border-b border-white/[0.06] transition-colors duration-300"
        style={{
          background: scrolled ? 'rgba(6, 13, 26, 0.92)' : 'rgba(6, 13, 26, 0.55)',
        }}
      >
        {/* Logo */}
        <a href="#" data-hover className="block">
          <Logo variant="lockup" size="sm" />
        </a>

        {/* Links */}
        <div className="hidden md:flex items-center gap-9">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-normal tracking-wide text-white/55 hover:text-aqua-400 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right side — auth-aware */}
        <div className="flex items-center gap-3">
          {!user && cloudOn && (
            <button
              onClick={() => setLoginOpen(true)}
              data-hover
              className="hidden text-sm font-medium tracking-wide text-white/70 transition-colors hover:text-aqua-400 md:block"
            >
              Entrar
            </button>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen((v) => !v)
                }}
                data-hover
                aria-label="Conta"
                className="flex h-9 items-center gap-2 rounded-full border border-aqua-400/30 bg-aqua-400/10 pl-1 pr-3 transition-all hover:border-aqua-400 hover:bg-aqua-400/20 active:scale-95"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-aqua-400 font-display text-sm font-bold text-ink-950">
                  {initial}
                </div>
                <span className="hidden text-xs font-medium text-aqua-200 md:inline">
                  Conta
                </span>
              </button>

              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-glass-border bg-ink-900/95 shadow-glow backdrop-blur-2xl"
                >
                  <div className="border-b border-white/[0.05] px-4 py-3">
                    <div className="truncate text-xs text-white/45">
                      Logado como
                    </div>
                    <div className="mt-0.5 truncate text-sm font-medium text-white">
                      {user.email}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      onOpenDashboard?.()
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-white/75 transition-colors hover:bg-white/[0.03] hover:text-aqua-300"
                  >
                    <LayoutGrid size={14} strokeWidth={1.6} />
                    Meus imóveis
                  </button>
                  <button
                    onClick={async () => {
                      setMenuOpen(false)
                      await signOut()
                    }}
                    className="flex w-full items-center gap-2.5 border-t border-white/[0.04] px-4 py-3 text-left text-sm text-white/55 transition-colors hover:bg-white/[0.03] hover:text-white"
                  >
                    <LogOut size={14} strokeWidth={1.6} />
                    Sair
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={cloudOn ? () => setLoginOpen(true) : undefined}
            >
              Começar agora
            </Button>
          )}
        </div>
      </motion.nav>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}

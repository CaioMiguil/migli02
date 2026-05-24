import { BRAND, FOOTER_LINKS } from '@lib/constants'
import Logo from '@components/brand/Logo'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-ink-950 px-6 py-10 md:px-12">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5">
        <Logo variant="lockup" size="sm" />
        <div className="text-xs text-white/25">
          © {new Date().getFullYear()} {BRAND.name}. Imersão 3D para o mercado imobiliário.
        </div>
        <div className="flex gap-7">
          {FOOTER_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-xs text-white/35 transition-colors hover:text-aqua-400"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}

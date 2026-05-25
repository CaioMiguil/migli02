import { motion } from 'framer-motion'
import { Home, Camera, LayoutGrid, Crown, User } from 'lucide-react'
import { navigate } from '@hooks/useAppRoute'

/**
 * TabBar — barra inferior persistente do app shell.
 *
 * Estilo: iPhone Tab Bar moderno.
 *   - 5 ícones com label PT-BR
 *   - tab ativa: cor ocean + indicador sutil
 *   - tabs inativas: cinza médio
 *   - tab "Capturar" central tem destaque visual (botão circular floating)
 *   - respeita safe-area inferior
 */
const TABS = [
  { id: 'home', label: 'Início', Icon: Home },
  { id: 'biblioteca', label: 'Biblioteca', Icon: LayoutGrid },
  { id: 'capturar', label: 'Escanear', Icon: Camera, primary: true },
  { id: 'plano', label: 'Plano', Icon: Crown },
  { id: 'perfil', label: 'Perfil', Icon: User },
]

export default function TabBar({ activeTab, onSelect }) {
  return (
    <nav className="tab-bar fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-between px-2 pt-2">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id
        const handleClick = () => {
          if (onSelect) {
            onSelect(tab.id)
          } else {
            navigate('/' + tab.id)
          }
        }

        if (tab.primary) {
          return <PrimaryTab key={tab.id} tab={tab} active={isActive} onClick={handleClick} />
        }

        return (
          <button
            key={tab.id}
            onClick={handleClick}
            data-hover
            aria-label={tab.label}
            className="group relative flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors"
          >
            <tab.Icon
              size={22}
              strokeWidth={isActive ? 2.2 : 1.7}
              className={`transition-colors ${
                isActive ? 'text-ocean-600' : 'text-ink-400 group-hover:text-ink-700'
              }`}
            />
            <span
              className={`text-[10px] font-semibold tracking-tight transition-colors ${
                isActive ? 'text-ocean-600' : 'text-ink-400 group-hover:text-ink-700'
              }`}
            >
              {tab.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute top-0 h-[2px] w-8 rounded-full bg-ocean-500"
                transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}

/**
 * Botão central destacado — ação principal "Escanear".
 * Floating, ligeiramente acima da barra, com gradiente ocean.
 */
function PrimaryTab({ tab, active, onClick }) {
  return (
    <button
      onClick={onClick}
      data-hover
      aria-label={tab.label}
      className="relative flex flex-1 flex-col items-center justify-end pb-1"
    >
      <div
        className="mb-1 flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full transition-all active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #0E8AC4 0%, #0871A6 100%)',
          boxShadow: active
            ? '0 14px 30px rgba(14,138,196,0.4)'
            : '0 8px 20px rgba(14,138,196,0.28)',
        }}
      >
        <tab.Icon size={22} strokeWidth={2} className="text-white" />
      </div>
      <span
        className={`-mt-2 text-[10px] font-semibold tracking-tight transition-colors ${
          active ? 'text-ocean-600' : 'text-ink-500'
        }`}
      >
        {tab.label}
      </span>
    </button>
  )
}

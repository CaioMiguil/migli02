import { motion } from 'framer-motion'
import { Home, Camera, LayoutGrid, Crown, User } from 'lucide-react'
import { navigate } from '@hooks/useAppRoute'

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
          if (onSelect) onSelect(tab.id)
          else navigate('/' + tab.id)
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
                isActive ? 'text-aqua-300' : 'text-white/45 group-hover:text-white/75'
              }`}
              style={{
                filter: isActive ? 'drop-shadow(0 0 8px rgba(0,194,255,0.55))' : 'none',
              }}
            />
            <span
              className={`text-[10px] font-semibold tracking-tight transition-colors ${
                isActive ? 'text-aqua-300' : 'text-white/45 group-hover:text-white/75'
              }`}
            >
              {tab.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute top-0 h-[2px] w-8 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, transparent, #00C2FF, transparent)',
                  boxShadow: '0 0 8px rgba(0,194,255,0.7)',
                }}
                transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}

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
          background: 'linear-gradient(135deg, #00C2FF 0%, #0E8AC4 100%)',
          boxShadow: active
            ? '0 14px 30px rgba(0,194,255,0.5), 0 0 0 4px rgba(0,194,255,0.15)'
            : '0 8px 20px rgba(0,194,255,0.35)',
        }}
      >
        <tab.Icon size={22} strokeWidth={2} className="text-white" />
      </div>
      <span
        className={`-mt-2 text-[10px] font-semibold tracking-tight transition-colors ${
          active ? 'text-aqua-300' : 'text-white/55'
        }`}
      >
        {tab.label}
      </span>
    </button>
  )
}

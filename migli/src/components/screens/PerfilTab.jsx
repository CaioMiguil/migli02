import { useState } from 'react'
import {
  LogIn,
  LogOut,
  Bell,
  HelpCircle,
  FileText,
  Shield,
  ChevronRight,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import AppHeader from '@components/shell/AppHeader'
import { useAuth } from '@hooks/useAuth'
import { usePWA } from '@hooks/usePWA'
import LoginModal from '@components/auth/LoginModal'
import { LogoMark } from '@components/brand/Logo'
import AtmosphericOrbs from '@components/ui/AtmosphericOrbs'

export default function PerfilTab() {
  const { user, ready, cloudOn, signOut } = useAuth()
  const { canInstall, installed, isIOS, install } = usePWA()
  const [loginOpen, setLoginOpen] = useState(false)

  const initial = (user?.email || '?').slice(0, 1).toUpperCase()

  return (
    <div className="relative min-h-screen overflow-hidden bg-cosmic pb-12">
      <AtmosphericOrbs density={0.5} />
      <AppHeader title="Perfil" />

      <section className="relative px-5 pt-6 md:px-8">
        {user ? (
          <LoggedInCard email={user.email} initial={initial} onLogout={signOut} />
        ) : (
          <LoggedOutCard
            cloudOn={cloudOn}
            ready={ready}
            onLogin={() => setLoginOpen(true)}
          />
        )}

        {!installed && (canInstall || isIOS) && (
          <Group label="APLICATIVO" className="mt-6">
            <Cell
              icon={Sparkles}
              title="Instalar como app"
              subtitle="Acesso rápido pela tela inicial"
              onClick={() => {
                if (canInstall) install()
                else alert('No Safari, toque em Compartilhar → Adicionar à Tela de Início')
              }}
            />
          </Group>
        )}

        <Group label="PREFERÊNCIAS" className="mt-6">
          <Cell icon={Bell} title="Notificações" subtitle="Em breve" disabled />
        </Group>

        <Group label="AJUDA & DESENVOLVIMENTO" className="mt-6">
          <Cell
            icon={BookOpen}
            title="Guia GO LIVE"
            subtitle="Configurar cloud em 30 minutos"
            onClick={() => window.open('/docs/GO_LIVE.md', '_blank')}
          />
          <Cell
            icon={HelpCircle}
            title="Central de ajuda"
            subtitle="Em breve"
            disabled
          />
          <Cell
            icon={FileText}
            title="Termos de uso"
            subtitle="Em breve"
            disabled
          />
          <Cell
            icon={Shield}
            title="Privacidade"
            subtitle="Em breve"
            disabled
          />
        </Group>

        <div className="mt-10 flex flex-col items-center gap-2 text-center opacity-60">
          <LogoMark size={22} />
          <div className="text-[10px] font-semibold uppercase tracking-widest3 text-white/50">
            MIGLI · Imersão 3D para imóveis
          </div>
          <div className="text-[10px] text-white/40">v9.0 · Brasil</div>
        </div>
      </section>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  )
}

function LoggedInCard({ email, initial, onLogout }) {
  return (
    <div className="card overflow-hidden p-5">
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl font-display text-xl font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, #00C2FF, #0E8AC4)',
            boxShadow: '0 8px 24px rgba(0,194,255,0.32)',
          }}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[13px] font-semibold tracking-tight text-white">
            Conta MIGLI
          </div>
          <div className="mt-0.5 truncate text-[12px] text-white/55">{email}</div>
        </div>
      </div>
      <button
        onClick={onLogout}
        data-hover
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-2.5 text-[12px] font-medium text-white/75 transition-all hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300 active:scale-99"
      >
        <LogOut size={13} strokeWidth={1.8} />
        Sair da conta
      </button>
    </div>
  )
}

function LoggedOutCard({ cloudOn, ready, onLogin }) {
  if (!cloudOn) {
    return (
      <div className="card p-5 text-[12px] text-white/75">
        <strong className="font-semibold text-aqua-200">Modo offline:</strong>{' '}
        sem cloud configurado. Seus scans estão salvos localmente. Confira{' '}
        <code className="rounded bg-white/5 px-1.5 py-0.5 text-aqua-300">
          docs/GO_LIVE.md
        </code>{' '}
        pra habilitar contas e compartilhamento.
      </div>
    )
  }
  return (
    <div className="card overflow-hidden p-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-aqua-400/30 bg-aqua-400/10">
        <LogIn size={24} strokeWidth={1.8} className="text-aqua-300" />
      </div>
      <h2 className="font-display text-lg font-bold tracking-tight text-white">
        Entre na sua conta
      </h2>
      <p className="mt-1.5 text-[12px] leading-relaxed text-white/60">
        Salve seus scans, acompanhe imóveis e acesse no celular ou desktop.
      </p>
      <button
        onClick={onLogin}
        data-hover
        disabled={!ready}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-aqua-400 px-5 py-2.5 text-[13px] font-semibold text-ink-950 shadow-aqua transition-all hover:bg-aqua-300 active:scale-95 disabled:opacity-50"
      >
        <LogIn size={13} strokeWidth={2.4} />
        Entrar com e-mail
      </button>
    </div>
  )
}

function Group({ label, className = '', children }) {
  return (
    <div className={className}>
      <div className="eyebrow mb-3 px-1">{label}</div>
      <div className="overflow-hidden rounded-2xl border border-white/8 bg-ink-900/55 backdrop-blur-xl">
        {children}
      </div>
    </div>
  )
}

function Cell({ icon: Icon, title, subtitle, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-white/4 disabled:opacity-50 disabled:hover:bg-transparent"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-aqua-400/25 bg-aqua-400/8">
        <Icon size={16} strokeWidth={1.8} className="text-aqua-300" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-[13px] font-semibold tracking-tight text-white">
          {title}
        </div>
        {subtitle && <div className="text-[11px] text-white/50">{subtitle}</div>}
      </div>
      {!disabled && (
        <ChevronRight
          size={14}
          strokeWidth={2}
          className="text-white/40 transition-transform group-hover:translate-x-0.5"
        />
      )}
    </button>
  )
}

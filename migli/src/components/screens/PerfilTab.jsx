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
} from 'lucide-react'
import AppHeader from '@components/shell/AppHeader'
import { useAuth } from '@hooks/useAuth'
import { usePWA } from '@hooks/usePWA'
import { isCloudConfigured } from '@lib/cloud/config'
import LoginModal from '@components/auth/LoginModal'
import { LogoMark } from '@components/brand/Logo'

/**
 * PerfilTab — conta + preferências + ajuda.
 *
 * Layout iPhone-style: lista de cells agrupadas, sem decoração pesada.
 * Quando logado, header mostra avatar/email. Quando não, oferece login.
 */
export default function PerfilTab() {
  const { user, ready, cloudOn, signOut } = useAuth()
  const { canInstall, installed, isIOS, install } = usePWA()
  const [loginOpen, setLoginOpen] = useState(false)

  const initial = (user?.email || '?').slice(0, 1).toUpperCase()

  return (
    <div className="min-h-screen">
      <AppHeader title="Perfil" />

      <section className="px-5 pt-6 pb-12 md:px-8">
        {/* Account block */}
        {user ? (
          <LoggedInCard email={user.email} initial={initial} onLogout={signOut} />
        ) : (
          <LoggedOutCard
            cloudOn={cloudOn}
            ready={ready}
            onLogin={() => setLoginOpen(true)}
          />
        )}

        {/* PWA install group */}
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

        {/* Settings */}
        <Group label="PREFERÊNCIAS" className="mt-6">
          <Cell
            icon={Bell}
            title="Notificações"
            subtitle="Em breve"
            disabled
          />
        </Group>

        {/* Help & Legal */}
        <Group label="AJUDA" className="mt-6">
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

        {/* Brand footer */}
        <div className="mt-10 flex flex-col items-center gap-2 text-center opacity-60">
          <LogoMark size={22} />
          <div className="text-[10px] font-semibold uppercase tracking-widest3 text-ink-500">
            MIGLI · Imersão 3D para imóveis
          </div>
          <div className="text-[10px] text-ink-400">v3.0 · Brasil</div>
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
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ocean-500 font-display text-xl font-bold text-white">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[13px] font-semibold tracking-tight text-ink-900">
            Conta MIGLI
          </div>
          <div className="mt-0.5 truncate text-[12px] text-ink-500">{email}</div>
        </div>
      </div>
      <button
        onClick={onLogout}
        data-hover
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-paper-300 bg-paper-50 py-2.5 text-[12px] font-medium text-ink-700 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-700 active:scale-99"
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
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-[12px] text-amber-900">
        <strong className="font-semibold">Modo demo:</strong> sem cloud
        configurado neste ambiente. Em produção, você pode criar conta com
        magic link.
      </div>
    )
  }
  return (
    <div className="card overflow-hidden p-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ocean-100">
        <LogIn size={24} strokeWidth={1.8} className="text-ocean-600" />
      </div>
      <h2 className="font-display text-lg font-bold tracking-tight text-ink-900">
        Entre na sua conta
      </h2>
      <p className="mt-1.5 text-[12px] leading-relaxed text-ink-600">
        Salve seus scans, acompanhe imóveis e acesse no celular ou
        desktop.
      </p>
      <button
        onClick={onLogin}
        data-hover
        disabled={!ready}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-ocean-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-ocean transition-all hover:bg-ocean-600 active:scale-95 disabled:opacity-50"
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
      <div className="overflow-hidden rounded-2xl border border-paper-200 bg-paper-50">
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
      className="group flex w-full items-center gap-3 border-b border-paper-200 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-paper-100 disabled:opacity-50 disabled:hover:bg-transparent"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-ocean-100">
        <Icon size={16} strokeWidth={1.8} className="text-ocean-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-[13px] font-semibold tracking-tight text-ink-900">
          {title}
        </div>
        {subtitle && (
          <div className="text-[11px] text-ink-500">{subtitle}</div>
        )}
      </div>
      {!disabled && (
        <ChevronRight
          size={14}
          strokeWidth={2}
          className="text-ink-400 transition-transform group-hover:translate-x-0.5"
        />
      )}
    </button>
  )
}

void isCloudConfigured

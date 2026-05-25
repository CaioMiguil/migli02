import { Component } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { LogoMark } from '@components/brand/Logo'

/**
 * Error boundary que isola crashes do PlayCanvas/WebGL do resto do app.
 *
 * Sem isso, qualquer erro durante init do motor 3D derruba a home inteira.
 * Aqui o erro vira um card elegante com "Tentar novamente" e o resto da
 * página continua funcional.
 *
 * Usado apenas em volta de áreas que rodam WebGL:
 *   <ViewerErrorBoundary><SplatViewer /></ViewerErrorBoundary>
 */
export default class ViewerErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[MIGLI] Falha no viewer 3D:', error, info)
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset)
      }
      return <DefaultFallback error={this.state.error} onRetry={this.reset} />
    }
    return this.props.children
  }
}

function DefaultFallback({ error, onRetry }) {
  const isWebGLError =
    /webgl|gpu|graphics|context lost/i.test(error?.message ?? '')

  return (
    <div className="relative flex h-full min-h-[320px] w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/[0.06] bg-ink-900/40 p-8 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,194,255,0.04), transparent 70%)',
        }}
      />
      <div className="relative">
        <div className="mb-5 flex justify-center opacity-70">
          <LogoMark size={36} />
        </div>
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/5">
          <AlertCircle size={16} className="text-amber-300/85" />
        </div>
        <h3 className="font-display text-base font-bold text-white/85">
          Visualização indisponível
        </h3>
        <p className="mt-2 max-w-xs text-xs font-light leading-relaxed text-white/45">
          {isWebGLError
            ? 'Seu navegador parece não suportar WebGL acelerado. Tente atualizar o navegador ou abrir em outro dispositivo.'
            : 'Não foi possível iniciar o motor 3D. Talvez seja uma extensão ou um problema temporário.'}
        </p>
        <button
          onClick={onRetry}
          data-hover
          className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-aqua-400/30 bg-aqua-400/10 px-4 py-1.5 text-xs font-medium text-aqua-300 transition-all hover:border-aqua-400 hover:bg-aqua-400/20 active:scale-95"
        >
          <RefreshCw size={11} strokeWidth={2.2} />
          Tentar novamente
        </button>
      </div>
    </div>
  )
}

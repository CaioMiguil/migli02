import { Component } from 'react'
import { LogoMark } from '@components/brand/Logo'

/**
 * Rede de proteção final. Captura qualquer erro de render que escape
 * dos boundaries específicos (viewer, modais, etc.) e mostra uma tela
 * mínima e elegante em vez de uma página branca.
 *
 * Diferente do ViewerErrorBoundary, este NÃO tem "tentar novamente" —
 * se o erro chegou até aqui, algo está estruturalmente errado e o
 * caminho seguro é recarregar.
 */
export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[MIGLI] Erro crítico no app:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ink-950 px-6 text-center text-white">
          <div className="max-w-md">
            <div className="mb-6 flex justify-center">
              <LogoMark size={48} animated />
            </div>
            <h1 className="font-display text-2xl font-bold">
              Algo deu errado
            </h1>
            <p className="mt-3 text-sm font-light text-white/55">
              Encontramos um problema inesperado. Recarregue a página para
              continuar.
            </p>
            <button
              onClick={() => window.location.reload()}
              data-hover
              className="mt-6 rounded-full border border-aqua-400/30 bg-aqua-400/10 px-5 py-2 text-xs font-medium text-aqua-300 transition-all hover:border-aqua-400 hover:bg-aqua-400/20 active:scale-95"
            >
              Recarregar
            </button>
            {import.meta.env?.DEV && (
              <pre className="mt-6 max-h-40 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-left text-[10px] text-white/45">
                {String(this.state.error?.stack || this.state.error)}
              </pre>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

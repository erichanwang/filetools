import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props { children: ReactNode }
interface State { error: Error | null; errorInfo: ErrorInfo | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorInfo: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full glass rounded-2xl p-8 text-center space-y-5 border-rose-500/20"
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/90">Something went wrong</h2>
              <p className="text-sm text-white/30 mt-2">
                {this.state.error.message || 'An unexpected error occurred'}
              </p>
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-3 text-left">
                  <summary className="text-xs text-white/20 cursor-pointer">Stack trace</summary>
                  <pre className="mt-2 text-[10px] text-white/15 bg-black/20 rounded-lg p-3 overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ error: null, errorInfo: null })
                  window.location.reload()
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-medium transition-all border border-amber-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                Reload
              </button>
              <button
                onClick={() => {
                  this.setState({ error: null, errorInfo: null })
                  window.location.href = '/'
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 text-sm font-medium transition-all border border-white/10"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>
          </motion.div>
        </div>
      )
    }
    return this.props.children
  }
}

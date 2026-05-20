import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../components/Toast'
import CopyButton from '../components/CopyButton'
import { Key, Eye, EyeOff, Clock, Info } from 'lucide-react'

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return atob(str)
}

interface JwtPayload {
  raw: unknown
  iat?: string
  exp?: string
  nbf?: string
}

export default function JwtDecoder() {
  const [jwt, setJwt] = useState('')
  const [header, setHeader] = useState<unknown>(null)
  const [payload, setPayload] = useState<JwtPayload | null>(null)
  const [signature, setSignature] = useState('')
  const [error, setError] = useState('')
  const [showHeader, setShowHeader] = useState(false)
  const { toast } = useToast()

  const decode = useCallback(() => {
    setError('')
    setHeader(null)
    setPayload(null)
    setSignature('')
    try {
      const trimmed = jwt.trim()
      if (!trimmed) { setError('Enter a JWT token'); return }
      const parts = trimmed.split('.')
      if (parts.length !== 3) { setError('Invalid JWT: must have 3 parts separated by dots'); return }
      const headerData = JSON.parse(base64UrlDecode(parts[0]))
      const payloadData = JSON.parse(base64UrlDecode(parts[1]))
      setHeader(headerData)
      setSignature(parts[2])

      const parsed: JwtPayload = { raw: payloadData }
      if (payloadData.iat) {
        const d = new Date(payloadData.iat * 1000)
        parsed.iat = d.toLocaleString()
      }
      if (payloadData.exp) {
        const d = new Date(payloadData.exp * 1000)
        parsed.exp = d.toLocaleString()
        if (Date.now() > d.getTime()) parsed.exp += ' ⚠ EXPIRED'
      }
      if (payloadData.nbf) {
        const d = new Date(payloadData.nbf * 1000)
        parsed.nbf = d.toLocaleString()
        if (Date.now() < d.getTime()) parsed.nbf += ' ⚠ NOT YET VALID'
      }
      setPayload(parsed)
      toast('JWT decoded')
    } catch (e) {
      setError('Invalid JWT token: ' + (e instanceof Error ? e.message : 'unable to decode'))
    }
  }, [jwt, toast])

  const formatJson = (obj: unknown): string => {
    try { return JSON.stringify(obj, null, 2) ?? '' }
    catch { return String(obj) }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">JWT Decoder</h1>
        <p className="text-white/50 text-sm">Decode and inspect JSON Web Tokens — all processing is local</p>
      </div>

      {/* Input */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
        <textarea
          value={jwt}
          onChange={(e) => setJwt(e.target.value)}
          placeholder="Paste a JWT token (eyJhbGciOiJIUzI1NiIs…)"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 font-mono resize-none"
        />
        <button
          onClick={decode}
          className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-sm transition-all border border-amber-500/20"
        >
          Decode JWT
        </button>
        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </div>

      {/* Header */}
      {header != null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
        >
          <button
            onClick={() => setShowHeader(!showHeader)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-white/60 hover:text-white/80 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-white/30" />
              Header
            </span>
            {showHeader ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          {showHeader && (
            <div className="px-5 pb-4">
              <pre className="text-xs font-mono text-white/70 bg-white/5 rounded-lg p-3 overflow-auto max-h-40">
                {formatJson(header)}
              </pre>
            </div>
          )}
        </motion.div>
      )}

      {/* Payload */}
      {payload != null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/60 flex items-center gap-2">
              <Key className="w-4 h-4 text-white/30" />
              Payload
            </span>
            <CopyButton text={typeof payload.raw === 'string' ? payload.raw as string : JSON.stringify(payload.raw, null, 2)} label="Copy" />
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Issued At', value: payload.iat },
              { label: 'Expires', value: payload.exp },
              { label: 'Not Before', value: payload.nbf },
            ].filter((f) => f.value).map((f) => (
              <div key={f.label} className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <div className="text-xs text-white/30 flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-3 h-3" />
                  {f.label}
                </div>
                <div className="text-xs font-mono text-white/60 leading-tight">{f.value}</div>
              </div>
            ))}
          </div>

          {/* Raw JSON */}
          <pre className="text-xs font-mono text-white/70 bg-white/5 rounded-lg p-3 overflow-auto max-h-72">
            {payload.raw != null ? formatJson(payload.raw) : ''}
          </pre>
        </motion.div>
      )}

      {/* Signature */}
      {signature && (
        <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30 font-medium">Signature</span>
            <span className="text-xs font-mono text-white/40 truncate max-w-80">
              {signature.slice(0, 40)}…
            </span>
          </div>
          <CopyButton text={signature} />
        </div>
      )}
    </motion.div>
  )
}

import { useState } from 'react'
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface IngestResult {
  success: boolean
  stats: {
    parsed: number
    new: number
    duplicates: number
  }
  error?: string
}

interface RadarIntakeProps {
  onIngestComplete?: () => void
}

export function RadarIntake({ onIngestComplete }: RadarIntakeProps) {
  const [html, setHtml] = useState('')
  const [source, setSource] = useState<'auto' | 'LinkedIn' | 'Indeed' | 'Otta'>('auto')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IngestResult | null>(null)

  const handleScan = async () => {
    if (!html.trim()) return

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/radar/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawHtml: html, source })
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({ success: false, stats: { parsed: 0, new: 0, duplicates: 0 }, error: data.error })
      } else {
        setResult(data)
        if (data.stats.new > 0 && onIngestComplete) {
          onIngestComplete()
        }
      }
    } catch (err) {
      setResult({
        success: false,
        stats: { parsed: 0, new: 0, duplicates: 0 },
        error: 'Failed to connect to server'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setHtml('')
    setResult(null)
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
      <div className="mb-4">
        <h3 className="mb-2 text-lg font-semibold">Frog Intake</h3>
        <p className="text-sm text-slate-400">
          Paste HTML from job search results (LinkedIn, Indeed, or Otta) to scan for opportunities.
        </p>
      </div>

      {/* Source selector */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-slate-300">Source</label>
        <div className="flex gap-2">
          {(['auto', 'LinkedIn', 'Indeed', 'Otta'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                source === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {s === 'auto' ? 'Auto-detect' : s}
            </button>
          ))}
        </div>
      </div>

      {/* HTML textarea */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Raw HTML
        </label>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          placeholder="Paste the HTML from your job search results here...

How to get HTML:
1. Go to LinkedIn/Indeed job search
2. Right-click on the results area
3. Select 'Inspect' or 'Inspect Element'
4. Find the container with job listings
5. Right-click the HTML and 'Copy > Copy outerHTML'"
          className="h-64 w-full rounded-lg border border-slate-600 bg-slate-900 p-3 font-mono text-sm text-slate-300 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <div className="mt-1 text-right text-xs text-slate-500">
          {html.length.toLocaleString()} characters
        </div>
      </div>

      {/* Action buttons */}
      <div className="mb-4 flex gap-3">
        <button
          onClick={handleScan}
          disabled={loading || !html.trim()}
          className="flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Scan for Jobs
            </>
          )}
        </button>
        <button
          onClick={handleClear}
          disabled={loading}
          className="rounded bg-slate-700 px-4 py-2 font-medium text-slate-300 transition-colors hover:bg-slate-600 disabled:opacity-50"
        >
          Clear
        </button>
      </div>

      {/* Results */}
      {result && (
        <div
          className={`rounded-lg border p-4 ${
            result.success
              ? 'border-emerald-700 bg-emerald-900/30'
              : 'border-red-700 bg-red-900/30'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
            )}
            <div>
              {result.success ? (
                <>
                  <p className="font-medium text-emerald-300">Scan Complete</p>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Parsed:</span>{' '}
                      <span className="font-medium text-slate-200">{result.stats.parsed}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">New:</span>{' '}
                      <span className="font-medium text-emerald-300">{result.stats.new}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Duplicates:</span>{' '}
                      <span className="font-medium text-yellow-300">{result.stats.duplicates}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium text-red-300">Scan Failed</p>
                  <p className="mt-1 text-sm text-red-400">{result.error}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RadarIntake

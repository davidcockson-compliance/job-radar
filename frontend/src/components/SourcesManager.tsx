import { useEffect, useState } from 'react'
import { Plus, Trash2, Globe, ToggleLeft, ToggleRight, X, ExternalLink } from 'lucide-react'

interface JobSource {
  id: string
  name: string
  url: string
  enabled: boolean
  builtin: boolean
}

interface SourcesManagerProps {
  onClose: () => void
}

export function SourcesManager({ onClose }: SourcesManagerProps) {
  const [sources, setSources] = useState<JobSource[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/sources')
      const data = await res.json()
      setSources(data)
    } catch (err) {
      console.error('Failed to fetch sources:', err)
    } finally {
      setLoading(false)
    }
  }

  const addSource = async () => {
    if (!newName.trim()) return
    setError('')
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), url: newUrl.trim(), enabled: true }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to add source')
        return
      }
      const source = await res.json()
      setSources([...sources, source])
      setNewName('')
      setNewUrl('')
    } catch (err) {
      console.error('Failed to add source:', err)
      setError('Failed to add source')
    }
  }

  const toggleSource = async (source: JobSource) => {
    try {
      const res = await fetch(`/api/sources/${source.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !source.enabled }),
      })
      const updated = await res.json()
      setSources(sources.map(s => s.id === source.id ? updated : s))
    } catch (err) {
      console.error('Failed to toggle source:', err)
    }
  }

  const deleteSource = async (source: JobSource) => {
    if (source.builtin) return
    try {
      const res = await fetch(`/api/sources/${source.id}`, { method: 'DELETE' })
      if (res.ok) {
        setSources(sources.filter(s => s.id !== source.id))
      }
    } catch (err) {
      console.error('Failed to delete source:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative max-h-[80vh] w-full max-w-lg overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold">Manage Job Sources</h2>
            </div>
            <button onClick={onClose} className="rounded p-1 hover:bg-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Control which job boards are searched. Toggle sources on or off, or add your own custom sources.
          </p>
        </div>

        {/* Content */}
        <div className="max-h-[55vh] overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Sources ({sources.filter(s => s.enabled).length} of {sources.length} enabled)
              </h3>
              {sources.map(source => (
                <div
                  key={source.id}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                    source.enabled
                      ? 'border-slate-600 bg-slate-900/50'
                      : 'border-slate-700 bg-slate-900/20 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleSource(source)}
                      className="flex-shrink-0"
                      title={source.enabled ? 'Disable source' : 'Enable source'}
                    >
                      {source.enabled ? (
                        <ToggleRight className="h-6 w-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-slate-500" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{source.name}</span>
                        {source.builtin && (
                          <span className="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-400">
                            built-in
                          </span>
                        )}
                      </div>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-400"
                        >
                          {source.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  {!source.builtin && (
                    <button
                      onClick={() => deleteSource(source)}
                      className="rounded p-1.5 text-slate-500 hover:bg-red-900/30 hover:text-red-400"
                      title="Delete source"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}

              {sources.length === 0 && (
                <div className="py-8 text-center text-slate-500">
                  <Globe className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                  <p className="font-medium">No sources configured</p>
                  <p className="mt-1 text-xs">Add a job board below to start tracking listings from it.</p>
                </div>
              )}
            </div>
          )}

          {/* Add new source */}
          <div className="mt-4 rounded-lg border border-dashed border-slate-600 p-4">
            <h3 className="mb-1 text-sm font-medium text-slate-300">Add Custom Source</h3>
            <p className="mb-3 text-xs text-slate-500">Add a job board that isn't built in. The name is used to tag jobs from this source.</p>
            <div className="space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSource()}
                placeholder="Source name (e.g. Reed, Glassdoor)"
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSource()}
                placeholder="Website URL (optional, e.g. https://reed.co.uk)"
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}
              <button
                onClick={addSource}
                disabled={!newName.trim()}
                className="flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                Add Source
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-700 p-4">
          <button
            onClick={onClose}
            className="rounded bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default SourcesManager

import { useEffect, useState } from 'react'
import { Plus, Trash2, Save, X, Flag, AlertTriangle, RefreshCw } from 'lucide-react'

interface RadarZone {
  id: string
  name: string
  searchTitle: string
  searchLocation: string
  greenFlags: string[]
  redFlags: string[]
  enabledSources: string[]
  active: boolean
}

interface JobSource {
  id: string
  name: string
  enabled: boolean
  builtin: boolean
}

interface ZonesConfigProps {
  onClose: () => void
  onSave: () => void
}

export function ZonesConfig({ onClose, onSave }: ZonesConfigProps) {
  const [zones, setZones] = useState<RadarZone[]>([])
  const [sources, setSources] = useState<JobSource[]>([])
  const [editingZone, setEditingZone] = useState<RadarZone | null>(null)
  const [saving, setSaving] = useState(false)
  const [newFlag, setNewFlag] = useState({ green: '', red: '' })

  useEffect(() => {
    fetchZones()
    fetchSources()
  }, [])

  const fetchZones = async () => {
    try {
      const res = await fetch('/api/radar-zones')
      const data = await res.json()
      setZones(data)
    } catch (err) {
      console.error('Failed to fetch zones:', err)
    }
  }

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/sources')
      const data = await res.json()
      setSources(data)
    } catch (err) {
      console.error('Failed to fetch sources:', err)
    }
  }

  const createZone = async () => {
    try {
      const enabledNames = sources.filter(s => s.enabled).map(s => s.name)
      const res = await fetch('/api/radar-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Zone',
          searchTitle: '',
          searchLocation: '',
          greenFlags: [],
          redFlags: [],
          enabledSources: enabledNames,
          active: true,
        }),
      })
      const zone = await res.json()
      setZones([zone, ...zones])
      setEditingZone(zone)
    } catch (err) {
      console.error('Failed to create zone:', err)
    }
  }

  const updateZone = async (zone: RadarZone) => {
    setSaving(true)
    try {
      await fetch(`/api/radar-zones/${zone.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: zone.name,
          searchTitle: zone.searchTitle,
          searchLocation: zone.searchLocation,
          greenFlags: zone.greenFlags,
          redFlags: zone.redFlags,
          enabledSources: zone.enabledSources,
          active: zone.active,
        }),
      })
      setZones(zones.map(z => z.id === zone.id ? zone : z))
    } catch (err) {
      console.error('Failed to update zone:', err)
    } finally {
      setSaving(false)
    }
  }

  const deleteZone = async (id: string) => {
    try {
      await fetch(`/api/radar-zones/${id}`, { method: 'DELETE' })
      setZones(zones.filter(z => z.id !== id))
      if (editingZone?.id === id) setEditingZone(null)
    } catch (err) {
      console.error('Failed to delete zone:', err)
    }
  }

  const toggleSource = (source: string) => {
    if (!editingZone) return
    const current = editingZone.enabledSources || []
    const updated = current.includes(source)
      ? current.filter(s => s !== source)
      : [...current, source]
    setEditingZone({ ...editingZone, enabledSources: updated })
  }

  const addFlag = (type: 'green' | 'red') => {
    if (!editingZone) return
    const value = newFlag[type].trim()
    if (!value) return
    if (type === 'green') {
      setEditingZone({ ...editingZone, greenFlags: [...editingZone.greenFlags, value] })
    } else {
      setEditingZone({ ...editingZone, redFlags: [...editingZone.redFlags, value] })
    }
    setNewFlag({ ...newFlag, [type]: '' })
  }

  const removeFlag = (type: 'green' | 'red', index: number) => {
    if (!editingZone) return
    if (type === 'green') {
      setEditingZone({ ...editingZone, greenFlags: editingZone.greenFlags.filter((_, i) => i !== index) })
    } else {
      setEditingZone({ ...editingZone, redFlags: editingZone.redFlags.filter((_, i) => i !== index) })
    }
  }

  const handleRescore = async () => {
    try {
      await fetch('/api/radar/rescore', { method: 'POST' })
      onSave()
    } catch (err) {
      console.error('Failed to rescore:', err)
    }
  }

  // All source names available for toggling (only globally-enabled ones)
  const availableSources = sources.filter(s => s.enabled).map(s => s.name)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <h2 className="text-lg font-semibold">Radar Zones</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={createZone}
              className="flex items-center gap-2 rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" />
              New Zone
            </button>
            <button onClick={onClose} className="rounded p-1 hover:bg-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex max-h-[65vh]">
          {/* Zone List */}
          <div className="w-64 flex-shrink-0 overflow-y-auto border-r border-slate-700">
            {zones.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No zones yet. Create one to get started.
              </div>
            ) : (
              zones.map(zone => (
                <button
                  key={zone.id}
                  onClick={() => setEditingZone(zone)}
                  className={`w-full border-b border-slate-700/50 px-4 py-3 text-left transition-colors ${
                    editingZone?.id === zone.id
                      ? 'bg-slate-700/50'
                      : 'hover:bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{zone.name}</span>
                    <span className={`h-2 w-2 rounded-full ${zone.active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 truncate">
                    {zone.searchTitle || 'No title'} - {zone.searchLocation || 'Any location'}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Zone Editor */}
          <div className="flex-1 overflow-y-auto p-6">
            {editingZone ? (
              <div className="space-y-4">
                {/* Zone Name */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Zone Name</label>
                  <input
                    type="text"
                    value={editingZone.name}
                    onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                    placeholder="e.g. RegTech Manchester"
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Search Parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Search Title</label>
                    <input
                      type="text"
                      value={editingZone.searchTitle}
                      onChange={(e) => setEditingZone({ ...editingZone, searchTitle: e.target.value })}
                      placeholder="e.g. Software Engineer"
                      className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Search Location</label>
                    <input
                      type="text"
                      value={editingZone.searchLocation}
                      onChange={(e) => setEditingZone({ ...editingZone, searchLocation: e.target.value })}
                      placeholder="e.g. Manchester, UK"
                      className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Enabled Sources */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Enabled Sources</label>
                  <div className="flex flex-wrap gap-3">
                    {availableSources.map(source => (
                      <button
                        key={source}
                        onClick={() => toggleSource(source)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          (editingZone.enabledSources || []).includes(source)
                            ? 'border-emerald-500 bg-emerald-900/30 text-emerald-300'
                            : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        <div className={`h-4 w-4 rounded border ${
                          (editingZone.enabledSources || []).includes(source)
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-slate-500'
                        }`}>
                          {(editingZone.enabledSources || []).includes(source) && (
                            <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        {source}
                      </button>
                    ))}
                    {availableSources.length === 0 && (
                      <span className="text-xs text-slate-500">No sources enabled. Add sources via the Sources manager.</span>
                    )}
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Active</span>
                  <button
                    onClick={() => setEditingZone({ ...editingZone, active: !editingZone.active })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      editingZone.active ? 'bg-emerald-600' : 'bg-slate-600'
                    }`}
                  >
                    <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                      editingZone.active ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>

                {/* Green Flags */}
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-400">
                    <Flag className="h-4 w-4" />
                    Green Flags (+ points)
                  </div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {editingZone.greenFlags.map((flag, i) => (
                      <span key={i} className="flex items-center gap-1 rounded-full bg-emerald-900 px-3 py-1 text-sm text-emerald-300">
                        {flag}
                        <button onClick={() => removeFlag('green', i)} className="ml-1 hover:text-white">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFlag.green}
                      onChange={(e) => setNewFlag({ ...newFlag, green: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && addFlag('green')}
                      placeholder="Add keyword..."
                      className="flex-1 rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    <button onClick={() => addFlag('green')} className="rounded bg-emerald-700 px-3 py-1.5 text-sm hover:bg-emerald-600">
                      Add
                    </button>
                  </div>
                </div>

                {/* Red Flags */}
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    Red Flags (- points)
                  </div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {editingZone.redFlags.map((flag, i) => (
                      <span key={i} className="flex items-center gap-1 rounded-full bg-red-900 px-3 py-1 text-sm text-red-300">
                        {flag}
                        <button onClick={() => removeFlag('red', i)} className="ml-1 hover:text-white">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFlag.red}
                      onChange={(e) => setNewFlag({ ...newFlag, red: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && addFlag('red')}
                      placeholder="Add keyword..."
                      className="flex-1 rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                    />
                    <button onClick={() => addFlag('red')} className="rounded bg-red-700 px-3 py-1.5 text-sm hover:bg-red-600">
                      Add
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-slate-700 pt-4">
                  <button
                    onClick={() => updateZone(editingZone)}
                    disabled={saving}
                    className="flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Zone'}
                  </button>
                  <button
                    onClick={() => deleteZone(editingZone.id)}
                    className="flex items-center gap-2 rounded bg-red-700 px-4 py-2 font-medium hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">
                Select a zone to edit or create a new one
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between border-t border-slate-700 p-4">
          <button
            onClick={handleRescore}
            className="flex items-center gap-2 rounded bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
          >
            <RefreshCw className="h-4 w-4" />
            Rescore All Leads
          </button>
          <button
            onClick={onClose}
            className="rounded bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ZonesConfig

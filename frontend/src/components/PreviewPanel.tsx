import { X, ExternalLink, Building2, MapPin, Calendar, Star, Archive, CheckCircle } from 'lucide-react'

interface JobLead {
  id: string
  title: string
  companyName: string
  location: string | null
  jobUrl: string
  description: string | null
  source: string
  matchScore: number
  status: string
  createdAt: string
}

interface PreviewPanelProps {
  lead: JobLead | null
  onClose: () => void
  onShortlist: (lead: JobLead) => void
  onArchive: (lead: JobLead) => void
  onApply: (lead: JobLead) => void
}

export function PreviewPanel({ lead, onClose, onShortlist, onArchive, onApply }: PreviewPanelProps) {
  if (!lead) return null

  const getScoreColor = (score: number) => {
    if (score > 50) return 'text-emerald-400'
    if (score > 0) return 'text-yellow-400'
    return 'text-red-400'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-[480px] flex-col border-l border-slate-700 bg-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-700 p-4">
        <div className="flex-1 pr-4">
          <h2 className="text-lg font-semibold leading-tight">{lead.title}</h2>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
            <Building2 className="h-4 w-4" />
            <span>{lead.companyName}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Meta info */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-slate-900 p-3">
            <div className="mb-1 text-xs text-slate-500">Match Score</div>
            <div className={`text-2xl font-bold ${getScoreColor(lead.matchScore)}`}>
              {lead.matchScore > 0 ? '+' : ''}{lead.matchScore}
            </div>
          </div>
          <div className="rounded-lg bg-slate-900 p-3">
            <div className="mb-1 text-xs text-slate-500">Source</div>
            <div className="text-lg font-medium">{lead.source}</div>
          </div>
        </div>

        {/* Details */}
        <div className="mb-6 space-y-3">
          {lead.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-slate-500" />
              <span>{lead.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span>Added {formatDate(lead.createdAt)}</span>
          </div>
        </div>

        {/* Description */}
        {lead.description && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-medium text-slate-400">Description</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {lead.description}
            </p>
          </div>
        )}

        {/* Job URL */}
        <div className="mb-6">
          <a
            href={lead.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded bg-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-600"
          >
            <ExternalLink className="h-4 w-4" />
            View Original Posting
          </a>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-slate-700 p-4">
        <div className="mb-3 text-xs text-slate-500">
          Quick Actions
        </div>
        <div className="flex gap-2">
          {lead.status === 'RADAR_NEW' && (
            <>
              <button
                onClick={() => onShortlist(lead)}
                className="flex flex-1 items-center justify-center gap-2 rounded bg-blue-600 py-2 font-medium hover:bg-blue-500"
              >
                <Star className="h-4 w-4" />
                Shortlist
                <kbd className="ml-1 rounded bg-blue-700 px-1.5 text-xs">S</kbd>
              </button>
              <button
                onClick={() => onArchive(lead)}
                className="flex flex-1 items-center justify-center gap-2 rounded bg-slate-600 py-2 font-medium hover:bg-slate-500"
              >
                <Archive className="h-4 w-4" />
                Archive
                <kbd className="ml-1 rounded bg-slate-700 px-1.5 text-xs">X</kbd>
              </button>
            </>
          )}
          {lead.status === 'SHORTLISTED' && (
            <button
              onClick={() => onApply(lead)}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-purple-600 py-2 font-medium hover:bg-purple-500"
            >
              <CheckCircle className="h-4 w-4" />
              Mark as Applied
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PreviewPanel

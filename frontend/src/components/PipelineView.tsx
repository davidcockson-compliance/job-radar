import { useState } from 'react'
import {
  Star, Send, Users, Archive, ExternalLink, Building2,
  MapPin, ChevronRight, GripVertical, FileText
} from 'lucide-react'

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

interface PipelineViewProps {
  leads: JobLead[]
  onStatusChange: (id: string, newStatus: string) => Promise<void>
  onSelectLead: (lead: JobLead) => void
  onGenerateWIBS: (lead: JobLead) => void
}

const PIPELINE_COLUMNS = [
  {
    status: 'SHORTLISTED',
    label: 'Shortlisted',
    icon: Star,
    color: 'blue',
    nextStatus: 'APPLIED',
    nextLabel: 'Mark Applied'
  },
  {
    status: 'APPLIED',
    label: 'Applied',
    icon: Send,
    color: 'purple',
    nextStatus: 'INTERVIEWING',
    nextLabel: 'Mark Interviewing'
  },
  {
    status: 'INTERVIEWING',
    label: 'Interviewing',
    icon: Users,
    color: 'cyan',
    nextStatus: null,
    nextLabel: null
  },
]

export function PipelineView({ leads, onStatusChange, onSelectLead, onGenerateWIBS }: PipelineViewProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const getColumnLeads = (status: string) =>
    leads.filter(l => l.status === status)

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedId(leadId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (draggedId) {
      const lead = leads.find(l => l.id === draggedId)
      if (lead && lead.status !== newStatus) {
        await onStatusChange(draggedId, newStatus)
      }
    }
    setDraggedId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverColumn(null)
  }

  const getScoreColor = (score: number) => {
    if (score > 50) return 'text-emerald-400'
    if (score > 0) return 'text-yellow-400'
    return 'text-red-400'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_COLUMNS.map(column => {
        const columnLeads = getColumnLeads(column.status)
        const Icon = column.icon
        const isDragOver = dragOverColumn === column.status

        return (
          <div
            key={column.status}
            className={`flex w-80 flex-shrink-0 flex-col rounded-lg border transition-colors ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-900/20'
                : 'border-slate-700 bg-slate-800/50'
            }`}
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            {/* Column Header */}
            <div className={`flex items-center gap-2 border-b border-slate-700 p-3`}>
              <Icon className={`h-4 w-4 text-${column.color}-400`} />
              <h3 className="font-medium">{column.label}</h3>
              <span className="ml-auto rounded bg-slate-700 px-2 py-0.5 text-xs">
                {columnLeads.length}
              </span>
            </div>

            {/* Column Content */}
            <div className="flex-1 space-y-2 overflow-y-auto p-2" style={{ maxHeight: 'calc(100vh - 220px)' }}>
              {columnLeads.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  No jobs in this stage
                </div>
              ) : (
                columnLeads.map(lead => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onDragEnd={handleDragEnd}
                    className={`group cursor-pointer rounded-lg border border-slate-700 bg-slate-800 p-3 transition-all hover:border-slate-600 ${
                      draggedId === lead.id ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Drag handle */}
                    <div className="mb-2 flex items-start justify-between">
                      <GripVertical className="h-4 w-4 cursor-grab text-slate-600 opacity-0 transition-opacity group-hover:opacity-100" />
                      <span className={`text-xs font-medium ${getScoreColor(lead.matchScore)}`}>
                        {lead.matchScore > 0 ? '+' : ''}{lead.matchScore}
                      </span>
                    </div>

                    {/* Title */}
                    <h4
                      className="mb-1 font-medium leading-tight hover:text-emerald-400"
                      onClick={() => onSelectLead(lead)}
                    >
                      {lead.title}
                    </h4>

                    {/* Company & Location */}
                    <div className="mb-2 space-y-1 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">{lead.companyName}</span>
                      </div>
                      {lead.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{lead.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-slate-700 pt-2">
                      <span className="text-xs text-slate-500">
                        {formatDate(lead.createdAt)}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); onGenerateWIBS(lead) }}
                          className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
                          title="Generate WIBS"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>
                        <a
                          href={lead.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-emerald-400"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        {column.nextStatus && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onStatusChange(lead.id, column.nextStatus!)
                            }}
                            className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-emerald-400"
                            title={column.nextLabel!}
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}

      {/* Archived Column (collapsed) */}
      <div className="flex w-48 flex-shrink-0 flex-col rounded-lg border border-slate-700 bg-slate-800/30">
        <div className="flex items-center gap-2 p-3">
          <Archive className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-medium text-slate-400">Archived</h3>
          <span className="ml-auto rounded bg-slate-700 px-2 py-0.5 text-xs">
            {leads.filter(l => l.status === 'ARCHIVED').length}
          </span>
        </div>
      </div>
    </div>
  )
}

export default PipelineView

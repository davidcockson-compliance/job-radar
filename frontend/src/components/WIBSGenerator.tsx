import { useState, useEffect } from 'react'
import { X, Copy, Check, FileText, Sparkles } from 'lucide-react'

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
}

interface CompanyProfile {
  id: string
  companyName: string
  companiesHouseId?: string
  industry?: string
  size?: string
  website?: string
  notes?: string
}

interface WIBSGeneratorProps {
  lead: JobLead
  company: CompanyProfile | null
  onClose: () => void
}

export function WIBSGenerator({ lead, company, onClose }: WIBSGeneratorProps) {
  const [wibs, setWibs] = useState({
    who: '',
    industry: '',
    business: '',
    strategy: '',
  })
  const [copied, setCopied] = useState(false)

  // Pre-fill with available data
  useEffect(() => {
    setWibs({
      who: `${lead.title} at ${lead.companyName}`,
      industry: company?.industry || '',
      business: company?.notes || lead.description?.slice(0, 200) || '',
      strategy: '',
    })
  }, [lead, company])

  const generateMarkdown = () => {
    return `# Why I'm the Best Suit: ${lead.companyName}

## Position
**${lead.title}**
${lead.location ? `📍 ${lead.location}` : ''}

## Who (The Company)
${wibs.who || '_Not specified_'}

## Industry & Market
${wibs.industry || '_Not specified_'}

## Business Context
${wibs.business || '_Not specified_'}

## My Strategy (Why I'm a Fit)
${wibs.strategy || '_Not specified_'}

---
*Generated for: [${lead.companyName}](${lead.jobUrl})*
`
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateMarkdown())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-slate-700 bg-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold">WIBS Generator</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-4">
          {/* Job Info */}
          <div className="mb-4 rounded-lg bg-slate-900 p-3">
            <div className="text-sm text-slate-400">Generating for:</div>
            <div className="font-medium">{lead.title}</div>
            <div className="text-sm text-slate-400">{lead.companyName}</div>
          </div>

          {/* WIBS Fields */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Who (The Company)
              </label>
              <textarea
                value={wibs.who}
                onChange={(e) => setWibs({ ...wibs, who: e.target.value })}
                placeholder="What does the company do? Who are they?"
                className="h-20 w-full rounded-lg border border-slate-600 bg-slate-900 p-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Industry & Market
              </label>
              <textarea
                value={wibs.industry}
                onChange={(e) => setWibs({ ...wibs, industry: e.target.value })}
                placeholder="What industry are they in? Market position?"
                className="h-20 w-full rounded-lg border border-slate-600 bg-slate-900 p-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Business Context
              </label>
              <textarea
                value={wibs.business}
                onChange={(e) => setWibs({ ...wibs, business: e.target.value })}
                placeholder="Current challenges, goals, recent news..."
                className="h-20 w-full rounded-lg border border-slate-600 bg-slate-900 p-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                My Strategy (Why I'm a Fit)
              </label>
              <textarea
                value={wibs.strategy}
                onChange={(e) => setWibs({ ...wibs, strategy: e.target.value })}
                placeholder="Why are you the best candidate? What unique value do you bring?"
                className="h-24 w-full rounded-lg border border-slate-600 bg-slate-900 p-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Preview</label>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded bg-slate-700 px-2 py-1 text-xs hover:bg-slate-600"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy Markdown
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-300">
              {generateMarkdown()}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-700 p-4">
          <button
            onClick={onClose}
            className="rounded bg-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-600"
          >
            Close
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500"
          >
            <FileText className="h-4 w-4" />
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default WIBSGenerator

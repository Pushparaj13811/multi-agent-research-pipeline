import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { Report } from '../types';
import { getReportPdfUrl } from '../api/client';

interface Props {
  report: Report;
  markdown: string;
  runId: string;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const color = confidence >= 0.8 ? 'text-green-400 bg-green-400/10' :
                confidence >= 0.5 ? 'text-yellow-400 bg-yellow-400/10' :
                'text-red-400 bg-red-400/10';
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${color}`}>
      {Math.round(confidence * 100)}% confidence
    </span>
  );
}

export default function ReportView({ report, markdown: _markdown, runId }: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set(report.sections.map((_, i) => i))
  );

  const toggleSection = (i: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">{report.title}</h2>
        <a
          href={getReportPdfUrl(runId)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </a>
      </div>

      <p className="text-gray-400 italic">{report.summary}</p>

      {report.key_findings.length > 0 && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-400 uppercase mb-2">Key Findings</h3>
          <ul className="space-y-1">
            {report.key_findings.map((finding, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {report.sections.map((section, i) => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection(i)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedSections.has(i) ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                <span className="font-medium text-white">{section.name}</span>
              </div>
              <ConfidenceBadge confidence={section.confidence} />
            </button>

            {expandedSections.has(i) && (
              <div className="px-4 pb-4 border-t border-gray-700">
                <div className="prose prose-invert prose-sm max-w-none mt-3">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {section.content}
                  </ReactMarkdown>
                </div>

                {section.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-700">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Sources</h4>
                    <div className="space-y-1">
                      {section.citations.map((cite, j) => (
                        <a
                          key={j}
                          href={cite.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {cite.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {report.sources.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">All Sources</h3>
          <div className="grid gap-2">
            {report.sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-sm text-gray-300 hover:text-blue-400 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">{source.title}</span>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{source.snippet}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { FileText, Bookmark, ExternalLink } from 'lucide-react';
import { RAGChunkCitation } from '../../types';

interface MarkdownMessageProps {
  content: string;
  citations?: RAGChunkCitation[];
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, citations }) => {
  // Clean raw LaTeX or math symbols
  const cleanContent = content
    .replace(/\$\\to\$/g, '→')
    .replace(/\\to/g, '→')
    .replace(/\$(\d+(\.\d+)?)\$/g, '$1');

  // Split into paragraphs / blocks
  const blocks = cleanContent.split(/\n\s*\n/);

  // Helper to parse inline bold, italics, code, and links
  const renderInline = (text: string): React.ReactNode => {
    // Regex matches **bold**, *italic*, `code`
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <em key={i} className="italic text-slate-700">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px] font-mono text-slate-800">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-2.5 text-xs sm:text-sm text-[#08162B] leading-relaxed">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Check if block is a list (lines starting with •, -, * )
        const lines = trimmed.split('\n');
        const isList = lines.every((line) => {
          const l = line.trim();
          return l.startsWith('•') || l.startsWith('- ') || l.startsWith('* ') || /^\d+\.\s/.test(l);
        });

        if (isList && lines.length > 1) {
          return (
            <ul key={bIdx} className="space-y-1.5 my-2 pl-1">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^[•\-\*]\s*|^\d+\.\s*/, '').trim();
                return (
                  <li key={lIdx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#176B87] mt-1.5 shrink-0" />
                    <span className="flex-1">{renderInline(cleanLine)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Check if line is a Heading (### or ## or #)
        if (trimmed.startsWith('#')) {
          const headingText = trimmed.replace(/^#{1,6}\s*/, '');
          return (
            <h4 key={bIdx} className="font-bold text-slate-900 text-xs sm:text-sm mt-3 mb-1">
              {renderInline(headingText)}
            </h4>
          );
        }

        // Normal paragraph (may have single-line breaks)
        return (
          <p key={bIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderInline(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}

      {/* Separate, readable Document Source Citations Section */}
      {citations && citations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200/80 bg-white/70 rounded-xl p-3 border border-slate-200/60 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#102A43]">
            <Bookmark className="w-3.5 h-3.5 text-[#176B87]" />
            <span>Document Sources & Citations</span>
          </div>

          <div className="space-y-1.5">
            {citations.map((cite, cIdx) => (
              <div
                key={cIdx}
                className="p-2 bg-slate-50/80 rounded-lg border border-slate-200/50 text-[11px] space-y-1"
              >
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold flex items-center gap-1 text-[#176B87] truncate max-w-[200px]">
                    <FileText className="w-3 h-3 shrink-0" />
                    {cite.document_name}
                  </span>
                  {cite.page_number && (
                    <span className="bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded text-[10px] font-mono">
                      Page {cite.page_number}
                    </span>
                  )}
                </div>
                <p className="text-slate-600 line-clamp-2 italic">"{cite.snippet}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Copy, Check } from 'lucide-react';

interface MarkdownMessageProps {
  content: string;
  isUser?: boolean;
  className?: string;
  showCopyButton?: boolean;
}

// Ensure marked uses GFM and standard line break semantics
marked.use({
  gfm: true,
  breaks: true,
});

/**
 * Pre-processes raw text from LLMs to ensure clean markdown hierarchy
 * if linebreaks or delimiters were compacted by the model.
 */
function normalizeMarkdown(raw: string): string {
  if (!raw) return '';

  let text = raw;

  // Ensure horizontal rules (---) have adequate spacing
  text = text.replace(/([^\n])\s*---\s*([^\n])/g, '$1\n\n---\n\n$2');
  text = text.replace(/([^\n])\s*---/g, '$1\n\n---');
  text = text.replace(/---\s*([^\n])/g, '---\n\n$1');

  // Ensure markdown headings (#, ##, ###) start on new lines
  text = text.replace(/([^\n])\s*(#{1,6}\s+)/g, '$1\n\n$2');

  // Ensure bullet points (* or - followed by space) have newlines before them
  text = text.replace(/([^\n])\s*([*•-]\s+)/g, '$1\n$2');

  // Ensure numbered list items (e.g., 1. 2.) have newlines before them if glued
  text = text.replace(/([^\n])\s*(\d+\.\s+)/g, '$1\n$2');

  // Enhance CCIP citation tags [Entity: ...], [Evidence: ...], [Case: ...], [Relation: ...], [Correlation: ...]
  text = text.replace(
    /\[(Entity|Evidence|Relation|Case|Correlation):\s*([^\]]+)\]/g,
    '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/20 text-cyan-300 border border-primary/40 mx-0.5 cursor-pointer hover:bg-primary/30 transition-colors">[$1: $2]</span>'
  );

  return text;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({
  content,
  isUser = false,
  className = '',
  showCopyButton = false,
}) => {
  const [copied, setCopied] = useState(false);

  const htmlContent = useMemo(() => {
    if (isUser) return '';
    try {
      const normalized = normalizeMarkdown(content);
      const parsed = marked.parse(normalized) as string;
      return DOMPurify.sanitize(parsed, {
        ADD_ATTR: ['target', 'rel', 'class'],
      });
    } catch (e) {
      console.error('[Markdown Parsing Error]', e);
      return content;
    }
  }, [content, isUser]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is blocked
    }
  };

  if (isUser) {
    return (
      <div className={`whitespace-pre-wrap leading-relaxed ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      {showCopyButton && (
        <button
          onClick={handleCopy}
          className="absolute -top-1 -right-1 p-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 text-content-muted hover:text-white transition-all opacity-70 hover:opacity-100 flex items-center gap-1 text-[10px] font-mono z-10"
          title="Copy response to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-sans">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="font-sans">Copy</span>
            </>
          )}
        </button>
      )}

      <div
        className="chatgpt-markdown"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};

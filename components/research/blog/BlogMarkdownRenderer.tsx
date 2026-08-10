import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, ExternalLink, ImageIcon, Loader2, Copy, Check } from 'lucide-react';
import { BlogPostResult, SectionImagePrompt } from '../../../services/geminiService';

interface BlogMarkdownRendererProps {
  content: string;
  blogResult?: BlogPostResult | null;
  generatingPromptId?: string | null;
  onGenerateSectionImage?: (promptObj: SectionImagePrompt) => void;
}

export const BlogMarkdownRenderer: React.FC<BlogMarkdownRendererProps> = ({
  content,
  blogResult,
  generatingPromptId,
  onGenerateSectionImage
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  return (
    <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-8 mb-4 font-display border-b border-purple-500/20 pb-3 leading-tight">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 mt-8 mb-4 font-display leading-tight flex items-center gap-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-6 mb-3 font-display leading-tight">{children}</h3>,
          h4: ({ children }) => <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-4 mb-2 font-display">{children}</h4>,
          p: ({ children }: any) => {
            const textContent = Array.isArray(children)
              ? children.map(c => (typeof c === 'string' ? c : (c?.props?.children ? String(c.props.children) : ''))).join('')
              : (typeof children === 'string' ? children : '');

            const promptMatch = textContent.match(/\[?IMAGE_PROMPT:\s*([^\]\n]+)\]?/i);
            if (promptMatch) {
              const promptText = promptMatch[1].trim();
              return (
                <div className="my-6 p-4 sm:p-5 bg-purple-950/40 dark:bg-purple-950/60 border border-purple-500/30 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>Image Prompt</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(promptText);
                        setCopiedPrompt(true);
                        setTimeout(() => setCopiedPrompt(false), 2000);
                      }}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer border border-purple-500/20"
                    >
                      {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPrompt ? 'Copied' : 'Copy prompt'}</span>
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-200 font-medium bg-slate-900/80 p-3.5 rounded-xl border border-purple-500/20 leading-relaxed whitespace-pre-wrap">
                    {promptText}
                  </p>
                  {blogResult && onGenerateSectionImage && (
                    <button
                      type="button"
                      disabled={generatingPromptId !== null}
                      onClick={() => {
                        const promptObj: SectionImagePrompt = {
                          id: `prompt_${Date.now()}`,
                          prompt: promptText,
                          tag: promptMatch[0]
                        };
                        onGenerateSectionImage(promptObj);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {generatingPromptId !== null ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                          <span>Generating High-Res Section Image...</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4" />
                          <span>🎨 Generate Image for Section</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            }

            return <p className="mb-4 leading-relaxed text-slate-800 dark:text-slate-200 text-sm sm:text-base">{children}</p>;
          },
          img: ({ src, alt }: any) => {
            if (!src) return null;
            return (
              <figure className="my-6 space-y-2">
                <div className="relative group overflow-hidden rounded-2xl border border-purple-500/30 bg-slate-900 shadow-xl max-w-2xl mx-auto">
                  <img
                    src={src}
                    alt={alt || "Blog section visual"}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-cover max-h-[460px] transition-transform duration-300 group-hover:scale-[1.01]"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.img-fallback-box')) {
                        const fallbackDiv = document.createElement('div');
                        fallbackDiv.className = 'img-fallback-box p-6 bg-slate-900 border border-purple-500/30 rounded-2xl text-center space-y-2';
                        fallbackDiv.innerHTML = `<span class="text-xs text-purple-400 font-mono font-bold block">🖼️ Section Image Asset</span><p class="text-xs text-slate-300 font-medium">${alt || 'Visual asset ready for publishing'}</p>`;
                        parent.appendChild(fallbackDiv);
                      }
                    }}
                  />
                  {alt && (
                    <div className="p-3 bg-slate-900/95 border-t border-slate-800 text-xs font-medium text-slate-200 flex items-center justify-between gap-2">
                      <span className="truncate">🎨 {alt}</span>
                      <span className="text-[10px] text-purple-400 font-mono shrink-0 px-2.5 py-0.5 bg-purple-500/10 rounded-full border border-purple-500/20">
                        Embedded Visual
                      </span>
                    </div>
                  )}
                </div>
              </figure>
            );
          },
          strong: ({ children }) => <strong className="font-bold text-slate-900 dark:text-white bg-purple-500/10 px-1 py-0.5 rounded border border-purple-500/20">{children}</strong>,
          em: ({ children }) => <em className="italic text-purple-600 dark:text-purple-300">{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-6 space-y-2.5 my-5 text-slate-800 dark:text-slate-200 text-sm sm:text-base">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 space-y-2.5 my-5 text-slate-800 dark:text-slate-200 text-sm sm:text-base">{children}</ol>,
          li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
          hr: () => <hr className="border-slate-200 dark:border-slate-800/80 my-8" />,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-500 pl-5 py-3.5 my-6 italic text-slate-700 dark:text-slate-300 bg-purple-500/10 rounded-r-2xl shadow-xs text-sm sm:text-base leading-relaxed">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-5 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-purple-100 dark:bg-purple-950/60 border-b border-slate-200 dark:border-slate-800 text-purple-800 dark:text-purple-300 uppercase tracking-wider text-[10px] font-bold">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{children}</th>,
          td: ({ children }) => <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">{children}</td>,
          code: ({ inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code className="px-2 py-0.5 bg-purple-500/15 text-purple-700 dark:text-purple-300 font-mono text-xs font-semibold rounded-md border border-purple-500/20" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-4 my-5 bg-slate-900 dark:bg-slate-950 border border-slate-700 dark:border-slate-800 text-purple-300 font-mono text-xs sm:text-sm rounded-2xl overflow-x-auto shadow-md">
                <code>{children}</code>
              </pre>
            );
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold inline-flex items-center gap-1"
            >
              {children}
              <ExternalLink className="w-3 h-3 inline shrink-0" />
            </a>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

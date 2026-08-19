import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, ExternalLink, ImageIcon, Loader2, Copy, Check, RefreshCw, CloudUpload, ClipboardList } from 'lucide-react';
import { BlogPostResult, SectionImagePrompt } from '../../../services/geminiService';
import { extractNodeDiagrams, findDiagramTokens, NodeDiagram } from '../../../lib/nodeDiagrams';
import { parseAsciiTable, AsciiTableData } from '../../../lib/asciiTable';
import { FlowDiagramRenderer } from './FlowDiagramRenderer';

const StyledAsciiTable: React.FC<{ table: AsciiTableData }> = ({ table }) => {
  const { headers, rows } = table;
  const singleColumn = headers.length === 1;

  if (singleColumn) {
    return (
      <div className="my-5 rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-950/40 to-slate-950/60 dark:from-purple-950/60 dark:to-slate-950 overflow-hidden shadow-md">
        <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-display font-bold text-sm flex items-center gap-2">
          <ClipboardList className="w-4 h-4 shrink-0" />
          <span className="uppercase tracking-wide">{headers[0]}</span>
        </div>
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {rows.map((row, i) => (
            <li key={i} className="flex items-start gap-3 px-4 py-3">
              <span className="w-6 h-6 shrink-0 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 text-[10px] font-bold flex items-center justify-center border border-purple-500/30 mt-0.5">
                {i + 1}
              </span>
              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {row[0]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="my-5 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 shadow-sm">
      <table className="w-full text-left text-xs sm:text-sm border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-purple-600/90 to-indigo-600/90 text-white uppercase tracking-wider text-[10px] sm:text-[11px] font-bold">
            {headers.map((h, i) => (
              <th key={i} className="p-3.5 font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className={`p-3.5 text-slate-700 dark:text-slate-300 font-medium ${j === 0 ? 'text-slate-900 dark:text-white font-bold' : ''}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface BlogMarkdownRendererProps {
  content: string;
  blogResult?: BlogPostResult | null;
  generatingPromptId?: string | null;
  uploadingPromptId?: string | null;
  onGenerateSectionImage?: (promptObj: SectionImagePrompt) => void;
  onUploadSectionImage?: (promptObj: SectionImagePrompt) => void;
}

export const BlogMarkdownRenderer: React.FC<BlogMarkdownRendererProps> = ({
  content,
  blogResult,
  generatingPromptId,
  uploadingPromptId,
  onGenerateSectionImage,
  onUploadSectionImage
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [ratioMap, setRatioMap] = useState<Record<string, string>>({});

  const extracted = useMemo(() => extractNodeDiagrams(content), [content]);
  const diagrams = extracted.diagrams;
  const cleanedContent = extracted.cleanedText;

  const diagramForIndex = (idx: number): NodeDiagram | null => diagrams[idx] || null;

  const ratioFor = (key: string, fallback?: string) => ratioMap[key] || fallback || '16:9';
  const setRatioFor = (key: string, val: string) => setRatioMap(prev => ({ ...prev, [key]: val }));

  const ratioSelect = (ratioKey: string, initialRatio?: string) => (
    <select
      value={ratioFor(ratioKey, initialRatio)}
      onChange={(e) => setRatioFor(ratioKey, e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className="px-1.5 py-1 bg-slate-900 text-slate-200 border border-purple-500/25 rounded-lg text-[10px] font-bold outline-none cursor-pointer"
      title="Image aspect ratio"
    >
      <option value="16:9">16:9 Landscape</option>
      <option value="1:1">1:1 Square</option>
      <option value="9:16">9:16 Portrait</option>
    </select>
  );
  return (
    <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-8 mb-4 font-display border-b border-purple-500/20 pb-3 leading-tight">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 mt-8 mb-4 font-display leading-tight flex items-center gap-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-6 mb-3 font-display leading-tight">{children}</h3>,
          h4: ({ children }) => <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-4 mb-2 font-display">{children}</h4>,
          p: ({ children, node }: any) => {
            const hasImageChild = (node?.children || []).some((c: any) => c?.type === 'image');

            if (hasImageChild) {
              return <div className="my-2">{children}</div>;
            }

            const textContent = Array.isArray(children)
              ? children.map(c => (typeof c === 'string' ? c : (c?.props?.children ? String(c.props.children) : ''))).join('')
              : (typeof children === 'string' ? children : '');

            const diagramTokens = findDiagramTokens(textContent);
            if (diagramTokens.length > 0 && diagrams.length > 0) {
              const rendered = diagramTokens
                .map(idx => diagramForIndex(idx))
                .filter((d): d is NodeDiagram => Boolean(d));
              if (rendered.length > 0) {
                return (
                  <div className="my-2 space-y-4">
                    {rendered.map((d, i) => (
                      <FlowDiagramRenderer key={`${d.id}-${i}`} diagram={d} />
                    ))}
                  </div>
                );
              }
            }

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
                    <div className="flex items-center gap-1.5">
                      {onGenerateSectionImage && ratioSelect(promptText, blogResult?.sectionImagePrompts.find(p => p.prompt === promptText)?.aspectRatio)}
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
                  </div>
                  <p className="text-xs sm:text-sm text-purple-200 font-medium bg-slate-900/80 p-3.5 rounded-xl border border-purple-500/20 leading-relaxed whitespace-pre-wrap">
                    {promptText}
                  </p>
                  {onGenerateSectionImage && (() => {
                    const matchedPrompt = blogResult?.sectionImagePrompts?.find((p: any) => p.prompt === promptText);
                    const hasPreview = matchedPrompt?.previewDataUrl && !matchedPrompt?.generatedUrl;

                    if (hasPreview && onUploadSectionImage) {
                      return (
                        <div className="space-y-2">
                          <div className="w-full max-h-64 overflow-hidden rounded-xl border border-purple-500/30 bg-slate-900">
                            <img src={matchedPrompt.previewDataUrl} alt="Generated section preview" className="w-full h-auto object-cover" />
                          </div>
                          <button
                            type="button"
                            disabled={uploadingPromptId !== null}
                            onClick={() => onUploadSectionImage(matchedPrompt)}
                            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {uploadingPromptId !== null ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-sky-200" />
                                <span>Uploading to Cloudinary...</span>
                              </>
                            ) : (
                              <>
                                <CloudUpload className="w-4 h-4" />
                                <span>Upload Image to Blog</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    }

                    return (
                      <button
                        type="button"
                        disabled={generatingPromptId !== null}
                        onClick={() => {
                          const promptObj: SectionImagePrompt = {
                            id: `prompt_${Date.now()}`,
                            prompt: promptText,
                            tag: promptMatch[0],
                            aspectRatio: ratioFor(promptText)
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
                    );
                  })()}
                </div>
              );
            }

            return <p className="mb-4 leading-relaxed text-slate-800 dark:text-slate-200 text-sm sm:text-base">{children}</p>;
          },
          img: ({ src, alt }: any) => {
            if (!src) return null;
            const matchedPrompt = blogResult?.sectionImagePrompts?.find((p: any) => p.generatedUrl && p.generatedUrl === src);
            return (
              <figure className="my-6 space-y-2">
                <div className="relative group overflow-hidden rounded-2xl border border-purple-500/30 bg-slate-900 shadow-xl max-w-2xl mx-auto">
                  <img
                    src={src}
                    alt={alt || "Blog section visual"}
                    referrerPolicy="no-referrer"
                    className={`w-full h-auto object-cover max-h-[460px] transition-transform duration-300 group-hover:scale-[1.01] ${matchedPrompt?.aspectRatio === '9:16' ? 'max-h-[640px]' : ''}`}
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
                {matchedPrompt && onGenerateSectionImage && (
                  <div className="flex flex-wrap items-center justify-between gap-2 max-w-2xl mx-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">🎨 {matchedPrompt.aspectRatio || '16:9'} {matchedPrompt.aspectRatio === '1:1' ? 'Square' : matchedPrompt.aspectRatio === '9:16' ? 'Portrait' : 'Landscape'}</span>
                    <div className="flex items-center gap-1.5">
                      {ratioSelect(matchedPrompt.prompt, matchedPrompt.aspectRatio)}
                      <button
                        type="button"
                        disabled={generatingPromptId !== null}
                        onClick={() => onGenerateSectionImage({ ...matchedPrompt, aspectRatio: ratioFor(matchedPrompt.prompt) })}
                        className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {generatingPromptId !== null ? <Loader2 className="w-3 h-3 animate-spin text-purple-200" /> : <RefreshCw className="w-3 h-3" />}
                        <span>Regenerate Section Image</span>
                      </button>
                    </div>
                  </div>
                )}
              </figure>
            );
          },
          strong: ({ children }) => <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-purple-600 dark:text-purple-300">{children}</em>,
          del: ({ children }) => <del className="line-through text-slate-500 dark:text-slate-400">{children}</del>,
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
            <div className="my-5 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 shadow-sm">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gradient-to-r from-purple-600/90 to-indigo-600/90 text-white uppercase tracking-wider text-[10px] sm:text-[11px] font-bold">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{children}</th>,
          td: ({ children }) => <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">{children}</td>,
          code: ({ inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code className="px-1.5 text-purple-700 dark:text-purple-300 font-mono text-xs font-semibold" {...props}>
                  {children}
                </code>
              );
            }
            const rawCode = Array.isArray(children) ? children.join('') : String(children || '');
            const asciiTable = parseAsciiTable(rawCode);
            if (asciiTable && asciiTable.headers.length > 0) {
              return <StyledAsciiTable table={asciiTable} />;
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
        {cleanedContent}
      </ReactMarkdown>
    </div>
  );
};

/**
 * Shared (client + server) utilities for the AI "node diagram" tool.
 *
 * The AI embeds a compact single-line marker in markdown:
 *   [NODE_DIAGRAM: {"title":"...","nodes":[{...}],"edges":[{...}]}]
 * These helpers extract the JSON out of the marker (replacing it with a
 * renderer token) and normalize it into a structured NodeDiagram.
 */

export interface NodeDiagramNode {
  id: string;
  label: string;
  description?: string;
  type?: 'input' | 'process' | 'decision' | 'output';
}

export interface NodeDiagramEdge {
  id?: string;
  source: string;
  target: string;
  label?: string;
}

export interface NodeDiagram {
  id: string;
  title?: string;
  nodes: NodeDiagramNode[];
  edges: NodeDiagramEdge[];
}

export interface ExtractedNodeDiagrams {
  diagrams: NodeDiagram[];
  /** Markdown with each diagram marker replaced by its renderer token ([[NODE_DIAGRAM:index]]). */
  cleanedText: string;
}

export const NODE_DIAGRAM_TOKEN = '[[NODE_DIAGRAM:';

const MARKER_OPEN = '[NODE_DIAGRAM:';
const VALID_TYPES = new Set(['input', 'process', 'decision', 'output']);

/** Scan for a balanced JSON object starting at `braceIndex`. Returns its closing index + raw text. */
const scanBalancedJson = (text: string, braceIndex: number): { end: number; json: string } | null => {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = braceIndex; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return { end: i, json: text.slice(braceIndex, i + 1) };
      }
    }
  }
  return null;
};

const normalizeDiagram = (raw: string): NodeDiagram | null => {
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || !Array.isArray(parsed.nodes) || parsed.nodes.length < 2) return null;

  const nodes: NodeDiagramNode[] = parsed.nodes
    .filter((n: any) => n && typeof n.id === 'string' && n.id.trim() && typeof n.label === 'string' && n.label.trim())
    .map((n: any) => ({
      id: n.id.trim(),
      label: n.label.trim(),
      description: typeof n.description === 'string' && n.description.trim() ? n.description.trim() : undefined,
      type: VALID_TYPES.has(n.type) ? n.type : undefined,
    }));
  if (nodes.length < 2) return null;

  const nodeIds = new Set(nodes.map(n => n.id));
  const edges: NodeDiagramEdge[] = Array.isArray(parsed.edges)
    ? parsed.edges
        .filter((e: any) => e && typeof e.source === 'string' && typeof e.target === 'string' && nodeIds.has(e.source) && nodeIds.has(e.target))
        .map((e: any, i: number) => ({
          id: typeof e.id === 'string' && e.id.trim() ? e.id.trim() : `edge_${i}`,
          source: e.source.trim(),
          target: e.target.trim(),
          label: typeof e.label === 'string' && e.label.trim() ? e.label.trim() : undefined,
        }))
    : [];

  return {
    id: `diagram_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : undefined,
    nodes,
    edges,
  };
};

/**
 * Extract every [NODE_DIAGRAM: ...] marker from markdown. Markers are removed
 * from the returned text and replaced with [[NODE_DIAGRAM:index]] tokens so a
 * renderer can substitute the diagram at the exact position it appeared.
 */
export const extractNodeDiagrams = (markdown: string): ExtractedNodeDiagrams => {
  if (!markdown || !markdown.includes(MARKER_OPEN)) {
    return { diagrams: [], cleanedText: markdown || '' };
  }

  const diagrams: NodeDiagram[] = [];
  let cleaned = '';
  let i = 0;

  while (i < markdown.length) {
    const open = markdown.indexOf(MARKER_OPEN, i);
    if (open === -1) {
      cleaned += markdown.slice(i);
      break;
    }
    cleaned += markdown.slice(i, open);

    const brace = markdown.indexOf('{', open + MARKER_OPEN.length);
    if (brace === -1) {
      cleaned += markdown.slice(open);
      break;
    }

    const scanned = scanBalancedJson(markdown, brace);
    if (!scanned) {
      cleaned += markdown.slice(open, brace + 1);
      i = brace + 1;
      continue;
    }

    let after = scanned.end + 1;
    // Skip any whitespace between the JSON and the closing bracket, then the bracket itself.
    while (after < markdown.length && /[\s]/.test(markdown[after])) after += 1;
    if (markdown[after] === ']') after += 1;

    const diagram = normalizeDiagram(scanned.json);
    if (diagram) {
      diagrams.push(diagram);
      cleaned += `${NODE_DIAGRAM_TOKEN}${diagrams.length - 1}]]`;
    } else {
      cleaned += markdown.slice(open, after);
    }
    i = after;
  }

  return { diagrams, cleanedText: cleaned };
};

/** Find all diagram tokens present in a rendered paragraph's text. */
export const findDiagramTokens = (text: string): number[] => {
  const indices: number[] = [];
  const re = /\[\[NODE_DIAGRAM:(\d+)\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const idx = Number(m[1]);
    if (!Number.isNaN(idx)) indices.push(idx);
  }
  return indices;
};

/**
 * Remove every [NODE_DIAGRAM: ...] marker from markdown entirely (used when
 * the node-diagram feature is disabled — the AI must fall back to natural
 * markdown explanations). Surrounding text is preserved.
 */
export const removeNodeDiagramMarkers = (markdown: string): string => {
  if (!markdown || !markdown.includes(MARKER_OPEN)) return markdown || '';

  let cleaned = '';
  let i = 0;
  while (i < markdown.length) {
    const open = markdown.indexOf(MARKER_OPEN, i);
    if (open === -1) {
      cleaned += markdown.slice(i);
      break;
    }
    cleaned += markdown.slice(i, open);

    const brace = markdown.indexOf('{', open + MARKER_OPEN.length);
    if (brace === -1) {
      cleaned += markdown.slice(open);
      break;
    }

    const scanned = scanBalancedJson(markdown, brace);
    if (!scanned) {
      cleaned += markdown.slice(open, brace + 1);
      i = brace + 1;
      continue;
    }

    let after = scanned.end + 1;
    // Skip any whitespace between the JSON and the closing bracket, then the bracket itself.
    while (after < markdown.length && /[\s]/.test(markdown[after])) after += 1;
    if (markdown[after] === ']') after += 1;
    i = after;
  }
  return cleaned;
};
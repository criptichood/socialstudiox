/**
 * Detect and parse box-drawn / plus-drawn ASCII tables that AI models often
 * emit inside fenced code blocks (e.g. audit checklists, comparison matrices).
 * Renders them as styled HTML tables or cards instead of raw monospace.
 */

export interface AsciiTableData {
  headers: string[];
  rows: string[][];
}

// A separator line contains only borders, dashes, and box-drawing characters.
const SEPARATOR_ONLY = /^[\s\-═─│║┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬+]*$/;
// At least one of these must appear somewhere for a block to count as a drawn table.
const HAS_DRAWING = /[\─═│║┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬]|\+/;

export const parseAsciiTable = (text: string): AsciiTableData | null => {
  const lines = text.split('\n').map((l) => l.replace(/\r$/, ''));
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  if (lines.length < 2) return null;

  const firstTrim = lines[0].trim();
  if (firstTrim.length === 0 || !SEPARATOR_ONLY.test(firstTrim)) return null;
  if (!HAS_DRAWING.test(text)) return null;

  const dataLines = lines.filter((l) => {
    const t = l.trim();
    return t.length > 0 && !SEPARATOR_ONLY.test(t);
  });
  if (dataLines.length === 0) return null;

  const splitRow = (l: string): string[] => {
    const normalized = l.replace(/[│║]/g, '|');
    let cells = normalized.split('|');
    if (cells.length && cells[0].trim() === '') cells.shift();
    if (cells.length && cells[cells.length - 1].trim() === '') cells.pop();
    return cells.map((c) => c.replace(/^[\s\-═─]+|[\s\-═─]+$/g, '').trim());
  };

  const parsed = dataLines.map(splitRow);
  const colCount = Math.max(...parsed.map((r) => r.length), 1);
  const normalized = parsed.map((r) => {
    const arr = [...r];
    while (arr.length < colCount) arr.push('');
    return arr;
  });

  return { headers: normalized[0], rows: normalized.slice(1) };
};
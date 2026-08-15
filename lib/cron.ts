/**
 * Minimal 5-field cron matcher.
 *
 * Supports the standard `minute hour day-of-month month day-of-week` fields
 * with `*`, comma lists, ranges (a-b) and steps (star/N, a-b/N).
 * Day-of-week uses 0-6 (0 = Sunday); 7 is normalized to Sunday like Vixie cron.
 * When both day-of-month and day-of-week are restricted, a day matches if
 * EITHER field matches (Vixie cron "OR" semantics).
 */

const MONTHS = 12;
const MIN_PER_HOUR = 60;

const expandField = (spec: string, min: number, max: number): Set<number> => {
  const allowed = new Set<number>();
  for (const part of spec.split(',')) {
    const piece = part.trim();
    if (!piece) continue;
    const [rangePart, stepPart] = piece.split('/');
    const step = stepPart ? Number(stepPart) : 1;
    if (!Number.isFinite(step) || step <= 0) continue;

    let start: number;
    let end: number;
    if (rangePart === '*') {
      start = min;
      end = max;
    } else if (rangePart.includes('-')) {
      const [a, b] = rangePart.split('-').map(Number);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      start = a;
      end = b;
    } else {
      const single = Number(rangePart);
      if (!Number.isFinite(single)) continue;
      start = single;
      end = single;
    }

    for (let value = start; value <= end; value += step) {
      if (value >= min && value <= max) allowed.add(value);
    }
  }
  return allowed;
};

const parseCron = (expr: string) => {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) return null;

  const minutes = expandField(fields[0], 0, 59);
  const hours = expandField(fields[1], 0, 23);
  const domRaw = expandField(fields[2], 1, 31);
  const months = expandField(fields[3], 1, MONTHS);
  const dowRaw = expandField(fields[4], 0, 7);

  // Normalize Sunday (0 and 7) to a single 0..6 set.
  const dows = new Set<number>();
  for (const value of dowRaw) dows.add(value % 7);

  const domRestricted = fields[2].trim() !== '*';
  const dowRestricted = fields[4].trim() !== '*';

  return { minutes, hours, dom: domRaw, months, dows, domRestricted, dowRestricted };
};

/**
 * Compute the next time a 5-field cron expression fires strictly after `from`.
 * Returns `null` when the expression is malformed or no match is found.
 */
export const nextCronRun = (expr: string, from: Date = new Date()): Date | null => {
  const cron = parseCron(expr);
  if (!cron) return null;

  const snapshot = new Date(from.getTime() + 1000);
  snapshot.setSeconds(0, 0);

  // Safety cap (~10 years of minute-by-minute advancement).
  const maxAttempts = 10 * 366 * 24 * 60;
  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    const month = snapshot.getMonth() + 1;
    if (!cron.months.has(month)) {
      snapshot.setDate(1);
      snapshot.setMonth(snapshot.getMonth() + 1); // first day of *next* month
      snapshot.setHours(0, 0, 0, 0);
      continue;
    }

    const domMatches = cron.dom.has(snapshot.getDate());
    const dowMatches = cron.dows.has(snapshot.getDay());
    const dayMatches =
      (cron.domRestricted && cron.dowRestricted)
        ? domMatches || dowMatches
        : cron.domRestricted
          ? domMatches
          : cron.dowRestricted
            ? dowMatches
            : true;

    if (!dayMatches) {
      snapshot.setDate(snapshot.getDate() + 1);
      snapshot.setHours(0, 0, 0, 0);
      continue;
    }

    const hour = snapshot.getHours();
    if (!cron.hours.has(hour)) {
      snapshot.setHours(hour + 1, 0, 0, 0);
      continue;
    }

    const minute = snapshot.getMinutes();
    if (!cron.minutes.has(minute)) {
      snapshot.setMinutes(minute + 1, 0, 0);
      continue;
    }

    if (snapshot.getTime() > from.getTime()) return snapshot;
    snapshot.setMinutes(snapshot.getMinutes() + 1, 0, 0);
  }

  return null;
};

/** Human-friendly label for a 5-field cron expression (falls back to the raw rule). */
export const describeCron = (expr: string): string => {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) return `Custom: ${expr}`;
  const [min, hour, dom, mon, dow] = fields;
  if (mon !== '*') return `Custom: ${expr}`;
  const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  if (dow !== '*') {
    const day = dow === '0' || dow === '7' ? 'Sundays' : dow === '1' ? 'Mondays' : dow === '2' ? 'Tuesdays' : dow === '3' ? 'Wednesdays' : dow === '4' ? 'Thursdays' : dow === '5' ? 'Fridays' : dow === '6' ? 'Saturdays' : null;
    if (day && dom === '*') return `Every ${day} at ${time}`;
  }
  if (dom === '*' && min === '0' && hour === '*') return `Every hour`;
  if (dom === '*' && min === '0') return `Daily at ${time}`;
  if (dom !== '*') {
    const dayNum = dom.startsWith('*/') ? `every ${dom.slice(2)} days` : `day ${dom} of month`;
    return `Every ${dayNum} at ${time}`;
  }
  return `Custom: ${expr}`;
};
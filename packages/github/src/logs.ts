export interface LogFilterOptions {
  job?: string;
  step?: string;
  grep?: string;
  head?: number;
  tail?: number;
}

export interface LogFilterResult {
  total_matching: number;
  returned: number;
  truncated: boolean;
  lines: string[];
}

/**
 * Filter raw gh workflow log output.
 * Each line looks like: `<jobName>\t<stepName>\t<timestamp> <message>`.
 */
export function filterLogs(raw: string, opts: LogFilterOptions): LogFilterResult {
  let lines = raw.split(/\r?\n/).filter((l) => l.length > 0);

  if (opts.job !== undefined) {
    const re = compileRegex(opts.job);
    lines = lines.filter((l) => re.test(firstCol(l, 0)));
  }
  if (opts.step !== undefined) {
    const re = compileRegex(opts.step);
    lines = lines.filter((l) => re.test(firstCol(l, 1)));
  }
  if (opts.grep !== undefined) {
    const re = compileRegex(opts.grep);
    lines = lines.filter((l) => re.test(l));
  }

  const totalMatching = lines.length;

  if (opts.head !== undefined && opts.tail !== undefined) {
    if (lines.length > opts.head + opts.tail) {
      lines = [...lines.slice(0, opts.head), ...lines.slice(-opts.tail)];
    }
  } else if (opts.head !== undefined) {
    lines = lines.slice(0, opts.head);
  } else if (opts.tail !== undefined) {
    lines = lines.slice(-opts.tail);
  }

  return {
    total_matching: totalMatching,
    returned: lines.length,
    truncated: lines.length < totalMatching,
    lines,
  };
}

function firstCol(line: string, index: number): string {
  const parts = line.split("\t");
  return parts[index] ?? "";
}

function compileRegex(pattern: string): RegExp {
  try {
    return new RegExp(pattern, "i");
  } catch {
    return new RegExp(escapeRegex(pattern), "i");
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

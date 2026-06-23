import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const MAX_BUFFER = 50 * 1024 * 1024;

export type GhErrorCode =
  | "GH_NOT_FOUND"
  | "GH_NOT_AUTHED"
  | "GH_API_ERROR"
  | "GH_TIMEOUT"
  | "GH_UNKNOWN";

export class GhCliError extends Error {
  code: GhErrorCode;
  stderr?: string;
  constructor(code: GhErrorCode, message: string, stderr?: string) {
    super(message);
    this.code = code;
    if (stderr) this.stderr = stderr;
  }
}

export interface ExecResult {
  stdout: string;
  stderr: string;
}

export type ExecImpl = (
  bin: string,
  args: readonly string[],
  opts: { maxBuffer: number },
) => Promise<ExecResult>;

export interface GhRunOptions {
  ghBin?: string;
  execImpl?: ExecImpl;
}

const defaultExec: ExecImpl = async (bin, args, opts) => {
  const result = await execFileAsync(bin, args as string[], opts);
  return { stdout: result.stdout, stderr: result.stderr };
};

export async function ghText(args: readonly string[], opts: GhRunOptions = {}): Promise<string> {
  const bin = opts.ghBin ?? "gh";
  const exec = opts.execImpl ?? defaultExec;
  try {
    const { stdout } = await exec(bin, args, { maxBuffer: MAX_BUFFER });
    return stdout;
  } catch (err: unknown) {
    const e = err as { code?: string; signal?: string; killed?: boolean; stderr?: string; message?: string };
    if (e.code === "ENOENT") {
      throw new GhCliError(
        "GH_NOT_FOUND",
        "`gh` CLI not found. Install from https://cli.github.com/ (scoop install gh / brew install gh / apt install gh).",
      );
    }
    const stderr = String(e.stderr ?? "");
    const message = String(e.message ?? "");
    const all = stderr + " " + message;
    if (/not logged into|authentication required|gh auth login/i.test(all)) {
      throw new GhCliError(
        "GH_NOT_AUTHED",
        "`gh` is not authenticated. Run `gh auth login` first.",
        stderr,
      );
    }
    if (e.signal === "SIGTERM" || e.killed) {
      throw new GhCliError("GH_TIMEOUT", `gh command timed out: ${bin} ${args.join(" ")}`);
    }
    const firstLine = stderr.split("\n").find((l) => l.trim().length > 0) ?? message;
    throw new GhCliError("GH_API_ERROR", `gh failed: ${firstLine.trim()}`, stderr);
  }
}

export async function ghJson<T>(args: readonly string[], opts: GhRunOptions = {}): Promise<T> {
  const text = await ghText(args, opts);
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    throw new GhCliError(
      "GH_UNKNOWN",
      `Failed to parse gh JSON output: ${(e as Error).message}`,
      text.slice(0, 200),
    );
  }
}

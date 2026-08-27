export type Artifact = {
  file: string;
  lang: string;
  text: string;
};

const FILE_TOKEN = /^(?:\.\/)?[\w.@+-]+(?:\/[\w.@+-]+)*\.[A-Za-z0-9]{1,8}$/;

export function isFilename(raw: string): boolean {
  const token = raw.trim().replace(/^["'`]+|["'`]+$/g, "");
  if (!token || token.length > 180 || /\s/.test(token)) return false;
  return FILE_TOKEN.test(token);
}

export function parseFenceInfo(
  info: string,
  prevLine = "",
): { lang: string; file: string | null } {
  const raw = info.trim();
  let file: string | null = null;
  let lang = "";

  const named = raw.match(
    /(?:filename|file|title|path)\s*[:=]\s*["']?([^\s"']+)/i,
  );
  if (named && isFilename(named[1] ?? "")) file = stripName(named[1] ?? "");

  if (!file) {
    const colon = raw.match(/^([A-Za-z0-9_+-]+)\s*:\s*(\S+)$/);
    if (colon && isFilename(colon[2] ?? "")) {
      lang = colon[1] ?? "";
      file = stripName(colon[2] ?? "");
    }
  }

  if (!file || !lang) {
    const parts = raw.split(/\s+/).filter(Boolean);
    if (!file) {
      const hit = parts.find((p) => isFilename(p));
      if (hit) file = stripName(hit);
    }
    if (!lang) {
      const first = parts[0];
      if (first && !isFilename(first)) lang = first;
    }
  }

  if (!file && prevLine) {
    const heading = prevLine
      .trim()
      .replace(/^#{1,6}\s+/, "")
      .replace(/^\*{1,2}(.+?)\*{1,2}$/, "$1")
      .replace(/^`(.+?)`$/, "$1")
      .replace(/^(?:file|filename)\s*:\s*/i, "");
    if (isFilename(heading)) file = stripName(heading);
  }

  if (!lang && file) {
    lang = file.split(".").pop() ?? "";
  }
  return { lang, file };
}

function stripName(value: string): string {
  return value.trim().replace(/^["'`]+|["'`]+$/g, "");
}

const OPEN_FENCE = /^( {0,3})(`{3,}|~{3,})([^\n]*)$/;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractArtifacts(text: string): Artifact[] {
  const source = typeof text === "string" ? text : String(text ?? "");
  const lines = source.split("\n");
  const out: Artifact[] = [];
  let i = 0;
  let prev = "";
  while (i < lines.length) {
    const open = lines[i].match(OPEN_FENCE);
    if (open) {
      const marker = open[2] ?? "```";
      const meta = parseFenceInfo(open[3] ?? "", prev);
      const close = new RegExp(`^ {0,3}${escapeRe(marker)}[ \\t]*$`);
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !close.test(lines[i])) {
        body.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      const code = body.join("\n").replace(/\n$/, "");
      if (meta.file && code.trim()) {
        out.push({ file: meta.file, lang: meta.lang, text: code });
      }
      prev = "";
      continue;
    }
    prev = lines[i];
    i += 1;
  }
  return out;
}

export function artifactsFromMessages(
  messages: { role: string; content: string }[],
): Artifact[] {
  const byName = new Map<string, Artifact>();
  for (const m of messages) {
    if (m.role !== "assistant" || !m.content) continue;
    for (const art of extractArtifacts(m.content)) {
      byName.set(art.file, art);
    }
  }
  return [...byName.values()];
}

export function downloadTextFile(name: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.split("/").pop() || name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

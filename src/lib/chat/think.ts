const START_RE = /<\s*(mm:)?(think|thinking|reasoning)\s*>/i;
const END_RE = /<\/\s*(mm:)?(think|thinking|reasoning)\s*>/i;

export type ThinkState = { inThink: boolean; ns?: string };

function tagNs(match: RegExpExecArray): string {
  return (match[1] || "").toLowerCase();
}

export function feedThink(
  chunk: string,
  state: ThinkState,
): { content: string; reasoning: string } {
  let content = "";
  let reasoning = "";
  let rest = chunk;
  while (rest.length) {
    if (state.inThink) {
      const m = END_RE.exec(rest);
      END_RE.lastIndex = 0;
      if (!m || m.index === undefined) {
        reasoning += rest;
        break;
      }
      if (tagNs(m) !== (state.ns || "")) {
        reasoning += rest.slice(0, m.index + m[0].length);
        rest = rest.slice(m.index + m[0].length);
        continue;
      }
      reasoning += rest.slice(0, m.index);
      rest = rest.slice(m.index + m[0].length);
      state.inThink = false;
      state.ns = "";
      continue;
    }
    const m = START_RE.exec(rest);
    START_RE.lastIndex = 0;
    if (!m || m.index === undefined) {
      content += rest;
      break;
    }
    content += rest.slice(0, m.index);
    rest = rest.slice(m.index + m[0].length);
    state.inThink = true;
    state.ns = tagNs(m);
  }
  return { content, reasoning };
}

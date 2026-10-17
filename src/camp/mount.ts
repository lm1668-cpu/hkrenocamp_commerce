export type CampParts = {
  styles: string;
  body: string;
  scripts: { module: boolean; code: string }[];
};

export function splitCampHtml(html: string): CampParts {
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((m) => m[1] ?? "")
    .join("\n");
  const scripts: CampParts["scripts"] = [];
  for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1] ?? "";
    const code = (m[2] ?? "").trim();
    if (!code) continue;
    scripts.push({
      module: /type\s*=\s*["']module["']/i.test(attrs),
      code,
    });
  }
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const body = (bodyMatch ? bodyMatch[1] : html).replace(/<script[\s\S]*?<\/script>/gi, "");
  return { styles, body, scripts };
}

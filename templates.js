// Template anchors and their bold captions are shared by lesson navigation and search.
export function readTemplates(markdown) {
  const matches = markdown.matchAll(/^<a id="(tpl-[a-z0-9-]+)"><\/a>[ \t]*\r?\n\s*\*\*([^\n]+?)\*\*/gm);
  return Array.from(matches, match => ({
    anchor: match[1],
    title: match[2].replace(/^双语模板\s*[·：:]\s*/, '').replaceAll('`', ''),
  }));
}

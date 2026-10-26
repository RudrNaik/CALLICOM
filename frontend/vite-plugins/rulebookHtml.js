import fs from 'node:fs'
import path from 'node:path'
import { Marked } from 'marked'

// Renders rulebook.json's markdown (titles + bodies, incl. GFM tables) to HTML
// at build time so the client never has to parse markdown.
export default function rulebookHtml() {
  const virtualId = 'virtual:rulebook-html'
  const resolvedId = '\0' + virtualId
  const jsonPath = path.resolve(import.meta.dirname, '../src/data/rulebook.json')
  const marked = new Marked({ gfm: true })

  return {
    name: 'rulebook-html',
    resolveId(id) {
      if (id === virtualId) return resolvedId
    },
    load(id) {
      if (id !== resolvedId) return
      this.addWatchFile(jsonPath)
      const rules = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
      const out = rules.map((rule, i) => ({
        ...rule,
        titleHtml: marked.parseInline(String(rule.title ?? '').replace(/^#+\s*/, '')),
        bodyHtml: marked.parse(String(rule.body ?? '')),
        searchText: `${rule.title ?? ''} ${rule.body ?? ''}`,
      }))
      return `export default ${JSON.stringify(out)}`
    },
  }
}

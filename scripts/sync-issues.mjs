// Creates the GitHub issues and milestone the plan called for at T01.
//
// Not run yet: every token supplied so far has carried Contents and Workflows
// but not Issues, so this has been blocked since the start and docs/TASKS.md has
// been the source of truth instead.
//
// Needs a token with `Issues: read and write`. Classic PAT scope `repo` covers
// it; a fine-grained token needs Issues explicitly.
//
//   gh auth switch --user mosimran && node scripts/sync-issues.mjs
//   node scripts/sync-issues.mjs --dry-run
//
// Idempotent: an issue whose title already starts with the same task id is
// updated rather than duplicated, and a closed task closes its issue. Running it
// twice does nothing the second time.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const REPO = 'mosimran/imran-site'
const DRY = process.argv.includes('--dry-run')
const MILESTONE = 'Launch: draft-imran-systems-and-arguments'

// execFileSync with an argument array, never a shell string. Task titles contain
// backticks (`.com.bd`), and inside a double-quoted sh string a backtick is
// command substitution. The first run of this script tried to execute `.com.bd`.
// No shell means nothing to escape and nothing to get wrong.
const gh = (args, body) => {
  try {
    return execFileSync('gh', args, { input: body, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  } catch (e) {
    throw new Error(e.stderr?.toString().trim() || e.message)
  }
}

// Parse docs/TASKS.md. Each task is "- [x] **T07** Title" followed by indented
// detail lines until the next blank line.
const md = readFileSync('docs/TASKS.md', 'utf8').split('\n')
const tasks = []
let track = ''
for (let i = 0; i < md.length; i++) {
  const t = md[i].match(/^## (.+)$/)
  if (t) track = t[1]
  const m = md[i].match(/^- \[([ x~])\] \*\*(T\d+[a-z]?)\*\*\s*(.*)$/)
  if (!m) continue
  const detail = []
  for (let j = i + 1; j < md.length && md[j].startsWith('  '); j++) detail.push(md[j].trim())
  tasks.push({
    id: m[2],
    state: m[1],
    title: m[3].replace(/~~/g, '').trim(),
    track,
    body: detail.join('\n').replace(/<br>/g, '\n'),
  })
}

if (!tasks.length) { console.error('no tasks parsed from docs/TASKS.md'); process.exit(1) }
console.log(`\nparsed ${tasks.length} tasks from docs/TASKS.md`)
console.log(`  done ${tasks.filter(t => t.state === 'x').length}` +
            `  partial ${tasks.filter(t => t.state === '~').length}` +
            `  open ${tasks.filter(t => t.state === ' ').length}\n`)

if (DRY) {
  for (const t of tasks) console.log(`  ${t.state === 'x' ? 'closed' : 'open  '}  ${t.id}  ${t.title.slice(0, 62)}`)
  console.log('\ndry run, nothing created\n')
  process.exit(0)
}

// Milestone
let milestone
try {
  const existing = JSON.parse(gh(['api', `/repos/${REPO}/milestones`, '--jq', '[.[]|{number,title}]']))
  milestone = existing.find((m) => m.title.startsWith(MILESTONE))
} catch { /* falls through to create */ }
if (!milestone) {
  const r = JSON.parse(gh(['api', '-X', 'POST', `/repos/${REPO}/milestones`,
    '-f', `title=${MILESTONE}`,
    '-f', 'description=One issue per task. Source of truth is docs/TASKS.md; the record is docs/WORKLOG.md.']))
  milestone = { number: r.number, title: r.title }
  console.log(`  milestone #${milestone.number} created`)
}

// Existing issues, so this is idempotent
const open = JSON.parse(gh(['api', `/repos/${REPO}/issues?state=all&per_page=100`, '--paginate', '--jq', '[.[]|{number,title,state}]']))
const find = (id) => open.find((i) => i.title.startsWith(`${id} `) || i.title.startsWith(`${id}:`))

let created = 0, updated = 0
for (const t of tasks) {
  const title = `${t.id} ${t.title}`
  const body = `${t.body}\n\n---\nTrack: ${t.track}\nSource of truth: [docs/TASKS.md](../blob/main/docs/TASKS.md)\nRecord: [docs/WORKLOG.md](../blob/main/docs/WORKLOG.md)`
  const existing = find(t.id)
  if (!existing) {
    // --milestone takes the title, not the number.
    const url = gh(['issue', 'create', '--repo', REPO, '--title', title,
                    '--body-file', '-', '--milestone', milestone.title], body).trim()
    created++
    if (t.state === 'x') gh(['issue', 'close', '--repo', REPO, url.split('/').pop(), '--reason', 'completed'])
    console.log(`  + ${t.id}${t.state === 'x' ? ' (closed)' : ''}`)
  } else {
    const want = t.state === 'x' ? 'CLOSED' : 'OPEN'
    if (existing.state.toUpperCase() !== want) {
      gh(['issue', want === 'CLOSED' ? 'close' : 'reopen', '--repo', REPO, String(existing.number)])
      updated++
      console.log(`  ~ ${t.id} -> ${want.toLowerCase()}`)
    }
  }
}
console.log(`\n  created ${created}, updated ${updated}\n`)

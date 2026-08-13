// Detached signatures over the canonical Markdown, produced after the build so
// they cover exactly the bytes that are served. Signing the source instead
// would sign something no reader ever sees.
//
// Skips silently when no secret key is present, so a CI runner without the key
// still builds. It is signed at release, not on every push.
import { execSync } from 'node:child_process'
import { readdirSync, existsSync } from 'node:fs'

const KEY = 'hey@mosthofaimran.com'
const has = (() => { try {
  return execSync(`gpg --list-secret-keys ${KEY}`, { stdio: ['ignore','pipe','ignore'] }).length > 0
} catch { return false } })()

if (!has) { console.log('\nsignatures\n  no secret key present, skipping\n'); process.exit(0) }

let n = 0
const targets = []
if (existsSync('dist/papers')) {
  for (const f of readdirSync('dist/papers').filter((x) => x.endsWith('.md'))) targets.push(`dist/papers/${f}`)
}
for (const t of targets) {
  execSync(`gpg --batch --yes --pinentry-mode loopback --passphrase '' --local-user ${KEY} --armor --detach-sign --output ${t}.asc ${t}`)
  n++
}
console.log(`\nsignatures\n  detached signatures written  ${n}\n`)

// What commit is actually serving? Answered from Cloudflare rather than from
// the workflow's exit code.
//
// The post-deploy live check has failed on every deploy since 2026-08-14
// because Web Analytics injects a beacon (erratum 7.6), so the run is red
// whatever happens. A permanently red run trains you to read the summary
// instead of the steps, and on 2026-09-02 that nearly produced a wrong
// diagnosis: the site looked stale, the run said failure, and the upload had
// in fact succeeded. It was CDN propagation.
//
// This asks the question the red cross obscures. It needs wrangler's OAuth
// session, so it runs locally and not in CI.
import { execSync } from 'node:child_process'

const ACCOUNT = 'f697cce1cf00f8132c900d2c643ad935'
const PROJECT = 'imran-site'

const sh = (c) => execSync(c, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()

let head
try {
  head = sh('git rev-parse --short HEAD')
} catch {
  console.error('\ndeployed: not a git checkout\n')
  process.exit(1)
}

let out
try {
  out = execSync(
    `CLOUDFLARE_ACCOUNT_ID=${ACCOUNT} npx wrangler pages deployment list --project-name ${PROJECT}`,
    { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' },
  )
} catch {
  console.error('\ndeployed: wrangler could not reach Cloudflare. `npx wrangler whoami` to check the session.\n')
  process.exit(1)
}

// First Production row wins; the table is newest first.
const row = out.split('\n').find((l) => l.includes('Production'))
const sha = row?.split('│').map((c) => c.trim()).find((c) => /^[0-9a-f]{7,40}$/.test(c))
const age = row?.split('│').map((c) => c.trim()).find((c) => /(ago|second|minute|hour|day)/.test(c))

console.log('\ndeployed')
console.log(`  local HEAD        ${head}`)
console.log(`  serving commit    ${sha ?? 'not found'}`)
console.log(`  deployed          ${age ?? 'unknown'}`)

if (!sha) {
  console.error('\ndeployed: could not read a commit from the deployment list.\n')
  process.exit(1)
}
if (!head.startsWith(sha) && !sha.startsWith(head)) {
  console.error(`\ndeployed check FAILED: ${sha} is serving, ${head} is local.`)
  console.error('Either the deploy has not landed yet, or it landed from a different commit.\n')
  process.exit(1)
}
console.log('  ok  the commit serving production is the one you are on\n')

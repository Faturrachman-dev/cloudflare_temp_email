/**
 * gen-jwt.mjs — Mint a JWT for an existing address when the original was lost.
 *
 * Usage:
 *   node scripts/gen-jwt.mjs <address> <address_id>
 *
 * Example:
 *   node scripts/gen-jwt.mjs tmpsankoi@faturismee.online 1
 *
 * Prerequisites:
 *   - Node 18+ (global crypto.subtle)
 *   - hono installed (pnpm install in worker/)
 *   - JWT_SECRET read from ../wrangler.toml
 */

import { Jwt } from 'hono/utils/jwt'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// --- Parse wrangler.toml for JWT_SECRET ---
function getJwtSecret() {
  const tomlPath = resolve(__dirname, '..', 'wrangler.toml')
  const content = readFileSync(tomlPath, 'utf-8')
  const match = content.match(/^JWT_SECRET\s*=\s*"([^"]+)"/m)
  if (!match) {
    console.error('ERROR: JWT_SECRET not found in wrangler.toml')
    process.exit(1)
  }
  return match[1]
}

// --- CLI ---
const [address, addressIdRaw] = process.argv.slice(2)

if (!address || !addressIdRaw) {
  console.error('Usage: node scripts/gen-jwt.mjs <address> <address_id>')
  console.error('Example: node scripts/gen-jwt.mjs tmpsankoi@faturismee.online 1')
  process.exit(1)
}

const address_id = Number(addressIdRaw)
if (!Number.isInteger(address_id) || address_id <= 0) {
  console.error('ERROR: address_id must be a positive integer')
  process.exit(1)
}

const secret = getJwtSecret()

const payload = { address, address_id }
const token = await Jwt.sign(payload, secret, 'HS256')

console.log('\n=== JWT for', address, '(id:', address_id, ') ===\n')
console.log(token)
console.log('\nPaste the above token into the "Kredensial alamat surat" field on the Masuk tab.\n')

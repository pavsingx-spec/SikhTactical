import { createHash, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes('@')) throw new Error('Pass the volunteer email address as the first argument.');

const envText = await readFile('.env.production.local', 'utf8');
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      const key = line.slice(0, index);
      let value = line.slice(index + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) value = JSON.parse(value);
      else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      return [key, value];
    }),
);

const connectionString = env.POSTGRES_URL_NON_POOLING ?? env.POSTGRES_URL;
if (!connectionString) throw new Error('No production Postgres connection string was found.');

const plain = randomBytes(9).toString('hex').toUpperCase();
const activationCode = `${plain.slice(0, 6)}-${plain.slice(6, 12)}-${plain.slice(12, 18)}`;
const codeHash = createHash('sha256').update(plain).digest('hex');
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
const sql = postgres(connectionString, { max: 1, ssl: 'require' });

try {
  const rows = await sql`
    update public.volunteers
    set invite_code_hash = ${codeHash},
        invite_expires_at = ${expiresAt.toISOString()},
        active = true
    where email = ${email}
    returning email
  `;
  if (rows.length !== 1) throw new Error(`No volunteer record exists for ${email}.`);
  console.log(JSON.stringify({ email, activationCode, expiresAt: expiresAt.toISOString() }));
} finally {
  await sql.end();
}

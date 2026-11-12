import bcrypt from "bcryptjs";
import crypto from "node:crypto";

// Hash de senhas com scrypt nativo: roda nas threads do libuv e não bloqueia o event loop
// (o bcryptjs é JavaScript puro e travava a API sob carga).
// Hashes bcrypt antigos continuam válidos e são trocados por scrypt no próximo login bem-sucedido.
const SCRYPT = { N: 16384, r: 8, p: 1 };
const KEYLEN = 64;
const MAXMEM = 64 * 1024 * 1024;

function derive(password: string, salt: Buffer, keylen: number, params: { N: number; r: number; p: number }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, { ...params, maxmem: MAXMEM }, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const key = await derive(password, salt, KEYLEN, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export interface PasswordCheck {
  ok: boolean;
  // true quando o hash guardado é do formato antigo (bcrypt) e deve ser regravado
  needsRehash: boolean;
}

export async function verifyPassword(password: string, stored: string): Promise<PasswordCheck> {
  if (stored.startsWith("$2")) {
    const ok = await bcrypt.compare(password, stored);
    return { ok, needsRehash: ok };
  }

  const [scheme, n, r, p, saltB64, keyB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !keyB64) return { ok: false, needsRehash: false };

  const expected = Buffer.from(keyB64, "base64");
  const actual = await derive(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return { ok: crypto.timingSafeEqual(actual, expected), needsRehash: false };
}

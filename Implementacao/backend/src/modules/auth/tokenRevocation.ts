import { postgres } from "../../database/postgres.js";

export async function revokeToken(jti: string, expiresAt: number): void {
  // Remove revogações já vencidas para a tabela não crescer sem limite
  await postgres.run("DELETE FROM revoked_tokens WHERE expires_at < ?", Math.floor(Date.now() / 1000));
  query.run("INSERT INTO revoked_tokens (jti, expires_at) VALUES (?, ?) ON CONFLICT (jti) DO NOTHING", jti, expiresAt);
}

export async function isTokenRevoked(jti: string): boolean {
  return Boolean(await postgres.get("SELECT jti FROM revoked_tokens WHERE jti = ?", jti));
}

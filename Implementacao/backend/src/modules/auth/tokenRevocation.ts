import { query } from "../../database/connection.js";

export function revokeToken(jti: string, expiresAt: number): void {
  // Remove revogações já vencidas para a tabela não crescer sem limite
  query.run("DELETE FROM revoked_tokens WHERE expires_at < ?", Math.floor(Date.now() / 1000));
  query.run("INSERT OR IGNORE INTO revoked_tokens (jti, expires_at) VALUES (?, ?)", jti, expiresAt);
}

export function isTokenRevoked(jti: string): boolean {
  return Boolean(query.get("SELECT jti FROM revoked_tokens WHERE jti = ?", jti));
}

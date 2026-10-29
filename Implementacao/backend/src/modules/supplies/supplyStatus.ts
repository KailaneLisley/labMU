// Situação do insumo a partir do saldo e do saldo mínimo
export function supplyStatusFor(balance: number, minimumBalance: number): "regular" | "abaixo" | "critico" {
  if (balance <= minimumBalance * 0.5) return "critico";
  if (balance <= minimumBalance) return "abaixo";
  return "regular";
}

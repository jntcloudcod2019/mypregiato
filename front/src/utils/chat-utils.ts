/** Remove "Bate‑papo com " e retorna apenas o número */
export function cleanTitle(raw?: string, name?: string, number?: string) {
  const base = (name?.trim() || raw?.trim() || number?.trim() || "").trim()
  if (!base) return number || "Contato"
  
  // Remove "Bate-papo com" de forma simples
  const cleaned = base.replace(/^Bate.*?papo\s+com\s*/i, "").trim()
  
  return cleaned || number || "Contato"
}

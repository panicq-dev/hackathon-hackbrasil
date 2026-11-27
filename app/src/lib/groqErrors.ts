function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

export function ehErroValidacaoJsonGroq(erro: unknown): boolean {
  if (!ehRegistro(erro) || erro.status !== 400 || !ehRegistro(erro.error)) return false;
  const body = erro.error;
  return ehRegistro(body.error) && body.error.code === "json_validate_failed";
}

import { describe, expect, it } from "vitest";
import { AVATARES_PERFIL } from "./avataresPerfil";

describe("catálogo de avatares de perfil", () => {
  it("mantém vinte e cinco modelos com identificadores únicos e estilos variados", () => {
    const ids = AVATARES_PERFIL.map((avatar) => avatar.id);
    const estilos = new Set(AVATARES_PERFIL.map((avatar) => avatar.penteado));

    expect(AVATARES_PERFIL).toHaveLength(25);
    expect(new Set(ids).size).toBe(ids.length);
    expect(estilos.size).toBeGreaterThanOrEqual(10);
  });
});

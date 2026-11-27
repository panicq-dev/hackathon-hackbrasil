import { describe, expect, it } from "vitest";
import { AVATARES_PERFIL } from "./avataresPerfil";

describe("catálogo de avatares de perfil", () => {
  it("mantém ao menos quinze modelos com identificadores únicos", () => {
    const ids = AVATARES_PERFIL.map((avatar) => avatar.id);

    expect(AVATARES_PERFIL.length).toBeGreaterThanOrEqual(15);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

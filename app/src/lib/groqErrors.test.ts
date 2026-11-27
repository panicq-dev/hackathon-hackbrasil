import { describe, expect, it } from "vitest";
import { ehErroValidacaoJsonGroq } from "./groqErrors";

describe("ehErroValidacaoJsonGroq", () => {
  it("reconhece erros de validação JSON do Groq", () => {
    expect(ehErroValidacaoJsonGroq({
      status: 400,
      error: { error: { code: "json_validate_failed" } },
    })).toBe(true);
  });

  it("ignora outros erros do Groq", () => {
    expect(ehErroValidacaoJsonGroq({
      status: 429,
      error: { error: { code: "json_validate_failed" } },
    })).toBe(false);
    expect(ehErroValidacaoJsonGroq(null)).toBe(false);
  });
});

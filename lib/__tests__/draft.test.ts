import { describe, it, expect, beforeEach } from "vitest";
import { saveDraft, loadDraft, clearDraft, DRAFT_KEY } from "@/lib/draft";
import type { DemandData } from "@/lib/demand-map";

const demand: DemandData = { values: { cliente: "Loja X" }, items: [{ id: "i1", typeId: "social-post", values: {} }] };

describe("rascunho local", () => {
  beforeEach(() => localStorage.clear());

  it("salva e restaura", () => {
    saveDraft(demand);
    expect(loadDraft()).toEqual(demand);
  });

  it("retorna null quando não há rascunho", () => {
    expect(loadDraft()).toBeNull();
  });

  it("limpa o rascunho", () => {
    saveDraft(demand);
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it("retorna null (sem lançar) se o conteúdo estiver corrompido", () => {
    localStorage.setItem(DRAFT_KEY, "{não é json}");
    expect(loadDraft()).toBeNull();
  });
});

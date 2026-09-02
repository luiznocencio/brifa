import { describe, it, expect, vi, afterEach, type MockedFunction } from "vitest";
import { aiInterpret, aiRedact, aiPropose } from "@/lib/ai-client";
import type { DemandData } from "@/lib/demand-map";

afterEach(() => vi.restoreAllMocks());

describe("ai-client", () => {
  it("aiInterpret faz POST /api/ai e retorna o JSON (com itens)", async () => {
    const fake = { campaignValues: {}, items: [{ typeId: "social-post", values: {} }], unmatched: [] };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(fake), { status: 200 })));
    const r = await aiInterpret("um post pro instagram");
    expect(r.items[0].typeId).toBe("social-post");
    expect(globalThis.fetch as unknown as MockedFunction<typeof fetch>).toHaveBeenCalledWith(
      "/api/ai",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("aiRedact faz fallback local quando o fetch falha", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    const demand: DemandData = { values: { cliente: "X" }, items: [] };
    const r = await aiRedact(demand);
    expect(r.text.startsWith("SOLICITACAO DE DEMANDA")).toBe(true);
  });

  it("aiPropose no caminho feliz e no fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ label: "t", fields: [{ id: "a", label: "A", type: "text", required: true }] }), { status: 200 })),
    );
    expect((await aiPropose("x")).fields).toHaveLength(1);

    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    const r = await aiPropose("algo fora do catálogo");
    expect(r.fields.length).toBeGreaterThanOrEqual(2);
    expect(r.fields.some((f) => f.required)).toBe(true);
  });
});

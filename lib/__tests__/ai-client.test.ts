import { describe, it, expect, vi, afterEach, type MockedFunction } from "vitest";
import { aiInterpret, aiRedact } from "@/lib/ai-client";
import type { DemandData } from "@/lib/demand-map";

afterEach(() => vi.restoreAllMocks());

describe("ai-client", () => {
  it("aiInterpret faz POST /api/ai e retorna o JSON", async () => {
    const fake = { typeId: "social-post", values: {}, unmatched: [] };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(fake), { status: 200 })),
    );
    const r = await aiInterpret("um post pro instagram");
    expect(r.typeId).toBe("social-post");
    expect(globalThis.fetch as unknown as MockedFunction<typeof fetch>).toHaveBeenCalledWith(
      "/api/ai",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("aiRedact faz fallback local quando o fetch falha", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    const demand: DemandData = { typeId: "social-post", values: { cliente: "X" } };
    const r = await aiRedact(demand);
    expect(r.text.startsWith("SOLICITACAO DE DEMANDA")).toBe(true);
  });
});

import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  isAiConfigured,
  mockInterpret,
  mockReview,
  mockRedact,
  mockPropose,
  normalizeCustomFields,
  classifyByKeywords,
  type InterpretResult,
  type ProposeResult,
} from "@/lib/ai-core";
import { generateDemandText } from "@/lib/generate-text";
import { DEMAND_TYPES, getFieldsForType, type DemandData } from "@/lib/demand-map";

export const runtime = "nodejs";

interface Body {
  action: "interpret" | "review" | "redact" | "propose";
  freeText?: string;
  demand?: DemandData;
}

const MODEL = "gpt-4o-mini";

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!["interpret", "review", "redact", "propose"].includes(body.action)) {
    return NextResponse.json({ error: "ação desconhecida" }, { status: 400 });
  }

  // Sem chave: modo mock determinístico.
  if (!isAiConfigured()) {
    return NextResponse.json(runMock(body));
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    if (body.action === "interpret") {
      return NextResponse.json(await aiInterpret(client, body.freeText ?? ""));
    }
    if (body.action === "review") {
      // Revisão é determinística (obrigatórios) + a IA não é necessária aqui.
      return NextResponse.json(mockReview(body.demand ?? emptyDemand()));
    }
    if (body.action === "redact") {
      return NextResponse.json(await aiRedact(client, body.demand ?? emptyDemand()));
    }
    if (body.action === "propose") {
      return NextResponse.json(await aiPropose(client, body.freeText ?? ""));
    }
    return NextResponse.json({ error: "ação desconhecida" }, { status: 400 });
  } catch {
    // Qualquer falha da IA cai no mock — a ferramenta nunca trava.
    return NextResponse.json(runMock(body));
  }
}

function emptyDemand(): DemandData {
  return { typeId: "outros", values: {} };
}

function runMock(body: Body) {
  if (body.action === "interpret") return mockInterpret(body.freeText ?? "");
  if (body.action === "review") return mockReview(body.demand ?? emptyDemand());
  if (body.action === "propose") return mockPropose(body.freeText ?? "");
  return mockRedact(body.demand ?? emptyDemand());
}

async function aiInterpret(client: OpenAI, freeText: string): Promise<InterpretResult> {
  const catalog = DEMAND_TYPES.map((t) => ({
    typeId: t.id,
    label: `${t.category} › ${t.label}`,
    fields: getFieldsForType(t.id).map((f) => ({ id: f.id, label: f.label })),
  }));

  const prompt = [
    "Você classifica demandas de uma agência criativa e extrai campos.",
    "Dado o texto livre do atendente, escolha o typeId mais adequado do catálogo",
    "e extraia valores para os campos daquele tipo (id -> valor) apenas quando",
    "o texto deixar claro. Não invente. Responda SOMENTE JSON:",
    '{"typeId": "...", "values": {"campo_id": "valor"}, "unmatched": ["trechos não usados"]}',
    "",
    `Catálogo: ${JSON.stringify(catalog)}`,
    `Texto livre: ${freeText}`,
  ].join("\n");

  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0,
  });

  const raw = res.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw) as InterpretResult;
    const typeId = DEMAND_TYPES.some((t) => t.id === parsed.typeId)
      ? parsed.typeId
      : classifyByKeywords(freeText);
    return {
      typeId,
      values: parsed.values ?? {},
      unmatched: parsed.unmatched ?? [],
    };
  } catch {
    return { typeId: classifyByKeywords(freeText), values: {}, unmatched: [freeText] };
  }
}

async function aiRedact(client: OpenAI, demand: DemandData): Promise<{ text: string }> {
  // Base determinística garante estrutura; a IA só melhora a redação do OBJETIVO
  // e OBSERVAÇÕES sem alterar rótulos técnicos.
  const base = generateDemandText(demand);
  const prompt = [
    "Reescreva de forma clara e objetiva SOMENTE os blocos OBJETIVO e",
    "PUBLICO / OBSERVACOES do texto abaixo, mantendo TODOS os rótulos, valores",
    "técnicos, cabeçalho e a ordem exatamente iguais. Texto puro, sem emojis.",
    "Responda apenas o texto final completo.",
    "",
    base,
  ].join("\n");

  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });
  const text = res.choices[0]?.message?.content?.trim();
  return { text: text && text.startsWith("SOLICITACAO") ? text : base };
}

async function aiPropose(client: OpenAI, freeText: string): Promise<ProposeResult> {
  const prompt = [
    "Um atendente descreveu uma demanda que NÃO está no catálogo padrão de uma agência.",
    "Proponha os campos TÉCNICOS mínimos que a produção precisa para executá-la bem.",
    "Cada campo tem: id (snake_case), label (curto, pt-BR), type (um de: text, textarea,",
    "select, number, date), required (boolean), placeholder (um exemplo curto) e, só para",
    "type=select, options (lista de strings). Entre 3 e 8 campos, do essencial ao útil.",
    "Um campo select PODE ter 'reveal': um objeto { \"valor_da_opcao\": [campos extras] } que",
    "abre campos condicionais quando aquela opção é escolhida (use com moderação, aninhamento raso).",
    "NÃO repita cliente, prazo, prioridade, objetivo ou público (esses já existem no formulário).",
    'Responda SOMENTE JSON: {"label": "resumo curto da demanda", "fields": [ {campo}, ... ]}',
    "",
    `Demanda: ${freeText}`,
  ].join("\n");

  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const raw = res.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw) as { label?: string; fields?: unknown };
    const fields = normalizeCustomFields(parsed.fields);
    if (fields.length === 0) return mockPropose(freeText);
    return { label: typeof parsed.label === "string" ? parsed.label : undefined, fields };
  } catch {
    return mockPropose(freeText);
  }
}

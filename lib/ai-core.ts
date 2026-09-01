import { type DemandData, type FieldDef, type FieldType } from "@/lib/demand-map";
import { validateRequired } from "@/lib/validate";
import { generateDemandText } from "@/lib/generate-text";

export type AiAction = "interpret" | "review" | "redact" | "propose";

export interface InterpretResult {
  typeId: string;
  values: Record<string, string>;
  unmatched: string[];
}
export interface ReviewResult {
  gaps: string[];
}
export interface RedactResult {
  text: string;
}
// Conjunto de campos técnicos gerado pela IA para uma demanda não listada.
export interface ProposeResult {
  label?: string;
  fields: FieldDef[];
}

const VALID_FIELD_TYPES: FieldType[] = ["text", "textarea", "select", "number", "date"];
const MAX_CUSTOM_FIELDS = 12;

function slugId(label: string, index: number): string {
  const base = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || `campo_${index + 1}`;
}

// Sanitiza a lista de campos vinda da IA (ou de qualquer origem não confiável)
// para FieldDefs válidos, com ids únicos e um teto de quantidade.
export function normalizeCustomFields(raw: unknown): FieldDef[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: FieldDef[] = [];
  for (let i = 0; i < raw.length && out.length < MAX_CUSTOM_FIELDS; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const label = typeof rec.label === "string" ? rec.label.trim() : "";
    if (!label) continue;
    const type = VALID_FIELD_TYPES.includes(rec.type as FieldType)
      ? (rec.type as FieldType)
      : "text";
    let id = typeof rec.id === "string" && rec.id.trim() ? slugId(rec.id, i) : slugId(label, i);
    while (seen.has(id)) id = `${id}_${i}`;
    seen.add(id);
    const field: FieldDef = { id, label, type, required: Boolean(rec.required) };
    if (typeof rec.placeholder === "string" && rec.placeholder.trim()) {
      field.placeholder = rec.placeholder.trim();
    }
    if (type === "select" && Array.isArray(rec.options)) {
      const options = rec.options.filter((o): o is string => typeof o === "string" && o.trim() !== "");
      if (options.length > 0) field.options = options;
    }
    out.push(field);
  }
  return out;
}

// Campos genéricos determinísticos usados quando não há chave de IA (modo mock)
// ou como fallback — cobrem o mínimo técnico de qualquer demanda física/digital.
export function mockPropose(freeText: string): ProposeResult {
  const fields: FieldDef[] = [
    { id: "descricao_detalhada", label: "Descrição detalhada", type: "textarea", required: true, placeholder: "Ex.: o que é, para que serve e o contexto da demanda" },
    { id: "dimensoes_ou_formato", label: "Dimensões / Formato", type: "text", required: false, placeholder: "Ex.: 100 x 50 cm, A4, 1080x1080 px" },
    { id: "quantidade", label: "Quantidade", type: "number", required: false, placeholder: "Ex.: 1" },
    { id: "material_ou_suporte", label: "Material / Suporte", type: "text", required: false, placeholder: "Ex.: papel, vinil, lona, digital" },
    { id: "referencias", label: "Referências", type: "textarea", required: false, placeholder: "Ex.: links ou exemplos do que se espera" },
  ];
  const label = freeText.trim() ? freeText.trim().slice(0, 60) : "Demanda personalizada";
  return { label, fields };
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim());
}

// Heurística simples de classificação por palavra-chave (usada no mock e como
// rede de segurança). A IA real refina isso.
const KEYWORDS: Array<{ typeId: string; words: string[] }> = [
  { typeId: "offline-sinalizacao", words: ["adesivo", "fachada", "sinaliza", "placa"] },
  { typeId: "offline-pdv", words: ["pdv", "display", "expositor", "ponto de venda"] },
  { typeId: "offline-eventos", words: ["evento", "stand", "ativa", "backdrop"] },
  { typeId: "offline-grande-formato", words: ["outdoor", "lona", "banner", "wind"] },
  { typeId: "offline-brindes", words: ["brinde", "caneca", "camiseta", "sacola"] },
  { typeId: "offline-impressos-fisicos", words: ["folder impresso", "catalogo", "cartão", "cartao"] },
  { typeId: "social-reels", words: ["reels", "vídeo curto", "video curto"] },
  { typeId: "social-carrossel", words: ["carrossel", "carousel"] },
  { typeId: "social-post", words: ["post", "feed", "story", "instagram"] },
  { typeId: "av-video", words: ["vsl", "vídeo institucional", "video institucional"] },
  { typeId: "av-motion", words: ["motion", "animação", "animacao"] },
  { typeId: "web-digital", words: ["landing", "site", "e-mail", "email", "ads"] },
  { typeId: "apresentacao", words: ["apresenta", "slides", "deck"] },
];

export function classifyByKeywords(freeText: string): string {
  const t = freeText.toLowerCase();
  for (const { typeId, words } of KEYWORDS) {
    if (words.some((w) => t.includes(w))) return typeId;
  }
  return "outros";
}

export function mockInterpret(freeText: string): InterpretResult {
  const typeId = classifyByKeywords(freeText);
  // O mock não tenta extrair valores campo a campo (isso é papel da IA real);
  // devolve o tipo detectado e o texto inteiro como "não casado".
  return { typeId, values: {}, unmatched: freeText ? [freeText] : [] };
}

export function mockReview(demand: DemandData): ReviewResult {
  const missing = validateRequired(demand);
  const gaps = missing.map((f) => `Falta preencher: ${f.label}.`);
  return { gaps };
}

export function mockRedact(demand: DemandData): RedactResult {
  return { text: generateDemandText(demand) };
}

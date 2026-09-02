import { type DemandData, type FieldDef, type FieldType } from "@/lib/demand-map";
import { validateRequired } from "@/lib/validate";
import { generateDemandText } from "@/lib/generate-text";

export type AiAction = "interpret" | "review" | "redact" | "propose";

// A interpretação pode gerar VÁRIOS itens (uma campanha com várias peças) +
// valores de nível campanha (cliente, objetivo, prazo…).
export interface InterpretedItem {
  typeId: string;
  values: Record<string, string>;
}
export interface InterpretResult {
  campaignValues: Record<string, string>;
  items: InterpretedItem[];
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

const MAX_REVEAL_DEPTH = 3;
const MAX_TOTAL_FIELDS = 40;

// Sanitiza a lista de campos vinda da IA (ou de qualquer origem não confiável)
// para FieldDefs válidos, com ids únicos, teto de quantidade e condicionais
// (reveal) recursivos com guarda de profundidade.
export function normalizeCustomFields(
  raw: unknown,
  depth = 0,
  // `seen` é compartilhado por toda a recursão de reveal: garante ids únicos
  // entre TODOS os níveis e também impõe o teto GLOBAL de campos.
  seen: Set<string> = new Set(),
): FieldDef[] {
  if (depth > MAX_REVEAL_DEPTH || !Array.isArray(raw)) return [];
  const out: FieldDef[] = [];
  for (let i = 0; i < raw.length && out.length < MAX_CUSTOM_FIELDS && seen.size < MAX_TOTAL_FIELDS; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const label = typeof rec.label === "string" ? rec.label.trim() : "";
    if (!label) continue;
    let type: FieldType = VALID_FIELD_TYPES.includes(rec.type as FieldType)
      ? (rec.type as FieldType)
      : "text";
    const baseId = typeof rec.id === "string" && rec.id.trim() ? slugId(rec.id, i) : slugId(label, i);
    let id = baseId;
    let n = 1;
    while (seen.has(id)) id = `${baseId}_${n++}`;
    seen.add(id);
    // Um select só é útil com opções; sem opções válidas vira campo de texto.
    let options: string[] | undefined;
    if (type === "select" && Array.isArray(rec.options)) {
      const opts = rec.options.filter((o): o is string => typeof o === "string" && o.trim() !== "");
      if (opts.length > 0) options = opts;
    }
    if (type === "select" && !options) type = "text";
    const field: FieldDef = { id, label, type, required: Boolean(rec.required) };
    if (options) field.options = options;
    if (typeof rec.placeholder === "string" && rec.placeholder.trim()) {
      field.placeholder = rec.placeholder.trim();
    }
    if (rec.reveal && typeof rec.reveal === "object" && !Array.isArray(rec.reveal)) {
      const reveal: Record<string, FieldDef[]> = {};
      for (const [key, sub] of Object.entries(rec.reveal as Record<string, unknown>)) {
        const subFields = normalizeCustomFields(sub, depth + 1, seen);
        if (subFields.length > 0) reveal[key] = subFields;
      }
      if (Object.keys(reveal).length > 0) field.reveal = reveal;
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
    {
      id: "acabamento_especial", label: "Tem acabamento especial?", type: "select", required: false, options: ["Sim", "Não"],
      reveal: {
        Sim: [
          { id: "qual_acabamento", label: "Qual acabamento", type: "text", required: false, placeholder: "Ex.: verniz, laminação, recorte especial" },
        ],
      },
    },
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
  { typeId: "offline-impressos-fisicos", words: ["impresso físico", "impresso fisico"] },
  { typeId: "impresso-panfleto", words: ["panfleto", "flyer"] },
  { typeId: "impresso-cartaz", words: ["cartaz", "pôster", "poster"] },
  { typeId: "impresso-editorial", words: ["folder", "catálogo", "catalogo", "cartão de visita", "cartao de visita"] },
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
  // O mock detecta UM tipo por palavra-chave e cria um único item (a IA real
  // é quem separa a campanha em várias peças). Sem extração de valores.
  const typeId = classifyByKeywords(freeText);
  return { campaignValues: {}, items: [{ typeId, values: {} }], unmatched: freeText ? [freeText] : [] };
}

export function mockReview(demand: DemandData): ReviewResult {
  const missing = validateRequired(demand);
  const gaps = missing.map((m) => `Falta preencher: ${m.field.label}.`);
  return { gaps };
}

export function mockRedact(demand: DemandData): RedactResult {
  return { text: generateDemandText(demand) };
}

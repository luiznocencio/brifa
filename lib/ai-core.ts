import { type DemandData } from "@/lib/demand-map";
import { validateRequired } from "@/lib/validate";
import { generateDemandText } from "@/lib/generate-text";

export type AiAction = "interpret" | "review" | "redact";

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

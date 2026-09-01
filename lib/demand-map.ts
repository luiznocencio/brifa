export type FieldType = "text" | "textarea" | "select" | "number" | "date";

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface DemandTypeDef {
  id: string;
  category: string;
  label: string;
  fields: FieldDef[];
}

export interface DemandData {
  typeId: string;
  values: Record<string, string>;
  // Campos técnicos gerados pela IA para uma demanda não listada ("Outro").
  // Quando presentes, complementam os campos estáticos do tipo.
  customFields?: FieldDef[];
}

export const TRUNK_FIELDS: FieldDef[] = [
  { id: "cliente", label: "Cliente / Campanha", type: "text", required: true, placeholder: "Ex.: Loja X — Campanha de inauguração" },
  { id: "objetivo", label: "Objetivo da peça", type: "textarea", required: true, placeholder: "Ex.: Divulgar a inauguração da nova loja e atrair moradores do bairro" },
  { id: "publico", label: "Público-alvo", type: "text", required: false, placeholder: "Ex.: Mulheres 25–40, clientes da região" },
  { id: "prazo", label: "Prazo de entrega", type: "date", required: true },
  { id: "prioridade", label: "Prioridade", type: "select", required: true, options: ["Baixa", "Média", "Alta", "Urgente"] },
  { id: "observacoes", label: "Observações", type: "textarea", required: false, placeholder: "Ex.: Usar a foto nova da fachada; cliente pediu urgência" },
];

// Campos compartilhados por todos os subtipos offline (o núcleo crítico).
const OFFLINE_CORE: FieldDef[] = [
  { id: "medida_real", label: "Medida real (L x A)", type: "text", required: true, placeholder: "Ex.: 200 x 90 cm" },
  { id: "material", label: "Material", type: "text", required: true, placeholder: "Ex.: Lona 440g, ACM, adesivo vinil" },
  { id: "acabamento", label: "Acabamento", type: "text", required: false, placeholder: "Ex.: Ilhós nas pontas, laminação fosca" },
  { id: "quantidade", label: "Quantidade", type: "number", required: true, placeholder: "Ex.: 2" },
  { id: "aplicacao_local", label: "Aplicação / Local", type: "text", required: true, placeholder: "Ex.: Fachada da loja nova, aplicado sobre vidro" },
  { id: "data_instalacao", label: "Data de instalação / evento", type: "date", required: false },
  { id: "fornecedor", label: "Fornecedor / Gráfica", type: "text", required: false, placeholder: "Ex.: Gráfica São Paulo (ou a definir)" },
];

function offlineType(id: string, label: string, extra: FieldDef[] = []): DemandTypeDef {
  return { id, category: "Produções Offline", label, fields: [...OFFLINE_CORE, ...extra] };
}

export const DEMAND_TYPES: DemandTypeDef[] = [
  // Social Media
  {
    id: "social-post", category: "Social Media", label: "Post estático",
    fields: [
      { id: "formato", label: "Formato", type: "select", required: true, options: ["Feed 1:1", "Feed 4:5", "Story 9:16"] },
      { id: "onde_veicula", label: "Onde veicula", type: "text", required: true, placeholder: "Ex.: Instagram, Facebook, LinkedIn" },
      { id: "copy", label: "Copy / Legenda", type: "textarea", required: false, placeholder: "Ex.: Texto final da legenda, com hashtags" },
      { id: "num_pecas", label: "Nº de peças", type: "number", required: false, placeholder: "Ex.: 3" },
    ],
  },
  {
    id: "social-carrossel", category: "Social Media", label: "Carrossel",
    fields: [
      { id: "num_cards", label: "Nº de cards", type: "number", required: true, placeholder: "Ex.: 5" },
      { id: "formato", label: "Formato", type: "select", required: true, options: ["Feed 1:1", "Feed 4:5"] },
      { id: "onde_veicula", label: "Onde veicula", type: "text", required: true, placeholder: "Ex.: Instagram, LinkedIn" },
      { id: "copy", label: "Copy / Roteiro dos cards", type: "textarea", required: false, placeholder: "Ex.: O que cada card deve dizer" },
    ],
  },
  {
    id: "social-reels", category: "Social Media", label: "Reels / Vídeo curto",
    fields: [
      { id: "duracao", label: "Duração", type: "text", required: true, placeholder: "Ex.: 30s" },
      { id: "proporcao", label: "Proporção", type: "select", required: true, options: ["9:16", "1:1", "16:9"] },
      { id: "trilha", label: "Trilha / Áudio", type: "text", required: false, placeholder: "Ex.: Trending do momento (ou trilha do cliente)" },
      { id: "referencias", label: "Referências", type: "textarea", required: false, placeholder: "Ex.: Links de vídeos de referência" },
    ],
  },
  // Audiovisual
  {
    id: "av-video", category: "Audiovisual", label: "Vídeo institucional / VSL",
    fields: [
      { id: "duracao", label: "Duração estimada", type: "text", required: true, placeholder: "Ex.: 60s a 90s" },
      { id: "proporcao", label: "Proporção", type: "select", required: true, options: ["16:9", "9:16", "1:1"] },
      { id: "locucao", label: "Locução", type: "select", required: false, options: ["Sim", "Não"] },
      { id: "trilha", label: "Trilha", type: "text", required: false, placeholder: "Ex.: Trilha licenciada (ou a definir)" },
      { id: "entregaveis", label: "Entregáveis", type: "textarea", required: false, placeholder: "Ex.: 1 vídeo master 16:9 + cortes 9:16" },
      { id: "referencias", label: "Referências", type: "textarea", required: false, placeholder: "Ex.: Links de referência de estilo" },
    ],
  },
  {
    id: "av-motion", category: "Audiovisual", label: "Motion / Animação",
    fields: [
      { id: "duracao", label: "Duração", type: "text", required: true, placeholder: "Ex.: 15s" },
      { id: "proporcao", label: "Proporção", type: "select", required: true, options: ["16:9", "9:16", "1:1"] },
      { id: "entregaveis", label: "Entregáveis", type: "textarea", required: false, placeholder: "Ex.: MP4 1080p + versão quadrada" },
      { id: "referencias", label: "Referências", type: "textarea", required: false, placeholder: "Ex.: Links de referência de estilo" },
    ],
  },
  // Impresso / Gráfico (digital-to-print, não offline físico de instalação)
  {
    id: "impresso-editorial", category: "Impresso / Gráfico", label: "Folder / Catálogo / Cartão",
    fields: [
      { id: "formato_fechado", label: "Formato fechado", type: "text", required: true, placeholder: "Ex.: A5, 9x5 cm" },
      { id: "sangria", label: "Sangria", type: "text", required: false, placeholder: "Ex.: 3 mm" },
      { id: "papel", label: "Papel", type: "text", required: false, placeholder: "Ex.: Couché 300g" },
      { id: "acabamento", label: "Acabamento", type: "text", required: false, placeholder: "Ex.: Laminação fosca, verniz localizado" },
      { id: "quantidade", label: "Quantidade", type: "number", required: true, placeholder: "Ex.: 1000" },
    ],
  },
  // Identidade / Branding
  {
    id: "branding", category: "Identidade / Branding", label: "Identidade / Branding",
    fields: [
      { id: "entregavel", label: "Tipo de entregável", type: "text", required: true, placeholder: "Ex.: Logo, manual da marca, papelaria" },
      { id: "aplicacoes", label: "Aplicações necessárias", type: "textarea", required: false, placeholder: "Ex.: Cartão, assinatura de e-mail, fachada" },
      { id: "arquivos_finais", label: "Arquivos finais", type: "text", required: false, placeholder: "Ex.: AI, PDF, PNG, SVG" },
    ],
  },
  // Web / Digital
  {
    id: "web-digital", category: "Web / Digital", label: "Landing page / Site / E-mail / Ads",
    fields: [
      { id: "subtipo", label: "Subtipo", type: "select", required: true, options: ["Landing page", "Site", "E-mail marketing", "Banner / Ads"] },
      { id: "dimensoes", label: "Dimensões / Breakpoints", type: "text", required: false, placeholder: "Ex.: 1440px desktop / 375px mobile" },
      { id: "veiculacao", label: "Veiculação", type: "text", required: false, placeholder: "Ex.: Google Ads, Meta Ads" },
      { id: "links", label: "Links / Referências", type: "textarea", required: false, placeholder: "Ex.: Link do briefing, referências" },
    ],
  },
  // Apresentação
  {
    id: "apresentacao", category: "Apresentação", label: "Apresentação / Deck",
    fields: [
      { id: "num_slides", label: "Nº de slides", type: "number", required: false, placeholder: "Ex.: 12" },
      { id: "proporcao", label: "Proporção", type: "select", required: true, options: ["16:9", "4:3"] },
      { id: "conteudo", label: "Conteúdo / Roteiro", type: "textarea", required: false, placeholder: "Ex.: Tópicos ou roteiro de cada slide" },
    ],
  },
  // Produções Offline (6 subtipos)
  offlineType("offline-sinalizacao", "Sinalização / Ambientação"),
  offlineType("offline-pdv", "PDV / Trade", [
    { id: "ponto_venda", label: "Ponto de venda destino", type: "text", required: false, placeholder: "Ex.: Rede X, lojas do shopping" },
  ]),
  offlineType("offline-eventos", "Eventos / Ativações", [
    { id: "dimensoes_espaco", label: "Dimensões do espaço", type: "text", required: false, placeholder: "Ex.: Estande 3x3 m, pé-direito 2,5 m" },
    { id: "montagem", label: "Montagem inclusa?", type: "select", required: false, options: ["Sim", "Não"] },
  ]),
  offlineType("offline-grande-formato", "Grandes formatos"),
  offlineType("offline-brindes", "Brindes / Merchandising", [
    { id: "cor", label: "Cor", type: "text", required: false, placeholder: "Ex.: Pantone 300C / azul da marca" },
    { id: "gravacao", label: "Gravação / Personalização", type: "text", required: false, placeholder: "Ex.: Logo 1 cor, gravação a laser" },
  ]),
  offlineType("offline-impressos-fisicos", "Impressos físicos"),
  // Fallback
  {
    id: "outros", category: "Outros", label: "Outro / não listado",
    fields: [
      { id: "descricao_livre", label: "Descrição da demanda", type: "textarea", required: true, placeholder: "Ex.: O que é, medidas, quantidade, onde vai ser usado, prazo…" },
    ],
  },
];

export function getTypeById(id: string): DemandTypeDef | undefined {
  return DEMAND_TYPES.find((t) => t.id === id);
}

export function getFieldsForType(typeId: string): FieldDef[] {
  const t = getTypeById(typeId);
  return [...TRUNK_FIELDS, ...(t ? t.fields : [])];
}

// Campos técnicos efetivos de uma demanda: os estáticos do tipo escolhido,
// acrescidos dos campos gerados pela IA (customFields), quando houver.
export function effectiveTypeFields(demand: DemandData): FieldDef[] {
  const t = getTypeById(demand.typeId);
  const base = t ? t.fields : [];
  if (demand.customFields && demand.customFields.length > 0) {
    return [...base, ...demand.customFields];
  }
  return base;
}

// Tronco + campos técnicos efetivos (considera customFields da IA).
export function getFieldsForDemand(demand: DemandData): FieldDef[] {
  return [...TRUNK_FIELDS, ...effectiveTypeFields(demand)];
}

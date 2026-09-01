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
}

export const TRUNK_FIELDS: FieldDef[] = [
  { id: "cliente", label: "Cliente / Campanha", type: "text", required: true, placeholder: "Ex.: Loja X — Campanha de inauguração" },
  { id: "solicitante", label: "Solicitante (quem pediu)", type: "text", required: true },
  { id: "objetivo", label: "Objetivo da peça", type: "textarea", required: true, placeholder: "O que essa peça precisa comunicar / resolver?" },
  { id: "publico", label: "Público-alvo", type: "text", required: false },
  { id: "prazo", label: "Prazo de entrega", type: "date", required: true },
  { id: "prioridade", label: "Prioridade", type: "select", required: true, options: ["Baixa", "Média", "Alta", "Urgente"] },
  { id: "aprovador", label: "Quem aprova", type: "text", required: false },
  { id: "observacoes", label: "Observações", type: "textarea", required: false },
];

// Campos compartilhados por todos os subtipos offline (o núcleo crítico).
const OFFLINE_CORE: FieldDef[] = [
  { id: "medida_real", label: "Medida real (L x A)", type: "text", required: true, placeholder: "Ex.: 200 x 90 cm" },
  { id: "material", label: "Material", type: "text", required: true },
  { id: "acabamento", label: "Acabamento", type: "text", required: false },
  { id: "quantidade", label: "Quantidade", type: "number", required: true },
  { id: "aplicacao_local", label: "Aplicação / Local", type: "text", required: true, placeholder: "Onde/como será aplicado ou instalado" },
  { id: "data_instalacao", label: "Data de instalação / evento", type: "date", required: false },
  { id: "fornecedor", label: "Fornecedor / Gráfica", type: "text", required: false },
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
      { id: "onde_veicula", label: "Onde veicula", type: "text", required: true, placeholder: "Instagram, Facebook, LinkedIn..." },
      { id: "copy", label: "Copy / Legenda", type: "textarea", required: false },
      { id: "num_pecas", label: "Nº de peças", type: "number", required: false },
    ],
  },
  {
    id: "social-carrossel", category: "Social Media", label: "Carrossel",
    fields: [
      { id: "num_cards", label: "Nº de cards", type: "number", required: true },
      { id: "formato", label: "Formato", type: "select", required: true, options: ["Feed 1:1", "Feed 4:5"] },
      { id: "onde_veicula", label: "Onde veicula", type: "text", required: true },
      { id: "copy", label: "Copy / Roteiro dos cards", type: "textarea", required: false },
    ],
  },
  {
    id: "social-reels", category: "Social Media", label: "Reels / Vídeo curto",
    fields: [
      { id: "duracao", label: "Duração", type: "text", required: true, placeholder: "Ex.: 30s" },
      { id: "proporcao", label: "Proporção", type: "select", required: true, options: ["9:16", "1:1", "16:9"] },
      { id: "trilha", label: "Trilha / Áudio", type: "text", required: false },
      { id: "referencias", label: "Referências", type: "textarea", required: false },
    ],
  },
  // Audiovisual
  {
    id: "av-video", category: "Audiovisual", label: "Vídeo institucional / VSL",
    fields: [
      { id: "duracao", label: "Duração estimada", type: "text", required: true },
      { id: "proporcao", label: "Proporção", type: "select", required: true, options: ["16:9", "9:16", "1:1"] },
      { id: "locucao", label: "Locução", type: "select", required: false, options: ["Sim", "Não"] },
      { id: "trilha", label: "Trilha", type: "text", required: false },
      { id: "entregaveis", label: "Entregáveis", type: "textarea", required: false },
      { id: "referencias", label: "Referências", type: "textarea", required: false },
    ],
  },
  {
    id: "av-motion", category: "Audiovisual", label: "Motion / Animação",
    fields: [
      { id: "duracao", label: "Duração", type: "text", required: true },
      { id: "proporcao", label: "Proporção", type: "select", required: true, options: ["16:9", "9:16", "1:1"] },
      { id: "entregaveis", label: "Entregáveis", type: "textarea", required: false },
      { id: "referencias", label: "Referências", type: "textarea", required: false },
    ],
  },
  // Impresso / Gráfico (digital-to-print, não offline físico de instalação)
  {
    id: "impresso-editorial", category: "Impresso / Gráfico", label: "Folder / Catálogo / Cartão",
    fields: [
      { id: "formato_fechado", label: "Formato fechado", type: "text", required: true, placeholder: "Ex.: A5, 9x5 cm" },
      { id: "sangria", label: "Sangria", type: "text", required: false },
      { id: "papel", label: "Papel", type: "text", required: false },
      { id: "acabamento", label: "Acabamento", type: "text", required: false },
      { id: "quantidade", label: "Quantidade", type: "number", required: true },
    ],
  },
  // Identidade / Branding
  {
    id: "branding", category: "Identidade / Branding", label: "Identidade / Branding",
    fields: [
      { id: "entregavel", label: "Tipo de entregável", type: "text", required: true, placeholder: "Logo, manual, papelaria..." },
      { id: "aplicacoes", label: "Aplicações necessárias", type: "textarea", required: false },
      { id: "arquivos_finais", label: "Arquivos finais", type: "text", required: false },
    ],
  },
  // Web / Digital
  {
    id: "web-digital", category: "Web / Digital", label: "Landing page / Site / E-mail / Ads",
    fields: [
      { id: "subtipo", label: "Subtipo", type: "select", required: true, options: ["Landing page", "Site", "E-mail marketing", "Banner / Ads"] },
      { id: "dimensoes", label: "Dimensões / Breakpoints", type: "text", required: false },
      { id: "veiculacao", label: "Veiculação", type: "text", required: false },
      { id: "links", label: "Links / Referências", type: "textarea", required: false },
    ],
  },
  // Apresentação
  {
    id: "apresentacao", category: "Apresentação", label: "Apresentação / Deck",
    fields: [
      { id: "num_slides", label: "Nº de slides", type: "number", required: false },
      { id: "proporcao", label: "Proporção", type: "select", required: true, options: ["16:9", "4:3"] },
      { id: "conteudo", label: "Conteúdo / Roteiro", type: "textarea", required: false },
    ],
  },
  // Produções Offline (6 subtipos)
  offlineType("offline-sinalizacao", "Sinalização / Ambientação"),
  offlineType("offline-pdv", "PDV / Trade", [
    { id: "ponto_venda", label: "Ponto de venda destino", type: "text", required: false },
  ]),
  offlineType("offline-eventos", "Eventos / Ativações", [
    { id: "dimensoes_espaco", label: "Dimensões do espaço", type: "text", required: false },
    { id: "montagem", label: "Montagem inclusa?", type: "select", required: false, options: ["Sim", "Não"] },
  ]),
  offlineType("offline-grande-formato", "Grandes formatos"),
  offlineType("offline-brindes", "Brindes / Merchandising", [
    { id: "cor", label: "Cor", type: "text", required: false },
    { id: "gravacao", label: "Gravação / Personalização", type: "text", required: false },
  ]),
  offlineType("offline-impressos-fisicos", "Impressos físicos"),
  // Fallback
  {
    id: "outros", category: "Outros", label: "Outros",
    fields: [
      { id: "descricao_livre", label: "Descrição da demanda", type: "textarea", required: true },
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

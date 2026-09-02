export type FieldType = "text" | "textarea" | "select" | "number" | "date";

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  // Campos condicionais: quando este campo (select) tem o valor da chave,
  // os campos correspondentes são revelados logo abaixo (cascata).
  reveal?: Record<string, FieldDef[]>;
}

export interface DemandTypeDef {
  id: string;
  category: string;
  label: string;
  fields: FieldDef[];
}

// Um item = uma peça da campanha (tem seu próprio tipo e specs).
export interface DemandItem {
  id: string;
  typeId: string;
  values: Record<string, string>;
  // Campos técnicos gerados pela IA quando o item é "Outro / não listado".
  customFields?: FieldDef[];
}

// Uma demanda = uma campanha (dados compartilhados) + vários itens.
export interface DemandData {
  values: Record<string, string>; // nível campanha (cliente, objetivo, prazo, prioridade…)
  items: DemandItem[];
}

// Campos de NÍVEL CAMPANHA — compartilhados por todos os itens.
export const CAMPAIGN_FIELDS: FieldDef[] = [
  { id: "cliente", label: "Cliente / Campanha", type: "text", required: true, placeholder: "Ex.: Loja X — Campanha de inauguração" },
  { id: "objetivo", label: "O que essa campanha precisa mudar?", type: "textarea", required: true, placeholder: "Ex.: fazer o bairro descobrir a loja nova e lotar a inauguração" },
  { id: "publico", label: "Público-alvo", type: "text", required: false, placeholder: "Ex.: Mulheres 25–40, clientes da região" },
  { id: "prazo", label: "Prazo de entrega", type: "date", required: true },
  {
    id: "prioridade", label: "Prioridade", type: "select", required: true, options: ["Baixa", "Média", "Alta", "Urgente"],
    reveal: {
      Urgente: [
        { id: "motivo_urgencia", label: "Motivo da urgência", type: "text", required: true, placeholder: "Ex.: cliente tem evento no dia 05/09" },
      ],
    },
  },
  { id: "observacoes", label: "Observações", type: "textarea", required: false, placeholder: "Ex.: Usar a foto nova da fachada; cliente pediu urgência" },
];

// Campos de NÍVEL ITEM que valem para qualquer tipo (além dos campos do tipo).
export const ITEM_EXTRA_FIELDS: FieldDef[] = [
  { id: "prazo_item", label: "Prazo próprio deste item (se diferente da campanha)", type: "date", required: false },
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
      {
        id: "locucao", label: "Locução", type: "select", required: false, options: ["Sim", "Não"],
        reveal: {
          Sim: [
            { id: "idioma_locucao", label: "Idioma da locução", type: "text", required: false, placeholder: "Ex.: Português BR" },
            { id: "roteiro_locucao", label: "Roteiro / texto da locução", type: "textarea", required: false, placeholder: "Ex.: cole o texto a ser narrado" },
          ],
        },
      },
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
  // Impresso / Gráfico
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
  {
    id: "impresso-panfleto", category: "Impresso / Gráfico", label: "Panfleto / Flyer",
    fields: [
      { id: "formato_fechado", label: "Formato fechado", type: "text", required: true, placeholder: "Ex.: A5, 15x21 cm" },
      { id: "frente_verso", label: "Frente e verso?", type: "select", required: false, options: ["Só frente", "Frente e verso"] },
      { id: "papel", label: "Papel", type: "text", required: false, placeholder: "Ex.: Couché 150g" },
      { id: "quantidade", label: "Quantidade", type: "number", required: true, placeholder: "Ex.: 5000" },
    ],
  },
  {
    id: "impresso-cartaz", category: "Impresso / Gráfico", label: "Cartaz / Pôster",
    fields: [
      { id: "formato_fechado", label: "Formato fechado", type: "text", required: true, placeholder: "Ex.: A3, 42x60 cm" },
      { id: "papel", label: "Papel", type: "text", required: false, placeholder: "Ex.: Couché 250g" },
      { id: "acabamento", label: "Acabamento", type: "text", required: false, placeholder: "Ex.: Laminação fosca" },
      { id: "quantidade", label: "Quantidade", type: "number", required: true, placeholder: "Ex.: 200" },
    ],
  },
  // Identidade / Branding
  {
    id: "branding", category: "Identidade / Branding", label: "Identidade / Branding",
    fields: [
      {
        id: "entregavel", label: "Tipo de entregável", type: "select", required: true,
        options: ["Logo", "Manual de marca", "Papelaria", "Identidade completa"],
        reveal: {
          Logo: [
            { id: "variacoes_logo", label: "Variações necessárias", type: "text", required: false, placeholder: "Ex.: horizontal, vertical, símbolo, monocromática" },
          ],
          "Manual de marca": [
            { id: "itens_manual", label: "O que o manual cobre", type: "textarea", required: false, placeholder: "Ex.: cores, tipografia, usos corretos/incorretos, grid" },
          ],
          Papelaria: [
            { id: "itens_papelaria", label: "Itens de papelaria", type: "text", required: false, placeholder: "Ex.: cartão, timbrado, envelope, assinatura de e-mail" },
          ],
          "Identidade completa": [
            { id: "escopo_identidade", label: "Escopo da identidade", type: "textarea", required: false, placeholder: "Ex.: logo, manual, papelaria, social, sinalização" },
          ],
        },
      },
      { id: "aplicacoes", label: "Aplicações necessárias", type: "textarea", required: false, placeholder: "Ex.: Cartão, assinatura de e-mail, fachada" },
      { id: "arquivos_finais", label: "Arquivos finais", type: "text", required: false, placeholder: "Ex.: AI, PDF, PNG, SVG" },
    ],
  },
  // Web / Digital
  {
    id: "web-digital", category: "Web / Digital", label: "Landing page / Site / E-mail / Ads",
    fields: [
      {
        id: "subtipo", label: "Subtipo", type: "select", required: true,
        options: ["Landing page", "Site", "E-mail marketing", "Banner / Ads"],
        reveal: {
          "Landing page": [
            { id: "secoes", label: "Seções da página", type: "textarea", required: false, placeholder: "Ex.: Hero, benefícios, prova social, CTA" },
            { id: "integracao", label: "Integração / captura", type: "text", required: false, placeholder: "Ex.: RD Station, formulário, WhatsApp" },
          ],
          Site: [
            { id: "num_paginas", label: "Nº de páginas", type: "number", required: false, placeholder: "Ex.: 5" },
            { id: "cms", label: "Plataforma / CMS", type: "text", required: false, placeholder: "Ex.: WordPress, Webflow" },
          ],
          "E-mail marketing": [
            { id: "assunto", label: "Assunto do e-mail", type: "text", required: false, placeholder: "Ex.: Novidades da semana" },
            { id: "lista_envio", label: "Lista de envio", type: "text", required: false, placeholder: "Ex.: base de clientes ativos" },
          ],
          "Banner / Ads": [
            { id: "plataforma_ads", label: "Plataforma", type: "text", required: false, placeholder: "Ex.: Google Ads, Meta Ads" },
            { id: "tamanhos_ads", label: "Tamanhos / formatos", type: "text", required: false, placeholder: "Ex.: 1080x1080, 300x250, 728x90" },
          ],
        },
      },
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
    {
      id: "montagem", label: "Montagem inclusa?", type: "select", required: false, options: ["Sim", "Não"],
      reveal: {
        Sim: [
          { id: "data_montagem", label: "Data / horário da montagem", type: "text", required: false, placeholder: "Ex.: 04/09 a partir das 8h" },
          { id: "responsavel_montagem", label: "Responsável pela montagem", type: "text", required: false, placeholder: "Ex.: fornecedor X / equipe interna" },
        ],
      },
    },
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
      { id: "descricao_livre", label: "Me conta o que é", type: "textarea", required: true, placeholder: "Ex.: o que é, medidas, quantidade, onde vai ser usado…" },
    ],
  },
];

export function getTypeById(id: string): DemandTypeDef | undefined {
  return DEMAND_TYPES.find((t) => t.id === id);
}

// Categorias na ordem em que aparecem (para o seletor em cascata).
export function getCategories(): string[] {
  const seen: string[] = [];
  for (const t of DEMAND_TYPES) if (!seen.includes(t.category)) seen.push(t.category);
  return seen;
}

export function typesInCategory(category: string): DemandTypeDef[] {
  return DEMAND_TYPES.filter((t) => t.category === category);
}

export function categoryOfType(typeId: string): string {
  return getTypeById(typeId)?.category ?? "";
}

let itemSeq = 0;
export function makeItemId(): string {
  itemSeq += 1;
  return `item_${Date.now().toString(36)}_${itemSeq}_${Math.random().toString(36).slice(2, 7)}`;
}

export function newItem(typeId = ""): DemandItem {
  return { id: makeItemId(), typeId, values: {} };
}

// Expande a lista revelando os campos condicionais conforme os valores atuais.
export function expandFields(fields: FieldDef[], values: Record<string, string>): FieldDef[] {
  const out: FieldDef[] = [];
  for (const f of fields) {
    out.push(f);
    if (f.reveal) {
      const revealed = f.reveal[values[f.id] ?? ""];
      if (revealed && revealed.length > 0) {
        out.push(...expandFields(revealed, values));
      }
    }
  }
  return out;
}

// Campos técnicos efetivos de um ITEM: os estáticos do tipo + os gerados pela IA
// (customFields), descartando ids que colidam com campanha / item-extra / tipo.
export function effectiveItemFields(item: DemandItem): FieldDef[] {
  const t = getTypeById(item.typeId);
  const base = t ? t.fields : [];
  if (item.customFields && item.customFields.length > 0) {
    const reserved = new Set<string>([
      ...CAMPAIGN_FIELDS.map((f) => f.id),
      ...ITEM_EXTRA_FIELDS.map((f) => f.id),
      ...base.map((f) => f.id),
    ]);
    const extra = item.customFields.filter((f) => !reserved.has(f.id));
    return [...base, ...extra];
  }
  return base;
}

// Campos visíveis (já com condicionais ativos) do NÍVEL CAMPANHA.
export function campaignVisibleFields(demand: DemandData): FieldDef[] {
  return expandFields(CAMPAIGN_FIELDS, demand.values);
}

// Campos visíveis (com condicionais ativos) de um ITEM: tipo + IA + item-extra.
export function itemVisibleFields(item: DemandItem): FieldDef[] {
  return expandFields([...effectiveItemFields(item), ...ITEM_EXTRA_FIELDS], item.values);
}

# Formulário Inteligente de Pauta de Demandas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um web app onde o atendimento pauta qualquer demanda (com campos que se adaptam ao tipo, ajuda de IA em 3 momentos) e gera um texto de solicitação técnico padronizado pronto pra colar no iClips.

**Architecture:** Next.js (App Router) na Vercel — a UI e uma única função serverless de IA convivem no mesmo deploy. Um "mapa técnico" (dados puros em `lib/demand-map.ts`) descreve tronco comum + galhos por tipo e alimenta tanto o formulário quanto a IA. Toda a lógica de valor (mapa, validação, geração de texto, rascunho) é composta por funções puras testáveis; a IA é uma camada turbo com fallback determinístico. Sem banco de dados e sem login; rascunho por sessão no `localStorage`.

**Tech Stack:** Next.js 14+ (App Router, TypeScript), Tailwind CSS, Vitest + @testing-library/react para testes, API do GPT (OpenAI) via route handler serverless.

## Global Constraints

- **Sem banco de dados e sem login.** Nada é persistido no servidor.
- **Rascunho local (v1):** autosave no `localStorage`, privado ao navegador, limpo ao gerar/descartar a pauta.
- **Chave da OpenAI nunca no navegador:** só a route handler serverless a lê, de `process.env.OPENAI_API_KEY`.
- **Modo mock da IA:** quando `OPENAI_API_KEY` está ausente, a route responde com resultados determinísticos (testes e dev rodam sem chave).
- **A ferramenta nunca trava por IA:** o texto final sempre pode ser gerado localmente por `generateDemandText` sem chamar a API.
- **Texto final = texto puro padronizado**, sem emojis/enfeites, ordem fixa de blocos.
- **Ambiente de dev:** projeto vive em `~/pauta-demandas` (home). Não desenvolver no caminho `@CODE` (volume externo, `#` + espaços) que quebra ferramentas Node.
- **Direção visual** (`design-taste-frontend` + design system do usuário) é aplicada só na fase de acabamento de UI (Task 11); tasks anteriores usam Tailwind cru e funcional.

---

## File Structure

**Lógica pura (o "cérebro", 100% testável):**
- `lib/demand-map.ts` — tipos + o mapa técnico (tronco comum + galhos por tipo/subtipo).
- `lib/validate.ts` — checagem de campos obrigatórios por tipo.
- `lib/generate-text.ts` — formata uma demanda no texto puro padronizado (fallback sem IA).
- `lib/draft.ts` — autosave/restauração/limpeza no `localStorage`.

**Camada de IA:**
- `app/api/ai/route.ts` — função serverless: `interpret` | `review` | `redact`, com modo mock.
- `lib/ai-client.ts` — wrapper do navegador que chama `/api/ai`.

**UI:**
- `lib/useDemand.ts` — hook de estado da demanda (valores, tipo, dirty).
- `components/FieldRenderer.tsx` — renderiza um `FieldDef` (text/textarea/select/number/date).
- `components/DemandForm.tsx` — renderiza tronco + galhos a partir do mapa.
- `components/FreeTextIntake.tsx` — Momento 1 (texto livre → pré-preenche).
- `components/GapReview.tsx` — Momento 2 (lacunas antes de gerar).
- `components/OutputPreview.tsx` — Momento 3 (texto final + copiar).
- `app/page.tsx` — monta tudo.

**Config:**
- `.env.local` (dev) / env var na Vercel — `OPENAI_API_KEY`.
- `.env.example`, `README.md` — instruções de chave e deploy.

---

## Task 1: Scaffold do projeto (Next.js + Tailwind + Vitest)

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `vitest.config.ts`, `.gitignore`, `.env.example`
- Test: `lib/__tests__/smoke.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: projeto Next.js que builda e roda; Vitest configurado com `npm test`.

- [ ] **Step 1: Scaffold Next.js**

Run (na home, fora do caminho `@CODE`):

```bash
cd ~/pauta-demandas
npx create-next-app@latest . --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm --yes
```

Se `create-next-app` reclamar que a pasta não está vazia (por causa de `docs/` e `.git`), rode em pasta temporária e mova:

```bash
cd ~ && npx create-next-app@latest pauta-demandas-tmp --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm --yes
cp -R ~/pauta-demandas-tmp/. ~/pauta-demandas/ && rm -rf ~/pauta-demandas-tmp
```

- [ ] **Step 2: Instalar Vitest e testing-library**

Run:

```bash
cd ~/pauta-demandas
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Configurar Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Escrever o smoke test**

Create `lib/__tests__/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("roda os testes", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Rodar os testes e o build**

Run:

```bash
cd ~/pauta-demandas && npm test && npm run build
```

Expected: teste PASS; build conclui sem erro.

- [ ] **Step 6: Garantir que .env não vaza**

Confirme que `.gitignore` contém `.env*.local`. Create `.env.example`:

```bash
# Chave da API da OpenAI. Sem ela, a IA roda em modo mock (respostas simuladas).
OPENAI_API_KEY=
```

- [ ] **Step 7: Commit**

```bash
cd ~/pauta-demandas && git add -A && git commit -m "chore: scaffold Next.js + Tailwind + Vitest"
```

---

## Task 2: Mapa técnico (tronco comum + galhos)

**Files:**
- Create: `lib/demand-map.ts`
- Test: `lib/__tests__/demand-map.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `type FieldType = "text" | "textarea" | "select" | "number" | "date"`
  - `interface FieldDef { id: string; label: string; type: FieldType; required: boolean; options?: string[]; placeholder?: string }`
  - `interface DemandTypeDef { id: string; category: string; label: string; fields: FieldDef[] }`
  - `interface DemandData { typeId: string; values: Record<string, string> }`
  - `const TRUNK_FIELDS: FieldDef[]` (ids: `cliente`, `solicitante`, `objetivo`, `publico`, `prazo`, `prioridade`, `aprovador`, `observacoes`)
  - `const DEMAND_TYPES: DemandTypeDef[]`
  - `function getTypeById(id: string): DemandTypeDef | undefined`
  - `function getFieldsForType(typeId: string): FieldDef[]` (tronco + campos do tipo)

- [ ] **Step 1: Escrever o teste que falha**

Create `lib/__tests__/demand-map.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  TRUNK_FIELDS,
  DEMAND_TYPES,
  getTypeById,
  getFieldsForType,
} from "@/lib/demand-map";

describe("mapa técnico", () => {
  it("tronco comum tem os campos-chave obrigatórios", () => {
    const ids = TRUNK_FIELDS.map((f) => f.id);
    for (const id of ["cliente", "solicitante", "objetivo", "prazo", "prioridade"]) {
      const f = TRUNK_FIELDS.find((x) => x.id === id);
      expect(f, `campo ${id} existe`).toBeTruthy();
      expect(f!.required, `campo ${id} é obrigatório`).toBe(true);
    }
    expect(ids).toContain("aprovador");
    expect(ids).toContain("publico");
    expect(ids).toContain("observacoes");
  });

  it("inclui os 6 subtipos de produções offline", () => {
    const offline = DEMAND_TYPES.filter((t) => t.category === "Produções Offline");
    expect(offline.length).toBe(6);
    const labels = offline.map((t) => t.label.toLowerCase());
    expect(labels.some((l) => l.includes("sinaliza"))).toBe(true);
    expect(labels.some((l) => l.includes("pdv") || l.includes("trade"))).toBe(true);
    expect(labels.some((l) => l.includes("evento") || l.includes("ativa"))).toBe(true);
    expect(labels.some((l) => l.includes("grande"))).toBe(true);
    expect(labels.some((l) => l.includes("brinde") || l.includes("merch"))).toBe(true);
    expect(labels.some((l) => l.includes("impress"))).toBe(true);
  });

  it("todo tipo offline exige medida real, quantidade e aplicação/local", () => {
    const offline = DEMAND_TYPES.filter((t) => t.category === "Produções Offline");
    for (const t of offline) {
      const ids = t.fields.map((f) => f.id);
      expect(ids, `${t.label} tem medida_real`).toContain("medida_real");
      expect(ids, `${t.label} tem quantidade`).toContain("quantidade");
      expect(ids, `${t.label} tem aplicacao_local`).toContain("aplicacao_local");
    }
  });

  it("ids de campo são únicos dentro de cada tipo (tronco + galho)", () => {
    for (const t of DEMAND_TYPES) {
      const ids = getFieldsForType(t.id).map((f) => f.id);
      expect(new Set(ids).size, `${t.label} sem ids duplicados`).toBe(ids.length);
    }
  });

  it("getTypeById e getFieldsForType funcionam", () => {
    const t = DEMAND_TYPES[0];
    expect(getTypeById(t.id)?.id).toBe(t.id);
    expect(getTypeById("inexistente")).toBeUndefined();
    const fields = getFieldsForType(t.id);
    expect(fields.length).toBe(TRUNK_FIELDS.length + t.fields.length);
    // tronco vem primeiro
    expect(fields[0].id).toBe(TRUNK_FIELDS[0].id);
  });

  it("existe um tipo de fallback 'Outros'", () => {
    expect(DEMAND_TYPES.some((t) => t.category === "Outros")).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `cd ~/pauta-demandas && npx vitest run lib/__tests__/demand-map.test.ts`
Expected: FAIL — `Cannot find module '@/lib/demand-map'`.

- [ ] **Step 3: Implementar o mapa**

Create `lib/demand-map.ts`:

```ts
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
```

- [ ] **Step 4: Rodar para ver passar**

Run: `cd ~/pauta-demandas && npx vitest run lib/__tests__/demand-map.test.ts`
Expected: PASS (todos os testes verdes).

- [ ] **Step 5: Commit**

```bash
cd ~/pauta-demandas && git add -A && git commit -m "feat: mapa técnico de tipos de demanda (tronco + galhos)"
```

---

## Task 3: Validação de campos obrigatórios

**Files:**
- Create: `lib/validate.ts`
- Test: `lib/__tests__/validate.test.ts`

**Interfaces:**
- Consumes: `getFieldsForType`, `FieldDef`, `DemandData` de `@/lib/demand-map`.
- Produces: `function validateRequired(demand: DemandData): FieldDef[]` — retorna os campos obrigatórios que estão vazios (string vazia ou só espaços). Lista vazia = ok.

- [ ] **Step 1: Escrever o teste que falha**

Create `lib/__tests__/validate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { validateRequired } from "@/lib/validate";
import type { DemandData } from "@/lib/demand-map";

describe("validateRequired", () => {
  it("aponta obrigatórios vazios do tronco e do galho", () => {
    const demand: DemandData = { typeId: "offline-sinalizacao", values: {} };
    const missing = validateRequired(demand).map((f) => f.id);
    // tronco obrigatórios
    expect(missing).toContain("cliente");
    expect(missing).toContain("solicitante");
    expect(missing).toContain("objetivo");
    expect(missing).toContain("prazo");
    expect(missing).toContain("prioridade");
    // galho offline obrigatórios
    expect(missing).toContain("medida_real");
    expect(missing).toContain("quantidade");
    expect(missing).toContain("aplicacao_local");
  });

  it("ignora campos opcionais", () => {
    const demand: DemandData = { typeId: "offline-sinalizacao", values: {} };
    const missing = validateRequired(demand).map((f) => f.id);
    expect(missing).not.toContain("publico");
    expect(missing).not.toContain("aprovador");
    expect(missing).not.toContain("acabamento");
  });

  it("trata string só de espaços como vazio", () => {
    const demand: DemandData = {
      typeId: "outros",
      values: { descricao_livre: "   " },
    };
    const missing = validateRequired(demand).map((f) => f.id);
    expect(missing).toContain("descricao_livre");
  });

  it("retorna lista vazia quando tudo obrigatório está preenchido", () => {
    const demand: DemandData = {
      typeId: "outros",
      values: {
        cliente: "Loja X",
        solicitante: "Ana",
        objetivo: "Divulgar inauguração",
        prazo: "2026-09-05",
        prioridade: "Alta",
        descricao_livre: "Precisa de um material simples",
      },
    };
    expect(validateRequired(demand)).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `cd ~/pauta-demandas && npx vitest run lib/__tests__/validate.test.ts`
Expected: FAIL — `Cannot find module '@/lib/validate'`.

- [ ] **Step 3: Implementar**

Create `lib/validate.ts`:

```ts
import { getFieldsForType, type DemandData, type FieldDef } from "@/lib/demand-map";

export function validateRequired(demand: DemandData): FieldDef[] {
  return getFieldsForType(demand.typeId).filter((field) => {
    if (!field.required) return false;
    const value = demand.values[field.id];
    return !value || value.trim() === "";
  });
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `cd ~/pauta-demandas && npx vitest run lib/__tests__/validate.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/pauta-demandas && git add -A && git commit -m "feat: validação de campos obrigatórios por tipo"
```

---

## Task 4: Gerador do texto padronizado (fallback sem IA)

**Files:**
- Create: `lib/generate-text.ts`
- Test: `lib/__tests__/generate-text.test.ts`

**Interfaces:**
- Consumes: `getTypeById`, `TRUNK_FIELDS`, `DemandData` de `@/lib/demand-map`.
- Produces: `function generateDemandText(demand: DemandData): string` — texto puro padronizado. Ordem fixa: cabeçalho → OBJETIVO → ESPECIFICACAO TECNICA (campos do galho) → PUBLICO / OBSERVACOES → APROVACAO. Campos vazios aparecem com rótulo e valor em branco (não somem), para a gestora ver o que ficou pendente.

- [ ] **Step 1: Escrever o teste que falha**

Create `lib/__tests__/generate-text.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generateDemandText } from "@/lib/generate-text";
import type { DemandData } from "@/lib/demand-map";

const offline: DemandData = {
  typeId: "offline-sinalizacao",
  values: {
    cliente: "Loja X — Inauguração",
    solicitante: "Ana",
    objetivo: "Comunicar a nova loja na fachada",
    publico: "Clientes do bairro",
    prazo: "2026-09-05",
    prioridade: "Alta",
    aprovador: "Carlos",
    medida_real: "200 x 90 cm",
    material: "Lona",
    quantidade: "1",
    aplicacao_local: "Fachada da loja nova",
  },
};

describe("generateDemandText", () => {
  it("começa com o cabeçalho padronizado", () => {
    const text = generateDemandText(offline);
    expect(text.startsWith("SOLICITACAO DE DEMANDA")).toBe(true);
  });

  it("inclui o rótulo do tipo (categoria › label)", () => {
    const text = generateDemandText(offline);
    expect(text).toContain("Tipo: Produções Offline › Sinalização / Ambientação");
  });

  it("traz os blocos na ordem fixa", () => {
    const text = generateDemandText(offline);
    const iObj = text.indexOf("OBJETIVO");
    const iSpec = text.indexOf("ESPECIFICACAO TECNICA");
    const iPub = text.indexOf("PUBLICO / OBSERVACOES");
    const iAprov = text.indexOf("APROVACAO");
    expect(iObj).toBeGreaterThan(-1);
    expect(iSpec).toBeGreaterThan(iObj);
    expect(iPub).toBeGreaterThan(iSpec);
    expect(iAprov).toBeGreaterThan(iPub);
  });

  it("renderiza campos técnicos do galho com seus rótulos", () => {
    const text = generateDemandText(offline);
    expect(text).toContain("Medida real (L x A): 200 x 90 cm");
    expect(text).toContain("Quantidade: 1");
    expect(text).toContain("Aplicação / Local: Fachada da loja nova");
  });

  it("não contém emojis (texto puro)", () => {
    const text = generateDemandText(offline);
    // faixa de emojis comuns
    expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text)).toBe(false);
  });

  it("mostra rótulo mesmo com valor vazio (campo pendente)", () => {
    const semObjetivo: DemandData = {
      typeId: "social-post",
      values: { cliente: "Y", formato: "Feed 1:1", onde_veicula: "Instagram" },
    };
    const text = generateDemandText(semObjetivo);
    // objetivo vazio ainda aparece como bloco rotulado
    expect(text).toContain("OBJETIVO");
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `cd ~/pauta-demandas && npx vitest run lib/__tests__/generate-text.test.ts`
Expected: FAIL — `Cannot find module '@/lib/generate-text'`.

- [ ] **Step 3: Implementar**

Create `lib/generate-text.ts`:

```ts
import { getTypeById, TRUNK_FIELDS, type DemandData, type FieldDef } from "@/lib/demand-map";

function val(demand: DemandData, id: string): string {
  return (demand.values[id] ?? "").trim();
}

function labelOf(id: string): string {
  const f = TRUNK_FIELDS.find((x) => x.id === id);
  return f ? f.label : id;
}

function line(label: string, value: string): string {
  return `${label}: ${value}`;
}

export function generateDemandText(demand: DemandData): string {
  const type = getTypeById(demand.typeId);
  const typeLabel = type ? `${type.category} › ${type.label}` : "(não definido)";

  const header = [
    "SOLICITACAO DE DEMANDA",
    "",
    line(labelOf("cliente"), val(demand, "cliente")),
    `${line(labelOf("solicitante"), val(demand, "solicitante"))}`,
    `Tipo: ${typeLabel}`,
    `${line(labelOf("prioridade"), val(demand, "prioridade"))}    ${line(labelOf("prazo"), val(demand, "prazo"))}`,
  ].join("\n");

  const objetivo = ["OBJETIVO", val(demand, "objetivo")].join("\n");

  const specFields: FieldDef[] = type ? type.fields : [];
  const specLines = specFields.map((f) => line(f.label, val(demand, f.id)));
  const spec = ["ESPECIFICACAO TECNICA", ...specLines].join("\n");

  const publico = [
    "PUBLICO / OBSERVACOES",
    line(labelOf("publico"), val(demand, "publico")),
    val(demand, "observacoes"),
  ]
    .filter((l, i) => i < 2 || l.length > 0)
    .join("\n");

  const aprovacao = ["APROVACAO", line(labelOf("aprovador"), val(demand, "aprovador"))].join("\n");

  return [header, "", objetivo, "", spec, "", publico, "", aprovacao].join("\n");
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `cd ~/pauta-demandas && npx vitest run lib/__tests__/generate-text.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/pauta-demandas && git add -A && git commit -m "feat: gerador de texto padronizado (fallback sem IA)"
```

---

## Task 5: Rascunho local (localStorage)

**Files:**
- Create: `lib/draft.ts`
- Test: `lib/__tests__/draft.test.ts`

**Interfaces:**
- Consumes: `DemandData` de `@/lib/demand-map`.
- Produces:
  - `const DRAFT_KEY = "pauta-demandas:draft"`
  - `function saveDraft(demand: DemandData): void`
  - `function loadDraft(): DemandData | null`
  - `function clearDraft(): void`
  - Todas resistem a ambiente sem `localStorage` (SSR) e a JSON inválido — nunca lançam.

- [ ] **Step 1: Escrever o teste que falha**

Create `lib/__tests__/draft.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { saveDraft, loadDraft, clearDraft, DRAFT_KEY } from "@/lib/draft";
import type { DemandData } from "@/lib/demand-map";

const demand: DemandData = { typeId: "social-post", values: { cliente: "Loja X" } };

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
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `cd ~/pauta-demandas && npx vitest run lib/__tests__/draft.test.ts`
Expected: FAIL — `Cannot find module '@/lib/draft'`.

- [ ] **Step 3: Implementar**

Create `lib/draft.ts`:

```ts
import type { DemandData } from "@/lib/demand-map";

export const DRAFT_KEY = "pauta-demandas:draft";

function storage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function saveDraft(demand: DemandData): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(DRAFT_KEY, JSON.stringify(demand));
  } catch {
    /* quota / modo privado — ignora */
  }
}

export function loadDraft(): DemandData | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.typeId === "string") {
      return parsed as DemandData;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(DRAFT_KEY);
  } catch {
    /* ignora */
  }
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `cd ~/pauta-demandas && npx vitest run lib/__tests__/draft.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/pauta-demandas && git add -A && git commit -m "feat: rascunho local no localStorage"
```

---

## Task 6: Função serverless de IA (com modo mock)

**Files:**
- Create: `lib/ai-core.ts` (lógica pura testável), `app/api/ai/route.ts` (handler HTTP)
- Test: `lib/__tests__/ai-core.test.ts`

**Interfaces:**
- Consumes: `DemandData`, `DEMAND_TYPES`, `getTypeById` de `@/lib/demand-map`; `validateRequired` de `@/lib/validate`; `generateDemandText` de `@/lib/generate-text`.
- Produces (em `lib/ai-core.ts`):
  - `type AiAction = "interpret" | "review" | "redact"`
  - `interface InterpretResult { typeId: string; values: Record<string, string>; unmatched: string[] }`
  - `interface ReviewResult { gaps: string[] }`
  - `interface RedactResult { text: string }`
  - `function mockInterpret(freeText: string): InterpretResult`
  - `function mockReview(demand: DemandData): ReviewResult`
  - `function mockRedact(demand: DemandData): RedactResult`
  - `function isAiConfigured(): boolean` (true se `process.env.OPENAI_API_KEY`)
- Produces (em `app/api/ai/route.ts`): `POST` handler que recebe `{ action, freeText?, demand? }` e responde o result correspondente. Sem chave → usa as funções mock. Com chave → chama a OpenAI (implementado nesta task, mas testado via mock).

- [ ] **Step 1: Escrever o teste que falha (lógica mock pura)**

Create `lib/__tests__/ai-core.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { mockInterpret, mockReview, mockRedact } from "@/lib/ai-core";
import type { DemandData } from "@/lib/demand-map";

describe("ai-core (modo mock)", () => {
  it("mockInterpret detecta offline por palavra-chave", () => {
    const r = mockInterpret("Cliente quer um adesivo pra fachada da loja nova");
    expect(r.typeId.startsWith("offline")).toBe(true);
    expect(Array.isArray(r.unmatched)).toBe(true);
  });

  it("mockInterpret cai em 'outros' quando não reconhece", () => {
    const r = mockInterpret("algo totalmente indefinido xyz");
    expect(r.typeId).toBe("outros");
  });

  it("mockReview lista as lacunas obrigatórias como frases legíveis", () => {
    const demand: DemandData = { typeId: "offline-sinalizacao", values: {} };
    const r = mockReview(demand);
    expect(r.gaps.length).toBeGreaterThan(0);
    expect(r.gaps.join(" ")).toContain("Medida real");
  });

  it("mockReview retorna zero lacunas quando completo", () => {
    const demand: DemandData = {
      typeId: "outros",
      values: {
        cliente: "X", solicitante: "Ana", objetivo: "obj",
        prazo: "2026-09-05", prioridade: "Alta", descricao_livre: "ok",
      },
    };
    expect(mockReview(demand).gaps).toEqual([]);
  });

  it("mockRedact devolve o texto padronizado", () => {
    const demand: DemandData = { typeId: "social-post", values: { cliente: "X" } };
    const r = mockRedact(demand);
    expect(r.text.startsWith("SOLICITACAO DE DEMANDA")).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `cd ~/pauta-demandas && npx vitest run lib/__tests__/ai-core.test.ts`
Expected: FAIL — `Cannot find module '@/lib/ai-core'`.

- [ ] **Step 3: Implementar a lógica pura**

Create `lib/ai-core.ts`:

```ts
import { DEMAND_TYPES, getTypeById, type DemandData } from "@/lib/demand-map";
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
```

- [ ] **Step 4: Rodar para ver passar**

Run: `cd ~/pauta-demandas && npx vitest run lib/__tests__/ai-core.test.ts`
Expected: PASS.

- [ ] **Step 5: Instalar o SDK da OpenAI**

Run: `cd ~/pauta-demandas && npm i openai`

- [ ] **Step 6: Implementar o handler HTTP (real + fallback mock)**

Create `app/api/ai/route.ts`:

```ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  isAiConfigured,
  mockInterpret,
  mockReview,
  mockRedact,
  classifyByKeywords,
  type InterpretResult,
} from "@/lib/ai-core";
import { generateDemandText } from "@/lib/generate-text";
import { validateRequired } from "@/lib/validate";
import { DEMAND_TYPES, getFieldsForType, type DemandData } from "@/lib/demand-map";

export const runtime = "nodejs";

interface Body {
  action: "interpret" | "review" | "redact";
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
    return NextResponse.json({ error: "ação desconhecida" }, { status: 400 });
  } catch (err) {
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
```

- [ ] **Step 7: Rodar todos os testes e o build**

Run: `cd ~/pauta-demandas && npm test && npm run build`
Expected: testes PASS; build conclui (a rota compila).

- [ ] **Step 8: Commit**

```bash
cd ~/pauta-demandas && git add -A && git commit -m "feat: função serverless de IA (interpret/review/redact) com modo mock"
```

---

## Task 7: Cliente de IA no navegador

**Files:**
- Create: `lib/ai-client.ts`
- Test: `lib/__tests__/ai-client.test.ts`

**Interfaces:**
- Consumes: `DemandData` de `@/lib/demand-map`; tipos `InterpretResult`, `ReviewResult`, `RedactResult` de `@/lib/ai-core`.
- Produces:
  - `async function aiInterpret(freeText: string): Promise<InterpretResult>`
  - `async function aiReview(demand: DemandData): Promise<ReviewResult>`
  - `async function aiRedact(demand: DemandData): Promise<RedactResult>`
  - Todas fazem `POST /api/ai`. Em erro de rede, `aiRedact` faz fallback local com `generateDemandText`; `aiInterpret`/`aiReview` relançam para a UI tratar.

- [ ] **Step 1: Escrever o teste que falha**

Create `lib/__tests__/ai-client.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
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
    expect((globalThis.fetch as any)).toHaveBeenCalledWith(
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
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `cd ~/pauta-demandas && npx vitest run lib/__tests__/ai-client.test.ts`
Expected: FAIL — `Cannot find module '@/lib/ai-client'`.

- [ ] **Step 3: Implementar**

Create `lib/ai-client.ts`:

```ts
import type { DemandData } from "@/lib/demand-map";
import type { InterpretResult, ReviewResult, RedactResult } from "@/lib/ai-core";
import { generateDemandText } from "@/lib/generate-text";

async function post<T>(body: unknown): Promise<T> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`IA respondeu ${res.status}`);
  return (await res.json()) as T;
}

export async function aiInterpret(freeText: string): Promise<InterpretResult> {
  return post<InterpretResult>({ action: "interpret", freeText });
}

export async function aiReview(demand: DemandData): Promise<ReviewResult> {
  return post<ReviewResult>({ action: "review", demand });
}

export async function aiRedact(demand: DemandData): Promise<RedactResult> {
  try {
    return await post<RedactResult>({ action: "redact", demand });
  } catch {
    // Nunca trava por IA: gera localmente.
    return { text: generateDemandText(demand) };
  }
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `cd ~/pauta-demandas && npx vitest run lib/__tests__/ai-client.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/pauta-demandas && git add -A && git commit -m "feat: cliente de IA no navegador com fallback local"
```

---

## Task 8: Hook de estado + renderizador de campo + formulário

**Files:**
- Create: `lib/useDemand.ts`, `components/FieldRenderer.tsx`, `components/DemandForm.tsx`
- Test: `components/__tests__/DemandForm.test.tsx`

**Interfaces:**
- Consumes: `TRUNK_FIELDS`, `DEMAND_TYPES`, `getTypeById`, `getFieldsForType`, `FieldDef`, `DemandData` de `@/lib/demand-map`.
- Produces:
  - `useDemand()` retorna `{ demand, setType, setValue, reset, setAll }` onde
    `demand: DemandData`, `setType(typeId: string): void`, `setValue(id: string, value: string): void`, `reset(): void`, `setAll(next: DemandData): void`.
  - `FieldRenderer({ field, value, onChange, highlight })` — um input controlado por `FieldDef`.
  - `DemandForm({ demand, onSetType, onSetValue, missingIds })` — seletor de tipo + tronco + galhos, marcando campos de `missingIds`.

- [ ] **Step 1: Escrever o teste que falha**

Create `components/__tests__/DemandForm.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DemandForm } from "@/components/DemandForm";
import type { DemandData } from "@/lib/demand-map";

const demand: DemandData = { typeId: "offline-sinalizacao", values: {} };

describe("DemandForm", () => {
  it("renderiza os campos do tronco comum", () => {
    render(
      <DemandForm demand={demand} onSetType={vi.fn()} onSetValue={vi.fn()} missingIds={[]} />,
    );
    expect(screen.getByLabelText(/Cliente \/ Campanha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Prazo de entrega/i)).toBeInTheDocument();
  });

  it("renderiza os campos do galho offline (medida real)", () => {
    render(
      <DemandForm demand={demand} onSetType={vi.fn()} onSetValue={vi.fn()} missingIds={[]} />,
    );
    expect(screen.getByLabelText(/Medida real/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Aplicação \/ Local/i)).toBeInTheDocument();
  });

  it("marca campos faltando via missingIds", () => {
    render(
      <DemandForm
        demand={demand}
        onSetType={vi.fn()}
        onSetValue={vi.fn()}
        missingIds={["cliente"]}
      />,
    );
    const input = screen.getByLabelText(/Cliente \/ Campanha/i);
    expect(input).toHaveAttribute("aria-invalid", "true");
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `cd ~/pauta-demandas && npx vitest run components/__tests__/DemandForm.test.tsx`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar o hook**

Create `lib/useDemand.ts`:

```ts
"use client";
import { useState, useCallback } from "react";
import type { DemandData } from "@/lib/demand-map";

const EMPTY: DemandData = { typeId: "", values: {} };

export function useDemand(initial: DemandData = EMPTY) {
  const [demand, setDemand] = useState<DemandData>(initial);

  const setType = useCallback((typeId: string) => {
    setDemand((d) => ({ ...d, typeId }));
  }, []);

  const setValue = useCallback((id: string, value: string) => {
    setDemand((d) => ({ ...d, values: { ...d.values, [id]: value } }));
  }, []);

  const setAll = useCallback((next: DemandData) => setDemand(next), []);
  const reset = useCallback(() => setDemand(EMPTY), []);

  return { demand, setType, setValue, setAll, reset };
}
```

- [ ] **Step 4: Implementar o FieldRenderer**

Create `components/FieldRenderer.tsx`:

```tsx
"use client";
import type { FieldDef } from "@/lib/demand-map";

interface Props {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
  highlight?: boolean;
}

export function FieldRenderer({ field, value, onChange, highlight }: Props) {
  const base =
    "w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 " +
    (highlight ? "border-red-400 bg-red-50" : "border-gray-300");

  const common = {
    id: field.id,
    "aria-invalid": highlight ? true : undefined,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(e.target.value),
    placeholder: field.placeholder,
    className: base,
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={field.id} className="text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {field.type === "textarea" ? (
        <textarea {...common} rows={3} />
      ) : field.type === "select" ? (
        <select {...common}>
          <option value="">Selecione…</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input {...common} type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"} />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Implementar o DemandForm**

Create `components/DemandForm.tsx`:

```tsx
"use client";
import { TRUNK_FIELDS, DEMAND_TYPES, getTypeById, type DemandData } from "@/lib/demand-map";
import { FieldRenderer } from "@/components/FieldRenderer";

interface Props {
  demand: DemandData;
  onSetType: (typeId: string) => void;
  onSetValue: (id: string, value: string) => void;
  missingIds: string[];
}

export function DemandForm({ demand, onSetType, onSetValue, missingIds }: Props) {
  const type = getTypeById(demand.typeId);
  const galho = type ? type.fields : [];

  // Agrupa tipos por categoria para o select.
  const categories = Array.from(new Set(DEMAND_TYPES.map((t) => t.category)));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="tipo" className="text-sm font-medium text-gray-700">
          Tipo de demanda <span className="text-red-500">*</span>
        </label>
        <select
          id="tipo"
          value={demand.typeId}
          onChange={(e) => onSetType(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Selecione o tipo…</option>
          {categories.map((cat) => (
            <optgroup key={cat} label={cat}>
              {DEMAND_TYPES.filter((t) => t.category === cat).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <fieldset className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Informações gerais
        </legend>
        {TRUNK_FIELDS.map((f) => (
          <div key={f.id} className={f.type === "textarea" ? "md:col-span-2" : ""}>
            <FieldRenderer
              field={f}
              value={demand.values[f.id] ?? ""}
              onChange={(v) => onSetValue(f.id, v)}
              highlight={missingIds.includes(f.id)}
            />
          </div>
        ))}
      </fieldset>

      {galho.length > 0 && (
        <fieldset className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Especificação técnica
          </legend>
          {galho.map((f) => (
            <div key={f.id} className={f.type === "textarea" ? "md:col-span-2" : ""}>
              <FieldRenderer
                field={f}
                value={demand.values[f.id] ?? ""}
                onChange={(v) => onSetValue(f.id, v)}
                highlight={missingIds.includes(f.id)}
              />
            </div>
          ))}
        </fieldset>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Rodar para ver passar**

Run: `cd ~/pauta-demandas && npx vitest run components/__tests__/DemandForm.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd ~/pauta-demandas && git add -A && git commit -m "feat: hook de estado, FieldRenderer e DemandForm"
```

---

## Task 9: Entrada em texto livre (Momento 1)

**Files:**
- Create: `components/FreeTextIntake.tsx`
- Test: `components/__tests__/FreeTextIntake.test.tsx`

**Interfaces:**
- Consumes: `aiInterpret` de `@/lib/ai-client`.
- Produces: `FreeTextIntake({ onInterpreted })` onde `onInterpreted(result: InterpretResult): void`. Um textarea + botão "Interpretar"; enquanto chama a IA, mostra estado de carregando; em erro, mostra aviso e não quebra.

- [ ] **Step 1: Escrever o teste que falha**

Create `components/__tests__/FreeTextIntake.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FreeTextIntake } from "@/components/FreeTextIntake";

afterEach(() => vi.restoreAllMocks());

describe("FreeTextIntake", () => {
  it("chama a IA e repassa o resultado", async () => {
    const fake = { typeId: "offline-sinalizacao", values: {}, unmatched: [] };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(fake), { status: 200 })),
    );
    const onInterpreted = vi.fn();
    render(<FreeTextIntake onInterpreted={onInterpreted} />);

    await userEvent.type(
      screen.getByPlaceholderText(/descreva a demanda/i),
      "adesivo pra fachada",
    );
    await userEvent.click(screen.getByRole("button", { name: /interpretar/i }));

    expect(onInterpreted).toHaveBeenCalledWith(fake);
  });

  it("mostra aviso em caso de erro, sem quebrar", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    render(<FreeTextIntake onInterpreted={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText(/descreva a demanda/i), "x");
    await userEvent.click(screen.getByRole("button", { name: /interpretar/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `cd ~/pauta-demandas && npx vitest run components/__tests__/FreeTextIntake.test.tsx`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar**

Create `components/FreeTextIntake.tsx`:

```tsx
"use client";
import { useState } from "react";
import { aiInterpret } from "@/lib/ai-client";
import type { InterpretResult } from "@/lib/ai-core";

interface Props {
  onInterpreted: (result: InterpretResult) => void;
}

export function FreeTextIntake({ onInterpreted }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handle() {
    if (!text.trim()) return;
    setLoading(true);
    setError(false);
    try {
      const result = await aiInterpret(text);
      onInterpreted(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <label htmlFor="freetext" className="text-sm font-medium text-gray-700">
        Entrada rápida (opcional)
      </label>
      <textarea
        id="freetext"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Descreva a demanda do jeito que ela chegou…"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handle}
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Interpretando…" : "Interpretar"}
        </button>
        {error && (
          <span role="alert" className="text-sm text-red-600">
            Não consegui interpretar agora. Você pode preencher na mão.
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rodar para ver passar**

Run: `cd ~/pauta-demandas && npx vitest run components/__tests__/FreeTextIntake.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/pauta-demandas && git add -A && git commit -m "feat: entrada em texto livre (Momento 1)"
```

---

## Task 10: Revisão de lacunas + preview do texto + página final

**Files:**
- Create: `components/GapReview.tsx`, `components/OutputPreview.tsx`
- Modify: `app/page.tsx` (montar tudo)
- Test: `components/__tests__/GapReview.test.tsx`, `components/__tests__/OutputPreview.test.tsx`

**Interfaces:**
- Consumes: `validateRequired` de `@/lib/validate`; `generateDemandText` de `@/lib/generate-text`; `aiRedact` de `@/lib/ai-client`; `useDemand` de `@/lib/useDemand`; `DemandForm`, `FreeTextIntake`; `saveDraft`/`loadDraft`/`clearDraft` de `@/lib/draft`.
- Produces:
  - `GapReview({ gaps })` — lista de lacunas; nada renderiza se vazio.
  - `OutputPreview({ text, onCopy })` — mostra o texto + botão copiar.

- [ ] **Step 1: Escrever os testes que falham**

Create `components/__tests__/GapReview.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GapReview } from "@/components/GapReview";

describe("GapReview", () => {
  it("não renderiza nada quando não há lacunas", () => {
    const { container } = render(<GapReview gaps={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lista as lacunas", () => {
    render(<GapReview gaps={["Falta preencher: Medida real (L x A)."]} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/Medida real/);
  });
});
```

Create `components/__tests__/OutputPreview.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OutputPreview } from "@/components/OutputPreview";

describe("OutputPreview", () => {
  it("mostra o texto e dispara onCopy", async () => {
    const onCopy = vi.fn();
    render(<OutputPreview text="SOLICITACAO DE DEMANDA" onCopy={onCopy} />);
    expect(screen.getByText(/SOLICITACAO DE DEMANDA/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /copiar/i }));
    expect(onCopy).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `cd ~/pauta-demandas && npx vitest run components/__tests__/GapReview.test.tsx components/__tests__/OutputPreview.test.tsx`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar GapReview**

Create `components/GapReview.tsx`:

```tsx
"use client";

interface Props {
  gaps: string[];
}

export function GapReview({ gaps }: Props) {
  if (gaps.length === 0) return null;
  return (
    <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4">
      <p className="mb-2 text-sm font-semibold text-amber-800">
        Antes de gerar, confira o que está faltando:
      </p>
      <ul className="list-disc pl-5 text-sm text-amber-800">
        {gaps.map((g, i) => (
          <li key={i}>{g}</li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Implementar OutputPreview**

Create `components/OutputPreview.tsx`:

```tsx
"use client";

interface Props {
  text: string;
  onCopy: () => void;
}

export function OutputPreview({ text, onCopy }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Texto da solicitação
        </h2>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white"
        >
          Copiar
        </button>
      </div>
      <pre className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-800">
        {text}
      </pre>
    </div>
  );
}
```

- [ ] **Step 5: Rodar os testes de componente**

Run: `cd ~/pauta-demandas && npx vitest run components/__tests__/GapReview.test.tsx components/__tests__/OutputPreview.test.tsx`
Expected: PASS.

- [ ] **Step 6: Montar a página**

Replace `app/page.tsx` com:

```tsx
"use client";
import { useEffect, useState } from "react";
import { useDemand } from "@/lib/useDemand";
import { DemandForm } from "@/components/DemandForm";
import { FreeTextIntake } from "@/components/FreeTextIntake";
import { GapReview } from "@/components/GapReview";
import { OutputPreview } from "@/components/OutputPreview";
import { validateRequired } from "@/lib/validate";
import { aiRedact } from "@/lib/ai-client";
import { saveDraft, loadDraft, clearDraft } from "@/lib/draft";
import type { InterpretResult } from "@/lib/ai-core";

export default function Page() {
  const { demand, setType, setValue, setAll, reset } = useDemand();
  const [gaps, setGaps] = useState<string[]>([]);
  const [missingIds, setMissingIds] = useState<string[]>([]);
  const [output, setOutput] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [restored, setRestored] = useState(false);

  // Restaura rascunho ao montar.
  useEffect(() => {
    const draft = loadDraft();
    if (draft) setAll(draft);
    setRestored(true);
  }, [setAll]);

  // Autosave (só depois de restaurar, pra não sobrescrever com vazio).
  useEffect(() => {
    if (restored && demand.typeId) saveDraft(demand);
  }, [demand, restored]);

  function handleInterpreted(result: InterpretResult) {
    setAll({ typeId: result.typeId, values: { ...demand.values, ...result.values } });
  }

  async function handleGenerate() {
    const missing = validateRequired(demand);
    setMissingIds(missing.map((f) => f.id));
    setGaps(missing.map((f) => `Falta preencher: ${f.label}.`));
    if (missing.length > 0) {
      setOutput("");
      return;
    }
    setGenerating(true);
    try {
      const { text } = await aiRedact(demand);
      setOutput(text);
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    navigator.clipboard?.writeText(output);
  }

  function handleReset() {
    reset();
    clearDraft();
    setGaps([]);
    setMissingIds([]);
    setOutput("");
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900">Pauta de Demandas</h1>
        <p className="text-sm text-gray-500">
          Descreva ou preencha a demanda; a ferramenta monta o texto técnico pra gestão.
        </p>
      </header>

      <FreeTextIntake onInterpreted={handleInterpreted} />
      <DemandForm demand={demand} onSetType={setType} onSetValue={setValue} missingIds={missingIds} />
      <GapReview gaps={gaps} />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !demand.typeId}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {generating ? "Gerando…" : "Gerar texto"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700"
        >
          Limpar
        </button>
      </div>

      {output && <OutputPreview text={output} onCopy={handleCopy} />}
    </main>
  );
}
```

- [ ] **Step 7: Rodar tudo + build + subir a app**

Run:

```bash
cd ~/pauta-demandas && npm test && npm run build && npm run dev
```

Expected: testes PASS; build OK; abrir `http://localhost:3000`, escolher um tipo offline, tentar gerar sem preencher (aparecem lacunas), preencher os obrigatórios e gerar (texto padronizado aparece). Encerrar o dev com Ctrl+C.

- [ ] **Step 8: Commit**

```bash
cd ~/pauta-demandas && git add -A && git commit -m "feat: revisão de lacunas, preview de saída e página completa"
```

---

## Task 11: Config de ambiente, README e acabamento visual

**Files:**
- Create: `README.md`
- Modify: `app/layout.tsx` (metadata/título), aplicação da direção visual nos componentes já criados.

**Interfaces:**
- Consumes: tudo. Não expõe novas interfaces.

- [ ] **Step 1: Escrever o README**

Create `README.md`:

```markdown
# Pauta de Demandas

Web app que ajuda o atendimento a pautar demandas com todas as informações
técnicas e gerar um texto padronizado pra colar no iClips.

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # opcional: preencha OPENAI_API_KEY
npm run dev
```

Sem `OPENAI_API_KEY`, a IA roda em modo mock (classificação por palavra-chave +
texto determinístico). Com a chave, a interpretação e a redação usam o GPT.

## Testes

```bash
npm test
```

## Deploy (Vercel)

1. Importe o repositório na Vercel.
2. Em Project → Settings → Environment Variables, adicione `OPENAI_API_KEY`.
3. Deploy. A função `app/api/ai` roda como serverless e é a única que lê a chave.

## Notas

- Sem banco de dados e sem login. Rascunho fica só no navegador (localStorage).
- Nunca coloque a chave no código do cliente — só na env var do servidor.
```

- [ ] **Step 2: Ajustar metadata da app**

Modify `app/layout.tsx` — garantir `metadata` com título "Pauta de Demandas" e `lang="pt-BR"` no `<html>`.

```tsx
export const metadata = {
  title: "Pauta de Demandas",
  description: "Formulário inteligente de pauta de demandas para atendimento.",
};
```

E no elemento raiz: `<html lang="pt-BR">`.

- [ ] **Step 3: Aplicar a direção visual (design-taste-frontend + design system)**

Invoque a skill `design-taste-frontend` para vestir a interface. Extraia do design
system do usuário (Claude Design, link fornecido no projeto): paleta de cores,
tipografia, raios/sombras, estilos de botão e input. Aplique de forma consistente
em `app/globals.css` (tokens/variáveis) e nos componentes `FieldRenderer`,
`DemandForm`, `FreeTextIntake`, `GapReview`, `OutputPreview`, `app/page.tsx` —
sem alterar comportamento nem os textos/rótulos técnicos, só a camada visual.

- [ ] **Step 4: Rodar tudo + build**

Run: `cd ~/pauta-demandas && npm test && npm run build`
Expected: testes PASS; build OK.

- [ ] **Step 5: Commit**

```bash
cd ~/pauta-demandas && git add -A && git commit -m "chore: README, metadata e acabamento visual"
```

---

## Self-Review

**Cobertura do spec:**
- Tronco comum + galhos (incl. 6 subtipos offline) → Task 2. ✓
- Gargalos A/B/D/E como campos obrigatórios → Task 2 (required) + Task 3 (validação). ✓
- Momento 1 (interpretar/pré-preencher) → Task 6 (`interpret`) + Task 9 (UI). ✓
- Momento 2 (revisão de lacunas) → Task 3 + Task 10 (`GapReview` + gate no `handleGenerate`). ✓
- Momento 3 (redação final) → Task 4 (fallback) + Task 6 (`redact`) + Task 10 (preview/copiar). ✓
- Texto puro padronizado, ordem fixa → Task 4 (+ teste anti-emoji e de ordem). ✓
- Sem banco/login → nenhuma task introduz persistência de servidor. ✓
- Rascunho local → Task 5 + fiação em Task 10. ✓
- Chave protegida / serverless / mock → Task 6 + Task 11 (README/deploy). ✓
- Nunca travar por IA → Task 6 (try/catch → mock), Task 7 (`aiRedact` fallback). ✓
- Fallback "Outros" → Task 2. ✓
- Direção visual só no fim → Task 11. ✓
- Testes do spec (mapa, validação, fallback sem IA, formato) → Tasks 2,3,4,6. ✓

**Placeholders:** nenhum "TBD/TODO"; todos os steps de código têm código real.

**Consistência de tipos:** `DemandData {typeId, values}`, `FieldDef`, `InterpretResult/ReviewResult/RedactResult`, `validateRequired`, `generateDemandText`, `aiInterpret/aiReview/aiRedact`, `saveDraft/loadDraft/clearDraft`, `useDemand`, `DemandForm`/`FieldRenderer` — nomes e assinaturas batem entre as tasks que produzem e consomem.

# Formulário Inteligente de Pauta de Demandas — Design

**Data:** 2026-09-01
**Status:** Design aprovado (aguardando revisão do spec)

## Problema

A equipe de atendimento de uma agência criativa pauta demandas para a produção,
mas as pautas chegam incompletas e geram retrabalho e idas e vindas. Os quatro
gargalos mais dolorosos hoje são:

- **(A) Briefing essencial** faltando — objetivo, público, o que comunicar.
- **(B) Especificação técnica** faltando — formato, dimensão, veiculação; crítico
  em produções offline (medida real, material, acabamento, quantidade).
- **(D) Prazo/prioridade** faltando — quando precisa, urgência real, quem aprova.
- **(E) Rastreabilidade** faltando — quem pediu, para qual cliente/campanha.

O fluxo atual: **atendimento pauta → gestora de projeto → iClips** (a gestora
cola a solicitação na plataforma de gestão manualmente).

## Objetivo

Um web app que ajuda o atendente a pautar qualquer demanda com todas as
informações necessárias, adaptando os campos ao tipo de peça e usando IA para
interpretar, completar e revisar. No final, gera um **texto de solicitação
técnico e padronizado** pronto para a gestora colar no iClips.

Métrica de sucesso: reduzir a zero as pautas que voltam por falta de informação
essencial (A, B, D, E).

## Escopo e decisões

| Decisão | Escolha |
|---|---|
| Natureza | Agência criativa, tipos de peça variados |
| Abordagem de UX | **Formulário inteligente (form-first)** com IA em 3 momentos |
| Destino do output | Texto padronizado, copiar/colar → gestora → iClips |
| Plataforma | Web app, desktop, acesso por link |
| Persistência | Sem banco, sem login. **Rascunho local** (localStorage) na v1 |
| IA | API do GPT, via função serverless (chave protegida) |
| Formato do texto | Padronizado (não espelha iClips por ora) + **texto puro** |
| Direção visual | `design-taste-frontend` + design system do usuário (Claude Design) |

### Fora de escopo (YAGNI)

- Banco de dados, login, histórico de pautas.
- Integração direta com a API do iClips.
- App mobile nativo (desktop-first resolve).
- Espelhar campos exatos do iClips (pode virar ajuste futuro se a gestora quiser).

## Arquitetura

```
Navegador (atendente)
  App web — formulário inteligente
    • Entrada em texto livre
    • Formulário estruturado (tronco + galhos)
    • Preview do texto final
        │ chamada segura
        ▼
Função serverless (Vercel)
  Guarda a chave da OpenAI e executa 3 tarefas:
    1. interpretar / pré-preencher
    2. revisar lacunas
    3. redigir o texto final
        │
        ▼
     API do GPT
```

- **Sem banco de dados, sem login.** A pauta vive na tela até virar texto.
- **Uma única função serverless** protege a chave da API; o navegador nunca a vê.
- **Rascunho local (v1):** autosave no `localStorage` como rede de segurança
  contra fechar a aba sem querer. Não é persistência de produto — é conveniência
  por sessão, privada ao navegador do atendente. Restaura o que estava sendo
  digitado ao reabrir; é limpo quando a pauta é gerada/descartada.

## Modelo de dados do formulário

O coração da ferramenta é um **mapa técnico** (arquivo de configuração) que
descreve tronco comum + galhos por tipo. Esse mapa serve tanto ao formulário
(quais campos renderizar) quanto à IA (o que perguntar/extrair).

### Tronco comum (toda demanda)

| Campo | Gargalo que blinda |
|---|---|
| Cliente / Campanha | E |
| Solicitante (quem pediu) | E |
| Objetivo da peça | A |
| Público-alvo | A |
| Prazo + Prioridade | D |
| Quem aprova | D |

### Galhos por tipo

- **Social Media** — formato, dimensão/proporção, onde veicula, copy/legenda, nº de peças
- **Audiovisual** — duração, proporção, trilha, locução, entregáveis, referências
- **Impresso / Gráfico** — formato fechado, sangria, papel, acabamento, quantidade
- **Identidade / Branding** — tipo de entregável, aplicações, arquivos finais
- **Web / Digital** — tipo (LP/site/e-mail/ads), dimensões, veiculação, links
- **Apresentação** — nº de slides, proporção, template, conteúdo
- **Produções Offline** (prioridade) — subtipos abaixo, com um núcleo compartilhado:
  **medida real, material, acabamento, quantidade, aplicação/local, data de
  instalação/evento, fornecedor/gráfica**
  - Sinalização / ambientação
  - PDV / Trade
  - Eventos / Ativações
  - Grandes formatos
  - Brindes / Merchandising
  - Impressos físicos
- **Outros** — campos genéricos + observações livres (fallback quando não encaixa)

## Fluxo da IA (3 momentos)

**Momento 1 — Entrada rápida (interpretar + pré-preencher).**
Campo de texto livre no topo: "Descreva a demanda do jeito que ela chegou." A IA
identifica o tipo, extrai o que dá e pré-preenche os campos; deixa em branco
(destacado) o que não encontrou. É atalho, não obrigação — dá pra preencher na mão.

**Momento 2 — Revisão de lacunas.** Ao clicar em "Gerar", antes de entregar, a IA
cruza o preenchido com o mapa técnico do tipo e aponta faltas/incoerências
(ex.: adesivo sem medida real nem local de aplicação). **Segura** a geração até
o essencial estar completo.

**Momento 3 — Redação final.** Com tudo ok, a IA transforma os campos num texto
técnico padronizado, pronto pra copiar. Botão de copiar com um clique.

## Formato do texto final

Padronizado, sempre na mesma ordem, **texto puro** (sem emojis/enfeites, máxima
compatibilidade de colagem):

```
SOLICITACAO DE DEMANDA

Cliente/Campanha:
Solicitante:            Data:
Tipo:
Prioridade:             Prazo:

OBJETIVO


ESPECIFICACAO TECNICA
(campos do tipo, ex. offline)
Medida real:     Material:     Acabamento:
Quantidade:      Aplicacao/Local:
Data instalacao/evento:        Fornecedor/grafica:

PUBLICO / OBSERVACOES


APROVACAO
Aprovador:
```

Nota: os blocos de ESPECIFICACAO variam conforme o tipo (renderizados a partir do
mapa técnico). O cabeçalho e os blocos de tronco comum são fixos.

## Erros e casos de borda

- **IA fora do ar / sem internet:** o formulário funciona 100% manual e gera o
  texto **sem IA** (redação vira template preenchido). A IA é turbo, não muleta.
- **IA "alucina" um campo:** tudo que ela preenche fica **destacado como
  sugestão** até o atendente confirmar. Nada entra no texto sem olho humano.
- **Demanda que não encaixa:** cai em "Outros" com campos genéricos.
- **Custo da API:** cada geração é uma chamada; sem login, dá pra impor um limite
  simples por sessão se necessário.

## Stack técnica (proposta)

- **Frontend + serverless num só projeto:** Next.js (App Router) na Vercel — a
  UI e a função de IA convivem no mesmo deploy.
- **IA:** API do GPT, chamada só pela route handler serverless (chave em env var).
- **Estilo:** aplicado na implementação via `design-taste-frontend` + design
  system do usuário (extrair cores, tipografia, componentes, espaçamentos).
- **Ambiente de dev:** desenvolver em `~/pauta-demandas` (home), não no caminho
  `@CODE` em volume externo, que quebra ferramentas Node.

## Testes

- **Mapa técnico:** teste de que cada tipo/subtipo renderiza os campos esperados
  e marca corretamente obrigatórios vs opcionais.
- **Momento 2 (revisão de lacunas):** casos onde falta campo obrigatório devem
  bloquear a geração; casos completos devem passar.
- **Fallback sem IA:** gerar o texto padronizado a partir dos campos sem chamar a
  API, garantindo que a ferramenta nunca "trava" por IA indisponível.
- **Formato do texto:** snapshot do texto final para um par de tipos (ex.: um
  social e um offline) garantindo ordem e rótulos estáveis.

## Próximos passos

1. Revisão deste spec pelo usuário.
2. Plano de implementação (skill `writing-plans`).
3. Construção da v1 com a direção visual definida.

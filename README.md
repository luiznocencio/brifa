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

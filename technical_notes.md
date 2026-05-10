# Notas tecnicas — Crypto Exchange

Documento de decisoes e evolucao do monorepo. Complementa o [`README.md`](README.md) sem duplicar guias de instalacao.

Este ficheiro e o [`pre_commit.md`](pre_commit.md) ficam **na raiz do repositorio** (um unico sitio para todo o monorepo). Os README em [`mobile/README.md`](mobile/README.md) e [`backend/README.md`](backend/README.md) apontam para aqui quando precisam de contexto partilhado.

## Roteiro da migracao para Expo Router (por ordem logica)

1. **Dependencias e entrada:** garantir `expo-router` no projecto; alterar `main` para `expo-router/entry` no `package.json`.
2. **Babel:** incluir `expo-router/babel` (com `react-native-reanimated/plugin` por ultimo).
3. **Pastas `app/`:** criar `_layout.tsx` raiz (providers, stack); `index.tsx` como portal de entrada que redirecciona com base na sessao.
4. **Segmentos:** mover login para `(auth)/login`; area logada para `(tabs)/` com `_layout.tsx` de tabs e ecras por ficheiro.
5. **Estado de dominio:** extrair logica pesada para `ExchangeContext` (e manter `AuthContext`) em vez de um unico `App.tsx`.
6. **Limpeza:** remover `index.ts` / `App.tsx` antigos e actualizar documentacao.

## O que melhora no app com esta mudanca

| Aspecto | Melhoria |
|--------|-----------|
| **Navegacao** | Rotas nomeadas (`/login`, `/dashboard`, …) em vez de estado interno (`mainTab`); historico e padrao familiar do React Navigation por baixo do Expo Router. |
| **Deep links e URLs** | Possibilidade de abrir ecras especificos via scheme ou ligacao (partilha, notificacoes, testes E2E por rota). |
| **Organizacao do codigo** | Um ficheiro por ecra sob `app/`; menos componente raiz monolitico; dominio da exchange concentrado no contexto. |
| **Manutencao** | Alinhamento com a documentacao actual do **Expo SDK 54** e exemplos da comunidade; onboarding mais simples para quem ja usa file-based routing. |
| **Backend** | Nenhuma mudanca obrigatoria — cliente continua a usar a mesma API Laravel / Sanctum. |

## Navegacao no mobile: o que se usava antes e por que mudou

### Antes (ate migracao para Expo Router)

- **Entrada:** ficheiro `mobile/index.ts` com `registerRootComponent(App)` e import de `App.tsx`.
- **Navegacao:** um unico componente raiz (`App` + `RootScreen`) com **estado React**:
  - `isAuthenticated` (via `AuthContext`) para alternar entre formulario de login/registo e area logada;
  - `mainTab` (`'dashboard' | 'trade' | 'history'`) para trocar o conteudo entre “ecras” **sem** URLs nem historico de navegacao do sistema.
- **Expo Router** ja estava em `package.json` como dependencia, mas **nao estava integrado** (sem pasta `app/`, `main` apontava para `index.ts`).

Isto e valido no Expo, mas nao segue o fluxo **file-based** recomendado na documentacao do **Expo SDK 54** para quem pretende rotas nomeadas, deep links e alinhamento com o ecossistema actual.

### Depois (estado actual)

- **Entrada:** `"main": "expo-router/entry"` no `mobile/package.json` (padrao oficial do Expo Router).
- **Babel:** plugin `expo-router/babel` (com `react-native-reanimated` em ultimo, como exigido).
- **Pastas:** `mobile/app/` com layouts e ecras:
  - `app/_layout.tsx` — import de `global.css`, `AuthProvider`, `Stack` raiz;
  - `app/index.tsx` — redirecciona para `/login` ou `/dashboard` consoante a sessao;
  - `app/(auth)/login.tsx` — autenticacao;
  - `app/(tabs)/` — abas `dashboard`, `trade`, `history` com `Tabs` e tab bar custom (`MainTabBar`).
- **Estado de dominio (API):** `ExchangeContext` concentra wallet, mercado, transacoes e logica de trade, evitando um ficheiro `App.tsx` monolitico.

### Motivos da mudanca

1. **Alinhar com a documentacao do Expo 54** para projectos que usam `expo-router` e o plugin `expo` no `app.json`.
2. **Rotas reais e deep links** (`/login`, `/dashboard`, etc.), uteis para partilha, testes e evolucao (ex.: proteccao de segmentos).
3. **Separacao clara** entre ecras (ficheiros em `app/`) e logica reutilizavel (`src/contexts`, `src/components`).
4. **Manter** Sanctum, Axios e `AuthContext`; apenas o **encerro de sessao** passou a usar `router.replace('/login')` apos `signOut()`.

A **API Laravel** nao foi alterada por esta mudanca; apenas a organizacao do cliente React Native.

## Outras referencias

- Detalhes de stack e comandos do mobile: [`mobile/README.md`](mobile/README.md).
- Contrato HTTP: [`backend/README.md`](backend/README.md).

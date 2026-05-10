# Mobile (frontend) — Crypto Exchange

App **React Native (Expo)** com **Expo Router** (file-based routing, alinhado ao [Expo SDK 54](https://docs.expo.dev/)). O **objetivo** e a visao geral do produto estao no [`README.md` da raiz](../README.md).

Historico da migracao de navegacao (`App.tsx` monolitico para rotas em `app/`)

## Stack (versoes)

Valores alinhados ao `package.json` em `mobile/`.

| Tecnologia | Versao / notas |
|------------|----------------|
| Expo SDK | ~54.0.33 |
| Expo Router | ~6 (`main`: `expo-router/entry`, pasta `app/`) |
| React | 19.1.0 |
| React Native | 0.81.5 |
| TypeScript | ~5.9.2 (`devDependencies`) |
| NativeWind | ^4.2.3 (Tailwind no RN) |
| Tailwind CSS | ^3.4.19 |
| React Native Reanimated | ~4.1.1 |
| React Native SVG | 15.12.x (graficos) |
| Axios | ^1.16.0 |
| date-fns | ^4.1.0 (datas no historico, locale `pt-BR`) |
| Async Storage | 2.2.0 (alinhado ao Expo SDK 54) |
| babel-preset-expo | ~54.0.10; plugin **`expo-router/babel`** |

Formatacao monetaria: **`Intl.NumberFormat`** (sem pacote extra de i18n so para numeros).

## Navegacao (Expo Router)

| Caminho do ficheiro | Rota publica (URL logica) | Conteudo |
|---------------------|---------------------------|----------|
| `app/index.tsx` | `/` | Redirecciona: sessao carregada → `/dashboard` ou `/login` |
| `app/(auth)/login.tsx` | `/login` | Login e registo; apos sucesso → `/dashboard` |
| `app/(tabs)/dashboard.tsx` | `/dashboard` | Gráfico BTC mercado X carteira, cotação ao vivo + `Atualizar cotação` (no cartão do gráfico), composição de patrimônio |
| `app/(tabs)/trade.tsx` | `/trade` | Negociacao (comprar/vender); botao **Atualizar saldo** |
| `app/(tabs)/history.tsx` | `/history` | Lista de transacoes + botao **Atualizar historico** |

- **`AuthProvider`** no `app/_layout.tsx` (sessao global).
- **`ExchangeProvider`** no `app/(tabs)/_layout.tsx` (dados da API apos login): wallet, mercado, transacoes, estado de trade.
- Grupos entre parenteses `(auth)` e `(tabs)` **nao** aparecem no URL; o scheme do projecto esta em `app.json` (`scheme`: `mobile`) para deep links.


## Status de implementacao (mobile)

### Fase 4 — App e integracao com a API

- [x] Monorepo com pasta `mobile/` e TypeScript
- [x] **Expo Router** (`app/`, `expo-router/entry`, plugin Babel); rotas nomeadas e layouts por grupo
- [x] `AuthContext` + token Sanctum persistido (`AsyncStorage`)
- [x] Ecra `login` com fluxo login/registo e validacao basica
- [x] Tratamento de erros de rede (`401` / `422`) com feedback ao usuario
- [x] `ExchangeContext`: wallet, mercado, transacoes e trade (efeitos partilhados entre abas)
- [x] Consumo de `GET /api/wallet` no estado autenticado
- [x] Polling de `GET /api/market/btc` (15s); botão **Atualizar cotação** no cartão do gráfico no Dashboard (na aba Negociar não há bloco Mercado BTC)
- [x] UI com **NativeWind** (`className`, Tailwind)
- [x] Trade: campo unico de valor + alternancia Comprar / Vender
- [x] Bloqueio quando valor > saldo BRL (compra) ou > saldo BTC (venda)
- [x] Feedback de sucesso (`Alert` + mensagem em tela)
- [x] Abas Dashboard / Negociar / Historico com tab bar custom (`MainTabBar`)
- [x] Saldo (`WalletSaldoCard`) em todas as abas via `AuthenticatedScroll`; Dashboard: `BtcMarketVsHoldingsLineChart` + `WalletBalanceChart`
- [x] Historico: `GET /api/transactions` com refresh manual; componentes `TransactionHistoryList` + `TransactionListItem` (`src/components/`)
- [x] `FlatList` no historico; cores compra (verde) / venda (vermelho)
- [x] `mobile/src/utils/format.ts`: `Intl` + **date-fns** (`pt-BR`)
- [x] Loading: spinner + esqueletos; estado vazio com mensagem fixa no app
- [x] `ScrollView` com `nestedScrollEnabled` para lista aninhada

Contrato da API (rotas, Sanctum): [`backend/README.md`](../backend/README.md).

## Executar o app

Primeira vez:

```bash
cd mobile
npm install
```

Bundler com cache limpo (recomendado apos mudancas em Metro/Tailwind):

```bash
cd mobile
npx expo start -c
```

Fluxo normal:

```bash
cd mobile
npm start
```

Na raiz do monorepo (backend + mobile):

```bash
./scripts/dev.sh
```

## Configuracao da API (Axios)

Cliente em `mobile/src/services/api.ts`.

- Variavel: `EXPO_PUBLIC_API_URL`
- Fallback padrao:
  - Emulador Android: `http://10.0.2.2/api`
  - Simulador iOS / Web: `http://127.0.0.1/api`

Dispositivo fisico: copiar `mobile/.env.example` para `mobile/.env` e definir o IP da maquina, por exemplo `http://192.168.x.x/api`.

## NativeWind (Tailwind)

Arquivos principais: `tailwind.config.js`, `global.css`, `babel.config.js`, `metro.config.js`, `app/_layout.tsx` (import do CSS no layout raiz do Expo Router).

## Estrutura de pastas (resumo)

```
mobile/
  app/                    # Rotas Expo Router
    _layout.tsx
    index.tsx
    (auth)/login.tsx
    (tabs)/_layout.tsx
    (tabs)/dashboard.tsx | trade.tsx | history.tsx
  src/
    contexts/             # AuthContext, ExchangeContext
    components/           # UI partilhada (exchange/, graficos, historico)
    services/api.ts
```

## Troubleshooting

### `Unable to resolve "@react-native-async-storage/async-storage"`

Instalar dependencias dentro de `mobile/`:

```bash
cd mobile && npm install
```

### `Rendered more hooks than during the previous render`

Manter todos os hooks no topo do componente, antes de qualquer `return` condicional. Se persistir, limpar cache do Metro: `npx expo start -c`.

### `Cannot find module 'babel-preset-expo'`

O preset deve estar em `dependencies` (ver `package.json`). Depois: `npm install` em `mobile/`.

## Documentacao no monorepo

- Visao geral: [`README.md`](../README.md)
- API Laravel: [`backend/README.md`](../backend/README.md)

# Mobile (frontend) — Crypto Exchange

App **React Native (Expo)**. O **objetivo** e a visao geral do produto estao no [`README.md` da raiz](../README.md).

## Stack (versoes)

Valores alinhados ao `package.json` em `mobile/`.

| Tecnologia | Versao / notas |
|------------|----------------|
| Expo SDK | ~54.0.33 |
| React | 19.1.0 |
| React Native | 0.81.5 |
| TypeScript | ~5.9.2 (`devDependencies`) |
| NativeWind | ^4.2.3 (Tailwind no RN) |
| Tailwind CSS | ^3.4.19 |
| React Native Reanimated | ~4.1.1 |
| Axios | ^1.16.0 |
| date-fns | ^4.1.0 (datas no historico, locale `pt-BR`) |
| Async Storage | 2.2.0 (alinhado ao Expo SDK 54) |
| babel-preset-expo | ~54.0.10 |

Formatacao monetaria: **`Intl.NumberFormat`** (sem pacote extra de i18n so para numeros).

## Status de implementacao (mobile)

### Fase 4 — App e integracao com a API

- [x] Monorepo com pasta `mobile/` e TypeScript
- [x] `AuthContext` + token Sanctum persistido (`AsyncStorage`)
- [x] Telas de login e registro com validacao basica
- [x] Tratamento de erros de rede (`401` / `422`) com feedback ao usuario
- [x] Consumo de `GET /api/wallet` no estado autenticado
- [x] Polling de `GET /api/market/btc` (15s) + botao de atualizar cotacao
- [x] UI com **NativeWind** (`className`, Tailwind)
- [x] Trade: campo unico de valor + alternancia Comprar / Vender
- [x] Bloqueio quando valor > saldo BRL (compra) ou > saldo BTC (venda)
- [x] Feedback de sucesso (`Alert` + mensagem em tela)
- [x] Ordem correta de hooks no `RootScreen`
- [x] Dashboard: carteira + preco BTC
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

Arquivos principais: `tailwind.config.js`, `global.css`, `babel.config.js`, `metro.config.js`, `index.ts` (import do CSS).

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

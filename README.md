# Crypto Exchange

Plataforma de trading (mini Binance) com backend em Laravel e aplicativo mobile em React Native.

## Objetivo do teste tecnico

Entregar uma aplicacao simples de compra e venda de BTC com:

- autenticacao de usuario;
- carteira com saldo em BRL e BTC;
- preco fake dinamico do mercado;
- operacoes de compra e venda;
- historico de transacoes;
- documentacao clara e testes automatizados.

## Stack do projeto

- Backend: Laravel 13, Sanctum, MySQL, Redis, Docker (Sail)
- Mobile: React Native (Expo) em `mobile/`
- Testes: PHPUnit (Feature e Unit)

## Status de implementacao

### Fase 1 - Execucao inicial

- [x] Projeto criado via `laravel.build`
- [x] Ambiente Docker/Sail configurado
- [x] Containers `laravel.test`, `mysql`, `redis` e `mailpit`
- [x] API scaffolding instalado com `php artisan install:api`

### Fase 2 - Autenticacao

- [x] Registro de usuario (`POST /api/register`)
- [x] Login com email e senha (`POST /api/login`)
- [x] Endpoint protegido `GET /api/me`
- [x] Validacao de aceite de termos no registro (`accepted_terms`)
- [x] Campo `accepted_terms_at` no usuario

### Fase 3 - Wallet, mercado e trade

- [x] `GET /api/wallet`
- [x] `GET /api/market/btc`
- [x] `POST /api/trade/buy`
- [x] `POST /api/trade/sell`
- [x] `GET /api/transactions`
- [x] Migrations `wallets` e `transactions` com `decimal(16,8)`
- [x] Compra/venda com transacao atomica e lock de concorrencia (`lockForUpdate`)

### Fase 4 - Mobile e integracao

- [x] Estrutura monorepo com `backend/` e `mobile/`
- [x] Projeto Expo TypeScript criado em `mobile/`
- [x] AuthContext com persistencia de token via AsyncStorage
- [x] Dependencia `@react-native-async-storage/async-storage` adicionada ao app mobile
- [x] Telas de login/registro com validacao simples
- [x] Tratamento de erros de rede (`401/422`) com feedback ao usuario
- [x] Consumo do endpoint `GET /wallet` no estado autenticado
- [x] Polling de `GET /market/btc` (15s) para atualizar cotacao fake do Redis
- [x] UI mobile com NativeWind (Tailwind) para alinhar estilos com web
- [x] Tela de trade com campo unico de valor e alternancia Comprar/Vender
- [x] Bloqueio do envio quando valor > saldo BRL (compra) ou > saldo BTC (venda)
- [x] Feedback visual de sucesso apos confirmacao do backend (alerta + mensagem em tela)
- [x] Correcao da ordem de hooks no `RootScreen` (erro "Rendered more hooks than during the previous render")
- [x] Dashboard com carteira + preco BTC
- [x] Tela de trade (buy/sell)
- [x] Tela de historico (`GET /api/transactions`) com refresh manual
- [x] **Dia 3 — Fase 1:** lista de historico com `FlatList`; cores distintas compra (verde) / venda (vermelho)
- [x] Formatacao de valores com `Intl.NumberFormat` e datas com `date-fns` (locale `pt-BR`) em `mobile/src/utils/format.ts`
- [x] Estados de carregamento: spinner + esqueletos; lista vazia com **Nenhuma transação encontrada.**
- [x] `ScrollView` com `nestedScrollEnabled` para scroll com lista aninhada

Documentacao focada no backend (mesma visao de rotas): [`backend/README.md`](backend/README.md).

## Rotas principais da API (trading)

Todas abaixo usam prefixo `/api` e, exceto registro/login, exigem `Authorization: Bearer <token>` (Sanctum).

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/register` | Registro de usuario |
| POST | `/login` | Login e emissao de token |
| GET | `/me` | Dados do usuario autenticado |
| GET | `/wallet` | Saldos BRL e BTC |
| GET | `/market/btc` | Cotacao fake (cache/Redis) |
| POST | `/trade/buy` | Compra de BTC |
| POST | `/trade/sell` | Venda de BTC |
| GET | `/transactions` | Historico de operacoes do usuario |

O app em `mobile/` consome estes endpoints. Detalhes de decisao e UX do historico (iteracao 16): `technical_notes.md` (ficheiro local, gitignored, se o mantiveres na pasta do projeto).

## Como executar o backend

Prerequisitos:

- Docker Desktop

Passos:

1. Criar projeto (somente no inicio):

```bash
curl -s "https://laravel.build/crypto-exchange" | bash
```

2. Entrar no backend e subir containers:

```bash
cd backend
./vendor/bin/sail up -d
```

Alternativa direta com Docker Compose:

```bash
docker compose up -d
```

3. Instalar scaffold de API (se ainda nao tiver feito):

```bash
./vendor/bin/sail artisan install:api
```

Aplicar migrations:

```bash
./vendor/bin/sail artisan migrate
```

Alternativa com Docker Compose:

```bash
docker compose exec laravel.test php artisan migrate
```

4. Consultar rotas:

```bash
./vendor/bin/sail artisan route:list
```

5. Gerar documentacao OpenAPI:

```bash
./vendor/bin/sail artisan l5-swagger:generate
```

### Observacao importante sobre Sail

Os comandos do Sail devem ser executados com o diretorio atual em `backend`, porque o arquivo `compose.yaml` esta la.

Se executar a partir da raiz com `./backend/vendor/bin/sail ...`, pode ocorrer o erro:

`no configuration file provided: not found`

Opcoes seguras:

```bash
cd backend
./vendor/bin/sail up -d
./vendor/bin/sail test
```

ou

```bash
(cd backend && ./vendor/bin/sail up -d && ./vendor/bin/sail test)
```

## Estrutura inicial

```text
crypto-exchange/
  backend/               # API Laravel (+ README com rotas e execucao)
  mobile/                # App React Native (Expo)
  README.md              # Documento principal do projeto
```

## Acesso a documentacao da API

- Swagger UI: `http://localhost/api/documentation`
- Scalar UI: `http://localhost/scalar`
- OpenAPI JSON (canonico): `http://localhost/docs`

## Scripts utilitarios

Na raiz do projeto:

```bash
./scripts/dev.sh      # sobe backend e inicia mobile (monorepo)
./scripts/up.sh       # sobe servicos e gera OpenAPI
./scripts/down.sh     # derruba servicos
./scripts/rebuild.sh  # rebuild completo + migrate + OpenAPI
./scripts/docs.sh     # regenera somente OpenAPI
```

Se o Swagger/Scalar mostrar erro de spec nao encontrado, rode:

```bash
./scripts/docs.sh
```

Esse script limpa caches seguros (`config`, `route`, `view`) e regenera a documentacao OpenAPI.


### Executar testes

```bash
cd backend
./vendor/bin/sail test
```

## Executar app mobile

O app usa [NativeWind](https://www.nativewind.dev/) (Tailwind no React Native). Arquivos principais: `mobile/tailwind.config.js`, `mobile/global.css`, `mobile/babel.config.js`, `mobile/metro.config.js`.

Na primeira vez apos instalar dependencias ou mudar config do Tailwind/Metro, limpe o cache do bundler:

```bash
cd mobile
npx expo start -c
```

Fluxo normal:

```bash
cd mobile
npm start
```

Comando unico na raiz (backend + mobile):

```bash
./scripts/dev.sh
```

## Configuracao da API no mobile (Axios)

O app mobile usa um cliente Axios central em `mobile/src/services/api.ts`.

- URL via ambiente: `EXPO_PUBLIC_API_URL`
- Fallback padrao:
  - Android emulator: `http://10.0.2.2/api`
  - iOS simulator/Web: `http://127.0.0.1/api`

Para dispositivo fisico, configure o IP da sua maquina:

```bash
cd mobile
cp .env.example .env
# ajuste EXPO_PUBLIC_API_URL para o IP local, exemplo:
# EXPO_PUBLIC_API_URL=http://192.168.0.10/api
```

Atalhos uteis no Expo:

- `a` para Android
- `i` para iOS
- `w` para Web

## Troubleshooting (mobile)

### Erro: Unable to resolve "@react-native-async-storage/async-storage"

Causa comum:

- dependencia nao instalada dentro de `mobile/`.

Correcao:

```bash
npm install @react-native-async-storage/async-storage --prefix ./mobile
```

### Erro: Rendered more hooks than during the previous render

Causa comum:

- algum hook (ex.: `useMemo`) sendo declarado depois de um `return` condicional.

Correcao:

- manter todos os hooks no topo do componente, antes de qualquer `if (...) return ...`.

Se o erro persistir por cache do Metro:

```bash
cd mobile
npx expo start -c
```


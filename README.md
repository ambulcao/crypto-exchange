# Crypto Exchange

Plataforma de trading (mini Binance) com backend em Laravel e aplicativo mobile em React Native.

## Documentacao por area

| Area | README | Conteudo principal |
|------|--------|-------------------|
| **Raiz** (este arquivo) | `README.md` | Objetivo do teste, stack resumida, **status consolidado** (backend + mobile), scripts, fluxo full-stack |
| **Backend** | [`backend/README.md`](backend/README.md) | Versoes PHP/Laravel/Sanctum, **status Fases 1–3**, tabela de rotas `/api`, Sail, testes, OpenAPI |
| **Frontend (mobile)** | [`mobile/README.md`](mobile/README.md) | Versoes Expo/RN/NativeWind, **status Fase 4 / Dia 3**, Expo, Axios, troubleshooting |

O bloco **Objetivo do teste tecnico** (abaixo) e intencionalmente **so na raiz** — nao repete-se em `backend/README.md` nem em `mobile/README.md`.

## Objetivo do teste tecnico

Entregar uma aplicacao simples de compra e venda de BTC com:

- autenticacao de usuario;
- carteira com saldo em BRL e BTC;
- preco fake dinamico do mercado;
- operacoes de compra e venda;
- historico de transacoes;
- documentacao clara e testes automatizados.

## Stack do projeto (versoes)

Resumo alinhado a `backend/composer.json` e `mobile/package.json`. Detalhes e comandos por pacote nos READMEs linkados acima.

| Camada | Tecnologias principais |
|--------|------------------------|
| **Backend** | PHP ^8.3, Laravel ^13, Sanctum ^4, Sail ^1.58, MySQL, Redis, PHPUnit ^12.5, L5-Swagger ^11 |
| **Mobile** | Expo SDK ~54, React 19.1, React Native 0.81, TypeScript ~5.9, NativeWind ^4, Tailwind ^3.4, Axios ^1.16, date-fns ^4.1 |
| **Testes (API)** | PHPUnit (Feature e Unit) |

## Status de implementacao

Checklist **consolidado** (tudo o que foi entregue). O detalhe por area:

- **Backend (Fases 1–3):** [backend/README.md — Status de implementacao (backend)](backend/README.md#status-de-implementacao-backend)
- **Mobile (Fase 4 + Dia 3):** [mobile/README.md — Status de implementacao (mobile)](mobile/README.md#status-de-implementacao-mobile)

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

## API REST (trading)

Rotas com prefixo `/api`, Sanctum (exceto `register` / `login`). **Tabela completa e descricao:** [backend/README.md — Rotas principais da API](backend/README.md#rotas-principais-da-api-trading).

O app em `mobile/` consome estes endpoints. Notas de entrevista / UX (ex.: iteracao 16): `technical_notes.md` (local; pode estar gitignored).

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
  backend/               # API Laravel (+ README so backend)
  mobile/                # App Expo (+ README so frontend)
  README.md              # Visao geral e checklist consolidado
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

Instrucoes completas (Expo, NativeWind, Axios, cache `-c`, troubleshooting): [**mobile/README.md**](mobile/README.md).

Comando unico na raiz (backend + mobile):

```bash
./scripts/dev.sh
```


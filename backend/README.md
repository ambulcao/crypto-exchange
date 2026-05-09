# Backend — Crypto Exchange

API Laravel do monorepo. O **objetivo do teste tecnico** e a visao geral do produto estao apenas no [`README.md` da raiz](../README.md) (nao duplicamos esse bloco aqui).

## Stack (versoes)

Valores alinhados ao `composer.json` do projeto.

| Tecnologia | Versao / notas |
|------------|----------------|
| PHP | ^8.3 |
| Laravel Framework | ^13.0 |
| Laravel Sanctum | ^4.0 (API token) |
| Laravel Sail | ^1.58 (Docker Compose) |
| PHPUnit | ^12.5 (`require-dev`) |
| L5-Swagger | ^11.0 (OpenAPI) |
| MySQL / Redis | Servicos definidos no `compose.yaml` do Sail |

Testes: Feature e Unit em `backend/tests/`.

## Status de implementacao (backend)

### Fase 1 — Execucao inicial

- [x] Projeto Laravel com Sail e ambiente Docker
- [x] Containers `laravel.test`, `mysql`, `redis`, `mailpit`
- [x] API scaffolding (`php artisan install:api`)

### Fase 2 — Autenticacao

- [x] `POST /api/register`, `POST /api/login`, `GET /api/me`
- [x] Aceite de termos (`accepted_terms`, `accepted_terms_at`)

### Fase 3 — Wallet, mercado e trade

- [x] `GET /api/wallet`, `GET /api/market/btc`, `POST /api/trade/buy`, `POST /api/trade/sell`, `GET /api/transactions`
- [x] Migrations `wallets` e `transactions` com `decimal(16,8)`
- [x] Compra/venda com transacao atomica e `lockForUpdate` na carteira

Integracao com o app: [`mobile/README.md`](../mobile/README.md).

## Escopo funcional (API)

- Autenticacao com Sanctum
- Carteira (BRL/BTC), cotacao fake de BTC com cache em **Redis**
- Operacoes de compra e venda com integridade transacional
- Historico persistido em `transactions`
- Documentacao OpenAPI (Swagger UI + Scalar)

## Rotas principais da API (trading)

Todas abaixo usam prefixo `/api`. Exceto registro e login, exigem cabecalho `Authorization: Bearer <token>` (Sanctum).

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

## Executar localmente

```bash
cd backend
./vendor/bin/sail up -d
./vendor/bin/sail artisan route:list
```

## Rodar testes

```bash
cd backend
./vendor/bin/sail test
```

## Documentacao da API

Gerar ou atualizar o OpenAPI:

```bash
cd backend
./vendor/bin/sail artisan l5-swagger:generate
```

Interfaces (com stack a correr):

- Swagger UI: `http://localhost/api/documentation`
- Scalar UI: `http://localhost/scalar`
- OpenAPI JSON: `http://localhost/docs`

## Documentacao no monorepo

- Visao geral e checklist completo (backend + mobile): [`README.md`](../README.md)
- App mobile (Expo): [`mobile/README.md`](../mobile/README.md)

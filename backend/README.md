# Backend - Crypto Exchange

API Laravel para o teste tecnico de plataforma de trading.

## Escopo atual

- Base Laravel criada com Sail
- API scaffold instalada (`install:api`)
- Sanctum configurado no `User`
- Testes iniciais de bootstrap/API protegida
- Dominio de trading: wallet, mercado (preco BTC em cache/Redis), compra/venda atomica e historico persistido

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

O app mobile (Expo) em `../mobile` consome estes endpoints. Na **Fase 1 do Dia 3** o historico foi refinado no cliente: `FlatList`, cores por tipo (`buy`/`sell`), formatacao de valores com `Intl.NumberFormat` e datas com `date-fns` (locale `pt-BR`), estados de carregamento com esqueleto e mensagem **Nenhuma transação encontrada.** Detalhes de UX e decisoes: `technical_notes.md` (iteracao 16). A mesma tabela de rotas esta no `README.md` da raiz do repositorio.

## Executar localmente

```bash
./vendor/bin/sail up -d
./vendor/bin/sail artisan route:list
```

## Rodar testes

```bash
./vendor/bin/sail test
```

## Documentacao da API

Gerar/atualizar OpenAPI:

```bash
./vendor/bin/sail artisan l5-swagger:generate
```

Acessar interfaces:

- Swagger UI: `http://localhost/api/documentation`
- Scalar UI: `http://localhost/scalar`
- OpenAPI JSON (canonico): `http://localhost/docs`

## Documentacao principal

A documentacao completa do projeto, fases e plano de testes esta no `README.md` da raiz do repositorio.

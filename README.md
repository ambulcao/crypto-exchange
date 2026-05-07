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
- Mobile: React Native (Expo) - em desenvolvimento
- Testes: PHPUnit (Feature e Unit)

## Status de implementacao

### Fase 1 - Execucao inicial

- [x] Projeto criado via `laravel.build`
- [x] Ambiente Docker/Sail configurado
- [x] Containers `laravel.test`, `mysql`, `redis` e `mailpit`
- [x] API scaffolding instalado com `php artisan install:api`

### Fase 2 - Autenticacao

- [ ] Registro de usuario
- [ ] Login com email e senha
- [ ] Endpoint protegido `GET /api/me`

### Fase 3 - Wallet, mercado e trade

- [ ] `GET /api/wallet`
- [ ] `GET /api/market/btc`
- [ ] `POST /api/trade/buy`
- [ ] `POST /api/trade/sell`
- [ ] `GET /api/transactions`

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

3. Instalar scaffold de API (se ainda nao tiver feito):

```bash
./vendor/bin/sail artisan install:api
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
  backend/               # API Laravel
  README.md              # Documento principal do projeto
```

## Acesso a documentacao da API

- Swagger UI: `http://localhost/api/documentation`
- Scalar UI: `http://localhost/scalar`
- OpenAPI JSON (canonico): `http://localhost/docs`

## Scripts utilitarios

Na raiz do projeto:

```bash
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

## Diretrizes tecnicas

- Usar `decimal` no banco para valores monetarios e BTC; nunca `float`.
- Operacoes de compra/venda devem usar `DB::transaction()`.
- Proteger saldo contra concorrencia com lock (`lockForUpdate` ou lock atomico).
- Organizar regras de negocio em Services para manter Controllers enxutos.

## Estrategia de testes

Objetivo: validar primeiro o comportamento critico de negocio antes da interface.

### Cobertura inicial (Fase 1)

- health check da aplicacao (`GET /`)
- acesso nao autenticado ao endpoint protegido padrao (`GET /api/user`)

### Cobertura planejada (proximas fases)

- autenticacao: registro, login, token invalido, endpoint `me`
- wallet: saldo inicial no primeiro acesso
- trade buy/sell: validacoes de saldo, conversao, atualizacao atomica
- transacoes: persistencia e ordenacao por data
- concorrencia: evitar double spending em requisicoes simultaneas

### Executar testes

```bash
cd backend
./vendor/bin/sail test
```

## Criterios de avaliacao do teste

- Backend: 40%
- Regras de negocio: 25%
- Mobile: 20%
- Codigo e organizacao: 10%
- Extras: 5%

## Diferenciais planejados

- Cache de preco de mercado com Redis
- Testes automatizados de regras de negocio
- Controle de concorrencia em trade
- Ambiente reproduzivel com Docker

## Protocolo pre-commit

Antes de cada commit, executar obrigatoriamente:

1. Atualizar o `README.md` com o estado real da implementacao.
2. Atualizar `technical_notes.md` com decisoes tecnicas, motivacoes e trade-offs da iteracao.
3. Atualizar `pre_commit.md` com checklist e status da iteracao.
4. Rodar testes relevantes do backend.
5. Garantir que os exemplos de request/response estejam coerentes com as rotas reais.

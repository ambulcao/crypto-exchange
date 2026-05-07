# Backend - Crypto Exchange

API Laravel para o teste tecnico de plataforma de trading.

## Escopo atual

- Base Laravel criada com Sail
- API scaffold instalada (`install:api`)
- Sanctum configurado no `User`
- Testes iniciais de bootstrap/API protegida

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

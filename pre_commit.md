# Checklist pre-commit — Crypto Exchange

Sugestao de verificacoes antes de `git commit` / abrir PR. Ajuste ao fluxo da sua equipa.

## Geral (monorepo)

- Mensagem de commit em **frases completas** e alinhada ao que o diff realmente altera (backend, mobile ou ambos).
- Se alterou **migrations** no backend: indicar se exige `sail artisan migrate` em ambientes existentes.
- Se alterou **dependencias** (`package.json` / `composer.json`): `npm install` / `composer install` ja foram corridos e lockfiles actualizados.

## Backend (`backend/`)

- `./vendor/bin/sail test` (ou `php artisan test` no ambiente local) sem falhas relevantes.
- Formatacao / estilo: opcionalmente `./vendor/bin/sail pint` se o projecto usar Pint de forma consistente.
- Rotas novas ou alteradas: actualizar OpenAPI se usarem atributos Swagger e regenerar se o fluxo do projecto o exigir (`l5-swagger:generate`).

## Mobile (`mobile/`)

- **`npx tsc --noEmit`** na pasta `mobile/` sem erros de TypeScript.
- Apos mudancas em **Metro**, **Babel**, **NativeWind** ou **Expo Router**: `npx expo start -c` uma vez localmente para validar bundling.
- **Expo Router:** novos ecras em `app/` com `_layout.tsx` coerente; `main` no `package.json` deve permanecer **`expo-router/entry`**.
- Variaveis `EXPO_PUBLIC_*`: documentar em `.env.example` se adicionar novas.

## Documentacao

- Se a mudanca for visivel para quem instala o projecto: actualizar [`README.md`](README.md) da raiz e, se aplicavel, [`mobile/README.md`](mobile/README.md) ou [`backend/README.md`](backend/README.md).
- Decisoes de arquitectura ou migracoes (como rotas): [`technical_notes.md`](technical_notes.md).

## CI

- Se o repositorio tiver **GitHub Actions** (ex.: workflow Laravel), confirmar que alteracoes em `composer.lock`, PHP ou caminhos (`backend/` como `working-directory`) continuam coerentes.

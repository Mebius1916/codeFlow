# Backend

NestJS backend for Figma conversion.

## Structure

- `src/main.ts`: application entry
- `src/appModule.ts`: root Nest module
- `src/config`: environment and runtime config
- `src/figma`: Figma conversion module

## Run

1. Copy `.env.example` to `.env` (optional: only `PORT` is required)
2. Start with:

```bash
pnpm --filter @codify/backend dev
```

# Backend

NestJS backend for Figma conversion.

## Structure

- `src/main.ts`: application entry
- `src/appModule.ts`: root Nest module
- `src/config`: environment and runtime config
- `src/storage`: shared object storage service
- `src/figma`: Figma conversion module

## Run

1. Copy `.env.example` to `.env`
2. Fill in `S3_*`
3. Start with:

```bash
pnpm --filter @codify/backend dev
```

# Agent Instructions

## Commands
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Test (All)**: `npm test -- --watch=false`
- **Test (Single)**: `npm test -- --include src/app/path/to/file.spec.ts --watch=false` (or use `fdescribe`/`fit` in code)

## Code Style & Conventions
- **Framework**: Ionic 8+ / Angular. Follow the official Angular Style Guide.
- **Naming**: `kebab-case` for files/selectors, `PascalCase` for classes, `camelCase` for members.
- **Structure**: Place spec files next to their source files (e.g., `component.ts` and `component.spec.ts`).
- **Async**: Heavy use of RxJS. Prefer `AsyncPipe` in templates over manual subscriptions.
- **Types**: Strict TypeScript. Explicitly define interfaces/types; avoid `any`.
- **Imports**: Angular/Ionic libraries first, then third-party, then local application code.
- **Formatting**: Respect `.editorconfig`. Ensure linting passes before committing.

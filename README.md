# KDP Orbit

KDP Orbit is a publishing intelligence dashboard for Amazon KDP authors and publishers.

## Architecture principles

- Prefer small, typed utilities over one-off logic.
- Keep business rules in service or validation layers instead of UI components.
- Centralize errors and environment configuration.
- Use the simplest architecture that scales: typed modules, small components, and explicit contracts.

## Key folders

- `src/components` — UI views and feature modules
- `src/config` — environment and branding configuration
- `src/context` — shared React state providers
- `src/lib` — validation and error utilities
- `src/services` — feature-specific service integrations

## Validation and tests

Run the test suite with:

```bash
npm test
```

## Build

```bash
npm run build
```

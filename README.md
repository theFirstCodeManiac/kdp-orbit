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

## Gmail SMTP

Copy `.env.example` to `.env` and set `SMTP_PASS` to a Gmail App Password for
the account in `SMTP_USER`. Do not use the normal Gmail password or commit the
`.env` file. Gmail SMTP uses `smtp.gmail.com` on port `465` with TLS by default.

After configuring the variables, start the server with `npm run dev` and create
an account to verify that the confirmation email arrives.

## Build

```bash
npm run build
```

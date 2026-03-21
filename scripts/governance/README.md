# Governance Scripts

## Scope

Phase 06 initial governance scope is intentionally limited to:

- `app`
- `components`
- `store`
- `utils`
- `hooks`
- `services`
- `lib`

Deferred from this first baseline: `ios`, `android`, and docs directories.

## One-command Entry

Run the governance pipeline through:

```bash
npm run verify:governance
```

Run a no-side-effect dry run:

```bash
npm run verify:governance -- --dry-run
```

## Fixed Stage Order

The script runs in this exact order:

1. `knip`
2. `dependency-cruiser`
3. `eslint-plugin-boundaries`

This order is fixed to keep local and CI output stable and reproducible.

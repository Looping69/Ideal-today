---
description: Production Readiness Audit & Deep Rating
---

This workflow performs a comprehensive audit of the codebase to determine its production readiness.

1. **Build Check**: Verification that `npm run build` succeeds (TSC + Vite).
2. **Lint Analysis**: Checks for `eslint` errors.
3. **Type Safety**: Scans for `any` usage and `tsc` strictness.
4. **Security Audit**:
    - Environment variable exposure (Safe `envPrefix`).
    - Secrets in code.
    - Sensitive data handling (Storage buckets).
5. **Code Quality**:
    - Console logs.
    - Architecture (Migrations vs Code).
    - Unused files/exports.
6. **Performance**: Bundle size analysis.

How to run:
Simply invoke `/prod` and the agent will perform these checks and provide a scored report.

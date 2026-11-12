# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] — 2026-11-12

Fixes the first run: a fresh checkout now loads in a browser.

### Fixed

- **The site no longer redirects away when no identity provider is set up.**
  The Keycloak client initialised with `check-sso` and the login iframe
  disabled, so it looked for an existing SSO session by redirecting the whole
  browser to the authorization endpoint. Against the shipped placeholder
  issuer — `auth.example.com`, under the reserved `example.com` — that
  redirect landed on a DNS error page and the app never painted, which is the
  opposite of the anonymous mode the README promises. An issuer under the
  reserved `example.com` now means "no identity provider": the app mounts
  straight away, and the sign-in control is hidden because there is nothing
  to sign in to.

## [1.0.0] — 2026-11-11

The first public release.

### Added

- **A read API over a published schema.** `docs/SCHEMA.sql` is the contract:
  15 tables and 2 views covering the news feed, the flash newswire, the market
  quote strip, sector heat, crypto, the economic calendar, trending keywords
  and the individual-stock hot list. The FastAPI service serves it under
  `/api/v1` and never writes to it.
- **A React 19 front end.** A bilingual (Chinese-first) interface with a
  responsive home grid, category boards, article pages, search, a scrolling
  quote ticker, a 7×24 flash feed and a dark/light theme.
- **A self-contained Docker Compose stack.** `docker compose up` brings up
  PostgreSQL 17, applies the schema contract, loads synthetic demo data and
  serves the site on <http://localhost:8080>. A dev variant adds hot reload.
- **A synthetic demo dataset.** `docs/samples/demo_data.sql` fills every panel
  with plausible, entirely invented content, so a fresh checkout has something
  to show without a data collector.
- **A schema-drift guard.** `backend/caijing/schema_check.py` compares the
  read-only ORM mirror against the live database and reports any column that
  has gone missing, as a loud failure instead of a runtime 500. An offline
  guard runs against a committed snapshot in CI.
- **CI with four gates.** Backend lint, syntax and tests; a schema job that
  applies the contract to a real PostgreSQL and checks the mirror against it;
  a frontend lint, type-check, test and build job; and a Docker build gate.

### Security

- Bumped `axios` from 1.14.0 to 1.21.1. Versions up to 1.19.0 are affected by
  three high-severity advisories — prototype-pollution gadgets that can leak
  credentials or hijack responses. The front end uses `axios.create()`,
  `axios.get()` and one request interceptor, all stable across 1.x.
- Added `npm audit --audit-level=high` to CI. Moderate findings in build-time
  lint tooling are tolerated deliberately; high and critical ones are not.

### Notes

- The upstream data collector is a separate component and is not part of this
  repository. See [docs/data-sources.md](docs/data-sources.md).
- Authentication is optional. Browsing is public; sign-in is delegated to
  your own OpenID Connect provider.

[Unreleased]: https://github.com/whereq/CaiJing-Today/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/whereq/CaiJing-Today/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/whereq/CaiJing-Today/releases/tag/v1.0.0

# Security Policy

## Supported versions

This project is released as a source tree, not as a versioned package. The
`main` branch is the supported version. Tagged releases are point-in-time
snapshots and receive fixes only when the fix is backported.

| Version | Supported |
|---|---|
| `main` | ✅ |
| Latest tag | ✅ |
| Older tags | ❌ |

## Reporting a vulnerability

Please **do not open a public issue** for a security problem.

Report it privately through GitHub's "Report a vulnerability" button on the
Security tab of the repository. That opens a private advisory visible only to
the maintainers.

Please include:

- what the problem is, and which component is affected (`backend/`,
  `frontend/`, `docker/`);
- how to reproduce it — a request, a command, a sequence of steps;
- the impact you believe it has;
- any suggested fix, if you have one.

You can expect an acknowledgement within a few days. If the report is
confirmed, a fix will be prepared and released, and you will be credited in
the release notes unless you prefer otherwise.

## Scope

**In scope**

- The API and the web UI in this repository.
- The Docker images built from `backend/Dockerfile` and
  `docker/frontend/Dockerfile`.
- The database setup scripts — `docs/SCHEMA.sql`,
  `docs/samples/demo_data.sql` and `docker/db/init/10-load-demo.sh`.
- Anything shipped in a release tarball or Docker image.

**Out of scope**

- Vulnerabilities in third-party dependencies that have no fix upstream. Report
  those upstream — see [NOTICE](NOTICE) for the dependency list. If you
  believe a pinned version in this repository is the problem, tell us and we
  will look at bumping it.
- The data collector. It is a separate component and is not part of this
  repository.
- Findings that require an attacker to already control your database, your
  identity provider, or your host.
- Missing security headers on a deployment you are running behind your own
  reverse proxy or CDN. The shipped nginx configuration is a development-grade
  default, not a hardened public edge.

## Deploying this application

CaiJing Today is a reader: it serves the database you give it and never writes
to it. Two things are worth knowing before you put it on a network.

**Authentication is optional by design.** News browsing is public, so the API
and the UI both work with no identity provider configured. If you turn on
sign-in, the backend verifies bearer tokens against
`<KEYCLOAK_URL>/realms/<KEYCLOAK_REALM>` and reads roles from the token — the
realm, the client id and the `azp` claim must all line up, and the JWKS
endpoint must be reachable.

**The shipped credentials are development credentials.** `docker/.env.example`
sets `POSTGRES_PASSWORD=caijing`. Change it before you expose the stack.

The compose stack does not publish PostgreSQL on a host port — the API reaches
it over the compose network, and the database stays off the network. If you
add a `ports:` entry for it, bind it to `127.0.0.1` rather than `0.0.0.0`.

The demo dataset is entirely synthetic, so running it exposes nothing real.
Connecting your own collector changes that — the content in your database
becomes your responsibility.

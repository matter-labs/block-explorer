Applies to application code in packages/api, packages/worker, packages/data-fetcher, and packages/app,
including configuration, migrations, and tests affecting those components. CI and deployment changes have separate
guidance in security-review-focus-ci.md.

# ZKsync Block Explorer Threat Model

## System and protected assets

- `packages/worker` and `packages/data-fetcher` ingest chain RPC data into PostgreSQL. `packages/api` exposes a NestJS
  REST API, and `packages/app` renders the explorer in the browser.
- Public mode intentionally exposes public chain data. That does not make session tokens, service credentials,
  operator secrets, or internal infrastructure public.
- Prividium mode (`PRIVIDIUM=true`) serves permissioned chain data. The API is part of the chain's confidentiality
  boundary: every response must respect the authenticated caller's entitlements.
- Protect private transactions, logs, balances, contract details, and aggregates; session integrity; indexed entity
  attribution; API and indexer availability; and users' browser sessions.

## Actors and trust boundaries

- Untrusted callers control HTTP paths, methods, headers, cookies, bodies, queries, addresses, hashes, pagination,
  filters, and session or API credential material.
- Contract authors and transaction senders control chain-sourced bytecode, logs, calldata, token metadata, and verified
  source content. This remains untrusted even when a permitted Prividium user authored it.
- The operator's RPC node is trusted for availability and protocol correctness. User-authored content returned by it
  remains attacker-controlled. The database is trusted infrastructure; request-derived queries must be injection-safe.
- In Prividium mode, the configured permissions service is the authority on identity and entitlements. The explorer
  must authenticate requests correctly and apply that authority's answer to each read.
- Operators are assumed to configure documented production settings correctly. Development fixtures do not establish
  that real credentials, production defaults, or deployable configurations are safe.

## Review invariants

1. Prividium routes must establish the intended user or machine identity before returning protected data. Check
   alternate paths, casing, normalization, methods, API prefixes, Swagger access, and the RPC proxy as well as controllers.
   Permissions-service errors or unavailable identity data must not widen access.
2. Every query must retain the caller's entitlement scope, including joins, filters, searches, counts, pagination,
   aggregates, exports, and error paths. Only documented full-read permissions may bypass entity-level restrictions.
   Caches must preserve the same visibility boundary across callers and public versus Prividium modes.
3. Session validation must preserve expiry, the accepted account or explorer audience, and wallet ownership. A wallet
   switch must not grant another user's identity or scope. Check cookie flags, origin checks, logout, and credential
   forwarding; browser restrictions do not replace server authorization.
4. Request-derived addresses, hashes, ranges, and filters must produce bounded, parameterized database queries.
   Unauthenticated inputs must not trigger unbounded scans or bypass limits through alternate routes or encodings.
5. Ingestion must not let attacker-authored logs, metadata, or bytecode overwrite or impersonate another entity.
   Malformed content must not stall indexing indefinitely or corrupt the attribution used by downstream queries.
6. Browser rendering must treat chain and API content as data. Check token names, symbols, metadata, verified source,
   decoded calldata, links, and URL state for script injection or attacker-controlled navigation with security impact.
7. Tests and mocks are useful evidence for these invariants. A change that weakens a security regression check matters;
   missing coverage or style alone does not establish a vulnerability.

## Impact and reporting

Use the shared engine's HIGH, MEDIUM, and LOW severity labels, with concrete reachability and impact evidence.

- Highest-impact findings include unauthorized access to Prividium chain data, SQL injection, remote code execution,
  session forgery or identity confusion, cross-site scripting in either mode, and cross-entity ingestion corruption.
- Consider existence oracles, count and pagination leaks, API-introduced timing differences, crafted-input indexer
  failures, and request-driven resource exhaustion. Sustained service-wide unavailability has greater impact than an
  isolated expensive request.
- State the affected mode, attacker, required permissions, configuration, and the data or action exposed. Cite the
  changed line and trace the request or ingested input through to the effect.
- Public visibility of public chain data is expected behavior. Non-secret configuration disclosure, hardening-only
  suggestions, documented operator misconfiguration, dependency versions without a reachable impact, and style-only
  observations are not findings by themselves.
- Rate limiting or caching implemented outside this repository is not assumed absent. Review controls this repository
  owns and identify any external assumption needed for the claimed impact.

Review comments and artifacts in this public repository are publicly accessible. Vulnerabilities requiring private
coordination follow the repository's SECURITY.md policy; this automated workflow is not a private reporting channel.

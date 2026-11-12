import Keycloak from 'keycloak-js'
import { oidcClientId, oidcConfigured, oidcIssuer, oidcRealm } from './config'

// Constructing the client is harmless — it does nothing until init() is
// called. The issuer falls back to a reserved, unresolvable host so the
// client never holds "undefined" in a URL.
const keycloak = new Keycloak({
  url: oidcIssuer || 'https://auth.invalid',
  realm: oidcRealm,
  clientId: oidcClientId,
})

export default keycloak
export { oidcConfigured }

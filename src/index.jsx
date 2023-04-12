import auth0 from 'auth0-js'
import { createContext, useContext, createSignal, splitProps } from 'solid-js'
import { isServer } from 'solid-js/web'
import { redirect } from 'solid-start/server'
import { storage } from './session.js'
import refresh from './lib/refresh.js'
import * as jose from 'jose'

export const Auth0Context = createContext()
export const useAuth0 = () => useContext(Auth0Context)

export function Auth0(props) {
  const [auth0config] = splitProps(props, [
    'domain',
    'clientId',
    'audience',
    'redirectUri',
    'logoutUrl',
    'organization',
    'invitation'
  ])
  const cookies = !isServer ? document.cookie : null

  const [isAuthenticated, setIsAuthenticated] = createSignal(undefined)
  const [user, setUser] = createSignal()
  const [accessToken, setAccessToken] = createSignal()
  const [idToken, setIdToken] = createSignal()
  const [userId, setUserId] = createSignal()
  const [organization, setOrganization] = createSignal()

  const scopes = ['openid', 'profile']
  if (import.meta.env.VITE_AUTH0_OFFLINE_ACCESS === 'true') {
    scopes.push('offline_access')
  }

  const webAuthnConfig = {
    _sendTelemetry: false,
    domain: auth0config.domain,
    clientID: auth0config.clientId,
    audience: auth0config.audience,
    redirectUri: auth0config.redirectUri,
    logoutUrl:
      auth0config.logoutUrl || `${import.meta.env.VITE_BASE_URL}/auth/logout`,
    responseType: 'code'
  }

  if (auth0config.organization) {
    setOrganization(auth0config.organization)
    webAuthnConfig.organization = auth0config.organization.id
  }

  const webAuthn = new auth0.WebAuth(webAuthnConfig)

  return (
    <Auth0Context.Provider
      value={{
        auth0Client: webAuthn,
        isAuthenticated: () => !!isAuthenticated(),
        isInitialized: () => isAuthenticated() !== undefined,
        organization,
        setInvitation: (invitation, org, orgName) => {
          webAuthn.baseOptions.invitation = invitation
          webAuthn.baseOptions.organization = org
          webAuthn.baseOptions.ogranization_name = orgName
        },
        user,
        userId,
        idToken,
        accessToken,
        async authorize() {
          await webAuthn.authorize({ scope: scopes.join(' ') })
        },
        async login() {
          const session = await storage.getSession(cookies)
          if (process.env.DEBUG) {
            console.log('Session:')
            console.log(session)
          }
          if (session.has('userId') && session.has('accessToken')) {
            const jwt = session.get('accessToken')
            const JWKS = jose.createRemoteJWKSet(
              new URL(`https://${auth0config.domain}/.well-known/jwks.json`)
            )
            try {
              // Throws if the token is invalid
              await jose.jwtVerify(jwt, JWKS, {
                issuer: `https://${auth0config.domain}/`,
                audience: auth0config.audience
              })
              setAccessToken(session.get('accessToken'))
              setIdToken(session.get('idToken'))
              setUserId(session.get('userId'))
              setUser(session.get('userInfo'))
              setIsAuthenticated(true)
            } catch (err) {
              console.error(err)
              if (err.name === 'JWTExpired' || err.code === 'ERR_JWT_EXPIRED') {
                const refreshToken = session.get('refreshToken')
                if (refreshToken) {
                  const tokens = await refresh(refreshToken)

                  session.set('accessToken', tokens.access_token)
                  session.set('idToken', tokens.id_token)
                  document.cookie = await storage.commitSession(session)

                  setAccessToken(tokens.access_token)
                  setIdToken(tokens.access_token)
                  setIsAuthenticated(true)
                } else {
                  setIsAuthenticated(false)
                }
              } else {
                console.error(err)
                setIsAuthenticated(false)
              }
            }
          } else {
            setIsAuthenticated(false)
          }
        },
        async logout() {
          const logoutUrl = await webAuthn.logout({
            returnTo: auth0config.logoutUrl,
            clientID: auth0config.clientId
          })
          await redirect(logoutUrl)
        }
      }}
    >
      {props.children}
    </Auth0Context.Provider>
  )
}

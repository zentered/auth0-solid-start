import auth0 from 'auth0-js'
import { createContext, useContext, createSignal, splitProps } from 'solid-js'
import { isServer } from 'solid-js/web'
import { redirect } from 'solid-start/server'
import { storage } from './session.js'

export const Auth0Context = createContext()
export const useAuth0 = () => useContext(Auth0Context)

export function Auth0(props) {
  const [auth0config] = splitProps(props, [
    'domain',
    'clientId',
    'audience',
    'redirectUri',
    'organization'
  ])
  const cookies = !isServer ? document.cookie : null

  const [isAuthenticated, setIsAuthenticated] = createSignal(undefined)
  const [user, setUser] = createSignal()
  const [accessToken, setAccessToken] = createSignal()
  const [idToken, setIdToken] = createSignal()
  const [userId, setUserId] = createSignal()
  const [organization, setOrganization] = createSignal()

  const scopes = ['openid', 'profile', 'email']
  if (process.env.VITE_AUTH0_OFFLINE_ACCESS === 'true') {
    scopes.push('offline_access')
  }

  const webAuthnConfig = {
    _sendTelemetry: false,
    domain: auth0config.domain,
    clientID: auth0config.clientId,
    audience: auth0config.audience,
    redirectUri: auth0config.redirectUri,
    scopes: scopes.join(' '),
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
        user,
        userId,
        idToken,
        accessToken,
        async authorize() {
          await webAuthn.authorize()
        },
        async login() {
          const session = await storage.getSession(cookies)
          if (session.has('userId') && session.has('accessToken')) {
            setAccessToken(session.get('accessToken'))
            setIdToken(session.get('idToken'))
            setUserId(session.get('userId'))
            setUser(session.get('userInfo'))
            setIsAuthenticated(true)
          } else {
            setIsAuthenticated(false)
          }
        },
        async logout() {
          const session = await storage.getSession(cookies)
          return redirect('/login', {
            headers: {
              'Set-Cookie': await storage.destroySession(session)
            }
          })
        }
      }}
    >
      {props.children}
    </Auth0Context.Provider>
  )
}

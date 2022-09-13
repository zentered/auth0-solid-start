import auth0 from 'auth0-js'
import { createContext, useContext, createSignal, splitProps } from 'solid-js'

export const Auth0Context = createContext()
export const useAuth0 = () => useContext(Auth0Context)

/**
 *
 * @param {*} props
 * @returns
 */
export function Auth0(props) {
  const [auth0config] = splitProps(props, [
    'domain',
    'clientId',
    'audience',
    'redirectUri',
    'organization'
  ])
  let baseUrl = import.meta.env.VITE_BASE_URL

  const [isAuthenticated, setIsAuthenticated] = createSignal(undefined)
  const [user, setUser] = createSignal()
  const [token, setToken] = createSignal()
  const [userId, setUserId] = createSignal()
  const [organization, setOrganization] = createSignal()

  const webAuthnConfig = {
    _sendTelemetry: false,
    domain: auth0config.domain,
    clientID: auth0config.clientId,
    audience: auth0config.audience,
    redirectUri: auth0config.redirectUri,
    responseType: 'code'
  }

  if (auth0config.organization) {
    setOrganization(auth0config.organization)
    webAuthnConfig.organization = auth0config.organization.id
  }

  if (import.meta.env.DEBUG === 'true') {
    console.log(webAuthnConfig)
    console.log(import.meta.env)
  }

  if (import.meta.env.VITE_AUTH0_MULTI_TENANT_MODE === 'true') {
    baseUrl = import.meta.env.VITE_BASE_URL.replace(
      'https://',
      `https://${auth0config.organization.name}.`
    )
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
        token,
        async authorize() {
          await webAuthn.authorize()
        },
        async login(accessToken) {
          if (!isAuthenticated()) {
            if (accessToken && accessToken !== undefined) {
              const userInfoResponse = await fetch(`${baseUrl}/auth/userinfo`, {
                method: 'POST',
                body: JSON.stringify({ accessToken })
              })
              if (userInfoResponse.status === 200) {
                const userInfo = await userInfoResponse.json()

                setIsAuthenticated(true)
                setToken(accessToken)
                setUser(userInfo)
                setUserId(userInfo.sub)
              }
            } else {
              setIsAuthenticated(false)
            }
          }
        }
      }}
    >
      {props.children}
    </Auth0Context.Provider>
  )
}

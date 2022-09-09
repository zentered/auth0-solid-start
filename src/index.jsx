import auth0 from 'auth0-js'
import { createContext, useContext, createSignal, createMemo } from 'solid-js'

export const Auth0Context = createContext()
export const useAuth0 = () => useContext(Auth0Context)

/**
 *
 * @param {*} props
 * @returns
 */
export function Auth0(props) {
  let organization

  const [isAuthenticated, setIsAuthenticated] = createSignal(undefined)
  const [user, setUser] = createSignal()
  const [token, setToken] = createSignal()
  const [userId, setUserId] = createSignal()
  if (props.organization) {
    organization = createMemo(() => props.organization)
  }

  const webAuthnConfig = {
    _sendTelemetry: false,
    domain: props.domain,
    clientID: props.clientId,
    audience: props.audience,
    redirectUri: props.redirectUri,
    responseType: 'code'
  }

  if (organization) {
    webAuthnConfig.organization = props.organization.id
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
              const userInfoResponse = await fetch(
                `${import.meta.env.VITE_BASE_URL}/auth/userinfo`,
                {
                  method: 'POST',
                  body: JSON.stringify({ accessToken })
                }
              )
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

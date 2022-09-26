import auth0 from 'auth0-js'
import { createContext, useContext, createSignal, splitProps } from 'solid-js'
// import { createServerData$ } from 'solid-start/server'
// import { parseCookie } from 'solid-start/session/cookie'
// import { unsign} from 'solid-start/session/cookieSigning'

export const Auth0Context = createContext()
export const useAuth0 = () => useContext(Auth0Context)

// const sessionSecret = import.meta.env.VITE_SESSION_SECRET
// export function routeData() {
//   return createServerData$(async (_, { request }) => {
//     console.log(request)
//   })
// }

export function Auth0(props) {
  const [auth0config] = splitProps(props, [
    'domain',
    'clientId',
    'audience',
    'redirectUri',
    'organization'
  ])

  const [isAuthenticated, setIsAuthenticated] = createSignal(undefined)
  const [user, setUser] = createSignal()
  const [token, setToken] = createSignal()
  const [userId, setUserId] = createSignal()
  const [baseUrl, setBaseUrl] = createSignal()
  const [organization, setOrganization] = createSignal()

  setBaseUrl(import.meta.env.VITE_BASE_URL)

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

  if (import.meta.env.VITE_DEBUG === 'true') {
    console.log('auth0 baseUrl: ', baseUrl())
    console.log(
      `auth0 multi-tenant-mode: ${import.meta.env.VITE_AUTH0_MULTI_TENANT_MODE}`
    )
    console.log(webAuthnConfig)
  }

  if (import.meta.env.VITE_AUTH0_MULTI_TENANT_MODE === 'true') {
    setBaseUrl(
      import.meta.env.VITE_BASE_URL.replace(
        'https://',
        `https://${auth0config.organization.name}.`
      )
    )
  }

  const webAuthn = new auth0.WebAuth(webAuthnConfig)

  // const cookies = isServer
  //   ? request.headers.get('Cookie')
  //   : document.cookie
  // console.log(cookies)
  // const verified = parseCookie(cookies ?? '')
  // console.log(verified)

  // const accessToken = parseCookie('auth0-solid-session', {
  //   secret: sessionSecret
  // })

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
        async getSession() {
          // console.log(session)
        },
        async login(accessToken) {
          if (!isAuthenticated()) {
            if (accessToken && accessToken !== undefined) {
              console.log(accessToken)
              // const session = await storage.getSession()
              // const userId = session.get('userId')
              // if (userId || typeof userId === 'string') {
              //   return session
              // }
              // const userInfoResponse = await fetch(
              //   `${baseUrl()}/auth/userinfo`,
              //   {
              //     method: 'POST',
              //     body: JSON.stringify({ accessToken })
              //   }
              // )
              // if (userInfoResponse.status === 200) {
              //   const userInfo = await userInfoResponse.json()

              //   setIsAuthenticated(true)
              //   setToken(accessToken)
              //   setUser(userInfo)
              //   setUserId(userInfo.sub)

              //   session.set('userId', userInfo.userId)
              //   session.set('accessToken', accessToken)

              //   await storage.commitSession(session)
              // }
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

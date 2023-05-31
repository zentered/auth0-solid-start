declare module '@zentered/auth0-solid-start/api/callback' {
  import type { APIEvent } from 'solid-start/api'
  export default function (req: APIEvent['request']): void
}

declare module '@zentered/auth0-solid-start/api/logout' {
  import type { APIEvent } from 'solid-start/api'
  export default function (req: APIEvent['request']): void
}

declare module '@zentered/auth0-solid-start/server' {
  import type { ServerFunctionEvent } from 'solid-start/server'
  import type { Session } from 'solid-start/session/sessions'

  export function getSession(event: ServerFunctionEvent): Promise<Session>
}

declare module '@zentered/auth0-solid-start' {
  import { Accessor, JSX } from 'solid-js'
  import type { WebAuth } from 'auth0-js'
  export type { SessionData } from 'solid-start/session/sessions'

  type Organization = { id: string }

  export interface User {
    [name: string]: unknown
  }

  type Auth0Context = {
    auth0Client: WebAuth
    isAuthenticated: () => boolean
    isInitialized: () => boolean
    organization: Accessor<Organization>
    setInvitation: (invitation: string, org: string, orgName: string) => void
    user: Accessor<User>
    userId: Accessor<string>
    idToken: Accessor<string>
    accessToken: Accessor<string>
    authorize: () => Promise<void>
    login: () => Promise<void>
    logout: () => Promise<void>
  }
  export function useAuth0(): Auth0Context

  type Auth0Props = {
    children: JSX.Element
    domain: string
    clientId: string
    audience: string
    redirectUri: string
    logoutUrl: string
    organization?: Organization
  }

  export function Auth0(props: Auth0Props): JSX.Element
}

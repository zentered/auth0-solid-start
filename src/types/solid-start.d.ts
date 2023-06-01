import 'solid-start/session/sessions'

declare module 'solid-start/session/sessions' {
  type UserInfo = {
    sub: string
    nickname: string
    name: string
    picture: string
    updated_at: string
    org_id: string
  }

  /*
    Note: This is the most basic form of SessionData, but sufficient for most of the times. Ideally, we should have built a discriminated union. 
    One type would set the refreshToken as required when the scope is set to offline_access, and another type would ignore that field.
  */
  export interface SessionData {
    accessToken: string
    idToken: string
    refreshToken?: string
    scope: string
    tokenType?: string
    userInfo: UserInfo
    userId: string
    orgId: string
    permissions?: unknown
  }
}

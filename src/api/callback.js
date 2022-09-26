import { createCookieSessionStorage } from 'solid-start/session'

const sessionSecret = process.env.VITE_SESSION_SECRET || 'supersercret123'
const storage = createCookieSessionStorage({
  cookie: {
    name: 'auth0-solid-session',
    // secure doesn't work on localhost for Safari
    // https://web.dev/when-to-use-local-https/
    secure: !!process.env.DEV,
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true
  }
})

async function auth0FetchOAuthToken(code, redirectUrl) {
  const endpoint = new URL(
    `https://${process.env.VITE_AUTH0_DOMAIN}/oauth/token`
  )

  const formData = new URLSearchParams()
  formData.append('grant_type', 'authorization_code')
  formData.append('client_id', process.env.VITE_AUTH0_CLIENT_ID)
  formData.append('client_secret', process.env.AUTH0_CLIENT_SECRET)
  formData.append('code', code)
  formData.append('redirect_uri', redirectUrl)

  const authToken = await fetch(endpoint, {
    method: 'POST',
    body: formData
  })

  return authToken.json()
}

export default async function (request) {
  let baseUrl = process.env.VITE_BASE_URL
  const session = await storage.getSession()
  const headers = new Headers()
  const url = new URL(request.url)
  const params = url.searchParams

  // TODO: security: check response state & cookie state
  // const requestHeaders = new Headers(request.headers)
  // const requestCookies = requestHeaders.get('cookie')

  if (params.get('code') === undefined || params.get('code') === null) {
    return new Response(JSON.stringify({ error: 'missing code' }), {
      status: 500
    })
  }

  let redirectUrl = process.env.VITE_AUTH0_REDIRECT_URI
  if (process.env.VITE_AUTH0_MULTI_TENANT_MODE === 'true') {
    const orgName = url.hostname.split('.')[0]
    redirectUrl = process.env.VITE_AUTH0_REDIRECT_URI.replace('org_id', orgName)
    baseUrl = process.env.VITE_BASE_URL.replace(
      'https://',
      `https://${orgName}.`
    )
  }

  const jsonAuthToken = await auth0FetchOAuthToken(
    params.get('code'),
    redirectUrl
  )

  session.set('accessToken', jsonAuthToken.access_token)
  session.set('idToken', jsonAuthToken.id_token)
  session.set('scope', jsonAuthToken.scope)
  session.set('expiresIn', jsonAuthToken.expires_in)
  session.set('tokenType', jsonAuthToken.token_type)

  headers.append('Content-Type', 'text/html; charset=utf-8')
  headers.append('Set-Cookie', await storage.commitSession(session))

  const body = `<html>
  <head>
    <meta http-equiv="refresh" content="0; url=${baseUrl}" />
  </head>
  <body></body>
</html>`

  return new Response(body, { headers })
}

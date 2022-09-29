import { storage } from '../session.js'

async function auth0UserInfo(accessToken) {
  const endpoint = new URL(`https://${process.env.VITE_AUTH0_DOMAIN}/userinfo`)

  const userInfo = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (userInfo.status !== 200) {
    return undefined
  }

  return userInfo.json()
}

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

export default async function get(request) {
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

  if (process.env.DEBUG === 'true') {
    console.log('auth0FetchOAuthToken')
    console.log(jsonAuthToken)
  }

  const userInfo = await auth0UserInfo(jsonAuthToken.access_token)
  if (process.env.DEBUG === 'true') {
    console.log('auth0UserInfo')
    console.log(userInfo)
  }
  if (userInfo === undefined) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401
    })
  }

  session.set('accessToken', jsonAuthToken.access_token)
  session.set('idToken', jsonAuthToken.id_token)
  session.set('scope', jsonAuthToken.scope)
  session.set('expiresIn', jsonAuthToken.expires_in)
  session.set('tokenType', jsonAuthToken.accessToken_type)
  session.set('userInfo', userInfo)
  session.set('userId', userInfo.sub)

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

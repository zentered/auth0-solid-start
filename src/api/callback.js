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
  console.log(process.env.VITE_AUTH0_MULTI_TENANT_MODE)
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

  const headers = new Headers()
  const expires = new Date(Date.now() + 86400000).toUTCString()
  headers.append('Content-Type', 'text/html; charset=utf-8')
  if (jsonAuthToken?.access_token && jsonAuthToken.access_token !== undefined) {
    // TODO: figure out how to set multiple cookies
    headers.append(
      'Set-Cookie',
      `com.auth0.auth.accessToken=${jsonAuthToken.access_token}; expires=${expires}; Path=/;`
    )
    // headers.append(
    //   'Set-Cookie',
    //   `com.auth0.auth.accessToken=${jsonAuthToken.access_token}; expires=${expires}; Path=/, com.auth0.auth.idToken=${jsonAuthToken.id_token} expires=${expires}; Path=/;`
    // )
  }

  console.log(baseUrl)

  const body = `<html>
  <head>
    <meta http-equiv="refresh" content="0; url=${baseUrl}" />
  </head>
  <body></body>
</html>`

  return new Response(body, { headers })
}

async function auth0UserInfo(accessToken) {
  console.log('requesting userinfo')
  const endpoint = new URL(`https://${process.env.VITE_AUTH0_DOMAIN}/userinfo`)

  const userInfo = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (userInfo.status !== 200) {
    console.error(userInfo)
    return undefined
  }

  return userInfo.json()
}

export async function post({ request }) {
  const body = await request.json()
  const { accessToken } = body

  try {
    const userInfo = await auth0UserInfo(accessToken)
    if (userInfo === undefined) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401
      })
    }
    return new Response(JSON.stringify(userInfo))
  } catch (e) {
    console.warn('fetching userInfo failed', e)
    return new Response(JSON.stringify({ error: 'fetching userInfo failed' }), {
      status: 500
    })
  }
}

export default async function refresh(refreshToken) {
  if (process.env.DEBUG) {
    console.log('refreshToken')
  }
  const endpoint = new URL(
    `https://${process.env.VITE_AUTH0_DOMAIN}/oauth/token`
  )

  const formData = new URLSearchParams()
  formData.append('grant_type', 'refresh_token')
  formData.append('client_id', process.env.VITE_AUTH0_CLIENT_ID)
  formData.append('client_secret', process.env.AUTH0_CLIENT_SECRET)
  formData.append('refresh_token', refreshToken)

  if (process.env.DEBUG) {
    console.log('formData')
    console.log(formData)
  }

  const authToken = await fetch(endpoint, {
    method: 'POST',
    body: formData
  })

  return authToken.json()
}

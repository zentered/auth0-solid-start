import { storage } from '../session.js'

const baseUrl = process.env.VITE_BASE_URL

export default async function get() {
  const headers = new Headers()
  const session = await storage.getSession()
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

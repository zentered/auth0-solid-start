import { redirect } from 'solid-start/server'
import { storage } from '../session.js'

export async function logout(session) {
  return redirect('/login', {
    headers: {
      'Set-Cookie': await storage.destroySession(session)
    }
  })
}

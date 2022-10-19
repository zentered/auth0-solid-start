/**
 * Inspired by https://github.com/solidjs/solid-start/blob/main/examples/durable-objects-websocket/src/session.tsx
 */
import { createCookieSessionStorage } from 'solid-start/session'

let sessionSecret
if (import.meta && import.meta.env.VITE_SESSION_SECRET) {
  sessionSecret = import.meta.env.VITE_SESSION_SECRET
} else if (process && process.env.VITE_SESSION_SECRET) {
  sessionSecret = process.env.VITE_SESSION_SECRET
} else {
  sessionSecret = 'dev-secret-session-123'
}

export const storage = createCookieSessionStorage({
  cookie: {
    name: '__session',
    // secure doesn't work on localhost for Safari
    // https://web.dev/when-to-use-local-https/
    secure: !!process.env.DEV,
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: !!process.env.DEV
  }
})

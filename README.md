# Auth0 Solid Start (SSR compatible)

This work is inspired by

- Ryan Turnquist [solid-auth0](https://github.com/rturnq/solid-auth0)
- Sergio Xalambrí
  [remix-auth-oauth2](https://github.com/sergiodxa/remix-auth-oauth2)

## Usage

### root.tsx

In `root.tsx` to enforce authentication on all pages:

```jsx
import { Show } from 'solid-js'
import { useAuth0, Auth0 } from '@zentered/auth0-solid-start'
import { ErrorBoundary, FileRoutes, Routes } from 'solid-start'

const GraphQLProvider = () => {} // let's assume you want to authenticate graphql requests

function Login(props) {
  return (
    <div>
      <p>Sign in</p>
      <div>
        <div>
          <a onClick={() => props.auth0.authorize()} type="button">
            Log In
          </a>
        </div>
      </div>
    </div>
  )
}

function SiteRequiresAuth(props) {
  const cookies = useCookies()
  const accessToken = cookies['com.auth0.auth.accessToken']
  const auth0 = useAuth0()

  if (!auth0.isAuthenticated() && accessToken) {
    auth0.login(accessToken)
  }

  return (
    <Show when={auth0.isAuthenticated()} fallback={<Login auth0={auth0} />}>
      <Show when={auth0.token()}>
        <GraphQLProvider auth0={auth0}>{props.children}</GraphQLProvider>
      </Show>
    </Show>
  )
}

export default function Root() {
  return (
    // ...
    <Auth0
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      audience={import.meta.env.VITE_AUTH0_AUDIENCE}
      successRedirectUri={import.meta.env.VITE_AUTH0_REDIRECT_URI}
      // organization={organization} // uncomment if you use auth0 organizations
    >
      <SiteRequiresAuth>
        <Routes>
          <FileRoutes />
        </Routes>
      </SiteRequiresAuth>
    </Auth0>
    // ...
  )
}
```

### API

`routes/api/callback.js|ts`:

```js
import callback from '@zentered/auth0-solid-start/api/callback'

export async function get({ request }) {
  return callback(request)
}
```

`routes/api/userinfo.js|ts`:

```js
import userinfo from '@zentered/auth0-solid-start/api/userinfo'

export async function post({ request }) {
  return userinfo(request)
}
```

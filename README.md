# Auth0 Solid Start (SSR compatible)

This is a fully functional library to add [Auth0](https://auth0.com) OAuth
Authentication to a [Solid-Start](https://github.com/solidjs/solid-start) App.

You'll need to sign up and create an Auth0 Application to use this library. The
credentials are stored in an `.env` file (see [.env.example](./env.example)).

This work is inspired by

- Ryan Turnquist [solid-auth0](https://github.com/rturnq/solid-auth0)
- Sergio Xalambrí
  [remix-auth-oauth2](https://github.com/sergiodxa/remix-auth-oauth2)

## How it works

This library is intended to be used on `root` level of your Solid-Start App. It
provides an authentication context for the entire App. Users/passwords etc. are
all stored in Auth0, we use the Universal Login Experience to authenticate users
and get a `code`, which we can exchange for an `access_token`. The
`access_token` is a valid JWT token and can be used to authenticate requests to
your API / GraphQL /etc.

The callback URL is set to `/auth/callback`, so you need to create an API route
in `src/routes/auth/callback.js/ts`. The code can be found below.

```mermaid
flowchart
    A[Browser] --> B[Initial Render/SSR]
    B{Valid Session Cookie exists?} --> |Yes| C
    C[Set Signals & Render App]
    B --> |No| D[Redirect to Auth0 Universal Login]
    D --> E[Callback to `/auth/callback` with `code` & `state`]
    E --> F[Exchange `code` for `access_token`]
    F --> G[Get User Info with access_token]
    G --> H[Set Signals & Session Cookie]
    H --> C[Render App]

```

## Multi Tenant Mode

Multi Tenant Mode can be used with
[Auth0 Organizations](https://auth0.com/docs/manage-users/organizations). You'll
have to pass an organization object into the Auth0 context with an `id`. We
recommend using the same schema as Auth0.

Set `VITE_AUTH0_MULTI_TENANT_MODE=true` in `.env`

## Usage

### root.jsx / .tsx

In `root.tsx` to enforce authentication on all pages:

```jsx
import { Show, Suspense } from 'solid-js'
import { ErrorBoundary, FileRoutes, Routes } from 'solid-start'
import { Auth0, useAuth0 } from '@zentered/auth0-solid-start'

const GraphQLProvider = () => {} // let's assume you want to authenticate graphql requests with your JWT

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
  const auth0 = useAuth0()

  if (!auth0.isAuthenticated() && !isServer) {
    auth0.login()
  }

  return (
    <>
      <Show when={auth0.isInitialized()}>
        <Show when={auth0.isAuthenticated()} fallback={<Login auth0={auth0} />}>
          <Show when={auth0.accessToken()}>
            <GraphQLProvider auth0={auth0}>{props.children}</GraphQLProvider>
          </Show>
        </Show>
      </Show>
    </>
  )
}

export default function Root() {
  return (
    // ...
    <Suspense>
      <ErrorBoundary>
        <Auth0
          domain={import.meta.env.VITE_AUTH0_DOMAIN}
          clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
          audience={import.meta.env.VITE_AUTH0_AUDIENCE}
          redirectUri={import.meta.env.VITE_AUTH0_REDIRECT_URI}
          // organization={organization} // uncomment if you use auth0 organizations
        >
          <SiteRequiresAuth>
            <Routes>
              <FileRoutes />
            </Routes>
          </SiteRequiresAuth>
        </Auth0>
      </ErrorBoundary>
    </Suspense>
    // ...
  )
}
```

### API

`routes/auth/callback.js|ts`:

```js
import fn from '@zentered/auth0-solid-start/api/callback'

export async function get({ request }) {
  return fn(request)
}
```

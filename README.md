# Auth0 Solid Start (SSR compatible)

This work is inspired by

- Ryan Turnquist [solid-auth0](https://github.com/rturnq/solid-auth0)
- Sergio Xalambrí
  [remix-auth-oauth2](https://github.com/sergiodxa/remix-auth-oauth2)

## Usage

In `root.tsx` to enfore authentication on all pages:

```jsx
import { useAuth0, Auth0 } from '@zentered/auth0-solid-start'

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
        <ConfigProvider initialConfig={config}>
          <Header />
          <Routes>
            <FileRoutes />
          </Routes>
          <Footer />
        </ConfigProvider>
      </SiteRequiresAuth>
    </Auth0>
    // ...
  )
}
```

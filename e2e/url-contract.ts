export type ExpectedStatusKind =
  | 'ok'
  | 'redirect-to-signin'
  | 'redirect-to-signin-with-next'
  | 'redirect-to-signin-missing-code'
  | 'unauthorized'
  | 'non-server-error'

export interface UrlContractEntry {
  url: string
  method: 'GET' | 'POST'
  body?: unknown
  label: string
  expect: ExpectedStatusKind
  next?: string
}

export const SESSION_ID_PLACEHOLDER = '00000000-0000-0000-0000-000000000000'

export const URL_CONTRACT: ReadonlyArray<UrlContractEntry> = [
  { url: '/', method: 'GET', label: 'landing', expect: 'ok' },
  { url: '/try', method: 'GET', label: 'anonymous demo', expect: 'ok' },
  { url: '/signin', method: 'GET', label: 'magic-link form', expect: 'ok' },
  {
    url: '/auth/callback',
    method: 'GET',
    label: 'magic-link callback (no code)',
    expect: 'redirect-to-signin-missing-code',
  },
  { url: '/about', method: 'GET', label: 'about page', expect: 'ok' },
  {
    url: '/about/personas',
    method: 'GET',
    label: 'persona library',
    expect: 'ok',
  },
  {
    url: '/legal/privacy',
    method: 'GET',
    label: 'privacy policy',
    expect: 'ok',
  },
  {
    url: '/legal/terms',
    method: 'GET',
    label: 'terms of use',
    expect: 'ok',
  },
  {
    url: '/app',
    method: 'GET',
    label: 'authed boardroom',
    expect: 'redirect-to-signin-with-next',
    next: '/app',
  },
  {
    url: '/app/sessions',
    method: 'GET',
    label: 'past sessions list',
    expect: 'redirect-to-signin-with-next',
    next: '/app/sessions',
  },
  {
    url: `/app/sessions/${SESSION_ID_PLACEHOLDER}`,
    method: 'GET',
    label: 'past session results',
    expect: 'redirect-to-signin-with-next',
    next: `/app/sessions/${SESSION_ID_PLACEHOLDER}`,
  },
  {
    url: `/app/sessions/${SESSION_ID_PLACEHOLDER}/transcript`,
    method: 'GET',
    label: 'past session transcript',
    expect: 'redirect-to-signin-with-next',
    next: `/app/sessions/${SESSION_ID_PLACEHOLDER}/transcript`,
  },
  {
    url: '/app/settings',
    method: 'GET',
    label: 'authed settings',
    expect: 'redirect-to-signin-with-next',
    next: '/app/settings',
  },
  {
    url: '/app/settings/delete-account',
    method: 'GET',
    label: 'delete-account flow',
    expect: 'redirect-to-signin-with-next',
    next: '/app/settings/delete-account',
  },
  {
    url: '/app/settings/api-key',
    method: 'GET',
    label: 'byok settings panel',
    expect: 'redirect-to-signin-with-next',
    next: '/app/settings/api-key',
  },
  {
    url: '/admin',
    method: 'GET',
    label: 'admin / dev dashboard (env-gated)',
    expect: 'redirect-to-signin-with-next',
    next: '/admin',
  },
  {
    url: '/admin/migrations',
    method: 'GET',
    label: 'admin migrations status (env-gated)',
    expect: 'redirect-to-signin-with-next',
    next: '/admin/migrations',
  },
  {
    url: '/api/health',
    method: 'GET',
    label: 'health probe',
    expect: 'ok',
  },
  {
    url: '/api/sessions',
    method: 'POST',
    body: {
      pitch: 'a short pitch',
      personaSlugs: ['product-lead'],
      templateSlug: 'pitch-to-spec',
    },
    label: 'sessions create',
    expect: 'unauthorized',
  },
  {
    url: `/api/sessions/${SESSION_ID_PLACEHOLDER}/answer`,
    method: 'POST',
    body: { body: 'short answer' },
    label: 'sessions answer',
    expect: 'unauthorized',
  },
  {
    url: '/api/demo/begin',
    method: 'POST',
    body: {},
    label: 'demo begin',
    expect: 'non-server-error',
  },
]

export const URL_CONTRACT_ROUTES: ReadonlyArray<string> = URL_CONTRACT.map(
  (e) => e.url.replace(SESSION_ID_PLACEHOLDER, '[id]'),
)

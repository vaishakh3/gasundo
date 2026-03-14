const DEFAULT_REDIRECT_PATH = '/'

export function getSafeRedirectPath(requestUrl, nextValue) {
  try {
    const requestOrigin = new URL(requestUrl).origin
    const nextUrl = new URL(nextValue || DEFAULT_REDIRECT_PATH, requestOrigin)

    if (nextUrl.origin !== requestOrigin) {
      return DEFAULT_REDIRECT_PATH
    }

    return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
  } catch {
    return DEFAULT_REDIRECT_PATH
  }
}

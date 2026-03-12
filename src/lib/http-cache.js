import { createHash } from 'node:crypto'

export function createStrongEtag(value) {
  const serializedValue =
    typeof value === 'string' ? value : JSON.stringify(value)

  return `"${createHash('sha1').update(serializedValue).digest('base64url')}"`
}

export function isEtagFresh(requestEtag, responseEtag) {
  if (!requestEtag || !responseEtag) {
    return false
  }

  if (requestEtag.trim() === '*') {
    return true
  }

  return requestEtag
    .split(',')
    .map((value) => value.trim())
    .includes(responseEtag)
}

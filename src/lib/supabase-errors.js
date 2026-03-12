export function isMissingRelationError(error) {
  const message = error?.message || ''

  return (
    error?.code === '42P01' ||
    error?.code === '42703' ||
    error?.code === 'PGRST205' ||
    /relation .* does not exist/i.test(message) ||
    /column .* does not exist/i.test(message) ||
    /could not find the table .* in the schema cache/i.test(message)
  )
}

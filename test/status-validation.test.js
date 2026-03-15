import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateCreateStatusPayload,
  validateStatusId,
} from '../src/lib/status-validation.js'

test('validateCreateStatusPayload derives a restaurant key when omitted', () => {
  const result = validateCreateStatusPayload({
    restaurant_name: 'Probe Cafe',
    lat: 9.96723,
    lng: 76.24567,
    status: 'open',
    note: 'Fresh batch',
  })

  assert.deepEqual(result, {
    data: {
      restaurant_name: 'Probe Cafe',
      restaurant_key: 'probe-cafe::9.96723::76.24567',
      lat: 9.96723,
      lng: 76.24567,
      status: 'open',
      note: 'Fresh batch',
    },
  })
})

test('validateCreateStatusPayload accepts restaurants across Kerala', () => {
  const result = validateCreateStatusPayload({
    restaurant_name: 'Capital Cafe',
    lat: 8.5241,
    lng: 76.9366,
    status: 'limited',
    note: '',
  })

  assert.deepEqual(result, {
    data: {
      restaurant_name: 'Capital Cafe',
      restaurant_key: 'capital-cafe::8.52410::76.93660',
      lat: 8.5241,
      lng: 76.9366,
      status: 'limited',
      note: null,
    },
  })
})

test('validateCreateStatusPayload rejects locations outside Kerala', () => {
  assert.equal(
    validateCreateStatusPayload({
      restaurant_name: 'Outstation Diner',
      lat: 13.0827,
      lng: 80.2707,
      status: 'open',
      note: '',
    }).error,
    'Location is outside the Kerala coverage area.'
  )
})

test('validateStatusId accepts UUID identifiers', () => {
  assert.deepEqual(validateStatusId('9f4d3b58-3c2b-4a40-9b2e-8d9c18d4f1a7'), {
    data: '9f4d3b58-3c2b-4a40-9b2e-8d9c18d4f1a7',
  })
})

test('validateStatusId rejects non-UUID identifiers', () => {
  assert.deepEqual(validateStatusId('1947'), {
    error: 'Invalid status id.',
  })
})

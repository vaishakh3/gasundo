import { DEFAULT_DISTRICT_SLUG, getDistrictConfig, KERALA_BOUNDS } from './districts.js'

export { KERALA_BOUNDS }

export const DEFAULT_MAP_CENTER =
  getDistrictConfig(DEFAULT_DISTRICT_SLUG).mapCenter
export const DEFAULT_MAP_ZOOM = 11
export const STATUS_VALUES = ['open', 'limited', 'closed']

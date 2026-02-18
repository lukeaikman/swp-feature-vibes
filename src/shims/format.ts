// Shim for @app/format — only exports getFullName (the only function used by UI components)
// Based on: safeworkplace-web-app/src/app/format.ts lines 5-8
// Other format utilities (formatDate, formatBytes, etc.) are NOT available.
// Use date-fns directly if you need date formatting.
import { startCase } from 'lodash'

export const getFullName = (
  firstName?: string,
  lastName?: string | null,
  defaultValue = 'Identity Unknown',
) => startCase(`${firstName ?? ''} ${lastName ?? ''}`).trim() || defaultValue

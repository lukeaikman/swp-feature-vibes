// Based on: safeworkplace-web-app/src/api/common.ts
// Last synced: 2026-02-17
// Integration: verify these match production before merging

export interface TokenPaginationResponse<T> {
  items: T[]
  meta: {
    hasNext: boolean
    nextCursor: string
  }
}

export type TPaginationCursor = string | null | undefined

export interface PaginatedResponse<T> {
  items: T[]
  meta?: {
    cursor?: TPaginationCursor
    limit: number
    offset?: number
    page: number
    total: number
    filters?: {
      department?: string[]
      officeLocation?: string[]
      jobTitle?: string[]
    }
  }
}

export interface IApiFile {
  originalname: string
  filename?: string
  mimetype: string
  path: string
  size: number
}

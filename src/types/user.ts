// This file is both a type snapshot and a runtime shim.
// Types (IUser, IUserPicture, Roles) are copied from safeworkplace-web-app/src/entities/user/types.ts
// Runtime exports (useMe, isAdmin, isUser, isSWPUser) are stubs that return hardcoded values.
// The real @entities/user module re-exports hooks from ./api and ./helpers — we mock those here.
// This entire file is scaffolding. It is thrown away on integration.
//
// Based on: safeworkplace-web-app/src/entities/user/types.ts
// Last synced: 2026-02-17
// Integration: verify these match production before merging

export enum Roles {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface IUserPicture {
  original: string
  thumbnail: string
}

export interface IUser {
  id: string
  email: string
  roles: Roles[]
  language: string
  firstName: string
  lastName?: string
  country?: string
  automaticTimeZoneEnabled?: boolean
  notificationsEnabled?: boolean
  timeZone?: string
  picture?: IUserPicture
  departmentMemberships: { id: string; departmentId: string; departmentName: string }[]
  nameFormatted?: string
  rolesLabel?: string
  online?: boolean
  subscribed?: boolean
  created: string
  isDeleted?: boolean
}

// Hardcoded mock user — matches the admin seed user in db.json
const MOCK_USER: IUser = {
  id: '8f0f9397-089c-4e99-9dc6-96b5bb742504',
  email: 'lloyd+master@safework.place',
  firstName: 'lloyd',
  lastName: 'master',
  roles: [Roles.ADMIN],
  language: 'en',
  timeZone: 'Africa/Johannesburg',
  departmentMemberships: [],
  created: '2026-01-01T00:00:00.000Z',
}

// Stub for useMe() — returns a shape compatible with UseQueryResult<IUser>
export const useMe = () => ({
  data: MOCK_USER,
  isLoading: false,
  isError: false,
  error: null,
  isSuccess: true,
  status: 'success' as const,
  refetch: () => Promise.resolve({ data: MOCK_USER, isLoading: false, isError: false, error: null, isSuccess: true, status: 'success' as const }),
})

// Helper stubs — always return true for dev convenience
export const isAdmin = (_user?: IUser) => true
export const isUser = (_user?: IUser) => true
export const isSWPUser = (_user?: IUser) => true

// Shims for @lingui/macro and @lingui/react
// Makes t`string` return the string as-is, Trans renders children directly
import type { ReactNode } from 'react'

// Shim for @lingui/macro — makes t`string` return the string as-is
export const t = (strings: TemplateStringsArray, ...values: any[]) =>
  String.raw(strings, ...values)

// Shim for msg`` (message descriptors) — returns the string as-is
export const msg = (strings: TemplateStringsArray, ...values: any[]) =>
  String.raw(strings, ...values)

// Shim for plural/select (rarely used in UI components)
export const plural = (value: number, options: Record<string, string>) =>
  options[value] ?? options.other ?? ''
export const select = (value: string, options: Record<string, string>) =>
  options[value] ?? options.other ?? ''

// Shim for <Trans> — renders children directly
export const Trans = ({ children }: { children?: ReactNode }) => children ?? null

// Shim for i18n object (some components may reference it)
export const i18n = { _: (msg: string) => msg }

// Shim for @lingui/react
export const I18nProvider = ({ children }: { children: ReactNode }) => children

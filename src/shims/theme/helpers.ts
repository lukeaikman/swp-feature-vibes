// Matches: safeworkplace-web-app/src/app/theme/helpers.ts
// Last synced: 2026-02-17
import { CSSProperties } from 'react'
import { Theme } from '@material-ui/core/styles'

export type ThemeColors =
  | 'brand'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warning'
  | 'error'
  | 'button'
  | 'buttonText'
  | 'gray'

export interface StyleProps {
  className?: string
  style?: CSSProperties
}

export const buttonInputHeight = 40

export const getScrollBarStyles = (theme: Theme) => ({
  '&::-webkit-scrollbar': {
    width: 8,
    height: 8,
  },
  '&::-webkit-scrollbar-thumb': {
    background: `${theme.palette.primary.main}90`,
    borderRadius: 4,
    cursor: 'pointer',
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.primary.main + 20,
  },
})

export const isDark = (theme: Theme) => theme.palette.type === 'dark'

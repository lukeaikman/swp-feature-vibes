// No-op — HeadTitle uses next/head to set page <title>, which doesn't matter in dev
import type { ReactNode } from 'react'
const Head = ({ children }: { children?: ReactNode }) => null
export default Head

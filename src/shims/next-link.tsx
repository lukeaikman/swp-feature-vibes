// Shim for next/link — renders React Router Link instead
import React from 'react'
import { Link as RouterLink } from 'react-router-dom'

const NextLink = React.forwardRef<HTMLAnchorElement, any>(
  ({ href, children, ...props }, ref) => (
    <RouterLink ref={ref} to={href} {...props}>
      {children}
    </RouterLink>
  )
)

NextLink.displayName = 'NextLink'
export default NextLink

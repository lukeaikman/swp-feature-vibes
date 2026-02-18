import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ROUTES } from '../routes'
import {
  SidebarContainer,
  LogoArea,
  LogoText,
  LogoSubtext,
  NavList,
  NavItem,
} from './Layout.styles'

// Configure your module's navigation items here
const NAV_ITEMS = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD },
  // Add more as you build pages, e.g.:
  // { label: 'Templates', path: ROUTES.TEMPLATES },
  // { label: 'Schedule', path: ROUTES.SCHEDULE },
  // { label: 'Findings', path: ROUTES.FINDINGS },
]

export const Sidebar = () => {
  const location = useLocation()

  return (
    <SidebarContainer>
      <LogoArea>
        <LogoText>Safe Workplace</LogoText>
        <LogoSubtext>Feature Module</LogoSubtext>
      </LogoArea>
      <NavList>
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.path}
            as={NavLink}
            to={item.path}
            $active={location.pathname === item.path}
          >
            {item.label}
          </NavItem>
        ))}
      </NavList>
    </SidebarContainer>
  )
}

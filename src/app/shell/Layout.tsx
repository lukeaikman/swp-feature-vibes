import React from 'react'
import { Sidebar } from './Sidebar'
import { LayoutContainer, ContentArea } from './Layout.styles'

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <LayoutContainer>
    <Sidebar />
    <ContentArea>{children}</ContentArea>
  </LayoutContainer>
)

import styled from 'styled-components'

export const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
`

export const SidebarContainer = styled.aside`
  width: 280px;
  min-width: 280px;
  background-color: #11233b;
  color: #fafafa;
  display: flex;
  flex-direction: column;
  padding: 24px 0;
`

export const ContentArea = styled.main`
  flex: 1;
  background-color: #f5f5f5;
  padding: 24px 32px;
  overflow-y: auto;
`

export const LogoArea = styled.div`
  padding: 0 24px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
`

export const LogoText = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #ff9900;
  font-family: 'DM Sans', sans-serif;
`

export const LogoSubtext = styled.div`
  font-size: 12px;
  color: rgba(250, 250, 250, 0.6);
  margin-top: 4px;
  font-family: 'DM Sans', sans-serif;
`

export const NavList = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 12px;
`

export const NavItem = styled.a<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  color: ${({ $active }) => ($active ? '#FF9900' : 'rgba(250, 250, 250, 0.8)')};
  background-color: ${({ $active }) => ($active ? 'rgba(255, 153, 0, 0.1)' : 'transparent')};
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  transition: background-color 0.15s, color 0.15s;
  cursor: pointer;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: #ffffff;
  }
`

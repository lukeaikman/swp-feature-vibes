import styled from 'styled-components'

export const CardHeader = styled.div<{ $clickable: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
`

export const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const SummaryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
`

// Shim for @report-configs
// Used by AnonymousBadge (useWithAnonymityStep) and InfoItemsList (IClientSummaryItem)
export const useWithAnonymityStep = () => ({ data: null, isLoading: false })

export interface IClientSummaryItem {
  label: string
  value: string | number
}

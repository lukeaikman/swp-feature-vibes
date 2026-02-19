import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Checkbox, Text, Column } from '@UI'
import {
  Chip,
  Collapse,
  Divider,
  useMediaQuery,
} from '@material-ui/core'
import EditOutlinedIcon from '@material-ui/icons/EditOutlined'
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp'
import { makeStyles, useTheme } from '@material-ui/core/styles'
import { HEALTHCARE_PROVIDER_TYPES } from '../../../../data/healthcare-provider-types'
import { mapLocaleToReferenceCode } from '../../../../entities/onboarding'
import type { AppLocale, ICareServiceDefinition } from '../../../../entities/onboarding'

const useStyles = makeStyles((theme) => ({
  categoryCard: {
    cursor: 'pointer',
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.grey[300]}`,
    transition: 'all 0.2s ease',
    overflow: 'hidden',
    '&:hover': {
      borderColor: theme.palette.brand.main,
      backgroundColor: `${theme.palette.brand.main}08`,
    },
  },
  categoryCardSelected: {
    borderColor: theme.palette.brand.main,
    backgroundColor: `${theme.palette.brand.main}10`,
    '&:hover': {
      backgroundColor: `${theme.palette.brand.main}12`,
    },
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1.5, 2),
    '& .MuiCheckbox-root': {
      marginRight: theme.spacing(1),
    },
  },
  editIcon: {
    marginLeft: 'auto',
    fontSize: 16,
    color: theme.palette.grey[400],
    transition: 'color 0.2s ease',
    '&:hover': {
      color: theme.palette.brand.main,
    },
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    padding: theme.spacing(0, 2, 1.5, 2),
  },
  subcategoryPanel: {
    padding: theme.spacing(1.5, 2, 2, 2),
    borderTop: `1px solid ${theme.palette.brand.main}20`,
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(0.5, 2),
  },
  checkboxItem: {
    '& .MuiCheckbox-root': {
      marginRight: theme.spacing(1),
    },
  },
  careCardHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1.5, 2),
  },
  summaryStrip: {
    padding: theme.spacing(1, 2),
    borderRadius: theme.shape.borderRadius,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
}))

export interface SelectionPayload {
  selectedCategoryIds: string[]
  selectedSubcategoryIds: string[]
  selectedCareServiceIds: string[]
}

interface ProviderCategorySelectorProps {
  locale: AppLocale
  selectedCategoryIds: string[]
  selectedSubcategoryIds: string[]
  selectedCareServiceIds: string[]
  onSelectionChange: (payload: SelectionPayload) => void
  errors?: { categories?: string; careServices?: string }
}

export const ProviderCategorySelector = ({
  locale,
  selectedCategoryIds,
  selectedSubcategoryIds,
  selectedCareServiceIds,
  onSelectionChange,
  errors,
}: ProviderCategorySelectorProps) => {
  const classes = useStyles()
  const theme = useTheme()
  const isNarrow = useMediaQuery(theme.breakpoints.down('sm'))
  const localeCode = mapLocaleToReferenceCode(locale)

  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)
  const [collapsedCareCardIds, setCollapsedCareCardIds] = useState<Set<string>>(new Set())
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const setCardRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    cardRefs.current[id] = el
  }, [])

  useEffect(() => {
    if (!expandedCategoryId) return

    const handleClickOutside = (e: MouseEvent) => {
      const cardEl = cardRefs.current[expandedCategoryId]
      if (cardEl && !cardEl.contains(e.target as Node)) {
        setExpandedCategoryId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [expandedCategoryId])

  const filteredCategories = useMemo(() => {
    return Object.values(HEALTHCARE_PROVIDER_TYPES).filter((cat) =>
      cat.locale.includes(localeCode)
    )
  }, [localeCode])

  const collectCareServiceIds = (categoryId: string): string[] => {
    const category = HEALTHCARE_PROVIDER_TYPES[categoryId]
    if (!category) return []
    const ids: string[] = []
    category.careServices?.forEach((s) => ids.push(s.id))
    category.subcategories.forEach((sub) => {
      sub.careServices?.forEach((s) => ids.push(s.id))
    })
    return ids
  }

  const handleCategoryToggle = (categoryId: string) => {
    const isSelected = selectedCategoryIds.includes(categoryId)

    if (!isSelected) {
      onSelectionChange({
        selectedCategoryIds: [...selectedCategoryIds, categoryId],
        selectedSubcategoryIds,
        selectedCareServiceIds,
      })
      setExpandedCategoryId(categoryId)
    } else {
      const category = HEALTHCARE_PROVIDER_TYPES[categoryId]
      const subcatIdsToRemove = category?.subcategories.map((s) => s.id) ?? []
      const serviceIdsToRemove = collectCareServiceIds(categoryId)

      onSelectionChange({
        selectedCategoryIds: selectedCategoryIds.filter((id) => id !== categoryId),
        selectedSubcategoryIds: selectedSubcategoryIds.filter((id) => !subcatIdsToRemove.includes(id)),
        selectedCareServiceIds: selectedCareServiceIds.filter((id) => !serviceIdsToRemove.includes(id)),
      })
      if (expandedCategoryId === categoryId) {
        setExpandedCategoryId(null)
      }
    }
  }

  const handleCardClick = (categoryId: string) => {
    const isSelected = selectedCategoryIds.includes(categoryId)

    if (!isSelected) {
      handleCategoryToggle(categoryId)
    } else {
      setExpandedCategoryId(expandedCategoryId === categoryId ? null : categoryId)
    }
  }

  const handleSubcategoryToggle = (subcategoryId: string, checked: boolean) => {
    let nextCareServiceIds = selectedCareServiceIds
    if (!checked) {
      for (const cat of Object.values(HEALTHCARE_PROVIDER_TYPES)) {
        const sub = cat.subcategories.find((s) => s.id === subcategoryId)
        if (sub?.careServices) {
          const idsToRemove = new Set(sub.careServices.map((s) => s.id))
          nextCareServiceIds = nextCareServiceIds.filter((id) => !idsToRemove.has(id))
          break
        }
      }
    }
    onSelectionChange({
      selectedCategoryIds,
      selectedSubcategoryIds: checked
        ? [...selectedSubcategoryIds, subcategoryId]
        : selectedSubcategoryIds.filter((id) => id !== subcategoryId),
      selectedCareServiceIds: nextCareServiceIds,
    })
  }

  const handleCareServiceToggle = (serviceId: string, checked: boolean) => {
    onSelectionChange({
      selectedCategoryIds,
      selectedSubcategoryIds,
      selectedCareServiceIds: checked
        ? [...selectedCareServiceIds, serviceId]
        : selectedCareServiceIds.filter((id) => id !== serviceId),
    })
  }

  const careServicesByCategory = useMemo(() => {
    const map = new Map<string, ICareServiceDefinition[]>()
    selectedCategoryIds.forEach((catId) => {
      const category = HEALTHCARE_PROVIDER_TYPES[catId]
      if (!category) return
      const serviceMap = new Map<string, ICareServiceDefinition>()
      category.careServices?.forEach((svc) => {
        if (svc.locale.includes(localeCode)) serviceMap.set(svc.id, svc)
      })
      category.subcategories.forEach((sub) => {
        if (selectedSubcategoryIds.includes(sub.id) && sub.careServices) {
          sub.careServices.forEach((svc) => {
            if (svc.locale.includes(localeCode)) serviceMap.set(svc.id, svc)
          })
        }
      })
      if (serviceMap.size > 0) map.set(catId, Array.from(serviceMap.values()))
    })
    return map
  }, [selectedCategoryIds, selectedSubcategoryIds, localeCode])

  const handleCareCardClick = (catId: string) => {
    const services = careServicesByCategory.get(catId) ?? []
    const hasCheckedServices = services.some((s) => selectedCareServiceIds.includes(s.id))
    if (!hasCheckedServices) return
    setCollapsedCareCardIds((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) {
        next.delete(catId)
      } else {
        next.add(catId)
      }
      return next
    })
  }

  const selectedCatCount = selectedCategoryIds.length
  const selectedSubCount = selectedSubcategoryIds.length
  const selectedServiceCount = selectedCareServiceIds.length

  return (
    <Column gap={3}>
      {/* Section 1: Provider Categories as inline-accordion cards */}
      <Column gap={1.5}>
        <Column gap={0.5}>
          <Text style={{ fontWeight: 600, fontSize: 16 }}>
            Healthcare provider type
          </Text>
          <Text style={{ fontSize: 13, color: theme.palette.grey[600] }}>
            Select all categories that apply to this location
          </Text>
        </Column>

        <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: theme.spacing(1.5), alignItems: 'start' }}>
          {filteredCategories.map((category) => {
            const isSelected = selectedCategoryIds.includes(category.id)
            const isExpanded = expandedCategoryId === category.id
            const subcats = category.subcategories.filter((s) => s.locale.includes(localeCode))
            const selectedSubs = subcats.filter((s) => selectedSubcategoryIds.includes(s.id))
            const hasSubcategories = subcats.length > 0

            return (
              <div
                key={category.id}
                ref={setCardRef(category.id)}
                className={`${classes.categoryCard} ${isSelected ? classes.categoryCardSelected : ''}`}
              >
                <div
                  className={classes.categoryHeader}
                  onClick={() => handleCardClick(category.id)}
                >
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleCategoryToggle(category.id)}
                    />
                  </div>
                  <Text style={{ fontWeight: 500, fontSize: 14, flex: 1 }}>{category.name}</Text>
                  {isSelected && !isExpanded && hasSubcategories && (
                    <EditOutlinedIcon className={classes.editIcon} />
                  )}
                </div>

                {isSelected && !isExpanded && hasSubcategories && selectedSubs.length === 0 && (
                  <div className={classes.chipRow}>
                    <Text style={{ fontSize: 12, color: theme.palette.grey[400], fontStyle: 'italic' }}>
                      No subcategories selected
                    </Text>
                  </div>
                )}

                {isSelected && !isExpanded && selectedSubs.length > 0 && (
                  <div className={classes.chipRow}>
                    {selectedSubs.map((sub) => (
                      <Chip
                        key={sub.id}
                        label={sub.name}
                        size="small"
                        onDelete={() => handleSubcategoryToggle(sub.id, false)}
                        style={{
                          backgroundColor: `${theme.palette.brand.main}15`,
                          borderColor: `${theme.palette.brand.main}40`,
                          fontWeight: 500,
                          fontSize: 11,
                        }}
                        variant="outlined"
                      />
                    ))}
                  </div>
                )}

                {isSelected && hasSubcategories && (
                  <Collapse in={isExpanded}>
                    <div className={classes.subcategoryPanel}>
                      <Text style={{ fontSize: 12, fontWeight: 600, color: theme.palette.grey[500], marginBottom: theme.spacing(1) }}>
                        Subcategories
                      </Text>
                      <div className={classes.checkboxGrid}>
                        {subcats.map((sub) => (
                          <div key={sub.id} className={classes.checkboxItem}>
                            <Checkbox
                              label={sub.name}
                              checked={selectedSubcategoryIds.includes(sub.id)}
                              onChange={(e) =>
                                handleSubcategoryToggle(sub.id, (e.target as HTMLInputElement).checked)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </Collapse>
                )}
              </div>
            )
          })}
        </div>

        {errors?.categories && (
          <Text style={{ color: theme.palette.error.main, fontSize: 13 }}>{errors.categories}</Text>
        )}

        {selectedCatCount > 0 && (
          <div
            className={classes.summaryStrip}
            style={{
              backgroundColor: `${theme.palette.brand.main}10`,
              border: `1px solid ${theme.palette.brand.main}25`,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: 600, color: theme.palette.primary.main }}>
              {selectedCatCount} {selectedCatCount === 1 ? 'category' : 'categories'} selected
            </Text>
          </div>
        )}
      </Column>

      {/* Section 2: Care Services — per-provider-type cards */}
      {careServicesByCategory.size > 0 && (
        <>
          <Divider />
          <Column gap={1.5}>
            <Column gap={0.5}>
              <Text style={{ fontWeight: 600, fontSize: 16 }}>
                Care services
              </Text>
              <Text style={{ fontSize: 13, color: theme.palette.grey[600] }}>
                Select the services each provider type offers
              </Text>
            </Column>

            <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: theme.spacing(1.5), alignItems: 'start' }}>
              {Array.from(careServicesByCategory.entries()).map(([catId, services]) => {
                const category = HEALTHCARE_PROVIDER_TYPES[catId]
                if (!category) return null
                const selectedServices = services.filter((s) => selectedCareServiceIds.includes(s.id))
                const hasChecked = selectedServices.length > 0
                const isCollapsed = collapsedCareCardIds.has(catId) && hasChecked
                const isCardExpanded = !isCollapsed

                return (
                  <div
                    key={catId}
                    className={`${classes.categoryCard} ${classes.categoryCardSelected}`}
                  >
                    <div
                      className={classes.careCardHeader}
                      style={{ cursor: hasChecked ? 'pointer' : 'default' }}
                      onClick={() => handleCareCardClick(catId)}
                    >
                      <Text style={{ fontWeight: 500, fontSize: 14, flex: 1 }}>
                        Care Services: {category.name}
                      </Text>
                      {hasChecked && isCollapsed && (
                        <EditOutlinedIcon className={classes.editIcon} />
                      )}
                      {hasChecked && isCardExpanded && (
                        <KeyboardArrowUpIcon className={classes.editIcon} />
                      )}
                    </div>

                    {isCollapsed && (
                      <div className={classes.chipRow}>
                        {selectedServices.map((svc) => (
                          <Chip
                            key={svc.id}
                            label={svc.name}
                            size="small"
                            onDelete={() => handleCareServiceToggle(svc.id, false)}
                            style={{
                              backgroundColor: `${theme.palette.info.main}15`,
                              borderColor: `${theme.palette.info.main}40`,
                              fontWeight: 500,
                              fontSize: 11,
                            }}
                            variant="outlined"
                          />
                        ))}
                      </div>
                    )}

                    <Collapse in={isCardExpanded}>
                      <div className={classes.subcategoryPanel}>
                        <div className={classes.checkboxGrid}>
                          {services.map((svc) => (
                            <div key={svc.id} className={classes.checkboxItem}>
                              <Checkbox
                                label={svc.name}
                                checked={selectedCareServiceIds.includes(svc.id)}
                                onChange={(e) =>
                                  handleCareServiceToggle(svc.id, (e.target as HTMLInputElement).checked)
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </Collapse>
                  </div>
                )
              })}
            </div>

            {errors?.careServices && (
              <Text style={{ color: theme.palette.error.main, fontSize: 13 }}>
                {errors.careServices}
              </Text>
            )}
          </Column>
        </>
      )}

      {/* Overall selection summary */}
      {(selectedCatCount > 0 || selectedSubCount > 0 || selectedServiceCount > 0) && (
        <div
          className={classes.summaryStrip}
          style={{
            backgroundColor: theme.palette.grey[50],
            border: `1px solid ${theme.palette.grey[200]}`,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: 500, color: theme.palette.grey[700] }}>
            Summary:
          </Text>
          {selectedCatCount > 0 && (
            <Chip
              label={`${selectedCatCount} ${selectedCatCount === 1 ? 'category' : 'categories'}`}
              size="small"
              style={{
                backgroundColor: `${theme.palette.brand.main}20`,
                fontWeight: 500,
                fontSize: 12,
              }}
            />
          )}
          {selectedSubCount > 0 && (
            <Chip
              label={`${selectedSubCount} ${selectedSubCount === 1 ? 'subcategory' : 'subcategories'}`}
              size="small"
              style={{
                backgroundColor: `${theme.palette.brand.main}15`,
                fontWeight: 500,
                fontSize: 12,
              }}
            />
          )}
          {selectedServiceCount > 0 && (
            <Chip
              label={`${selectedServiceCount} ${selectedServiceCount === 1 ? 'service' : 'services'}`}
              size="small"
              style={{
                backgroundColor: `${theme.palette.info.main}15`,
                fontWeight: 500,
                fontSize: 12,
              }}
            />
          )}
        </div>
      )}
    </Column>
  )
}

export default ProviderCategorySelector

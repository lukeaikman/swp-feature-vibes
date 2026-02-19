import React, { useMemo } from 'react'
import { Checkbox, Text, Column, Row } from '@UI'
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { makeStyles, useTheme } from '@material-ui/core/styles'
import { HEALTHCARE_PROVIDER_TYPES } from '../../../../data/healthcare-provider-types'
import { mapLocaleToReferenceCode } from '../../../../entities/onboarding'
import type { AppLocale, ICareServiceDefinition } from '../../../../entities/onboarding'

const useStyles = makeStyles((theme) => ({
  categoryCard: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1.5, 2),
    border: `1px solid ${theme.palette.grey[300]}`,
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: theme.palette.brand.main,
      backgroundColor: `${theme.palette.brand.main}08`,
    },
    '& .MuiCheckbox-root': {
      marginRight: theme.spacing(1),
    },
    '& .MuiFormControlLabel-root': {
      pointerEvents: 'none',
    },
  },
  categoryCardSelected: {
    borderColor: theme.palette.brand.main,
    backgroundColor: `${theme.palette.brand.main}10`,
    '&:hover': {
      backgroundColor: `${theme.palette.brand.main}18`,
    },
  },
  accordion: {
    boxShadow: 'none',
    '&:before': { display: 'none' },
    borderRadius: `${theme.shape.borderRadius}px !important`,
    border: `1px solid ${theme.palette.grey[200]}`,
    overflow: 'hidden',
  },
  accordionSummary: {
    minHeight: '48px !important',
    '& .MuiAccordionSummary-content': {
      margin: `${theme.spacing(1)}px 0 !important`,
      alignItems: 'center',
    },
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    marginLeft: theme.spacing(1),
  },
  subcategoryContainer: {
    padding: theme.spacing(1, 0),
    backgroundColor: `${theme.palette.brand.main}05`,
    borderRadius: theme.shape.borderRadius,
  },
  careServiceContainer: {
    padding: theme.spacing(1, 0),
    backgroundColor: `${theme.palette.info.main}05`,
    borderRadius: theme.shape.borderRadius,
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
  const localeCode = mapLocaleToReferenceCode(locale)

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
    } else {
      const category = HEALTHCARE_PROVIDER_TYPES[categoryId]
      const subcatIdsToRemove = category?.subcategories.map((s) => s.id) ?? []
      const serviceIdsToRemove = collectCareServiceIds(categoryId)

      onSelectionChange({
        selectedCategoryIds: selectedCategoryIds.filter((id) => id !== categoryId),
        selectedSubcategoryIds: selectedSubcategoryIds.filter((id) => !subcatIdsToRemove.includes(id)),
        selectedCareServiceIds: selectedCareServiceIds.filter((id) => !serviceIdsToRemove.includes(id)),
      })
    }
  }

  const handleSubcategoryToggle = (subcategoryId: string, checked: boolean) => {
    onSelectionChange({
      selectedCategoryIds,
      selectedSubcategoryIds: checked
        ? [...selectedSubcategoryIds, subcategoryId]
        : selectedSubcategoryIds.filter((id) => id !== subcategoryId),
      selectedCareServiceIds,
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

  const availableCareServices = useMemo(() => {
    const serviceMap = new Map<string, ICareServiceDefinition>()

    selectedCategoryIds.forEach((catId) => {
      const category = HEALTHCARE_PROVIDER_TYPES[catId]
      if (!category) return

      category.careServices?.forEach((svc) => {
        if (svc.locale.includes(localeCode)) {
          serviceMap.set(svc.id, svc)
        }
      })

      category.subcategories.forEach((sub) => {
        if (selectedSubcategoryIds.includes(sub.id) && sub.careServices) {
          sub.careServices.forEach((svc) => {
            if (svc.locale.includes(localeCode)) {
              serviceMap.set(svc.id, svc)
            }
          })
        }
      })
    })

    return Array.from(serviceMap.values())
  }, [selectedCategoryIds, selectedSubcategoryIds, localeCode])

  const selectedCatCount = selectedCategoryIds.length
  const selectedSubCount = selectedSubcategoryIds.length
  const selectedServiceCount = selectedCareServiceIds.length

  return (
    <Column gap={3}>
      {/* Section 1: Provider Categories */}
      <Column gap={1.5}>
        <Column gap={0.5}>
          <Text style={{ fontWeight: 600, fontSize: 16 }}>
            Healthcare provider type
          </Text>
          <Text style={{ fontSize: 13, color: theme.palette.grey[600] }}>
            Select all categories that apply to this location
          </Text>
        </Column>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing(1.5) }}>
          {filteredCategories.map((category) => {
            const isSelected = selectedCategoryIds.includes(category.id)
            return (
              <div
                key={category.id}
                className={`${classes.categoryCard} ${isSelected ? classes.categoryCardSelected : ''}`}
                onClick={() => handleCategoryToggle(category.id)}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => {}}
                  label={category.name}
                />
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

      {/* Section 2: Subcategories — per selected category, in accordions */}
      {selectedCategoryIds.map((catId) => {
        const category = HEALTHCARE_PROVIDER_TYPES[catId]
        if (!category || category.subcategories.length === 0) return null

        const subcats = category.subcategories.filter((s) => s.locale.includes(localeCode))
        if (subcats.length === 0) return null

        const selectedCount = subcats.filter((s) => selectedSubcategoryIds.includes(s.id)).length

        return (
          <Accordion key={catId} defaultExpanded className={classes.accordion}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              className={classes.accordionSummary}
              style={{ backgroundColor: `${theme.palette.brand.main}06` }}
            >
              <Row gap={1} alignItems="center">
                <Text style={{ fontWeight: 600, fontSize: 14 }}>
                  Subcategories – {category.name}
                </Text>
                {selectedCount > 0 && (
                  <span
                    className={classes.badge}
                    style={{ backgroundColor: theme.palette.brand.main }}
                  >
                    {selectedCount}
                  </span>
                )}
              </Row>
            </AccordionSummary>
            <AccordionDetails>
              <Column gap={1} style={{ width: '100%' }}>
                <div className={classes.subcategoryContainer}>
                  <div className={classes.checkboxGrid} style={{ padding: theme.spacing(1, 2) }}>
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

                {selectedCount > 0 && (
                  <Row gap={1} style={{ flexWrap: 'wrap', paddingTop: theme.spacing(0.5) }}>
                    {subcats
                      .filter((s) => selectedSubcategoryIds.includes(s.id))
                      .map((sub) => (
                        <Chip
                          key={sub.id}
                          label={sub.name}
                          size="small"
                          onDelete={() => handleSubcategoryToggle(sub.id, false)}
                          style={{
                            backgroundColor: `${theme.palette.brand.main}15`,
                            borderColor: `${theme.palette.brand.main}40`,
                            fontWeight: 500,
                            fontSize: 12,
                          }}
                          variant="outlined"
                        />
                      ))}
                  </Row>
                )}
              </Column>
            </AccordionDetails>
          </Accordion>
        )
      })}

      {/* Section 3: Care Services — accordion, only when services are available */}
      {availableCareServices.length > 0 && (
        <Accordion defaultExpanded className={classes.accordion}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            className={classes.accordionSummary}
            style={{ backgroundColor: `${theme.palette.info.main}06` }}
          >
            <Row gap={1} alignItems="center">
              <Text style={{ fontWeight: 600, fontSize: 14 }}>
                Care services
              </Text>
              <Text style={{ fontSize: 13, color: theme.palette.grey[500] }}>
                — What does this location provide?
              </Text>
              {selectedServiceCount > 0 && (
                <span
                  className={classes.badge}
                  style={{ backgroundColor: theme.palette.info.main }}
                >
                  {selectedServiceCount}
                </span>
              )}
            </Row>
          </AccordionSummary>
          <AccordionDetails>
            <Column gap={1} style={{ width: '100%' }}>
              <div className={classes.careServiceContainer}>
                <div className={classes.checkboxGrid} style={{ padding: theme.spacing(1, 2) }}>
                  {availableCareServices.map((svc) => (
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

              {selectedServiceCount > 0 && (
                <Row gap={1} style={{ flexWrap: 'wrap', paddingTop: theme.spacing(0.5) }}>
                  {availableCareServices
                    .filter((svc) => selectedCareServiceIds.includes(svc.id))
                    .map((svc) => (
                      <Chip
                        key={svc.id}
                        label={svc.name}
                        size="small"
                        onDelete={() => handleCareServiceToggle(svc.id, false)}
                        style={{
                          backgroundColor: `${theme.palette.info.main}15`,
                          borderColor: `${theme.palette.info.main}40`,
                          fontWeight: 500,
                          fontSize: 12,
                        }}
                        variant="outlined"
                      />
                    ))}
                </Row>
              )}

              {errors?.careServices && (
                <Text style={{ color: theme.palette.error.main, fontSize: 13 }}>
                  {errors.careServices}
                </Text>
              )}
            </Column>
          </AccordionDetails>
        </Accordion>
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

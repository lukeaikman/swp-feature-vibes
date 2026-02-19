import React, { useState, useMemo } from 'react'
import { Checkbox, Text, Column } from '@UI'
import { makeStyles } from '@material-ui/core/styles'
import { HEALTHCARE_PROVIDER_TYPES } from '../../../../data/healthcare-provider-types'
import { mapLocaleToReferenceCode } from '../../../../entities/onboarding'
import type { AppLocale, ICareServiceDefinition } from '../../../../entities/onboarding'

const useStyles = makeStyles((theme) => ({
  checkboxItem: {
    '& .MuiCheckbox-root': {
      marginRight: theme.spacing(1),
    },
  },
}))

interface ProviderCategorySelectorProps {
  locale: AppLocale
  selectedCategoryIds: string[]
  selectedSubcategoryIds: string[]
  selectedCareServiceIds: string[]
  onCategoriesChange: (ids: string[]) => void
  onSubcategoriesChange: (ids: string[]) => void
  onCareServicesChange: (ids: string[]) => void
  errors?: { categories?: string; careServices?: string }
}

export const ProviderCategorySelector = ({
  locale,
  selectedCategoryIds,
  selectedSubcategoryIds,
  selectedCareServiceIds,
  onCategoriesChange,
  onSubcategoriesChange,
  onCareServicesChange,
  errors,
}: ProviderCategorySelectorProps) => {
  const classes = useStyles()
  const localeCode = mapLocaleToReferenceCode(locale)

  // Track which categories have had subcategory selections (for visibility state machine)
  const [hasSubcategorySelection, setHasSubcategorySelection] = useState<Record<string, boolean>>({})

  const filteredCategories = useMemo(() => {
    return Object.values(HEALTHCARE_PROVIDER_TYPES).filter((cat) =>
      cat.locale.includes(localeCode)
    )
  }, [localeCode])

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    if (checked) {
      onCategoriesChange([...selectedCategoryIds, categoryId])
    } else {
      onCategoriesChange(selectedCategoryIds.filter((id) => id !== categoryId))

      // Remove all subcategories and care services belonging to this category
      const category = HEALTHCARE_PROVIDER_TYPES[categoryId]
      if (category) {
        const subcatIds = category.subcategories.map((s) => s.id)
        onSubcategoriesChange(selectedSubcategoryIds.filter((id) => !subcatIds.includes(id)))

        const careServiceIds = collectCareServiceIds(categoryId)
        onCareServicesChange(selectedCareServiceIds.filter((id) => !careServiceIds.includes(id)))
      }

      setHasSubcategorySelection((prev) => ({ ...prev, [categoryId]: false }))
    }
  }

  const handleSubcategoryToggle = (categoryId: string, subcategoryId: string, checked: boolean) => {
    let nextIds: string[]
    if (checked) {
      nextIds = [...selectedSubcategoryIds, subcategoryId]
    } else {
      nextIds = selectedSubcategoryIds.filter((id) => id !== subcategoryId)
    }
    onSubcategoriesChange(nextIds)

    const category = HEALTHCARE_PROVIDER_TYPES[categoryId]
    const catSubcatIds = category?.subcategories.map((s) => s.id) ?? []
    const hasAnySelected = nextIds.some((id) => catSubcatIds.includes(id))
    setHasSubcategorySelection((prev) => ({ ...prev, [categoryId]: hasAnySelected }))
  }

  const handleCareServiceToggle = (serviceId: string, checked: boolean) => {
    if (checked) {
      onCareServicesChange([...selectedCareServiceIds, serviceId])
    } else {
      onCareServicesChange(selectedCareServiceIds.filter((id) => id !== serviceId))
    }
  }

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

  // Collect all available care services based on current selections
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

  return (
    <Column gap={2}>
      <Text style={{ fontWeight: 600, fontSize: 16 }}>
        What type of healthcare provider is this location?
      </Text>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {filteredCategories.map((category) => (
          <div key={category.id} className={classes.checkboxItem}>
            <Checkbox
              label={category.name}
              checked={selectedCategoryIds.includes(category.id)}
              onChange={(e) => handleCategoryToggle(category.id, (e.target as HTMLInputElement).checked)}
            />
          </div>
        ))}
      </div>

      {errors?.categories && (
        <Text style={{ color: '#d32f2f', fontSize: 13 }}>{errors.categories}</Text>
      )}

      {selectedCategoryIds.map((catId) => {
        const category = HEALTHCARE_PROVIDER_TYPES[catId]
        if (!category || category.subcategories.length === 0) return null

        const subcats = category.subcategories.filter((s) => s.locale.includes(localeCode))
        if (subcats.length === 0) return null

        const showOnlySelected = hasSubcategorySelection[catId]
        const visibleSubcats = showOnlySelected
          ? subcats.filter((s) => selectedSubcategoryIds.includes(s.id))
          : subcats

        const displaySubcats = visibleSubcats.length === 0 ? subcats : visibleSubcats

        return (
          <Column key={catId} gap={1} style={{ marginLeft: 24 }}>
            <Text style={{ fontWeight: 500, fontSize: 14, color: '#666' }}>
              {category.name} — Subcategories
            </Text>
            {displaySubcats.map((sub) => (
              <div key={sub.id} className={classes.checkboxItem}>
                <Checkbox
                  label={sub.name}
                  checked={selectedSubcategoryIds.includes(sub.id)}
                  onChange={(e) =>
                    handleSubcategoryToggle(catId, sub.id, (e.target as HTMLInputElement).checked)
                  }
                />
              </div>
            ))}
          </Column>
        )
      })}

      {availableCareServices.length > 0 && (
        <Column gap={1} style={{ marginTop: 8 }}>
          <Text style={{ fontWeight: 600, fontSize: 16 }}>
            What care services does this location provide?
          </Text>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {availableCareServices.map((svc) => (
              <div key={svc.id} className={classes.checkboxItem}>
                <Checkbox
                  label={svc.name}
                  checked={selectedCareServiceIds.includes(svc.id)}
                  onChange={(e) => handleCareServiceToggle(svc.id, (e.target as HTMLInputElement).checked)}
                />
              </div>
            ))}
          </div>
          {errors?.careServices && (
            <Text style={{ color: '#d32f2f', fontSize: 13 }}>{errors.careServices}</Text>
          )}
        </Column>
      )}
    </Column>
  )
}

export default ProviderCategorySelector

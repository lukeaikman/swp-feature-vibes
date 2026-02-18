import React, { useState } from 'react'
import { ContentBox, Input, Select, Button, Text, Modal } from '@UI'
import { AddressFields } from '../AddressFields'
import { ProviderCategorySelector } from '../ProviderCategorySelector'
import { AddPersonDialog } from '../AddPersonDialog'
import {
  getLocationLabel,
  mapCountryToLocale,
  createEmptyAddress,
  COUNTRY_GROUPS,
} from '../../../../entities/onboarding'
import type { ILocation, IPerson, IAddress, AppLocale } from '../../../../entities/onboarding'

const countryItems = COUNTRY_GROUPS.flatMap((group) =>
  group.options.map((opt) => ({ value: opt.value, label: opt.label }))
)

interface LocationCardProps {
  index: number
  location: Partial<ILocation>
  isExpanded: boolean
  isCollapsible: boolean
  canRemove: boolean
  people: IPerson[]
  orgAddress?: Partial<IAddress>
  orgUrl?: string
  orgPrimaryContactId?: string
  isFirstLocation: boolean
  onToggle: () => void
  onChange: (location: Partial<ILocation>) => void
  onRemove: () => void
  onPersonCreated: (person: IPerson) => void
}

const ADD_PERSON_VALUE = '__ADD_NEW_PERSON__'

export const LocationCard = ({
  index,
  location,
  isExpanded,
  isCollapsible,
  canRemove,
  people,
  orgAddress,
  orgUrl,
  orgPrimaryContactId,
  isFirstLocation,
  onToggle,
  onChange,
  onRemove,
  onPersonCreated,
}: LocationCardProps) => {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [showAddPerson, setShowAddPerson] = useState(false)

  const locale: AppLocale = location.locale ?? mapCountryToLocale(location.countryOfOperation ?? '')

  const handleCopyFromOrg = () => {
    if (!orgAddress) return
    onChange({
      ...location,
      address: { ...createEmptyAddress(), ...orgAddress } as IAddress,
      countryOfOperation: orgAddress.country ?? '',
      locale: mapCountryToLocale(orgAddress.country ?? ''),
      locationUrl: orgUrl ?? '',
      keyContactId: orgPrimaryContactId ?? undefined,
    })
  }

  const handleCountryChange = (country: string) => {
    onChange({
      ...location,
      countryOfOperation: country,
      locale: mapCountryToLocale(country),
    })
  }

  const handleKeyContactChange = (value: string) => {
    if (value === ADD_PERSON_VALUE) {
      setShowAddPerson(true)
      return
    }
    onChange({ ...location, keyContactId: value || undefined })
  }

  const handlePersonCreated = (person: IPerson) => {
    onPersonCreated(person)
    onChange({ ...location, keyContactId: person.id })
  }

  const contactItems = [
    ...people.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` })),
    { value: ADD_PERSON_VALUE, label: '+ Add new person' },
  ]

  const collapsedSummary = () => {
    const name = location.locationName || 'Unnamed'
    const country = countryItems.find((c) => c.value === location.countryOfOperation)?.label ?? ''
    const catCount = location.selectedProviderCategoryIds?.length ?? 0
    const contact = people.find((p) => p.id === location.keyContactId)
    const contactName = contact ? `${contact.firstName} ${contact.lastName}` : ''

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
        <Text style={{ fontWeight: 600 }}>{getLocationLabel(index)} — {name}</Text>
        {country && <Text style={{ fontSize: 13, color: '#666' }}>{country}</Text>}
        {catCount > 0 && (
          <Text style={{ fontSize: 13, color: '#666' }}>
            {catCount} {catCount === 1 ? 'category' : 'categories'}
          </Text>
        )}
        {contactName && <Text style={{ fontSize: 13, color: '#666' }}>{contactName}</Text>}
      </div>
    )
  }

  return (
    <ContentBox>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: isCollapsible ? 'pointer' : 'default',
          marginBottom: isExpanded ? 16 : 0,
        }}
        onClick={isCollapsible ? onToggle : undefined}
      >
        {isExpanded ? (
          <Text style={{ fontWeight: 700, fontSize: 18 }}>{getLocationLabel(index)}</Text>
        ) : (
          collapsedSummary()
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          {canRemove && (
            <Button
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                setShowRemoveConfirm(true)
              }}
            >
              Remove
            </Button>
          )}
          {isCollapsible && (
            <Text style={{ fontSize: 13, color: '#1976d2', cursor: 'pointer' }}>
              {isExpanded ? 'Collapse' : 'Expand'}
            </Text>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isFirstLocation && orgAddress && (
            <Text
              style={{ color: '#1976d2', cursor: 'pointer', fontSize: 14 }}
              onClick={handleCopyFromOrg}
            >
              Copy details from organisation
            </Text>
          )}

          {/* Row: Location Name | Location URL */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input
              label="Location Name"
              fullWidth
              value={location.locationName ?? ''}
              onChange={(e) =>
                onChange({ ...location, locationName: (e.target as HTMLInputElement).value })
              }
              required
            />
            <Input
              label="Location URL"
              type="url"
              fullWidth
              value={location.locationUrl ?? ''}
              onChange={(e) =>
                onChange({ ...location, locationUrl: (e.target as HTMLInputElement).value })
              }
              helperText="Optional"
            />
          </div>

          <Text style={{ fontWeight: 600, fontSize: 16 }}>Location Address</Text>

          <AddressFields
            address={location.address ?? createEmptyAddress()}
            onChange={(addr) =>
              onChange({ ...location, address: { ...createEmptyAddress(), ...addr } as IAddress })
            }
          />

          {/* Row: Country of Operation | Key Contact */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Select
              label="Country of Operation"
              value={location.countryOfOperation ?? ''}
              items={countryItems}
              onChange={handleCountryChange}
              emptyLabel="Select a country"
              required
            />
            <Select
              label="Key Contact"
              value={location.keyContactId ?? ''}
              items={contactItems}
              onChange={handleKeyContactChange}
              emptyLabel="Select a contact (optional)"
            />
          </div>

          <ProviderCategorySelector
            locale={locale}
            selectedCategoryIds={location.selectedProviderCategoryIds ?? []}
            selectedSubcategoryIds={location.selectedProviderSubcategoryIds ?? []}
            selectedCareServiceIds={location.careServiceIds ?? []}
            onCategoriesChange={(ids) => onChange({ ...location, selectedProviderCategoryIds: ids })}
            onSubcategoriesChange={(ids) => onChange({ ...location, selectedProviderSubcategoryIds: ids })}
            onCareServicesChange={(ids) => onChange({ ...location, careServiceIds: ids })}
          />
        </div>
      )}

      {/* Remove confirmation modal */}
      <Modal
        isOpen={showRemoveConfirm}
        close={() => setShowRemoveConfirm(false)}
        title="Remove Location"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Text>
            Are you sure you want to remove {getLocationLabel(index)}
            {location.locationName ? ` — ${location.locationName}` : ''}?
          </Text>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setShowRemoveConfirm(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setShowRemoveConfirm(false)
                onRemove()
              }}
            >
              Remove
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add person dialog */}
      <AddPersonDialog
        isOpen={showAddPerson}
        onClose={() => setShowAddPerson(false)}
        onPersonCreated={handlePersonCreated}
      />
    </ContentBox>
  )
}

export default LocationCard

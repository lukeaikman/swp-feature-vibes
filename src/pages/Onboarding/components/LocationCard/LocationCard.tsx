import React, { useState } from 'react'
import { ContentBox, Input, Select, Button, Text, Modal, Row, Column } from '@UI'
import { Divider, useMediaQuery } from '@material-ui/core'
import { useTheme } from '@material-ui/core/styles'
import { AddressFields } from '../AddressFields'
import { ProviderCategorySelector } from '../ProviderCategorySelector'
import type { SelectionPayload } from '../ProviderCategorySelector/ProviderCategorySelector'
import { AddPersonDialog } from '../AddPersonDialog'
import {
  getLocationLabel,
  mapCountryToLocale,
  createEmptyAddress,
  COUNTRY_GROUPS,
} from '../../../../entities/onboarding'
import type { ILocation, AppLocale } from '../../../../entities/onboarding'
import type { IUser, IAddress } from '../../../../types'

const countryItems = COUNTRY_GROUPS.flatMap((group) =>
  group.options.map((opt) => ({ value: opt.value, label: opt.label }))
)

interface LocationCardProps {
  index: number
  location: Partial<ILocation>
  isExpanded: boolean
  isCollapsible: boolean
  canRemove: boolean
  people: IUser[]
  orgAddress?: Partial<IAddress>
  orgUrl?: string
  orgPrimaryContactId?: string
  isFirstLocation: boolean
  onToggle: () => void
  onChange: (location: Partial<ILocation>) => void
  onRemove: () => void
  onPersonCreated: (person: IUser) => void
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

  const theme = useTheme()
  const isStacked = useMediaQuery(theme.breakpoints.down('md'))

  const locale: AppLocale = location.locale ?? mapCountryToLocale(location.address?.country ?? '')

  const handleCopyFromOrg = () => {
    if (!orgAddress) return
    onChange({
      ...location,
      address: { ...createEmptyAddress(), ...orgAddress } as IAddress,
      locale: mapCountryToLocale(orgAddress.country ?? ''),
      locationUrl: orgUrl ?? '',
      keyContactId: orgPrimaryContactId ?? undefined,
    })
  }

  const handleKeyContactChange = (value: string) => {
    if (value === ADD_PERSON_VALUE) {
      setShowAddPerson(true)
      return
    }
    onChange({ ...location, keyContactId: value || undefined })
  }

  const handlePersonCreated = (person: IUser) => {
    onPersonCreated(person)
    onChange({ ...location, keyContactId: person.id })
  }

  const contactItems = [
    ...people.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` })),
    { value: ADD_PERSON_VALUE, label: '+ Add new person' },
  ]

  const addressSummary = () => {
    const parts = [location.address?.addressLine1, location.address?.city].filter(Boolean)
    return parts.join(', ') || ''
  }

  const collapsedSummary = () => {
    const name = location.locationName || 'Unnamed'
    const addr = addressSummary()
    const catCount = location.selectedProviderCategoryIds?.length ?? 0
    const contact = people.find((p) => p.id === location.keyContactId)
    const contactName = contact ? `${contact.firstName} ${contact.lastName}` : ''

    return (
      <Row gap={2} alignItems="center" flex={1}>
        <Text style={{ fontWeight: 600 }}>{getLocationLabel(index)} — {name}</Text>
        {addr && <Text style={{ fontSize: 13, color: '#666' }}>{addr}</Text>}
        {catCount > 0 && (
          <Text style={{ fontSize: 13, color: '#666' }}>
            {catCount} {catCount === 1 ? 'category' : 'categories'}
          </Text>
        )}
        {contactName && <Text style={{ fontSize: 13, color: '#666' }}>{contactName}</Text>}
      </Row>
    )
  }

  return (
    <ContentBox>
      <Row
        alignItems="center"
        justifyContent="space-between"
        style={{
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
        <Row gap={1} alignItems="center">
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
              {isExpanded ? 'Collapse' : 'Edit'}
            </Text>
          )}
        </Row>
      </Row>

      {isExpanded && (
        <Column gap={3}>
          {isFirstLocation && orgAddress && (
            <Text
              style={{ color: '#1976d2', cursor: 'pointer', fontSize: 14 }}
              onClick={handleCopyFromOrg}
            >
              Copy details from organisation
            </Text>
          )}

          {isStacked ? (
            <Column gap={3}>
              <Column gap={2}>
                <Input
                  label="Location Name *"
                  fullWidth
                  value={location.locationName ?? ''}
                  onChange={(e) =>
                    onChange({ ...location, locationName: (e.target as HTMLInputElement).value })
                  }
                />
                <Input
                  label="Location URL"
                  type="url"
                  fullWidth
                  value={location.locationUrl ?? ''}
                  onChange={(e) =>
                    onChange({ ...location, locationUrl: (e.target as HTMLInputElement).value })
                  }
                />
                <Select
                  label="Key Contact"
                  fullWidth
                  value={location.keyContactId ?? ''}
                  items={contactItems}
                  onChange={handleKeyContactChange}
                  emptyLabel="Select a contact (optional)"
                />
              </Column>

              <Divider />

              <Column gap={2}>
                <Text style={{ fontWeight: 600, fontSize: 16 }}>Location Address</Text>
                <AddressFields
                  address={location.address ?? createEmptyAddress()}
                  onChange={(addr) => {
                    const merged = { ...createEmptyAddress(), ...addr } as IAddress
                    onChange({
                      ...location,
                      address: merged,
                      locale: mapCountryToLocale(merged.country ?? ''),
                    })
                  }}
                />
              </Column>
            </Column>
          ) : (
            <Row gap={3}>
              <Column gap={2} flex={1}>
                <Input
                  label="Location Name *"
                  fullWidth
                  value={location.locationName ?? ''}
                  onChange={(e) =>
                    onChange({ ...location, locationName: (e.target as HTMLInputElement).value })
                  }
                />
                <Input
                  label="Location URL"
                  type="url"
                  fullWidth
                  value={location.locationUrl ?? ''}
                  onChange={(e) =>
                    onChange({ ...location, locationUrl: (e.target as HTMLInputElement).value })
                  }
                />
                <Select
                  label="Key Contact"
                  fullWidth
                  value={location.keyContactId ?? ''}
                  items={contactItems}
                  onChange={handleKeyContactChange}
                  emptyLabel="Select a contact (optional)"
                />
              </Column>

              <Divider
                orientation="vertical"
                flexItem
                style={{ backgroundColor: theme.palette.primary.main, opacity: 0.15 }}
              />

              <Column gap={2} flex={2}>
                <AddressFields
                  address={location.address ?? createEmptyAddress()}
                  onChange={(addr) => {
                    const merged = { ...createEmptyAddress(), ...addr } as IAddress
                    onChange({
                      ...location,
                      address: merged,
                      locale: mapCountryToLocale(merged.country ?? ''),
                    })
                  }}
                />
              </Column>
            </Row>
          )}

          <Divider />

          <ProviderCategorySelector
            locale={locale}
            selectedCategoryIds={location.selectedProviderCategoryIds ?? []}
            selectedSubcategoryIds={location.selectedProviderSubcategoryIds ?? []}
            selectedCareServiceIds={location.careServiceIds ?? []}
            onSelectionChange={(payload: SelectionPayload) =>
              onChange({
                ...location,
                selectedProviderCategoryIds: payload.selectedCategoryIds,
                selectedProviderSubcategoryIds: payload.selectedSubcategoryIds,
                careServiceIds: payload.selectedCareServiceIds,
              })
            }
          />
        </Column>
      )}

      <Modal
        isOpen={showRemoveConfirm}
        close={() => setShowRemoveConfirm(false)}
        title="Remove Location"
      >
        <Column gap={2}>
          <Text>
            Are you sure you want to remove {getLocationLabel(index)}
            {location.locationName ? ` — ${location.locationName}` : ''}?
          </Text>
          <Row gap={1} justifyContent="flex-end">
            <Button onClick={() => setShowRemoveConfirm(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setShowRemoveConfirm(false)
                onRemove()
              }}
            >
              Remove
            </Button>
          </Row>
        </Column>
      </Modal>

      <AddPersonDialog
        isOpen={showAddPerson}
        onClose={() => setShowAddPerson(false)}
        onPersonCreated={handlePersonCreated}
      />
    </ContentBox>
  )
}

export default LocationCard

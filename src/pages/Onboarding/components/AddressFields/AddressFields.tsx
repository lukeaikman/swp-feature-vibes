import React from 'react'
import { Input, Select } from '@UI'
import { COUNTRY_GROUPS } from '../../../../entities/onboarding'
import type { IAddress } from '../../../../types'

interface AddressFieldsProps {
  address: Partial<IAddress>
  onChange: (address: Partial<IAddress>) => void
  errors?: Record<string, string | undefined>
}

const countryItems = COUNTRY_GROUPS.flatMap((group) =>
  group.options.map((opt) => ({ value: opt.value, label: opt.label }))
)

export const AddressFields = ({ address, onChange, errors }: AddressFieldsProps) => {
  const update = (field: keyof IAddress, value: string) => {
    onChange({ ...address, [field]: value })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Row 1: Address Line 1 (full width, keep label) */}
      <Input
        label="Address Line 1 *"
        fullWidth
        value={address.addressLine1 ?? ''}
        onChange={(e) => update('addressLine1', (e.target as HTMLInputElement).value)}
        errors={errors?.addressLine1 ? [errors.addressLine1] : undefined}
      />

      {/* Row 2: Address Line 2 (full width, placeholder only) */}
      <Input
        fullWidth
        placeholder="Address Line 2"
        value={address.addressLine2 ?? ''}
        onChange={(e) => update('addressLine2', (e.target as HTMLInputElement).value)}
      />

      {/* Row 3: City | County/State (2-up, placeholders) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input
          fullWidth
          placeholder="City"
          value={address.city ?? ''}
          onChange={(e) => update('city', (e.target as HTMLInputElement).value)}
        />
        <Input
          fullWidth
          placeholder="County / State"
          value={address.state ?? ''}
          onChange={(e) => update('state', (e.target as HTMLInputElement).value)}
        />
      </div>

      {/* Row 4: Postcode | Country (2-up) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input
          label="Postcode *"
          fullWidth
          value={address.zipCode ?? ''}
          onChange={(e) => update('zipCode', (e.target as HTMLInputElement).value)}
          errors={errors?.zipCode ? [errors.zipCode] : undefined}
        />
        <Select
          label="Country *"
          value={address.country ?? ''}
          items={countryItems}
          onChange={(value) => update('country', value)}
          emptyLabel="Select a country"
          errors={errors?.country ? [errors.country] : undefined}
        />
      </div>
    </div>
  )
}

export default AddressFields

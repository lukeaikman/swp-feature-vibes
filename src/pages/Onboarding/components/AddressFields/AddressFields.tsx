import React from 'react'
import { Input, Select, Row, Column } from '@UI'
import { useMediaQuery } from '@material-ui/core'
import { useTheme } from '@material-ui/core/styles'
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
  const theme = useTheme()
  const isNarrow = useMediaQuery(theme.breakpoints.down('sm'))

  const update = (field: keyof IAddress, value: string) => {
    onChange({ ...address, [field]: value })
  }

  const FieldRow = isNarrow ? Column : Row

  return (
    <Column gap={2}>
      <FieldRow gap={2}>
        <Input
          label="Address Line 1 *"
          fullWidth
          value={address.addressLine1 ?? ''}
          onChange={(e) => update('addressLine1', (e.target as HTMLInputElement).value)}
          errors={errors?.addressLine1 ? [errors.addressLine1] : undefined}
          containerStyle={{ flex: 1 }}
        />
        <Input
          label="Address Line 2"
          fullWidth
          value={address.addressLine2 ?? ''}
          onChange={(e) => update('addressLine2', (e.target as HTMLInputElement).value)}
          containerStyle={{ flex: 1 }}
        />
      </FieldRow>

      <FieldRow gap={2}>
        <Input
          label="City"
          fullWidth
          value={address.city ?? ''}
          onChange={(e) => update('city', (e.target as HTMLInputElement).value)}
          containerStyle={{ flex: 1 }}
        />
        <Input
          label="County / State"
          fullWidth
          value={address.state ?? ''}
          onChange={(e) => update('state', (e.target as HTMLInputElement).value)}
          containerStyle={{ flex: 1 }}
        />
      </FieldRow>

      <FieldRow gap={2}>
        <Input
          label="Postcode *"
          fullWidth
          value={address.zipCode ?? ''}
          onChange={(e) => update('zipCode', (e.target as HTMLInputElement).value)}
          errors={errors?.zipCode ? [errors.zipCode] : undefined}
          containerStyle={{ flex: 1 }}
        />
        <div style={{ flex: 1 }}>
          <Select
            label="Country *"
            fullWidth
            value={address.country ?? ''}
            items={countryItems}
            onChange={(value) => update('country', value)}
            emptyLabel="Select a country"
            errors={errors?.country ? [errors.country] : undefined}
          />
        </div>
      </FieldRow>
    </Column>
  )
}

export default AddressFields

import React, { useCallback, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { ContentBox, Input, Button, Text } from '@UI'
import { AddressFields } from '../AddressFields'
import { createEmptyAddress } from '../../../../entities/onboarding'
import type { IClient, IUser, IAddress } from '../../../../types'

interface OrganisationStepProps {
  orgData: Partial<IClient>
  primaryContact: Partial<IUser>
  onOrgChange: (data: Partial<IClient>) => void
  onContactChange: (data: Partial<IUser>) => void
  onNext: (org: Partial<IClient>, contact: Partial<IUser>) => void
}

export const OrganisationStep = ({
  orgData,
  primaryContact,
  onOrgChange,
  onContactChange,
  onNext,
}: OrganisationStepProps) => {
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({})
  const markTouched = useCallback((name: string) => {
    setTouched((prev) => {
      if (prev.has(name)) return prev
      const next = new Set(prev)
      next.add(name)
      return next
    })
  }, [])

  const form = useForm({
    defaultValues: {
      organisationName: orgData.organisation_name ?? '',
      contactFirstName: primaryContact.firstName ?? '',
      contactLastName: primaryContact.lastName ?? '',
      contactEmail: primaryContact.email ?? '',
      contactPhone: primaryContact.phone ?? '',
      address: (orgData.address ?? createEmptyAddress()) as IAddress,
      phoneNumber: orgData.phone ?? '',
      organisationUrl: orgData.organisationUrl ?? '',
    },
    onSubmit: async ({ value }) => {
      const addrErr: Record<string, string> = {}
      if (!value.address.addressLine1?.trim()) addrErr.addressLine1 = 'Address line 1 is required'
      if (!value.address.zipCode?.trim()) addrErr.zipCode = 'Postcode is required'
      if (!value.address.country?.trim()) addrErr.country = 'Country is required'
      setAddressErrors(addrErr)
      if (Object.keys(addrErr).length > 0) return

      const org: Partial<IClient> = {
        ...orgData,
        organisation_name: value.organisationName,
        address: value.address,
        phone: value.phoneNumber,
        organisationUrl: value.organisationUrl || undefined,
      }
      const contact: Partial<IUser> = {
        ...primaryContact,
        firstName: value.contactFirstName,
        lastName: value.contactLastName,
        email: value.contactEmail,
        phone: value.contactPhone,
      }
      onOrgChange(org)
      onContactChange(contact)
      onNext(org, contact)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setSubmitted(true)
        setTouched(new Set([
          'organisationName', 'phoneNumber', 'organisationUrl',
          'contactFirstName', 'contactLastName', 'contactEmail', 'contactPhone',
        ]))
        const addr = form.getFieldValue('address')
        const addrErr: Record<string, string> = {}
        if (!addr.addressLine1?.trim()) addrErr.addressLine1 = 'Address line 1 is required'
        if (!addr.zipCode?.trim()) addrErr.zipCode = 'Postcode is required'
        if (!addr.country?.trim()) addrErr.country = 'Country is required'
        setAddressErrors(addrErr)
        form.handleSubmit()
      }}
    >
      <ContentBox>
        <Text style={{ fontWeight: 700, fontSize: 20, marginBottom: 20 }}>
          Organisation Details
        </Text>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Row 1: Org Name | Org URL */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <form.Field
              name="organisationName"
              validators={{
                onChange: ({ value }) => {
                  if (!value.trim()) return 'Organisation name is required'
                  if (value.length > 200) return 'Maximum 200 characters'
                  return undefined
                },
              }}
              children={(field) => (
                <Input
                  label="Organisation Name *"
                  fullWidth
                  value={field.state.value}
                  onChange={(e) => field.handleChange((e.target as HTMLInputElement).value)}
                  onBlur={() => markTouched(field.name)}
                  errors={(touched.has(field.name) || submitted) ? field.state.meta.errors : undefined}
                />
              )}
            />
            <form.Field
              name="organisationUrl"
              validators={{
                onChange: ({ value }) => {
                  if (value && !/^[^\s]+\.[^\s]+/.test(value)) return 'Must be a valid URL'
                  return undefined
                },
              }}
              children={(field) => (
                <Input
                  label="Organisation URL"
                  type="url"
                  fullWidth
                  value={field.state.value}
                  onChange={(e) => field.handleChange((e.target as HTMLInputElement).value)}
                  onBlur={() => markTouched(field.name)}
                  errors={(touched.has(field.name) || submitted) ? field.state.meta.errors : undefined}
                />
              )}
            />
          </div>

          {/* Row 2: Org Phone */}
          <form.Field
            name="phoneNumber"
            validators={{
              onChange: ({ value }) => !value.trim() ? 'Organisation phone number is required' : undefined,
            }}
            children={(field) => (
              <Input
                label="Organisation Phone Number *"
                type="tel"
                fullWidth
                value={field.state.value}
                onChange={(e) => field.handleChange((e.target as HTMLInputElement).value)}
                onBlur={() => markTouched(field.name)}
                errors={(touched.has(field.name) || submitted) ? field.state.meta.errors : undefined}
              />
            )}
          />

          <Text style={{ fontWeight: 600, fontSize: 16, marginTop: 8 }}>Primary Contact</Text>

          {/* Row 3: First Name | Last Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <form.Field
              name="contactFirstName"
              validators={{
                onChange: ({ value }) => !value.trim() ? 'First name is required' : undefined,
              }}
              children={(field) => (
                <Input
                  label="First Name *"
                  fullWidth
                  value={field.state.value}
                  onChange={(e) => field.handleChange((e.target as HTMLInputElement).value)}
                  onBlur={() => markTouched(field.name)}
                  errors={(touched.has(field.name) || submitted) ? field.state.meta.errors : undefined}
                />
              )}
            />
            <form.Field
              name="contactLastName"
              validators={{
                onChange: ({ value }) => !value.trim() ? 'Last name is required' : undefined,
              }}
              children={(field) => (
                <Input
                  label="Last Name *"
                  fullWidth
                  value={field.state.value}
                  onChange={(e) => field.handleChange((e.target as HTMLInputElement).value)}
                  onBlur={() => markTouched(field.name)}
                  errors={(touched.has(field.name) || submitted) ? field.state.meta.errors : undefined}
                />
              )}
            />
          </div>

          {/* Row 4: Email | Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <form.Field
              name="contactEmail"
              validators={{
                onChange: ({ value }) => {
                  if (!value.trim()) return 'Email is required'
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format'
                  return undefined
                },
              }}
              children={(field) => (
                <Input
                  label="Email *"
                  type="email"
                  fullWidth
                  value={field.state.value}
                  onChange={(e) => field.handleChange((e.target as HTMLInputElement).value)}
                  onBlur={() => markTouched(field.name)}
                  errors={(touched.has(field.name) || submitted) ? field.state.meta.errors : undefined}
                />
              )}
            />
            <form.Field
              name="contactPhone"
              validators={{
                onChange: ({ value }) => !value.trim() ? 'Phone number is required' : undefined,
              }}
              children={(field) => (
                <Input
                  label="Phone Number *"
                  type="tel"
                  fullWidth
                  value={field.state.value}
                  onChange={(e) => field.handleChange((e.target as HTMLInputElement).value)}
                  onBlur={() => markTouched(field.name)}
                  errors={(touched.has(field.name) || submitted) ? field.state.meta.errors : undefined}
                />
              )}
            />
          </div>

          <Text style={{ fontWeight: 600, fontSize: 16, marginTop: 8 }}>Organisation Address</Text>

          <form.Field
            name="address"
            children={(field) => (
              <AddressFields
                address={field.state.value}
                onChange={(addr) => {
                  field.handleChange({ ...field.state.value, ...addr } as IAddress)
                  if (Object.keys(addressErrors).length) setAddressErrors({})
                }}
                errors={submitted ? addressErrors : undefined}
              />
            )}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <Button type="submit">Next</Button>
        </div>
      </ContentBox>
    </form>
  )
}

export default OrganisationStep

import React, { useState } from 'react'
import { Button, Text } from '@UI'
import { LocationCard } from '../LocationCard'
import type { ILocation } from '../../../../entities/onboarding'
import type { IClient, IUser } from '../../../../types'

interface LocationStepProps {
  orgData: Partial<IClient>
  primaryContact: Partial<IUser>
  locations: Partial<ILocation>[]
  people: IUser[]
  onLocationsChange: (locations: Partial<ILocation>[]) => void
  onPeopleChange: (people: IUser[]) => void
  onBack: () => void
  onComplete: () => void
  isSubmitting: boolean
  submitError: string | null
}

export const LocationStep = ({
  orgData,
  primaryContact,
  locations,
  people,
  onLocationsChange,
  onPeopleChange,
  onBack,
  onComplete,
  isSubmitting,
  submitError,
}: LocationStepProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number>(locations.length - 1)
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({})

  const isCollapsible = locations.length > 1

  const handleAddLocation = () => {
    const newLocations = [...locations, {}]
    onLocationsChange(newLocations)
    setExpandedIndex(newLocations.length - 1)
  }

  const handleRemoveLocation = (index: number) => {
    const newLocations = locations.filter((_, i) => i !== index)
    onLocationsChange(newLocations)
    if (expandedIndex >= newLocations.length) {
      setExpandedIndex(newLocations.length - 1)
    }
  }

  const handleLocationChange = (index: number, location: Partial<ILocation>) => {
    const newLocations = [...locations]
    newLocations[index] = location
    onLocationsChange(newLocations)
  }

  const handlePersonCreated = (person: IUser) => {
    onPeopleChange([...people, person])
  }

  const validate = (): boolean => {
    const errors: Record<number, string[]> = {}
    let isValid = true

    locations.forEach((loc, i) => {
      const locErrors: string[] = []
      if (!loc.locationName?.trim()) locErrors.push('Location name is required')
      if (!loc.address?.addressLine1?.trim()) locErrors.push('Address line 1 is required')
      if (!loc.address?.zipCode?.trim()) locErrors.push('Postcode is required')
      if (!loc.countryOfOperation) locErrors.push('Country of operation is required')
      if (!loc.selectedProviderCategoryIds?.length) locErrors.push('At least one provider category is required')

      if (locErrors.length > 0) {
        errors[i] = locErrors
        isValid = false
      }
    })

    setValidationErrors(errors)
    if (!isValid) {
      const firstErrorIndex = parseInt(Object.keys(errors)[0])
      setExpandedIndex(firstErrorIndex)
    }
    return isValid
  }

  const handleComplete = () => {
    if (!validate()) return
    onComplete()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Text style={{ fontWeight: 700, fontSize: 20 }}>Location Setup</Text>

      {locations.map((location, index) => (
        <div key={index}>
          <LocationCard
            index={index}
            location={location}
            isExpanded={expandedIndex === index}
            isCollapsible={isCollapsible}
            canRemove={locations.length > 1}
            people={people}
            orgAddress={orgData.address}
            orgUrl={orgData.organisationUrl}
            orgPrimaryContactId={orgData.primaryContactId}
            isFirstLocation={index === 0}
            onToggle={() => setExpandedIndex(expandedIndex === index ? -1 : index)}
            onChange={(loc) => handleLocationChange(index, loc)}
            onRemove={() => handleRemoveLocation(index)}
            onPersonCreated={handlePersonCreated}
          />
          {validationErrors[index] && (
            <div style={{ marginTop: 4 }}>
              {validationErrors[index].map((err, errIdx) => (
                <Text key={errIdx} style={{ color: '#d32f2f', fontSize: 13 }}>
                  {err}
                </Text>
              ))}
            </div>
          )}
        </div>
      ))}

      <Button onClick={handleAddLocation}>+ Add Another Location</Button>

      {submitError && (
        <Text style={{ color: '#d32f2f', fontSize: 14 }}>{submitError}</Text>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <Button onClick={onBack}>Back</Button>
        <Button onClick={handleComplete} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Complete Setup'}
        </Button>
      </div>
    </div>
  )
}

export default LocationStep

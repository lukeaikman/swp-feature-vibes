import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer, ContentBox, Text } from '@UI'
import { ROUTES } from '../../app/routes'
import {
  useCreateOrganisation,
  useUpdateOrganisation,
  useCreatePerson,
  useCreateLocation,
  mapCountryToLocale,
} from '../../entities/onboarding'
import type { IOrganisation, IPerson, ILocation } from '../../entities/onboarding'
import { OrganisationStep } from './components/OrganisationStep'
import { LocationStep } from './components/LocationStep'

const Onboarding = () => {
  const navigate = useNavigate()

  const [step, setStep] = useState<1 | 2>(1)

  // Organisation state
  const [orgData, setOrgData] = useState<Partial<IOrganisation>>({})
  const [primaryContact, setPrimaryContact] = useState<Partial<IPerson>>({})

  // Track whether org/contact have been persisted (for back → next using PUT vs POST)
  const [persistedOrgId, setPersistedOrgId] = useState<string | null>(null)
  const [persistedContactId, setPersistedContactId] = useState<string | null>(null)

  // Locations state
  const [locations, setLocations] = useState<Partial<ILocation>[]>([{}])

  // People created during onboarding (for key contact dropdown)
  const [people, setPeople] = useState<IPerson[]>([])

  // Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Mutations
  const createOrg = useCreateOrganisation()
  const updateOrg = useUpdateOrganisation()
  const createPerson = useCreatePerson()
  const createLocation = useCreateLocation()

  const handleStep1Next = async () => {
    setFeedback(null)
    setIsSubmitting(true)

    try {
      let personId = persistedContactId
      if (!personId) {
        const person = await createPerson.mutateAsync({
          ...primaryContact,
          role: 'primary_contact',
          createdAt: new Date().toISOString(),
        })
        personId = person.id
        setPersistedContactId(person.id)
        setPeople((prev) => [...prev, person])
      }

      let orgId = persistedOrgId
      const orgPayload = {
        ...orgData,
        primaryContactId: personId,
        isDeleted: false,
        _meta: {
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: '8f0f9397-089c-4e99-9dc6-96b5bb742504',
          updated_by: '8f0f9397-089c-4e99-9dc6-96b5bb742504',
        },
      }

      if (orgId) {
        await updateOrg.mutateAsync({ id: orgId, ...orgPayload })
      } else {
        const org = await createOrg.mutateAsync(orgPayload)
        orgId = org.id
        setPersistedOrgId(org.id)
      }

      setOrgData((prev) => ({ ...prev, primaryContactId: personId! }))
      setFeedback({ type: 'success', message: 'Organisation details saved' })
      setStep(2)
    } catch {
      setFeedback({ type: 'error', message: 'Failed to save organisation. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComplete = async () => {
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      for (const location of locations) {
        await createLocation.mutateAsync({
          ...location,
          organisationId: persistedOrgId!,
          locale: mapCountryToLocale(location.countryOfOperation ?? ''),
          selectedProviderCategoryIds: location.selectedProviderCategoryIds ?? [],
          selectedProviderSubcategoryIds: location.selectedProviderSubcategoryIds ?? [],
          careServiceIds: location.careServiceIds ?? [],
          isDeleted: false,
          _meta: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: '8f0f9397-089c-4e99-9dc6-96b5bb742504',
            updated_by: '8f0f9397-089c-4e99-9dc6-96b5bb742504',
          },
        })
      }

      setFeedback({ type: 'success', message: 'Onboarding complete!' })
      setTimeout(() => navigate(ROUTES.DASHBOARD), 1500)
    } catch {
      setSubmitError('Failed to save locations. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageContainer breadcrumbs={[{ label: 'Onboarding' }]}>
      {feedback && (
        <ContentBox
          style={{
            backgroundColor: feedback.type === 'success' ? '#e8f5e9' : '#ffebee',
            marginBottom: 16,
          }}
        >
          <Text>{feedback.message}</Text>
        </ContentBox>
      )}

      {step === 1 && (
        <OrganisationStep
          orgData={orgData}
          primaryContact={primaryContact}
          onOrgChange={setOrgData}
          onContactChange={setPrimaryContact}
          onNext={handleStep1Next}
        />
      )}

      {step === 2 && (
        <LocationStep
          orgData={orgData}
          primaryContact={primaryContact}
          locations={locations}
          people={people}
          onLocationsChange={setLocations}
          onPeopleChange={setPeople}
          onBack={() => {
            setFeedback(null)
            setStep(1)
          }}
          onComplete={handleComplete}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      )}
    </PageContainer>
  )
}

export default Onboarding

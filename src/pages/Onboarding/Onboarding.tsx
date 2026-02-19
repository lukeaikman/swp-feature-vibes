import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer, ContentBox, Text } from '@UI'
import { ROUTES } from '../../app/routes'
import {
  useCreateClient,
  useUpdateClient,
  useCreateUser,
  useCreateLocation,
  mapCountryToLocale,
} from '../../entities/onboarding'
import type { ILocation } from '../../entities/onboarding'
import type { IClient, IUser } from '../../types'
import { Roles } from '../../types'
import { OrganisationStep } from './components/OrganisationStep'
import { LocationStep } from './components/LocationStep'

const Onboarding = () => {
  const navigate = useNavigate()

  // TODO: Remove hardcoded step/IDs after testing — revert to step 1, null IDs
  const [step, setStep] = useState<1 | 2>(2)

  const [orgData, setOrgData] = useState<Partial<IClient>>({})
  const [primaryContact, setPrimaryContact] = useState<Partial<IUser>>({})

  const [persistedOrgId, setPersistedOrgId] = useState<string | null>('org-001')
  const [persistedContactId, setPersistedContactId] = useState<string | null>('person-001')

  const [locations, setLocations] = useState<Partial<ILocation>[]>([{}])

  const [people, setPeople] = useState<IUser[]>([])

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const createUser = useCreateUser()
  const createLocation = useCreateLocation()

  const handleStep1Next = async (org: Partial<IClient>, contact: Partial<IUser>) => {
    setFeedback(null)
    setIsSubmitting(true)

    try {
      let personId = persistedContactId
      if (!personId) {
        const person = await createUser.mutateAsync({
          ...contact,
          roles: [Roles.ADMIN],
          language: 'en',
          isDeleted: false,
        })
        personId = person.id
        setPersistedContactId(person.id)
        setPeople((prev) => [...prev, person as IUser])
      }

      let orgId = persistedOrgId
      const orgPayload: Partial<IClient> = {
        ...org,
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
        await updateClient.mutateAsync({ id: orgId, ...orgPayload })
      } else {
        const created = await createClient.mutateAsync(orgPayload)
        orgId = (created as { id: string }).id
        setPersistedOrgId(orgId)
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

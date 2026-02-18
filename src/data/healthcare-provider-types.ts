import type { IHealthcareProviderCategory } from '../entities/onboarding'

/**
 * Static reference data for provider categories, subcategories, and care services.
 * In production this will be served from `/api/v1/reference/provider-types`.
 */
export const HEALTHCARE_PROVIDER_TYPES: Record<string, IHealthcareProviderCategory> = {
  long_term_care: {
    id: 'long_term_care',
    name: 'Long-Term Care and Social Care',
    locale: ['us', 'uk', 'ni', 'ie'],
    careServices: [
      { id: 'rehabilitation', name: 'Rehabilitation Services', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'homeHealth', name: 'Home Health Care', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'palliative', name: 'Palliative Care', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'physicalTherapy', name: 'Physical Therapy', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'endOfLife', name: 'End-of-Life Care', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'alzheimers', name: "Alzheimer's Care", locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'memory', name: 'Memory Care', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'assistedLiving', name: 'Assisted Living Support', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'skilledNursing', name: 'Skilled Nursing Care', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'occupational', name: 'Occupational Therapy', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'dementia', name: 'Dementia Care', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'respite', name: 'Respite Care', locale: ['us', 'uk', 'ni', 'ie'] },
    ],
    subcategories: [
      { id: 'nursing_homes', name: 'Nursing Homes / Care Homes', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'assisted_living', name: 'Assisted Living Facilities', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'home_care', name: 'Home Care Agencies', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'hospice', name: 'Hospice Providers', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'adult_day', name: 'Adult Day Care Centres', locale: ['uk', 'ni', 'ie'] },
    ],
  },
  mental_health: {
    id: 'mental_health',
    name: 'Mental Health and Behavioral Health Services',
    locale: ['us', 'uk', 'ni', 'ie'],
    subcategories: [
      {
        id: 'substance_abuse_facilities',
        name: 'Substance Abuse Treatment Facilities',
        locale: ['us', 'uk', 'ni', 'ie'],
        careServices: [
          { id: 'detox', name: 'Detoxification Services', locale: ['us', 'uk', 'ni', 'ie'] },
          { id: 'outpatient_rehab', name: 'Outpatient Rehabilitation', locale: ['us', 'uk', 'ni', 'ie'] },
          { id: 'inpatient_rehab', name: 'Inpatient Rehabilitation', locale: ['us', 'uk', 'ni', 'ie'] },
        ],
      },
      { id: 'psychiatric_hospitals', name: 'Psychiatric Hospitals', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'counselling_centres', name: 'Counselling Centres', locale: ['uk', 'ni', 'ie'] },
      { id: 'counseling_centers', name: 'Counseling Centers', locale: ['us'] },
    ],
  },
}

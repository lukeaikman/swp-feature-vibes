import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { IOrganisation, IPerson, ILocation } from './types'

// ─── Query keys ───

export const ORGANISATIONS_QUERY = 'organisations'
export const PEOPLE_QUERY = 'people'
export const LOCATIONS_QUERY = 'locations'

// ─── Organisation hooks ───

export const useGetOrganisation = (id: string) =>
  useQuery({
    queryKey: [ORGANISATIONS_QUERY, id],
    queryFn: async () => {
      const { data } = await axios.get<IOrganisation>(`/api/onboarding/organisations/${id}`)
      return data
    },
    enabled: !!id,
  })

export const useCreateOrganisation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<IOrganisation>) => {
      const { data } = await axios.post<IOrganisation>('/api/onboarding/organisations', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORGANISATIONS_QUERY] })
    },
  })
}

export const useUpdateOrganisation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<IOrganisation> & { id: string }) => {
      const { data } = await axios.put<IOrganisation>(`/api/onboarding/organisations/${id}`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORGANISATIONS_QUERY] })
    },
  })
}

// ─── Person hooks ───

export const useGetPeople = () =>
  useQuery({
    queryKey: [PEOPLE_QUERY],
    queryFn: async () => {
      const { data } = await axios.get<IPerson[]>('/api/onboarding/people')
      return data
    },
  })

export const useCreatePerson = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<IPerson>) => {
      const { data } = await axios.post<IPerson>('/api/onboarding/people', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PEOPLE_QUERY] })
    },
  })
}

// ─── Location hooks ───

export const useGetLocations = (params?: { organisationId?: string }) =>
  useQuery({
    queryKey: [LOCATIONS_QUERY, params],
    queryFn: async () => {
      const { data } = await axios.get<ILocation[]>('/api/onboarding/locations', { params })
      return data
    },
  })

export const useCreateLocation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<ILocation>) => {
      const { data } = await axios.post<ILocation>('/api/onboarding/locations', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOCATIONS_QUERY] })
    },
  })
}

export const useUpdateLocation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<ILocation> & { id: string }) => {
      const { data } = await axios.put<ILocation>(`/api/onboarding/locations/${id}`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOCATIONS_QUERY] })
    },
  })
}

export const useDeleteLocation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/onboarding/locations/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOCATIONS_QUERY] })
    },
  })
}

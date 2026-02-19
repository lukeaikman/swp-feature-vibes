import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { IClient } from '../../types'
import type { IUser } from '../../types'
import type { ILocation } from './types'

// ─── Query keys ───

export const CLIENTS_QUERY = 'clients'
export const USERS_QUERY = 'users'
export const LOCATIONS_QUERY = 'locations'

// ─── Client (organisation) hooks ───

export const useGetClient = (id: string) =>
  useQuery({
    queryKey: [CLIENTS_QUERY, id],
    queryFn: async () => {
      const { data } = await axios.get<IClient>(`/api/onboarding/clients/${id}`)
      return data
    },
    enabled: !!id,
  })

export const useCreateClient = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<IClient>) => {
      const { data } = await axios.post<IClient>('/api/onboarding/clients', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_QUERY] })
    },
  })
}

export const useUpdateClient = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<IClient> & { id: string }) => {
      const { data } = await axios.put<IClient>(`/api/onboarding/clients/${id}`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_QUERY] })
    },
  })
}

// ─── User hooks ───

export const useGetUsers = () =>
  useQuery({
    queryKey: [USERS_QUERY],
    queryFn: async () => {
      const { data } = await axios.get<IUser[]>('/api/onboarding/users')
      return data
    },
  })

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<IUser>) => {
      const { data } = await axios.post<IUser>('/api/onboarding/users', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY] })
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

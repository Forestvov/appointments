import type { UseQueryResult } from '@tanstack/react-query'
import type { IService } from 'src/api_v2/service/service.types'

import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'

import { getServiceById } from 'src/api_v2/service/service.api'

import { calculateTotalServiceMinutes } from '../utils/form-helpers'

type UseServiceDurationsResult = {
	queries: UseQueryResult<IService, unknown>[]
	totalMinutes: number
}

export const useServiceDurations = (serviceIds: number[]): UseServiceDurationsResult => {
	const serviceDetailsQueries = useQueries({
		queries: serviceIds.map(serviceId => ({
			queryKey: ['services', 'detail', serviceId] as const,
			queryFn: () => getServiceById(serviceId),
			enabled: serviceId > 0,
			refetchOnWindowFocus: false
		}))
	})

	const totalMinutes = useMemo(
		() => calculateTotalServiceMinutes(serviceDetailsQueries),
		[serviceDetailsQueries]
	)

	return {
		queries: serviceDetailsQueries,
		totalMinutes
	}
}

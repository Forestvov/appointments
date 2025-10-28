import type { UseQueryResult } from '@tanstack/react-query'
import type { IService } from 'src/api_v2/service/service.types'

import { useQueries } from '@tanstack/react-query'
import { useRef, useMemo, useEffect, useCallback } from 'react'

import { getServiceById } from 'src/api_v2/service/service.api'

import { toStringArray, buildPackageChildMap, toUniquePositiveNumbers } from '../utils/form-helpers'

type ResetTrackingParams = {
	packageIds?: unknown
	serviceIds?: unknown
}

type UsePackageServiceSyncParams = {
	onChangePackageIds?: (ids: string[]) => void
	onChangeServiceIds: (ids: string[]) => void
	packageValue: unknown
	serviceValue: unknown
}

type UsePackageServiceSyncResult = {
	packageIds: number[]
	packageValues: string[]
	resetTracking: (params?: ResetTrackingParams) => void
	serviceIds: number[]
	serviceValues: string[]
}

export const usePackageServiceSync = ({
	onChangePackageIds,
	onChangeServiceIds,
	packageValue,
	serviceValue
}: UsePackageServiceSyncParams): UsePackageServiceSyncResult => {
	const packageValues = useMemo(() => toStringArray(packageValue), [packageValue])
	const serviceValues = useMemo(() => toStringArray(serviceValue), [serviceValue])

	const packageIds = useMemo(() => toUniquePositiveNumbers(packageValues), [packageValues])
	const serviceIds = useMemo(() => toUniquePositiveNumbers(serviceValues), [serviceValues])

	const packageDetailsQueries = useQueries({
		queries: packageIds.map(packageId => ({
			queryKey: ['services', 'detail', packageId] as const,
			queryFn: () => getServiceById(packageId),
			enabled: packageId > 0,
			refetchOnWindowFocus: false
		}))
	}) as UseQueryResult<IService, unknown>[]

	const packageChildMap = useMemo(
		() => buildPackageChildMap(packageIds, packageDetailsQueries),
		[packageDetailsQueries, packageIds]
	)

	const removedPackageServiceIdsRef = useRef<Map<number, Set<string>>>(new Map())
	const packageChildCacheRef = useRef<Map<number, string[]>>(new Map())
	const previousServiceIdsRef = useRef<Set<string>>(new Set())
	const previousPackageIdsRef = useRef<Set<number>>(new Set())

	const resetTracking = useCallback(
		(params?: ResetTrackingParams) => {
			removedPackageServiceIdsRef.current.clear()

			const initialServiceIds = params?.serviceIds ?? serviceValues
			previousServiceIdsRef.current = new Set(toStringArray(initialServiceIds))

			const initialPackageIds = params?.packageIds ?? packageValues
			previousPackageIdsRef.current = new Set(toUniquePositiveNumbers(initialPackageIds))
		},
		[packageValues, serviceValues]
	)

	useEffect(() => {
		const cache = packageChildCacheRef.current
		packageChildMap.forEach((childIds, packageId) => {
			if (childIds.length) {
				cache.set(packageId, childIds)
			}
		})
	}, [packageChildMap])

	useEffect(() => {
		const currentSet = new Set(serviceValues)
		const previousSet = previousServiceIdsRef.current

		const removed = Array.from(previousSet).filter(id => !currentSet.has(id))
		const added = serviceValues.filter(id => !previousSet.has(id))

		previousServiceIdsRef.current = currentSet

		if ((!removed.length && !added.length) || !packageIds.length) {
			return
		}

		packageIds.forEach(packageId => {
			const childIds = packageChildMap.get(packageId)
			if (!childIds?.length) {
				return
			}

			const childSet = new Set(childIds)

			let store = removedPackageServiceIdsRef.current.get(packageId) ?? null
			let storeChanged = false

			if (removed.length) {
				removed.forEach(id => {
					if (childSet.has(id)) {
						if (!store) {
							store = new Set<string>()
						}
						if (!store.has(id)) {
							store.add(id)
							storeChanged = true
						}
					}
				})
			}

			if (added.length && store?.size) {
				added.forEach(id => {
					if (childSet.has(id) && store?.delete(id)) {
						storeChanged = true
					}
				})
			}

			if (!storeChanged) {
				return
			}

			if (store && store.size) {
				removedPackageServiceIdsRef.current.set(packageId, store)
			} else {
				removedPackageServiceIdsRef.current.delete(packageId)
			}
		})
	}, [packageChildMap, packageIds, serviceValues])

	useEffect(() => {
		if (!packageIds.length) {
			removedPackageServiceIdsRef.current.clear()
			return
		}

		const currentSet = new Set(serviceValues)
		let hasChanges = false

		packageIds.forEach(packageId => {
			const childIds = packageChildMap.get(packageId)
			if (!childIds?.length) {
				return
			}

			const removedSet = removedPackageServiceIdsRef.current.get(packageId)

			childIds.forEach(childId => {
				if (removedSet?.has(childId)) {
					return
				}
				if (!currentSet.has(childId)) {
					currentSet.add(childId)
					hasChanges = true
				}
			})
		})

		if (!hasChanges) {
			return
		}

		onChangeServiceIds(Array.from(currentSet.values()))
	}, [onChangeServiceIds, packageChildMap, packageIds, serviceValues])

	useEffect(() => {
		if (!packageValues.length || !onChangePackageIds) {
			return
		}

		const currentSet = new Set(serviceValues)
		const packagesToRemove: string[] = []

		packageValues.forEach(value => {
			const numericId = Number(value)
			if (!Number.isFinite(numericId) || numericId <= 0) {
				return
			}

			const childIds = packageChildMap.get(numericId)
			if (!childIds?.length) {
				return
			}

			const removedSet = removedPackageServiceIdsRef.current.get(numericId)
			const hasAnySelected = childIds.some(childId => currentSet.has(childId))

			if (hasAnySelected) {
				return
			}

			if (removedSet && childIds.every(childId => removedSet.has(childId))) {
				packagesToRemove.push(value)
			}
		})

		if (!packagesToRemove.length) {
			return
		}

		const retained = packageValues.filter(value => !packagesToRemove.includes(value))

		if (retained.length === packageValues.length) {
			return
		}

		onChangePackageIds(retained)

		packagesToRemove.forEach(value => {
			const numericId = Number(value)
			if (Number.isFinite(numericId)) {
				removedPackageServiceIdsRef.current.delete(numericId)
			}
		})
	}, [onChangePackageIds, packageChildMap, packageValues, serviceValues])

	useEffect(() => {
		const previousPackages = previousPackageIdsRef.current
		const currentPackages = new Set(packageIds)
		const removedPackages = Array.from(previousPackages).filter(id => !currentPackages.has(id))

		previousPackageIdsRef.current = currentPackages

		if (!removedPackages.length) {
			if (!packageIds.length) {
				removedPackageServiceIdsRef.current.clear()
			}
			return
		}

		const currentSet = new Set(serviceValues)
		let hasChanges = false

		removedPackages.forEach(packageId => {
			const childIds =
				packageChildMap.get(packageId) ?? packageChildCacheRef.current.get(packageId) ?? []

			childIds.forEach(childId => {
				if (currentSet.delete(childId)) {
					hasChanges = true
				}
			})

			removedPackageServiceIdsRef.current.delete(packageId)
		})

		if (!hasChanges) {
			return
		}

		onChangeServiceIds(Array.from(currentSet.values()))
	}, [onChangeServiceIds, packageChildMap, packageIds, serviceValues])

	return {
		packageIds,
		packageValues,
		resetTracking,
		serviceIds,
		serviceValues
	}
}

import type { UseQueryResult } from '@tanstack/react-query'
import type { IService } from 'src/api_v2/service/service.types'

const NUMBER_ID_THRESHOLD = 0

export const toStringArray = (value: unknown): string[] => {
	if (!Array.isArray(value)) {
		return []
	}

	return value
		.map(item => {
			if (typeof item === 'string') {
				return item.trim()
			}

			if (item === undefined || item === null) {
				return ''
			}

			return String(item).trim()
		})
		.filter(item => item.length > 0)
}

export const toUniquePositiveNumbers = (values: unknown): number[] => {
	const asStrings = Array.isArray(values) ? values : []
	const unique = new Set<number>()

	asStrings.forEach(value => {
		const numeric = Number(value)
		if (Number.isFinite(numeric) && numeric > NUMBER_ID_THRESHOLD) {
			unique.add(numeric)
		}
	})

	return Array.from(unique.values())
}

export const haveSameMembers = (first: string[], second: string[]): boolean => {
	if (first.length !== second.length) {
		return false
	}

	const sortedFirst = [...first].sort()
	const sortedSecond = [...second].sort()

	return sortedFirst.every((value, index) => value === sortedSecond[index])
}

export const buildPackageChildMap = (
	packageIds: number[],
	packageDetailsQueries: UseQueryResult<IService, unknown>[]
): Map<number, string[]> => {
	const map = new Map<number, string[]>()

	packageIds.forEach((packageId, index) => {
		const childs = packageDetailsQueries[index]?.data?.childs ?? []

		if (!childs?.length) {
			return
		}

		const childSet = new Set<string>()
		childs.forEach(child => {
			const numeric = Number(child?.id)
			if (Number.isFinite(numeric) && numeric > NUMBER_ID_THRESHOLD) {
				childSet.add(String(numeric))
			}
		})

		if (childSet.size) {
			map.set(packageId, Array.from(childSet.values()))
		}
	})

	return map
}

export const calculateTotalServiceMinutes = (
	serviceDetailsQueries: UseQueryResult<IService, unknown>[]
): number =>
	serviceDetailsQueries.reduce((total, query) => {
		const serviceTime = query.data?.time ?? 0
		const numeric = Number(serviceTime)
		return total + (Number.isFinite(numeric) ? numeric : 0)
	}, 0)

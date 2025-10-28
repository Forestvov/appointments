'use client'

import type { ICalendarFilters } from 'src/types/calendar'

import { useSetState } from 'minimal-shared/hooks'
import { useMemo, useState, useEffect } from 'react'

import { fIsAfter } from 'src/utils/format-time'

import { useAppointmentBooksPage } from 'src/api_v2/appointment-book/appointment-book.hooks'

const APPOINTMENT_BOOK_QUERY = {
	page: 0,
	size: 200,
	sortDir: 'ASC' as const,
	sortField: 'name',
	criteria: [
		{
			key: 'status',
			value: 'Enabled'
		}
	]
}

export const useAppointmentsFilters = () => {
	const filters = useSetState<ICalendarFilters>({ startDate: null, doctorIds: [], endDate: null })

	const { state: currentFilters, setState: updateFilters } = filters
	const { doctorIds } = currentFilters

	const { data: appointmentBooksPage } = useAppointmentBooksPage(APPOINTMENT_BOOK_QUERY)

	const appointmentBooks = useMemo(
		() => appointmentBooksPage?.content ?? [],
		[appointmentBooksPage]
	)

	const [resourcesInitialized, setResourcesInitialized] = useState(false)

	useEffect(() => {
		if (!resourcesInitialized && doctorIds.length) {
			setResourcesInitialized(true)
		}
	}, [doctorIds.length, resourcesInitialized])

	useEffect(() => {
		if (resourcesInitialized || !appointmentBooks.length) {
			return
		}

		if (doctorIds.length) {
			setResourcesInitialized(true)
			return
		}

		const initialIds = Array.from(
			new Set(
				appointmentBooks
					.map(book => book.doctorMainId ?? book.id)
					.filter((id): id is number => id !== undefined && id !== null)
			)
		)

		if (initialIds.length) {
			updateFilters({
				doctorIds: initialIds
			})
		}

		setResourcesInitialized(true)
	}, [appointmentBooks, doctorIds.length, resourcesInitialized, updateFilters])

	const defaultResourceIds = useMemo(
		() =>
			Array.from(
				new Set(
					appointmentBooks
						.map(book => book.doctorMainId ?? book.id)
						.filter((id): id is number => id !== undefined && id !== null)
				)
			),
		[appointmentBooks]
	)

	const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate)
	const hasDateFilter = Boolean(currentFilters.startDate && currentFilters.endDate)

	const resourceFilterActive = resourcesInitialized
		? doctorIds.length === 0 ||
			(defaultResourceIds.length > 0 &&
				(doctorIds.length !== defaultResourceIds.length ||
					!defaultResourceIds.every(id => doctorIds.includes(id))))
		: Boolean(doctorIds.length)

	const canReset = hasDateFilter || resourceFilterActive
	const showDoctorFilterChips = resourceFilterActive && doctorIds.length > 0

	return {
		appointmentBooks,
		canReset,
		currentFilters,
		dateError,
		defaultResourceIds,
		doctorIds,
		filters,
		resourcesInitialized,
		showDoctorFilterChips
	}
}

import type { ICalendarEvent, ICalendarRange } from 'src/types/calendar'

import dayjs from 'dayjs'
import { useMemo } from 'react'

import { fDateTime } from 'src/utils/format-time'

// ----------------------------------------------------------------------

const formatDate = (date: string) => fDateTime(date, 'YYYY-MM-DD, HH:mm:ss')

export function useEvent(
	events: ICalendarEvent[],
	selectEventId: string,
	selectedRange: ICalendarRange,
	openForm: boolean
) {
	const currentEvent = events.find(event => event.id === selectEventId)

	const defaultValues: ICalendarEvent = useMemo(() => {
		const fallbackDoctorId =
			currentEvent?.doctorId ||
			(currentEvent?.doctorMainId !== undefined && currentEvent?.doctorMainId !== null
				? String(currentEvent.doctorMainId)
				: undefined) ||
			selectedRange?.resourceDoctorMainId ||
			selectedRange?.resourceId ||
			''
		return {
			id: currentEvent?.id || '',
			patientId: currentEvent?.patientId || '',
			doctorId: fallbackDoctorId,
			title: currentEvent?.title || '',
			description: currentEvent?.description || '',
			serviceIds: Array.isArray(currentEvent?.serviceIds)
				? currentEvent.serviceIds.map(serviceId => String(serviceId))
				: Array.isArray(selectedRange?.serviceIds)
					? selectedRange.serviceIds.map(serviceId => String(serviceId))
					: [],
			packageIds: Array.isArray(currentEvent?.packageIds)
				? currentEvent.packageIds.map(packageId => String(packageId))
				: Array.isArray(selectedRange?.packageIds)
					? selectedRange.packageIds.map(packageId => String(packageId))
					: [],
			start: currentEvent
				? formatDate(currentEvent.start)
				: selectedRange
					? formatDate(selectedRange.start)
					: dayjs(new Date()).format(),
			end: currentEvent
				? formatDate(currentEvent.end)
				: selectedRange
					? formatDate(selectedRange.end)
					: dayjs(new Date()).format()
		}
	}, [selectedRange, currentEvent])

	if (!openForm) {
		return undefined
	}

	return defaultValues
}

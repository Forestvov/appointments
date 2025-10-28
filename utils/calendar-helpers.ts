import type { IAppointmentDay } from 'src/api_v2/appoint/appoint.types'
import type { ICalendarEvent, ICalendarFilters } from 'src/types/calendar'

import dayjs from 'dayjs'

import { fIsBetween } from 'src/utils/format-time'

import {
	DAY_MINUTES,
	FALLBACK_MAX_MINUTES,
	FALLBACK_MIN_MINUTES,
	LOCAL_DATETIME_FORMAT
} from '../const-options'

export const escapeHtml = (value: string) =>
	value.replace(/[&<>"']/g, match => {
		switch (match) {
			case '&':
				return '&amp;'
			case '<':
				return '&lt;'
			case '>':
				return '&gt;'
			case '"':
				return '&quot;'
			case "'":
				return '&#39;'
			default:
				return match
		}
	})

export type WorkingHoursSummary = {
	minMinutes: number
	maxMinutes: number
	slotMinTime: string
	slotMaxTime: string
	scrollTime: string
	byDoctor: Record<string, { minMinutes: number; maxMinutes: number }>
}

const toMinutes = (value: string) => {
	const parsed = dayjs(value)
	if (!parsed.isValid()) {
		return null
	}

	return parsed.hour() * 60 + parsed.minute()
}

const minutesToTimeString = (minutes: number) =>
	dayjs()
		.startOf('day')
		.add(Math.max(0, Math.min(minutes, DAY_MINUTES)), 'minute')
		.format('HH:mm:ss')

export const buildWorkingHoursSummary = (appointments: IAppointmentDay[]): WorkingHoursSummary => {
	const byDoctor: WorkingHoursSummary['byDoctor'] = {}

	let minMinutes = Number.POSITIVE_INFINITY
	let maxMinutes = Number.NEGATIVE_INFINITY

	appointments.forEach(day => {
		day.details.forEach(detail => {
			const startMinutes = toMinutes(detail.startTime)
			const endMinutes = toMinutes(detail.endTime)

			if (startMinutes === null || endMinutes === null) {
				return
			}

			const doctorKey = String(detail.doctorMainId ?? detail.doctorId)
			const current = byDoctor[doctorKey]

			if (!current) {
				byDoctor[doctorKey] = {
					minMinutes: startMinutes,
					maxMinutes: endMinutes
				}
			} else {
				current.minMinutes = Math.min(current.minMinutes, startMinutes)
				current.maxMinutes = Math.max(current.maxMinutes, endMinutes)
			}

			minMinutes = Math.min(minMinutes, startMinutes)
			maxMinutes = Math.max(maxMinutes, endMinutes)
		})
	})

	Object.values(byDoctor).forEach(window => {
		window.minMinutes = Math.max(0, Math.floor(window.minMinutes))
		window.maxMinutes = Math.min(
			DAY_MINUTES,
			Math.max(Math.ceil(window.maxMinutes), window.minMinutes + 30)
		)
	})

	if (
		!Number.isFinite(minMinutes) ||
		!Number.isFinite(maxMinutes) ||
		minMinutes >= maxMinutes ||
		minMinutes < 0 ||
		maxMinutes > DAY_MINUTES
	) {
		minMinutes = FALLBACK_MIN_MINUTES
		maxMinutes = FALLBACK_MAX_MINUTES
	} else {
		minMinutes = Math.max(0, Math.floor(minMinutes))
		maxMinutes = Math.min(DAY_MINUTES, Math.max(Math.ceil(maxMinutes), minMinutes + 30))
	}

	return {
		minMinutes,
		maxMinutes,
		slotMinTime: minutesToTimeString(minMinutes),
		slotMaxTime: minutesToTimeString(maxMinutes),
		scrollTime: minutesToTimeString(minMinutes),
		byDoctor
	}
}

export const mapToCalendarEvents = (data: IAppointmentDay[]): ICalendarEvent[] =>
	data.flatMap(day =>
		day.details.flatMap(detail => {
			const startDate = dayjs(detail.startTime)
			const endDate = dayjs(detail.endTime)
			const doctorMainId = detail.doctorMainId ?? detail.doctorId
			const resourceKey = doctorMainId ?? detail.doctorId

			const start = startDate.isValid()
				? startDate.format(LOCAL_DATETIME_FORMAT)
				: String(detail.startTime)
			const end = endDate.isValid() ? endDate.format(LOCAL_DATETIME_FORMAT) : String(detail.endTime)
			const endIntervalDate = dayjs(detail.endIntervalTime)
			const endInterval = endIntervalDate.isValid()
				? endIntervalDate.format(LOCAL_DATETIME_FORMAT)
				: ''

			const normalizedServiceIds = (() => {
				if (Array.isArray(detail.serviceIds) && detail.serviceIds.length > 0) {
					return detail.serviceIds
						.map(serviceId => {
							if (
								serviceId !== undefined &&
								serviceId !== null &&
								(typeof serviceId === 'number' || typeof serviceId === 'string')
							) {
								return serviceId
							}
							return undefined
						})
						.filter(
							(serviceId): serviceId is number => serviceId !== undefined && serviceId !== null
						)
				}

				if (Array.isArray(detail.services)) {
					return detail.services
						.map(service => service?.id)
						.filter(
							(serviceId): serviceId is number => serviceId !== undefined && serviceId !== null
						)
				}

				return []
			})()

			const baseEvent: ICalendarEvent = {
				id: String(detail.id),
				title: detail.doctorFio
					? `${detail.patientFio} (${detail.doctorFio})`
					: `Свободно (${detail.doctorFio})`,
				doctorId: String(doctorMainId),
				patientId: String(detail.patientId),
				description: detail.description,
				classNames: ['fc-interval-item'],
				start,
				end,
				resourceId: resourceKey !== undefined ? String(resourceKey) : undefined,
				doctorMainId,
				serviceIds: normalizedServiceIds
			}

			const events: ICalendarEvent[] = [baseEvent]

			if (
				endInterval &&
				endIntervalDate.isValid() &&
				endDate.isValid() &&
				endIntervalDate.isAfter(endDate)
			) {
				events.push({
					id: `${detail.id}-interval`,
					title: '',
					doctorId: String(doctorMainId),
					patientId: String(detail.patientId),
					description: '',
					start: end,
					end: endInterval,
					resourceId: resourceKey !== undefined ? String(resourceKey) : undefined,
					doctorMainId,
					display: 'background',
					classNames: ['fc-interval-block'],
					extendedProps: {
						isIntervalBlock: true,
						sourceEventId: String(detail.id)
					}
				})
			}

			return events
		})
	)

type ApplyFilterProps = {
	dateError: boolean
	filters: ICalendarFilters
	inputData: ICalendarEvent[]
	resourcesInitialized?: boolean
}

export const applyFilter = ({
	inputData,
	filters,
	dateError,
	resourcesInitialized
}: ApplyFilterProps) => {
	const { startDate, endDate, doctorIds } = filters

	const stabilizedThis = inputData.map((el, index) => [el, index] as const)

	inputData = stabilizedThis.map(el => el[0])

	if (resourcesInitialized && doctorIds.length === 0) {
		return []
	}

	if (doctorIds.length) {
		const doctorSet = new Set(doctorIds.map(id => String(id)))
		inputData = inputData.filter(event =>
			doctorSet.has(String(event.doctorMainId ?? event.doctorId))
		)
	}

	if (!dateError) {
		if (startDate && endDate) {
			inputData = inputData.filter(event => fIsBetween(event.start, startDate, endDate))
		}
	}

	return inputData
}

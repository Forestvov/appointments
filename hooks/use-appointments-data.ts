'use client'

import type { GetList } from 'src/api_v2/types'
import type { ICalendarEvent } from 'src/types/calendar'
import type { IAppointmentDay } from 'src/api_v2/appoint/appoint.types'
import type {
	AppointmentBook,
	AppointmentBookList,
	AppointmentBookWeekDay
} from 'src/api_v2/appointment-book/appointment-book.types'

import dayjs from 'dayjs'
import { useMemo } from 'react'

import { useAppointments } from 'src/api_v2/appoint/appoint.hooks'
import { useAppointmentBooksList } from 'src/api_v2/appointment-book/appointment-book.hooks'

import {
	escapeHtml,
	mapToCalendarEvents,
	buildWorkingHoursSummary,
	type WorkingHoursSummary
} from '../utils/calendar-helpers'

type IntervalBlock = Array<{ start: number; end: number }>

type IntervalBlocks = {
	all: IntervalBlock
	byDoctor: Map<string, IntervalBlock>
}

const WEEK_DAY_VALUES: AppointmentBookWeekDay[] = [
	'MONDAY',
	'TUESDAY',
	'WEDNESDAY',
	'THURSDAY',
	'FRIDAY',
	'SATURDAY',
	'SUNDAY'
]

const WEEK_DAY_BY_DAYJS_INDEX: AppointmentBookWeekDay[] = [
	'SUNDAY',
	'MONDAY',
	'TUESDAY',
	'WEDNESDAY',
	'THURSDAY',
	'FRIDAY',
	'SATURDAY'
]

const normalizeWeekDay = (
	value: AppointmentBookWeekDay | number | string | null | undefined
): AppointmentBookWeekDay | null => {
	if (typeof value === 'string') {
		const upper = value.toUpperCase()

		if (WEEK_DAY_VALUES.includes(upper as AppointmentBookWeekDay)) {
			return upper as AppointmentBookWeekDay
		}

		const numeric = Number(value)
		if (!Number.isNaN(numeric)) {
			return normalizeWeekDay(numeric)
		}

		return null
	}

	if (typeof value === 'number' && !Number.isNaN(value)) {
		if (value >= 1 && value <= WEEK_DAY_VALUES.length) {
			return WEEK_DAY_VALUES[value - 1]
		}

		if (value >= 0 && value < WEEK_DAY_BY_DAYJS_INDEX.length) {
			return WEEK_DAY_BY_DAYJS_INDEX[value]
		}
	}

	return null
}

const getWeekDayFromDate = (date: Date): AppointmentBookWeekDay | null => {
	const parsed = dayjs(date)

	if (!parsed.isValid()) {
		return null
	}

	const dayIndex = parsed.day()

	if (dayIndex < 0 || dayIndex >= WEEK_DAY_BY_DAYJS_INDEX.length) {
		return null
	}

	return WEEK_DAY_BY_DAYJS_INDEX[dayIndex]
}

export type CalendarResourceExtendedProps = {
	doctorFio?: string
	bookName?: string
	labelHtml?: string
	doctorMainId?: string
}

type UseAppointmentsDataParams = {
	appointmentBooks: AppointmentBook[]
	defaultResourceIds: number[]
	doctorIds: number[]
	fallbackResourceColor: string
	selectedDate: Date
}

type UseAppointmentsDataResult = {
	appointments: IAppointmentDay[]
	appointmentsQuery: GetList
	calendarResources: Array<{
		eventBackgroundColor: string
		eventBorderColor: string
		extendedProps: CalendarResourceExtendedProps
		id: string
		title: string
	}>
	events: ICalendarEvent[]
	intervalBlocks: IntervalBlocks
	isAppointmentsFetching: boolean
	workingHours: WorkingHoursSummary
}

const buildAppointmentsQuery = (doctorIds: number[]): GetList =>
	({
		criteria: doctorIds.map(item => ({
			key: 'doctorId',
			operation: '=!=',
			value: item
		})),
		page: 0,
		size: 500,
		sortDir: 'ASC'
	}) satisfies GetList

const buildIntervalBlocks = (appointments: IAppointmentDay[]): IntervalBlocks => {
	const byDoctor = new Map<string, IntervalBlock>()
	const all: IntervalBlock = []

	appointments.forEach(day => {
		day.details.forEach(detail => {
			const endDate = dayjs(detail.endTime)
			const intervalEndDate = dayjs(detail.endIntervalTime)

			if (!endDate.isValid() || !intervalEndDate.isValid() || !intervalEndDate.isAfter(endDate)) {
				return
			}

			const start = endDate.valueOf()
			const end = intervalEndDate.valueOf()
			const doctorKey = String(detail.doctorMainId ?? detail.doctorId)

			const list = byDoctor.get(doctorKey)
			if (list) {
				list.push({ start, end })
			} else {
				byDoctor.set(doctorKey, [{ start, end }])
			}

			all.push({ start, end })
		})
	})

	return { byDoctor, all }
}

const buildCalendarResources = ({
	appointmentBooks,
	defaultResourceIds,
	doctorIds,
	fallbackResourceColor,
	staffList,
	selectedWeekDay
}: {
	appointmentBooks: AppointmentBook[]
	defaultResourceIds: number[]
	doctorIds: number[]
	fallbackResourceColor: string
	staffList: AppointmentBookList
	selectedWeekDay: AppointmentBookWeekDay | null
}) => {
	if (!staffList.length || !selectedWeekDay) {
		return []
	}

	const baseIds = doctorIds.length > 0 ? doctorIds : defaultResourceIds
	const hasRestrictions = baseIds.length > 0
	const allowedNumeric = new Set(baseIds)

	const appointmentBookMap = new Map<number, AppointmentBook>()
	appointmentBooks.forEach(book => {
		if (typeof book.id === 'number') {
			appointmentBookMap.set(book.id, book)
		}

		if (book.appointBookId !== undefined && book.appointBookId !== null) {
			appointmentBookMap.set(book.appointBookId, book)
		}
	})

	const resourceMap = new Map<
		string,
		{
			id: string
			title: string
			extendedProps: CalendarResourceExtendedProps
			eventBackgroundColor: string
			eventBorderColor: string
		}
	>()

	staffList.forEach(item => {
		const itemWeekDay = normalizeWeekDay(item.weekDay)
		if (itemWeekDay !== selectedWeekDay) {
			return
		}

		const match =
			appointmentBookMap.get(item.appointBookId) ?? appointmentBookMap.get(item.id ?? -1)

		const matchDoctorId =
			typeof match?.doctorMainId === 'number' && !Number.isNaN(match.doctorMainId)
				? match.doctorMainId
				: undefined
		const staffDoctorId =
			typeof item.staffId === 'number' && !Number.isNaN(item.staffId) ? item.staffId : undefined
		const accountDoctorId =
			typeof item.accountId === 'number' && !Number.isNaN(item.accountId)
				? item.accountId
				: undefined

		const resourceDoctorId = matchDoctorId ?? staffDoctorId ?? accountDoctorId

		if (resourceDoctorId === undefined || resourceDoctorId === null) {
			return
		}

		if (
			hasRestrictions &&
			!allowedNumeric.has(resourceDoctorId) &&
			!(matchDoctorId !== undefined && allowedNumeric.has(matchDoctorId)) &&
			!(staffDoctorId !== undefined && allowedNumeric.has(staffDoctorId))
		) {
			return
		}

		const doctorKey = String(resourceDoctorId)

		if (resourceMap.has(doctorKey)) {
			return
		}

		const resourceColor = item.color || match?.color || fallbackResourceColor
		const doctorLabel = item.doctorFam || match?.doctorMainFio || ''
		const bookLabel = item.name || match?.name || ''

		const labelParts: string[] = []

		if (doctorLabel) {
			labelParts.push(`<span class="fc-resource-label__doctor">${escapeHtml(doctorLabel)}</span>`)
		}

		if (bookLabel) {
			labelParts.push(`<span class="fc-resource-label__book">${escapeHtml(bookLabel)}</span>`)
		}

		const title =
			doctorLabel && bookLabel ? `${doctorLabel} ${bookLabel}` : doctorLabel || bookLabel || ''

		resourceMap.set(doctorKey, {
			id: doctorKey,
			title,
			extendedProps: {
				doctorFio: doctorLabel || undefined,
				bookName: bookLabel || undefined,
				labelHtml: labelParts.join(''),
				doctorMainId: doctorKey
			},
			eventBackgroundColor: resourceColor,
			eventBorderColor: resourceColor
		})
	})

	return Array.from(resourceMap.values())
}

export const useAppointmentsData = ({
	appointmentBooks,
	defaultResourceIds,
	doctorIds,
	fallbackResourceColor,
	selectedDate
}: UseAppointmentsDataParams): UseAppointmentsDataResult => {
	const appointmentsQuery = useMemo(() => buildAppointmentsQuery(doctorIds), [doctorIds])

	const { data: appointmentsData, isFetching: isAppointmentsFetching } = useAppointments(
		appointmentsQuery,
		{
			enabled: doctorIds.length > 0
		}
	)

	const appointments: IAppointmentDay[] = doctorIds.length > 0 ? (appointmentsData ?? []) : []

	const staffListParams = useMemo(
		() => ({
			page: 0,
			size: 7,
			sortDir: 'ASC' as const
		}),
		[]
	)

	const { data: staffListData } = useAppointmentBooksList(staffListParams)
	const staffList = staffListData ?? []

	const selectedWeekDay = useMemo(() => getWeekDayFromDate(selectedDate), [selectedDate])

	const events = useMemo(() => mapToCalendarEvents(appointments), [appointments])
	const workingHours = useMemo(() => buildWorkingHoursSummary(appointments), [appointments])
	const intervalBlocks = useMemo(() => buildIntervalBlocks(appointments), [appointments])

	const calendarResources = useMemo(
		() =>
			buildCalendarResources({
				appointmentBooks,
				defaultResourceIds,
				doctorIds,
				fallbackResourceColor,
				staffList,
				selectedWeekDay
			}),
		[
			appointmentBooks,
			defaultResourceIds,
			doctorIds,
			fallbackResourceColor,
			staffList,
			selectedWeekDay
		]
	)

	return {
		appointments,
		appointmentsQuery,
		calendarResources,
		events,
		intervalBlocks,
		isAppointmentsFetching,
		workingHours
	}
}

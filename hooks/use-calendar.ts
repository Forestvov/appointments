import type FullCalendar from '@fullcalendar/react'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import type { EventDropArg, DateSelectArg, EventClickArg } from '@fullcalendar/core'
import type { ICalendarView, ICalendarRange, ICalendarEvent } from 'src/types/calendar'

import dayjs from 'dayjs'
import { useRef, useState, useCallback } from 'react'

import useMediaQuery from '@mui/material/useMediaQuery'

// ----------------------------------------------------------------------

const DEFAULT_PM_HOUR = 8 // default start hour within the working day
const LOCAL_DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss'

export function useCalendar() {
	const calendarRef = useRef<FullCalendar>(null)
	const calendarEl = calendarRef.current

	const smUp = useMediaQuery(theme => theme.breakpoints.up('sm'))

	const [date, setDate] = useState(new Date())

	const [openForm, setOpenForm] = useState(false)

	const [selectEventId, setSelectEventId] = useState('')

	const [selectedRange, setSelectedRange] = useState<ICalendarRange>(null)

	const defaultView = smUp ? 'resourceTimeGridDay' : 'listWeek'

	const [view, setView] = useState<ICalendarView>(defaultView)

	const changeDateByView = useCallback(
		(direction: number) => {
			setDate(prev => {
				const base = dayjs(prev)

				let next: dayjs.Dayjs

				if (view.includes('Month')) {
					next = base.add(direction, 'month')
				} else if (view.includes('Week')) {
					next = base.add(direction, 'week')
				} else {
					next = base.add(direction, 'day')
				}

				return next.toDate()
			})
		},
		[view]
	)

	const onOpenForm = useCallback(() => {
		setOpenForm(true)
	}, [])

	const onCloseForm = useCallback(() => {
		setOpenForm(false)
		setSelectedRange(null)
		setSelectEventId('')
	}, [])

	const openFormWithRange = useCallback(
		(range: NonNullable<ICalendarRange>) => {
			setSelectEventId('')
			setSelectedRange({
				start: range.start,
				end: range.end,
				resourceId: range.resourceId,
				resourceDoctorMainId: range.resourceDoctorMainId,
				serviceIds: range.serviceIds,
				packageIds: range.packageIds
			})
			onOpenForm()
		},
		[onOpenForm]
	)

	const onInitialView = useCallback(() => {
		if (calendarEl) {
			const calendarApi = calendarEl.getApi()

			const newView = smUp ? 'resourceTimeGridDay' : 'listWeek'
			calendarApi.changeView(newView)
			setView(newView)
		} else {
			setView(smUp ? 'resourceTimeGridDay' : 'listWeek')
		}
	}, [calendarEl, smUp])

	const onChangeView = useCallback(
		(newView: ICalendarView) => {
			if (calendarEl) {
				const calendarApi = calendarEl.getApi()

				calendarApi.changeView(newView)
			}

			setView(newView)
		},
		[calendarEl]
	)

	const onDateToday = useCallback(() => {
		if (calendarEl) {
			const calendarApi = calendarEl.getApi()

			calendarApi.today()
			setDate(calendarApi.getDate())
		} else {
			setDate(new Date())
		}
	}, [calendarEl])

	const onDatePrev = useCallback(() => {
		if (calendarEl) {
			const calendarApi = calendarEl.getApi()

			calendarApi.prev()
			setDate(calendarApi.getDate())
		} else {
			changeDateByView(-1)
		}
	}, [calendarEl, changeDateByView])

	const onDateNext = useCallback(() => {
		if (calendarEl) {
			const calendarApi = calendarEl.getApi()

			calendarApi.next()
			setDate(calendarApi.getDate())
		} else {
			changeDateByView(1)
		}
	}, [calendarEl, changeDateByView])

	const onSelectRange = useCallback(
		(arg: DateSelectArg) => {
			if (calendarEl) {
				const api = calendarEl.getApi()
				api.unselect()
			}

			const resourceArg = arg as DateSelectArg & {
				resource?: { id?: string; extendedProps?: Record<string, unknown> } | null
				resourceId?: string
			}

			const resourceId = resourceArg.resource?.id ?? resourceArg.resourceId
			const rawDoctorMainId = (
				resourceArg.resource?.extendedProps as { doctorMainId?: string | number } | undefined
			)?.doctorMainId
			const resourceDoctorMainId =
				rawDoctorMainId !== undefined && rawDoctorMainId !== null
					? String(rawDoctorMainId)
					: undefined

			const startRaw = arg.start
			let start = startRaw
			let end = arg.end

			const ONE_DAY = 24 * 60 * 60 * 1000
			const isAllDay = arg.allDay || end.getTime() - startRaw.getTime() >= ONE_DAY

			if (isAllDay) {
				start = new Date(
					startRaw.getFullYear(),
					startRaw.getMonth(),
					startRaw.getDate(),
					DEFAULT_PM_HOUR,
					0,
					0,
					0
				)
				end = new Date(start.getTime() + 30 * 60 * 1000)
			} else {
				if (!end || end.getTime() === start.getTime()) {
					end = new Date(start.getTime() + 30 * 60 * 1000)
				}
			}

			onOpenForm()
			setSelectedRange({
				start: dayjs(start).format(LOCAL_DATETIME_FORMAT),
				end: dayjs(end).format(LOCAL_DATETIME_FORMAT),
				resourceId: resourceId ? String(resourceId) : undefined,
				resourceDoctorMainId
			})
		},
		[calendarEl, onOpenForm]
	)

	const onClickEvent = useCallback(
		(arg: EventClickArg) => {
			const { event } = arg

			onOpenForm()
			setSelectEventId(event.id)
		},
		[onOpenForm]
	)

	const onResizeEvent = useCallback(
		(arg: EventResizeDoneArg, updateEvent: (eventData: Partial<ICalendarEvent>) => void) => {
			const { event } = arg

			updateEvent({
				id: event.id,
				start: event.startStr,
				end: event.endStr
			})
		},
		[]
	)

	const onDropEvent = useCallback(
		(arg: EventDropArg, updateEvent: (eventData: Partial<ICalendarEvent>) => void) => {
			const { event } = arg

			updateEvent({
				id: event.id,
				start: event.startStr,
				end: event.endStr
			})
		},
		[]
	)

	const onClickEventInFilters = useCallback(
		(eventId: string) => {
			if (eventId) {
				onOpenForm()
				setSelectEventId(eventId)
			}
		},
		[onOpenForm]
	)

	return {
		calendarRef,
		/********/
		view,
		date,
		/********/
		onDatePrev,
		onDateNext,
		onDateToday,
		onDropEvent,
		onClickEvent,
		onChangeView,
		onSelectRange,
		onResizeEvent,
		onInitialView,
		/********/
		openForm,
		onOpenForm,
		onCloseForm,
		openFormWithRange,
		/********/
		selectEventId,
		selectedRange,
		/********/
		onClickEventInFilters
	}
}

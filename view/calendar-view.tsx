'use client'

import type { DateSelectArg } from '@fullcalendar/core'
import type { Theme, SxProps } from '@mui/material/styles'
import type { ResourceLabelContentArg } from '@fullcalendar/resource/index.js'

import dynamic from 'next/dynamic'
import Calendar from '@fullcalendar/react'
import listPlugin from '@fullcalendar/list'
import dayGridPlugin from '@fullcalendar/daygrid'
import { useBoolean } from 'minimal-shared/hooks'
import timeGridPlugin from '@fullcalendar/timegrid'
import timelinePlugin from '@fullcalendar/timeline'
import { useMemo, useEffect, useCallback } from 'react'
import interactionPlugin from '@fullcalendar/interaction'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import DialogTitle from '@mui/material/DialogTitle'

import { fDate } from 'src/utils/format-time'

import { DashboardContent } from 'src/layouts/dashboard'

import { Iconify } from 'src/components/iconify'

import { CalendarRoot } from '../styles'
import { useEvent } from '../hooks/use-event'
import { CanceledVisits } from '../canceled-visits'
import { useCalendar } from '../hooks/use-calendar'
import { CalendarToolbar } from '../calendar-toolbar'
import { CalendarFiltersResult } from '../calendar-filters-result'
import { escapeHtml, applyFilter } from '../utils/calendar-helpers'
import { useAppointmentsDialogs } from '../hooks/use-appointments-dialogs'
import { useAppointmentsFilters } from '../hooks/use-appointments-filters'
import { CALENDAR_SLOT_DURATION, DEFAULT_RESOURCE_MIN_WIDTH } from '../const-options'
import {
	useAppointmentsData,
	type CalendarResourceExtendedProps
} from '../hooks/use-appointments-data'

const CalendarForm = dynamic(() => import('../calendar-form').then(mod => mod.CalendarForm), {
	loading: () => null,
	ssr: false
})

const CalendarFilters = dynamic(
	() => import('../calendar-filters').then(mod => mod.CalendarFilters),
	{
		loading: () => null,
		ssr: false
	}
)

const AvailableSearch = dynamic(
	() => import('../available-search').then(mod => mod.AvailableSearch),
	{
		loading: () => null,
		ssr: false
	}
)

export function AppointmentsView() {
	const theme = useTheme()
	const fallbackResourceColor = theme.palette.primary.main

	const openFilters = useBoolean()

	const {
		appointmentBooks,
		canReset,
		currentFilters,
		dateError,
		defaultResourceIds,
		doctorIds,
		filters,
		resourcesInitialized,
		showDoctorFilterChips
	} = useAppointmentsFilters()

	const {
		calendarRef,
		view,
		date,
		onDatePrev,
		onDateNext,
		onDateToday,
		onChangeView,
		onSelectRange,
		onClickEvent,
		onInitialView,
		openForm,
		onOpenForm,
		onCloseForm,
		openFormWithRange,
		selectEventId,
		selectedRange
	} = useCalendar()

	const { calendarResources, events, intervalBlocks, isAppointmentsFetching, workingHours } =
		useAppointmentsData({
			appointmentBooks,
			defaultResourceIds,
			doctorIds,
			fallbackResourceColor,
			selectedDate: date
		})

	const {
		handleBackToSearch,
		handleCloseForm,
		handleOpenFormManual,
		handleSearchDialogClose,
		handleSlotSelect,
		isAvailableSearchOpen,
		openAvailableSearch,
		openedFromSearch,
		searchResetToken,
		selectedSearchServiceIds,
		selectedSearchPackageIds
	} = useAppointmentsDialogs({
		onCloseForm,
		onOpenForm,
		openFormWithRange
	})

	const currentEvent = useEvent(events, selectEventId, selectedRange, openForm)

	useEffect(() => {
		onInitialView()
	}, [onInitialView])

	const selectAllow = useCallback(
		(range: DateSelectArg) => {
			const resourceArg = range as DateSelectArg & {
				resource?: { id?: string; extendedProps?: Record<string, unknown> } | null
				resourceId?: string
			}

			const resourceDoctorMainId =
				(resourceArg.resource?.extendedProps as { doctorMainId?: string } | undefined)
					?.doctorMainId ??
				resourceArg.resource?.id ??
				resourceArg.resourceId

			const doctorKey = resourceDoctorMainId ? String(resourceDoctorMainId) : undefined
			const intervals = doctorKey
				? (intervalBlocks.byDoctor.get(doctorKey) ?? [])
				: intervalBlocks.all

			const selectionStart = range.start.getTime()
			const selectionEnd = range.end?.getTime() ?? selectionStart

			return intervals.every(
				interval => selectionEnd <= interval.start || selectionStart >= interval.end
			)
		},
		[intervalBlocks]
	)

	const renderResourceLabel = useCallback(({ resource }: ResourceLabelContentArg) => {
		const { doctorFio, bookName, labelHtml } =
			resource.extendedProps as CalendarResourceExtendedProps

		if (labelHtml) {
			return { html: labelHtml }
		}

		const segments: string[] = []

		if (doctorFio) {
			segments.push(`<span class="fc-resource-label__doctor">${escapeHtml(doctorFio)}</span>`)
		}

		if (bookName) {
			segments.push(`<span class="fc-resource-label__book">${escapeHtml(bookName)}</span>`)
		}

		if (segments.length > 0) {
			return { html: segments.join('') }
		}

		return { text: resource.title || '' }
	}, [])

	const dataFiltered = useMemo(
		() =>
			applyFilter({
				inputData: events,
				filters: currentFilters,
				dateError,
				resourcesInitialized
			}),
		[events, currentFilters, dateError, resourcesInitialized]
	)

	const filteredAppointments = useMemo(
		() => dataFiltered.filter(event => event.display !== 'background'),
		[dataFiltered]
	)

	const filterResults = useMemo(
		() =>
			canReset ? (
				<CalendarFiltersResult
					filters={filters}
					totalResults={filteredAppointments.length}
					showDoctorFilters={showDoctorFilterChips}
					sx={{ mb: { xs: 3, md: 5 } }}
				/>
			) : null,
		[canReset, filteredAppointments.length, filters, showDoctorFilterChips]
	)

	const flexStyles: SxProps<Theme> = {
		flex: '1 1 auto',
		display: 'flex',
		flexDirection: 'column'
	}

	const layoutStyles: SxProps<Theme> = {
		flex: '1 1 auto',
		display: 'flex',
		gap: 3,
		alignItems: 'stretch',
		flexDirection: { xs: 'column', md: 'row' }
	}

	const calendarCardStyles: SxProps<Theme> = {
		...flexStyles,
		minHeight: { xs: '60vh', md: '70vh' },
		maxHeight: { xs: 'none', md: 'calc(100vh - 240px)' },
		overflow: 'hidden'
	}

	return (
		<>
			<DashboardContent
				maxWidth='xl'
				sx={{ ...flexStyles }}
			>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						mb: { xs: 3, md: 5 },
						gap: '20px'
					}}
				>
					<Typography variant='h4'>Записи</Typography>

					<Stack
						spacing={1}
						direction='row'
					>
						<CanceledVisits />
						<AvailableSearch
							open={isAvailableSearchOpen}
							onOpen={openAvailableSearch}
							onClose={handleSearchDialogClose}
							onSlotSelect={handleSlotSelect}
							resetToken={searchResetToken}
							initialServiceIds={selectedSearchServiceIds}
							initialPackageIds={selectedSearchPackageIds}
						/>
						<Button
							variant='contained'
							color='primary'
							startIcon={<Iconify icon='mingcute:add-line' />}
							onClick={handleOpenFormManual}
						>
							Новая запись
						</Button>
					</Stack>
				</Box>

				{filterResults}

				<Box sx={{ ...layoutStyles }}>
					<Card sx={calendarCardStyles}>
						<Box
							sx={{
								flex: '1 1 auto',
								minHeight: 0,
								overflow: 'auto',
								display: 'flex'
							}}
						>
							<CalendarRoot
								sx={{
									...flexStyles,
									overflowX: 'visible',
									minHeight: '100%',
									'.fc.fc-media-screen': { flex: '1 1 auto', minWidth: 'max-content' }
								}}
							>
								<CalendarToolbar
									date={fDate(date)}
									view={view}
									canReset={canReset}
									loading={isAppointmentsFetching}
									onNextDate={onDateNext}
									onPrevDate={onDatePrev}
									onToday={onDateToday}
									onChangeView={onChangeView}
									onOpenFilters={openFilters.onTrue}
								/>

								<Calendar
									weekends
									editable={false}
									droppable={false}
									selectable
									allDaySlot={false}
									rerenderDelay={10}
									allDayMaintainDuration
									ref={calendarRef}
									initialDate={date}
									initialView={view}
									dayMaxEventRows={3}
									eventDisplay='block'
									events={dataFiltered}
									headerToolbar={false}
									select={onSelectRange}
									selectAllow={selectAllow}
									eventClick={onClickEvent}
									aspectRatio={3}
									businessHours={{
										daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
										startTime: workingHours.slotMinTime,
										endTime: workingHours.slotMaxTime
									}}
									slotDuration={CALENDAR_SLOT_DURATION}
									snapDuration={CALENDAR_SLOT_DURATION}
									slotMinWidth={DEFAULT_RESOURCE_MIN_WIDTH}
									slotMinTime={workingHours.slotMinTime}
									slotMaxTime={workingHours.slotMaxTime}
									scrollTime={workingHours.scrollTime}
									resources={calendarResources}
									resourceLabelContent={renderResourceLabel}
									slotLabelFormat={{
										hour: '2-digit',
										minute: '2-digit',
										hour12: false
									}}
									eventTimeFormat={{
										hour: '2-digit',
										minute: '2-digit',
										hour12: false
									}}
									plugins={[
										listPlugin,
										dayGridPlugin,
										timelinePlugin,
										resourceTimeGridPlugin,
										timeGridPlugin,
										interactionPlugin
									]}
								/>
							</CalendarRoot>
						</Box>
					</Card>
				</Box>
			</DashboardContent>

			<Dialog
				fullWidth
				maxWidth='md'
				open={openForm}
				onClose={handleCloseForm}
				transitionDuration={{
					enter: theme.transitions.duration.shortest,
					exit: theme.transitions.duration.shortest - 80
				}}
				slotProps={{
					paper: {
						sx: {
							display: 'flex',
							overflow: 'hidden',
							flexDirection: 'column',
							'& form': {
								...flexStyles,
								minHeight: 0
							}
						}
					}
				}}
			>
				<DialogTitle sx={{ minHeight: 76 }}>
					{openForm && <> {currentEvent?.id ? 'Обновить' : 'Добавить'} запись</>}
				</DialogTitle>

				<CalendarForm
					currentEvent={currentEvent}
					onClose={handleCloseForm}
					onBack={openedFromSearch ? handleBackToSearch : undefined}
					workingHours={workingHours}
				/>
			</Dialog>

			<CalendarFilters
				filters={filters}
				canReset={canReset}
				dateError={dateError}
				open={openFilters.value}
				onClose={openFilters.onFalse}
			/>
		</>
	)
}

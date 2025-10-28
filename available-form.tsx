import type { ColumnDef, OnChangeFn, PaginationState } from '@tanstack/react-table'
import type {
	AvailableSlot,
	AvailableSlotFilter,
	FetchAvailableSlotsParams
} from 'src/api_v2/appoint/appoint-free.types'

import dayjs from 'dayjs'
import { useForm, Controller } from 'react-hook-form'
import React, { useMemo, useState, useEffect, useCallback } from 'react'
import {
	flexRender,
	useReactTable,
	getCoreRowModel,
	getPaginationRowModel
} from '@tanstack/react-table'

import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import TableRow from '@mui/material/TableRow'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import Typography from '@mui/material/Typography'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'

import { useAvailableSlots } from 'src/api_v2/appoint/appoint.hooks'

import { Scrollbar } from 'src/components/scrollbar'
import { Form, Field } from 'src/components/hook-form'
import { TableNoData, TablePaginationCustom } from 'src/components/table'
import { StaffSelector, ServiceFieldSelector } from 'src/components/selectors'

import { useServiceDurations } from './hooks/use-service-durations'
import { toStringArray, haveSameMembers } from './utils/form-helpers'
import { createAvailableSlotsColumns } from './available-form.columns'
import { usePackageServiceSync } from './hooks/use-package-service-sync'
import {
	DAY_OPTIONS,
	DEFAULT_PAGE,
	DEFAULT_PAGE_SIZE,
	TIME_OF_DAY_OPTIONS,
	DEFAULT_GRID_MINUTES,
	DEFAULT_DURATION_MINUTES
} from './const-options'

type AvailableFormValues = {
	timeStart: string
	timeEnd: string
	weekdays: string[]
	preferredTimesOfDay: string[]
	doctorIds: number[]
	excludeDoctorIds: number[]
	serviceIds: string[]
	packageIds: string[]
	duration: number
}

type AvailableFormProps = {
	onSelectSlot?: (
		slot: AvailableSlot,
		context: { packageIds: number[]; serviceIds: number[] }
	) => void
	selectedServiceIds?: number[]
	selectedPackageIds?: number[]
	resetKey?: number
}

export const AvailableForm: React.FC<AvailableFormProps> = ({
	onSelectSlot,
	selectedServiceIds,
	selectedPackageIds,
	resetKey
}) => {
	const methods = useForm<AvailableFormValues>({
		mode: 'onSubmit',
		defaultValues: {
			timeStart: '',
			timeEnd: '',
			weekdays: [],
			preferredTimesOfDay: [],
			doctorIds: [],
			excludeDoctorIds: [],
			serviceIds: [],
			packageIds: [],
			duration: DEFAULT_DURATION_MINUTES
		}
	})

	const { control, handleSubmit, watch, setValue, getValues, reset: resetForm } = methods

	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: DEFAULT_PAGE,
		pageSize: DEFAULT_PAGE_SIZE
	})

	const [baseParams, setBaseParams] = useState<Omit<
		FetchAvailableSlotsParams,
		'page' | 'size'
	> | null>(null)

	const watchedPackageIds = watch('packageIds')
	const watchedServiceIds = watch('serviceIds')

	const updateServiceIds = useCallback(
		(ids: string[]) =>
			setValue('serviceIds', ids, {
				shouldDirty: false,
				shouldTouch: false,
				shouldValidate: true
			}),
		[setValue]
	)

	const updatePackageIds = useCallback(
		(ids: string[]) =>
			setValue('packageIds', ids, {
				shouldDirty: false,
				shouldTouch: false
			}),
		[setValue]
	)

	const { packageIds, serviceIds } = usePackageServiceSync({
		packageValue: watchedPackageIds,
		serviceValue: watchedServiceIds,
		onChangeServiceIds: updateServiceIds,
		onChangePackageIds: updatePackageIds
	})

	const { totalMinutes: totalServiceMinutes } = useServiceDurations(serviceIds)

	useEffect(() => {
		if (typeof resetKey !== 'number' || resetKey <= 0) {
			return
		}

		resetForm()
		setBaseParams(null)
		setPagination({ pageIndex: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE })
	}, [resetForm, resetKey, setBaseParams, setPagination])

	useEffect(() => {
		if (!Array.isArray(selectedPackageIds)) {
			return
		}

		const currentValue = getValues('packageIds')
		const normalized = selectedPackageIds.map(id => String(id))
		const currentNormalized = toStringArray(currentValue)

		if (haveSameMembers(normalized, currentNormalized)) {
			return
		}

		setValue('packageIds', normalized, {
			shouldDirty: false,
			shouldTouch: false,
			shouldValidate: true
		})
	}, [getValues, selectedPackageIds, setValue])

	useEffect(() => {
		if (!Array.isArray(selectedServiceIds) || !selectedServiceIds.length) {
			return
		}

		const currentValue = getValues('serviceIds')
		const normalized = selectedServiceIds.map(id => String(id))
		const currentNormalized = toStringArray(currentValue)

		if (haveSameMembers(normalized, currentNormalized)) {
			return
		}

		setValue('serviceIds', normalized, {
			shouldDirty: false,
			shouldTouch: false,
			shouldValidate: true
		})
	}, [getValues, selectedServiceIds, setValue])

	useEffect(() => {
		if (!serviceIds.length) {
			return
		}

		if (!totalServiceMinutes || totalServiceMinutes <= 0) {
			return
		}

		const currentDuration = getValues('duration')
		if (currentDuration === totalServiceMinutes) {
			return
		}

		setValue('duration', totalServiceMinutes, { shouldDirty: false, shouldTouch: false })
	}, [getValues, serviceIds, setValue, totalServiceMinutes])

	const onSubmit = handleSubmit(data => {
		const fromDate = data.timeStart
			? dayjs(data.timeStart).format('YYYY-MM-DD')
			: dayjs().format('YYYY-MM-DD')

		const uniqueDoctorIds = Array.isArray(data.doctorIds)
			? Array.from(
					new Set(data.doctorIds.map(Number).filter(value => Number.isFinite(value) && value > 0))
				)
			: []

		const parsedDuration = Number(data.duration)
		const rawDurationMinutes =
			Number.isFinite(parsedDuration) && parsedDuration > 0
				? parsedDuration
				: totalServiceMinutes && totalServiceMinutes > 0
					? totalServiceMinutes
					: DEFAULT_DURATION_MINUTES
		const durationMinutes = Math.max(Math.round(rawDurationMinutes), 1)

		const filters: AvailableSlotFilter[] = []

		uniqueDoctorIds.forEach(value => {
			filters.push({
				key: 'doctorId',
				value,
				operation: '=='
			})
		})

		let genericFilterIndex = 1

		const timeStart = data.timeStart ? dayjs(data.timeStart) : null
		let timeEnd = data.timeEnd ? dayjs(data.timeEnd) : null

		if (timeStart?.isValid() && (!timeEnd || !timeEnd.isValid())) {
			timeEnd = timeStart.add(1, 'week')
		}

		if (timeStart?.isValid() && timeEnd?.isValid() && timeEnd.isAfter(timeStart)) {
			filters.push({
				key: 'startTime',
				value: [timeStart.format('YYYY-MM-DDTHH:mm'), timeEnd.format('YYYY-MM-DDTHH:mm')],
				operation: 'overlaps',
				paramKey: String(genericFilterIndex++),
				disableIndexSuffix: true
			})
		}

		const normalizedWeekdays = Array.isArray(data.weekdays)
			? data.weekdays
					.map(value => (typeof value === 'string' ? value.trim() : ''))
					.filter(value => value.length > 0)
			: []

		const normalizedDayparts = Array.isArray(data.preferredTimesOfDay)
			? data.preferredTimesOfDay
					.map(value => (typeof value === 'string' ? value.trim() : ''))
					.filter(value => value.length > 0)
			: []

		if (normalizedWeekdays.length) {
			const joined = normalizedWeekdays.join(',')
			filters.push({
				key: 'weekdays',
				value: joined,
				paramKey: 'weekdays',
				disableIndexSuffix: true,
				raw: true
			})
		}

		if (normalizedDayparts.length) {
			const joined = normalizedDayparts.join(',')
			filters.push({
				key: 'daypart',
				value: joined,
				paramKey: 'daypart',
				disableIndexSuffix: true,
				raw: true
			})
		}

		const baseRequest: Omit<FetchAvailableSlotsParams, 'page' | 'size'> = {
			duration: durationMinutes,
			grid: DEFAULT_GRID_MINUTES,
			fromDate,
			filters: filters.length ? filters : undefined
		}

		setBaseParams(baseRequest)
		setPagination({
			pageIndex: DEFAULT_PAGE,
			pageSize: DEFAULT_PAGE_SIZE
		})
	})

	const handlePaginationChange: OnChangeFn<PaginationState> = updater =>
		setPagination(prev => (typeof updater === 'function' ? updater(prev) : updater))

	const queryParams = useMemo(() => {
		if (!baseParams) {
			return null
		}

		return {
			...baseParams,
			page: pagination.pageIndex,
			size: pagination.pageSize
		}
	}, [baseParams, pagination.pageIndex, pagination.pageSize])

	const {
		data: slotsPage,
		error: slotsError,
		isFetching: isFetchingSlots,
		isPending: isPendingSlots
	} = useAvailableSlots(queryParams)

	useEffect(() => {
		if (!slotsPage?.pageable) {
			return
		}

		const nextPageIndex = slotsPage.pageable.pageNumber ?? DEFAULT_PAGE
		const nextPageSize = slotsPage.pageable.pageSize ?? DEFAULT_PAGE_SIZE

		setPagination(prev => {
			if (prev.pageIndex === nextPageIndex && prev.pageSize === nextPageSize) {
				return prev
			}

			return {
				pageIndex: nextPageIndex,
				pageSize: nextPageSize
			}
		})
	}, [slotsPage])

	const handleSelectSlot = useCallback(
		(slot: AvailableSlot) => {
			onSelectSlot?.(slot, { packageIds, serviceIds })
		},
		[onSelectSlot, packageIds, serviceIds]
	)

	const effectiveSelectedServiceIds =
		Array.isArray(selectedServiceIds) && selectedServiceIds.length ? selectedServiceIds : serviceIds

	const columns = useMemo<ColumnDef<AvailableSlot>[]>(
		() =>
			createAvailableSlotsColumns({
				handleSelectSlot,
				isSelectionEnabled: Boolean(onSelectSlot),
				selectedServiceIds: effectiveSelectedServiceIds
			}),
		[effectiveSelectedServiceIds, handleSelectSlot, onSelectSlot]
	)

	const table = useReactTable({
		data: slotsPage?.content ?? [],
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onPaginationChange: handlePaginationChange,
		pageCount: slotsPage?.totalPages ?? 0,
		manualPagination: true,
		state: { pagination }
	})

	const hasSearched = !!baseParams
	const totalFound = slotsPage?.totalElements ?? 0
	const errorMessage = slotsError
		? slotsError.payload?.message
		: slotsError
			? 'Failed to load available slots'
			: null
	const isSearching = isPendingSlots || isFetchingSlots
	const notFound = hasSearched && !isSearching && !(slotsPage?.content?.length ?? 0)

	return (
		<Form
			methods={methods}
			onSubmit={onSubmit}
		>
			<Stack
				spacing={3}
				p={3}
				sx={{ overflow: 'auto' }}
			>
				<Box>
					<Typography
						variant='subtitle2'
						sx={{ mb: 2 }}
					>
						Time Window (optional)
					</Typography>

					<Stack
						direction={{ xs: 'column', sm: 'row' }}
						spacing={2}
					>
						<Field.MobileDateTimePicker
							name='timeStart'
							label='Start Time'
						/>

						<Field.MobileDateTimePicker
							name='timeEnd'
							label='End Time'
						/>
					</Stack>
				</Box>

				<Divider />

				<Stack spacing={2}>
					<ServiceFieldSelector
						name='packageIds'
						label='Packages'
						type='Package'
						multiple
					/>

					<ServiceFieldSelector
						name='serviceIds'
						label='Services'
						type='Service'
						multiple
					/>

					<Field.NumberInput
						name='duration'
						label='Длительность (мин)'
						sx={{ maxWidth: '200px' }}
					/>
				</Stack>

				<Divider />

				<Box>
					<Stack spacing={2}>
						<Controller
							name='doctorIds'
							control={control}
							render={({ field }) => (
								<StaffSelector
									selectedIds={Array.isArray(field.value) ? field.value : []}
									onChange={value => field.onChange(value)}
									label='Doctors'
									multiple
								/>
							)}
						/>
					</Stack>
				</Box>

				<Divider />

				<Field.MultiCheckbox
					name='weekdays'
					label='Preferred Days'
					options={DAY_OPTIONS}
					sx={{
						flexDirection: 'row'
					}}
				/>

				<Field.MultiCheckbox
					name='preferredTimesOfDay'
					label='Preferred Daypart'
					options={TIME_OF_DAY_OPTIONS}
					sx={{
						flexDirection: 'row'
					}}
				/>

				<Divider />

				<Box position='relative'>
					<Typography
						variant='subtitle2'
						sx={{ mb: 2 }}
					>
						Available Slots ({totalFound} found)
					</Typography>

					{hasSearched && errorMessage && (
						<Alert
							severity='error'
							sx={{ mb: 2 }}
						>
							{errorMessage}
						</Alert>
					)}

					{hasSearched && isSearching && (
						<Box
							sx={{
								position: 'absolute',
								inset: 0,
								display: 'flex',
								alignItems: 'flex-start',
								justifyContent: 'center',
								backgroundColor: 'rgba(255, 255, 255, 0.75)',
								zIndex: 2
							}}
						>
							<CircularProgress size={20} />
						</Box>
					)}

					{hasSearched && !errorMessage && (
						<>
							<Box sx={{ position: 'relative' }}>
								<Scrollbar>
									<Table>
										<TableHead>
											{table.getHeaderGroups().map(headerGroup => (
												<TableRow key={headerGroup.id}>
													{headerGroup.headers.map(header => (
														<TableCell
															key={header.id}
															sx={{ whiteSpace: 'nowrap' }}
														>
															<Typography variant='subtitle2'>
																{header.isPlaceholder
																	? null
																	: flexRender(header.column.columnDef.header, header.getContext())}
															</Typography>
														</TableCell>
													))}
												</TableRow>
											))}
										</TableHead>
										<TableBody>
											{table.getRowModel().rows.map(row => (
												<TableRow key={row.id}>
													{row.getVisibleCells().map(cell => (
														<TableCell key={cell.id}>
															{flexRender(cell.column.columnDef.cell, cell.getContext())}
														</TableCell>
													))}
												</TableRow>
											))}

											<TableNoData notFound={notFound} />
										</TableBody>
									</Table>
								</Scrollbar>
							</Box>

							{(slotsPage?.totalPages ?? 0) > 1 && <TablePaginationCustom table={table} />}
						</>
					)}

					{!hasSearched && (
						<Typography
							variant='body2'
							color='text.secondary'
						>
							Configure filters and start a search to see available slots.
						</Typography>
					)}
				</Box>
			</Stack>

			<DialogActions sx={{ flexShrink: 0 }}>
				<Button
					type='submit'
					variant='contained'
					loading={isFetchingSlots}
					disabled={isFetchingSlots}
				>
					Search for Available Slots
				</Button>
			</DialogActions>
		</Form>
	)
}

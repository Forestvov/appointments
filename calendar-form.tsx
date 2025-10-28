import type { ICalendarEvent } from 'src/types/calendar'
import type { IEventCreate, IEventUpdate } from 'src/api_v2/appoint/appoint.types'

import { z } from 'zod'
import React from 'react'
import dayjs from 'dayjs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import { Typography } from '@mui/material'
import DialogActions from '@mui/material/DialogActions'

import { fIsAfter, fDateTime, minutesBetween } from 'src/utils/format-time'

import { EventCreateSchema } from 'src/api_v2/appoint/appoint.types'
import { useCreateAppoint, useUpdateAppoint } from 'src/api_v2/appoint/appoint.hooks'

import { toast } from 'src/components/snackbar'
import { Scrollbar } from 'src/components/scrollbar'
import { Form, Field } from 'src/components/hook-form'
import {
	PatientFieldSelector,
	ServiceFieldSelector,
	AppointmentBooksFieldSelector
} from 'src/components/selectors'

import { useServiceDurations } from './hooks/use-service-durations'
import { usePackageServiceSync } from './hooks/use-package-service-sync'

// ----------------------------------------------------------------------

type Props = {
	onClose: () => void
	onBack?: () => void
	currentEvent?: ICalendarEvent
	workingHours: {
		minMinutes: number
		maxMinutes: number
		byDoctor: Record<string, { minMinutes: number; maxMinutes: number }>
	}
}

const createBoundTime = (minutes: number) =>
	dayjs().startOf('day').add(minutes, 'minute').second(0).millisecond(0)

const toStringOrEmpty = (value?: string | number | null) =>
	value !== undefined && value !== null ? String(value) : ''

const CalendarFormSchema = EventCreateSchema.extend({
	packageIds: z.array(z.union([z.string(), z.number()])).default([])
})

type CalendarFormValues = z.infer<typeof CalendarFormSchema>

export function CalendarForm({ currentEvent, onClose, onBack, workingHours }: Props) {
	const { mutateAsync: createAppoint, isPending: isCreatePending } = useCreateAppoint()
	const { mutateAsync: updateAppoint, isPending: isUpdatePending } = useUpdateAppoint()

	const formDefaultValues = React.useMemo(
		() => ({
			id: toStringOrEmpty(currentEvent?.id),
			startTime: currentEvent?.start ?? '',
			endTime: currentEvent?.end ?? '',
			doctorId: toStringOrEmpty(currentEvent?.doctorId),
			patientId: toStringOrEmpty(currentEvent?.patientId),
			description: currentEvent?.description ?? '',
			time: '',
			serviceIds: Array.isArray(currentEvent?.serviceIds)
				? currentEvent.serviceIds.map(serviceId => String(serviceId))
				: [],
			packageIds: Array.isArray(currentEvent?.packageIds)
				? currentEvent.packageIds.map(packageId => String(packageId))
				: []
		}),
		[currentEvent]
	)

	const methods = useForm<CalendarFormValues>({
		mode: 'onSubmit',
		resolver: zodResolver(CalendarFormSchema),
		defaultValues: formDefaultValues
	})

	const {
		reset,
		watch,
		setValue,
		handleSubmit,
		formState: { isSubmitting }
	} = methods

	React.useEffect(() => {
		reset(formDefaultValues)
	}, [formDefaultValues, reset])

	const startTime = watch('startTime')
	const endTime = watch('endTime')
	const doctorId = watch('doctorId')
	const serviceIds = watch('serviceIds')
	const packageIds = watch('packageIds')

	const dateError = fIsAfter(startTime, endTime)

	const updateServiceIds = React.useCallback(
		(ids: string[]) =>
			setValue('serviceIds', ids, {
				shouldDirty: false,
				shouldTouch: false,
				shouldValidate: true
			}),
		[setValue]
	)

	const updatePackageIds = React.useCallback(
		(ids: string[]) =>
			setValue('packageIds', ids, {
				shouldDirty: false,
				shouldTouch: false,
				shouldValidate: true
			}),
		[setValue]
	)

	const { serviceIds: normalizedServiceIds, resetTracking } = usePackageServiceSync({
		packageValue: packageIds,
		serviceValue: serviceIds,
		onChangeServiceIds: updateServiceIds,
		onChangePackageIds: updatePackageIds
	})

	React.useEffect(() => {
		resetTracking({
			packageIds: formDefaultValues.packageIds,
			serviceIds: formDefaultValues.serviceIds
		})
	}, [formDefaultValues, resetTracking])

	const { totalMinutes: totalServiceMinutes } = useServiceDurations(normalizedServiceIds)

	const computedEndTime = React.useMemo(() => {
		if (!startTime) {
			return ''
		}

		const start = dayjs(startTime)

		if (!start.isValid()) {
			return ''
		}

		return start.add(totalServiceMinutes, 'minute').format()
	}, [startTime, totalServiceMinutes])

	React.useEffect(() => {
		if (!startTime) {
			setValue('endTime', '')
			return
		}

		if (!computedEndTime) {
			return
		}

		if (computedEndTime !== endTime) {
			setValue('endTime', computedEndTime, { shouldValidate: true })
		}
	}, [computedEndTime, endTime, setValue, startTime])

	const endTimeLabel = React.useMemo(
		() => `End Time (Duration: ${totalServiceMinutes}m)`,
		[totalServiceMinutes]
	)

	const doctorWorkingWindow = React.useMemo(() => {
		const doctorKey = doctorId ? String(doctorId) : ''
		const doctorLimits = doctorKey ? workingHours.byDoctor[doctorKey] : undefined

		const minMinutes = doctorLimits?.minMinutes ?? workingHours.minMinutes
		const maxMinutes = doctorLimits?.maxMinutes ?? workingHours.maxMinutes

		return minMinutes >= maxMinutes
			? {
					min: createBoundTime(workingHours.minMinutes),
					max: createBoundTime(workingHours.maxMinutes)
				}
			: {
					min: createBoundTime(minMinutes),
					max: createBoundTime(maxMinutes)
				}
	}, [doctorId, workingHours])

	const onSubmit = handleSubmit(async data => {
		const eventData = {
			time: minutesBetween(data.startTime, data.endTime),
			doctorId: data.doctorId,
			patientId: data.patientId,
			startTime: fDateTime(data.startTime, 'YYYY-MM-DD, HH:mm:ss'),
			description: data.description,
			serviceIds: Array.isArray(data.serviceIds)
				? data.serviceIds.map(serviceId => Number(serviceId)).filter(Number.isFinite)
				: []
		}

		try {
			if (!dateError) {
				if (currentEvent?.id) {
					await updateAppoint({
						...eventData,
						id: currentEvent.id
					} as unknown as IEventUpdate)
					toast.success('Запись обновлена!')
				} else {
					await createAppoint(eventData as unknown as IEventCreate)
					toast.success('Запись создана!')
				}
				onClose()
				reset()
			}
		} catch (error) {
			console.error(error)
		}
	})

	return (
		<Form
			methods={methods}
			onSubmit={onSubmit}
		>
			<Scrollbar sx={{ p: 3, bgcolor: 'background.neutral' }}>
				<Stack spacing={3}>
					<Stack
						spacing={3}
						direction='row'
						alignContent='center'
					>
						<Field.MobileDateTimePicker
							name='startTime'
							label='Start Time'
							sx={{ width: 1 }}
							minTime={doctorWorkingWindow.min}
							maxTime={doctorWorkingWindow.max}
							minutesStep={5}
						/>

						<Field.MobileDateTimePicker
							name='endTime'
							disabled
							label={endTimeLabel}
							sx={{ width: 1 }}
							minTime={doctorWorkingWindow.min}
							maxTime={doctorWorkingWindow.max}
							minutesStep={5}
							slotProps={{
								textField: {
									error: !!methods.formState.errors.endTime,
									helperText: dateError
										? 'Конец записи раньше начала'
										: methods.formState.errors.endTime
											? methods.formState.errors.endTime.message
											: null
								}
							}}
						/>
					</Stack>

					<PatientFieldSelector
						name='patientId'
						label='Patient'
					/>

					<Box>
						<Stack spacing={2}>
							<ServiceFieldSelector
								name='packageIds'
								label='Пакеты'
								type='Package'
								multiple
							/>

							<ServiceFieldSelector
								name='serviceIds'
								label='Услуги'
								type='Service'
								multiple
							/>
						</Stack>

						<Typography
							variant='body2'
							color='text.secondary'
							sx={{ mt: 1, pl: 2, fontSize: 13 }}
						>
							Total duration: {totalServiceMinutes} minutes
						</Typography>
					</Box>

					<AppointmentBooksFieldSelector
						name='doctorId'
						label='Resource (Doctor/Room)'
					/>

					<Field.Text
						name='description'
						label='Комментарий'
						multiline
						rows={3}
					/>
				</Stack>
			</Scrollbar>

			<DialogActions sx={{ flexShrink: 0 }}>
				{onBack && (
					<Button
						variant='text'
						color='inherit'
						onClick={onBack}
					>
						Назад
					</Button>
				)}

				<Box sx={{ flexGrow: 1 }} />

				{currentEvent?.id && (
					<>
						<Button
							variant='contained'
							color='error'
						>
							Cancel Appointment
						</Button>
						<Button
							variant='outlined'
							color='info'
						>
							Add to Waiting List
						</Button>
					</>
				)}

				<Button
					variant='outlined'
					color='inherit'
					onClick={onClose}
				>
					Отмена
				</Button>

				<Button
					type='submit'
					variant='contained'
					loading={isSubmitting || isCreatePending || isUpdatePending}
					disabled={dateError}
				>
					Сохранить
				</Button>
			</DialogActions>
		</Form>
	)
}

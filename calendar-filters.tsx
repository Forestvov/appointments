import type { IDatePickerControl } from 'src/types/common'
import type { ICalendarFilters } from 'src/types/calendar'
import type { UseSetStateReturn } from 'minimal-shared/hooks'

import { useCallback } from 'react'

import Box from '@mui/material/Box'
import Badge from '@mui/material/Badge'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

import { Iconify } from 'src/components/iconify'
import { Scrollbar } from 'src/components/scrollbar'
import { AppointmentBooksSelector } from 'src/components/selectors'

// ----------------------------------------------------------------------

type Props = {
	open: boolean
	canReset: boolean
	dateError: boolean
	onClose: () => void
	filters: UseSetStateReturn<ICalendarFilters>
}

type SelectorValue = string | number

export function CalendarFilters({ open, onClose, filters, canReset, dateError }: Props) {
	const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters

	const handleFilterStartDate = useCallback(
		(newValue: IDatePickerControl) => {
			updateFilters({ startDate: newValue })
		},
		[updateFilters]
	)

	const handleFilterEndDate = useCallback(
		(newValue: IDatePickerControl) => {
			updateFilters({ endDate: newValue })
		},
		[updateFilters]
	)

	const handleFilterDoctorIds = useCallback(
		(newValue: SelectorValue | SelectorValue[] | null) => {
			const rawValues = newValue == null ? [] : Array.isArray(newValue) ? newValue : [newValue]
			const idsArray = rawValues
				.map(value => (typeof value === 'number' ? value : Number(value)))
				.filter((value): value is number => Number.isFinite(value))
			const uniqueIds = Array.from(new Set(idsArray))

			updateFilters({ doctorIds: uniqueIds })
		},
		[updateFilters]
	)

	const renderHead = () => (
		<>
			<Box
				sx={{
					py: 2,
					pr: 1,
					pl: 2.5,
					display: 'flex',
					alignItems: 'center'
				}}
			>
				<Typography
					variant='h6'
					sx={{ flexGrow: 1 }}
				>
					Filters
				</Typography>

				<Tooltip title='Reset'>
					<IconButton onClick={() => resetFilters()}>
						<Badge
							color='error'
							variant='dot'
							invisible={!canReset}
						>
							<Iconify icon='solar:restart-bold' />
						</Badge>
					</IconButton>
				</Tooltip>

				<IconButton onClick={onClose}>
					<Iconify icon='mingcute:close-line' />
				</IconButton>
			</Box>

			<Divider sx={{ borderStyle: 'dashed' }} />
		</>
	)

	const renderDateRange = () => (
		<Box
			sx={{
				mb: 3,
				px: 2.5,
				display: 'flex',
				flexDirection: 'column',
				mt: 3
			}}
		>
			<Typography
				variant='subtitle2'
				sx={{ mb: 1.5 }}
			>
				Даты
			</Typography>

			<DatePicker
				label='Время записи'
				value={currentFilters.startDate}
				onChange={handleFilterStartDate}
				sx={{ mb: 2.5 }}
			/>

			<DatePicker
				label='Конец записи'
				value={currentFilters.endDate}
				onChange={handleFilterEndDate}
				slotProps={{
					textField: {
						error: dateError,
						helperText: dateError ? 'Конец записи раньше начала' : null
					}
				}}
			/>
		</Box>
	)

	const renderStuff = () => (
		<Box
			sx={{
				mb: 3,
				px: 2.5,
				display: 'flex',
				flexDirection: 'column',
				mt: 3
			}}
		>
			<AppointmentBooksSelector
				label='Врачи'
				value={currentFilters.doctorIds}
				multiple
				onChange={handleFilterDoctorIds}
			/>
		</Box>
	)

	return (
		<Drawer
			anchor='right'
			open={open}
			onClose={onClose}
			slotProps={{
				backdrop: { invisible: true },
				paper: { sx: { width: 320 } }
			}}
		>
			{renderHead()}

			<Scrollbar>
				{renderDateRange()}

				{renderStuff()}
			</Scrollbar>
		</Drawer>
	)
}

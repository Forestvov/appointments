import type { ColumnDef } from '@tanstack/react-table'
import type { AvailableSlot } from 'src/api_v2/appoint/appoint-free.types'

import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

import { fDateTime } from 'src/utils/format-time'

type CreateAvailableSlotsColumnsParams = {
	handleSelectSlot: (slot: AvailableSlot) => void
	isSelectionEnabled: boolean
	selectedServiceIds: number[]
}

export const createAvailableSlotsColumns = ({
	handleSelectSlot,
	isSelectionEnabled,
	selectedServiceIds
}: CreateAvailableSlotsColumnsParams): ColumnDef<AvailableSlot>[] => [
	{
		accessorKey: 'start',
		header: 'Start',
		cell: ({ row }) => (
			<Typography variant='body2'>{fDateTime(row.original.start, 'DD MMM YYYY, HH:mm')}</Typography>
		)
	},
	{
		accessorKey: 'end',
		header: 'End',
		cell: ({ row }) => (
			<Typography variant='body2'>{fDateTime(row.original.end, 'HH:mm')}</Typography>
		)
	},
	{
		accessorKey: 'doctorFio',
		header: 'Doctor',
		cell: ({ row }) => (
			<Typography
				variant='body2'
				color='text.secondary'
			>
				{row.original.doctorFio || '—'}
			</Typography>
		)
	},
	{
		accessorKey: 'appointBookName',
		header: 'Resource',
		cell: ({ row }) => (
			<Typography
				variant='body2'
				color='text.secondary'
			>
				{row.original.appointBookName || '—'}
			</Typography>
		)
	},
	{
		id: 'actions',
		header: '',
		enableSorting: false,
		enableHiding: false,
		cell: ({ row }) => (
			<Button
				variant='outlined'
				size='small'
				onClick={() =>
					handleSelectSlot({
						...row.original,
						serviceIds: selectedServiceIds.length
							? selectedServiceIds
							: Array.isArray(row.original.serviceIds)
								? row.original.serviceIds
								: []
					})
				}
				disabled={!isSelectionEnabled}
			>
				Записать
			</Button>
		)
	}
]

import type { ICalendarFilters } from 'src/types/calendar'
import type { UseSetStateReturn } from 'minimal-shared/hooks'
import type { FiltersResultProps } from 'src/components/filters-result'

import { useCallback } from 'react'

import Chip from '@mui/material/Chip'

import { fDateRangeShortLabel } from 'src/utils/format-time'

import { useGetStaffList } from 'src/api_v2/staff/staff.hooks'

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result'

// ----------------------------------------------------------------------

type Props = FiltersResultProps & {
	filters: UseSetStateReturn<ICalendarFilters>
	showDoctorFilters?: boolean
}

export function CalendarFiltersResult({
	filters,
	totalResults,
	sx,
	showDoctorFilters = true
}: Props) {
	const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters

	const { data } = useGetStaffList()

	const selectedLabels = currentFilters.doctorIds
		.map(crit => {
			const option = data?.find(option => option.id === Number(crit))
			return option ? { id: option.id, code: option.fio } : null
		})
		.filter(item => !!item)

	const handleRemoveDate = useCallback(() => {
		updateFilters({ startDate: null, endDate: null })
	}, [updateFilters])

	const handleRemoveDoctor = useCallback(
		(id: number) => {
			const newDoctorIds = currentFilters.doctorIds.filter(item => item !== id)
			updateFilters({ doctorIds: newDoctorIds })
		},
		[updateFilters, currentFilters]
	)

	return (
		<FiltersResult
			totalResults={totalResults}
			onReset={() => resetFilters()}
			sx={sx}
		>
			<FiltersBlock
				label='Даты:'
				isShow={Boolean(currentFilters.startDate && currentFilters.endDate)}
			>
				<Chip
					{...chipProps}
					label={fDateRangeShortLabel(currentFilters.startDate, currentFilters.endDate)}
					onDelete={handleRemoveDate}
				/>
			</FiltersBlock>

			<FiltersBlock
				label='Врачи:'
				isShow={showDoctorFilters && Boolean(selectedLabels.length)}
			>
				{selectedLabels.map(item => (
					<Chip
						{...chipProps}
						key={item.id}
						label={item.code}
						onDelete={() => handleRemoveDoctor(Number(item.id))}
						sx={{ textTransform: 'capitalize' }}
					/>
				))}
			</FiltersBlock>
		</FiltersResult>
	)
}

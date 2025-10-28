import type { Theme, SxProps } from '@mui/material/styles'
import type { AppointmentBook } from 'src/api_v2/appointment-book/appointment-book.types'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import { ListItemText } from '@mui/material'
import Checkbox from '@mui/material/Checkbox'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import FormControlLabel from '@mui/material/FormControlLabel'
import CircularProgress from '@mui/material/CircularProgress'

import { Scrollbar } from 'src/components/scrollbar'

// ----------------------------------------------------------------------

type Props = {
	appointmentBooks: AppointmentBook[]
	doctorIds: number[]
	allResourcesSelected: boolean
	partiallySelected: boolean
	isFetching: boolean
	onToggleAll: (checked: boolean) => void
	onToggleResource: (id: number) => void
	sx?: SxProps<Theme>
}

export function VisibleResourcesCard({
	sx,
	doctorIds,
	isFetching,
	appointmentBooks,
	allResourcesSelected,
	partiallySelected,
	onToggleAll,
	onToggleResource
}: Props) {
	const theme = useTheme()

	return (
		<Card sx={sx}>
			<Typography
				variant='subtitle1'
				sx={{ px: 2, pt: 2, pb: 1 }}
			>
				Visible Resources
			</Typography>

			<FormControlLabel
				control={
					<Checkbox
						size='small'
						indeterminate={partiallySelected}
						checked={allResourcesSelected}
						onChange={(_, checked) => onToggleAll(checked)}
					/>
				}
				label='All'
				sx={{ px: 2, py: 0.5 }}
			/>

			<Divider sx={{ my: 1 }} />

			<Box
				sx={{
					flex: 1,
					minHeight: 0,
					px: 2,
					pb: 2
				}}
			>
				{isFetching ? (
					<Box
						sx={{
							alignItems: 'center',
							justifyContent: 'center',
							minHeight: 160,
							display: 'flex'
						}}
					>
						<CircularProgress size={20} />
					</Box>
				) : appointmentBooks.length ? (
					<Scrollbar
						sx={{
							maxHeight: { xs: 320, md: 'calc(100vh - 320px)' }
						}}
					>
						<Stack spacing={1.25}>
							{appointmentBooks.map(book => {
								const doctorSelectionId = book.doctorMainId ?? book.id
								if (doctorSelectionId === undefined || doctorSelectionId === null) {
									return null
								}
								const isSelected = doctorIds.includes(doctorSelectionId)
								const color = book.color || theme.palette.primary.main
								const labelColor = isSelected ? color : theme.palette.text.primary

								return (
									<FormControlLabel
										key={book.id}
										control={
											<Checkbox
												size='small'
												checked={isSelected}
												onChange={() => onToggleResource(doctorSelectionId)}
												sx={{
													color,
													'&.Mui-checked': { color }
												}}
											/>
										}
										label={
											<Box
												component='span'
												sx={{
													display: 'flex',
													alignItems: 'center',
													gap: 1,
													fontSize: 13,
													fontWeight: isSelected ? 600 : 500,
													color: labelColor
												}}
											>
												<ListItemText
													primary={book.doctorMainFio}
													secondary={book.name}
												/>
											</Box>
										}
										sx={{ mx: 0 }}
									/>
								)
							})}
						</Stack>
					</Scrollbar>
				) : (
					<Typography
						variant='body2'
						color='text.secondary'
						sx={{ mt: 1 }}
					>
						Ресурсы не найдены
					</Typography>
				)}
			</Box>
		</Card>
	)
}

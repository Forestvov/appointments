import React from 'react'
import { useBoolean } from 'minimal-shared/hooks'

import { Button, Dialog, useTheme, DialogTitle } from '@mui/material'

export const CanceledVisits: React.FC = () => {
	const theme = useTheme()
	const openForm = useBoolean()

	return (
		<>
			<Button
				variant='outlined'
				color='error'
				onClick={openForm.onTrue}
			>
				Canceled Visits
			</Button>
			<Dialog
				fullWidth
				maxWidth='md'
				open={openForm.value}
				onClose={openForm.onFalse}
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
								minHeight: 0
							}
						}
					}
				}}
			>
				<DialogTitle sx={{ minHeight: 76 }}>List of Canceled Visits</DialogTitle>
			</Dialog>
		</>
	)
}

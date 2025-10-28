import type { Theme, SxProps } from '@mui/material'
import type { AvailableSlot } from 'src/api_v2/appoint/appoint-free.types'

import React from 'react'
import { useBoolean } from 'minimal-shared/hooks'

import { Button, Dialog, useTheme, DialogTitle } from '@mui/material'

import { Iconify } from 'src/components/iconify'

import { AvailableForm } from './available-form'

const flexStyles: SxProps<Theme> = {
	flex: '1 1 auto',
	display: 'flex',
	flexDirection: 'column'
}

type AvailableSearchProps = {
	onSlotSelect?: (
		slot: AvailableSlot,
		context: { packageIds: number[]; serviceIds: number[] }
	) => void
	open?: boolean
	onOpen?: () => void
	onClose?: (options?: { reset?: boolean }) => void
	resetToken?: number
	initialServiceIds?: number[]
	initialPackageIds?: number[]
}

export const AvailableSearch: React.FC<AvailableSearchProps> = ({
	onSlotSelect,
	open,
	onOpen,
	onClose,
	resetToken,
	initialServiceIds,
	initialPackageIds
}) => {
	const theme = useTheme()
	const internalState = useBoolean()
	const isControlled = typeof open === 'boolean'

	const dialogOpen = isControlled ? open : internalState.value

	const handleOpen = React.useCallback(() => {
		if (isControlled) {
			onOpen?.()
		} else {
			internalState.onTrue()
		}
	}, [internalState, isControlled, onOpen])

	const closeInternal = React.useCallback(
		(shouldReset: boolean) => {
			if (!isControlled) {
				internalState.onFalse()
			}
			onClose?.({ reset: shouldReset })
		},
		[internalState, isControlled, onClose]
	)

	const handleDialogClose = React.useCallback(
		(_event: object, _reason?: string) => {
			closeInternal(true)
		},
		[closeInternal]
	)

	const handleSlotSelect = React.useCallback(
		(slot: AvailableSlot, context: { packageIds: number[]; serviceIds: number[] }) => {
			onSlotSelect?.(slot, context)
			closeInternal(false)
		},
		[closeInternal, onSlotSelect]
	)

	return (
		<>
			<Button
				variant='outlined'
				color='primary'
				startIcon={<Iconify icon='eva:search-fill' />}
				onClick={handleOpen}
			>
				Find Available Slot
			</Button>

			<Dialog
				fullWidth
				maxWidth='md'
				open={dialogOpen}
				onClose={handleDialogClose}
				keepMounted
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
				<DialogTitle sx={{ minHeight: 76 }}>Find Available Slot</DialogTitle>
				<AvailableForm
					onSelectSlot={handleSlotSelect}
					selectedServiceIds={initialServiceIds}
					selectedPackageIds={initialPackageIds}
					resetKey={resetToken}
				/>
			</Dialog>
		</>
	)
}

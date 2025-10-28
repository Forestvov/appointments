'use client'

import type { AvailableSlot } from 'src/api_v2/appoint/appoint-free.types'

import dayjs from 'dayjs'
import { useBoolean } from 'minimal-shared/hooks'
import { useMemo, useState, useCallback } from 'react'

import { LOCAL_DATETIME_FORMAT } from '../const-options'

type OpenFormWithRangePayload = {
	end: string
	resourceDoctorMainId?: string
	resourceId?: string
	serviceIds?: number[]
	packageIds?: number[]
	start: string
}

type UseAppointmentsDialogsParams = {
	onCloseForm: () => void
	onOpenForm: () => void
	openFormWithRange: (range: OpenFormWithRangePayload) => void
}

export const useAppointmentsDialogs = ({
	onCloseForm,
	onOpenForm,
	openFormWithRange
}: UseAppointmentsDialogsParams) => {
	const {
		value: isAvailableSearchOpen,
		onTrue: openAvailableSearch,
		onFalse: closeAvailableSearch
	} = useBoolean()

	const [openedFromSearch, setOpenedFromSearch] = useState(false)
	const [selectedSearchServiceIds, setSelectedSearchServiceIds] = useState<number[]>([])
	const [selectedSearchPackageIds, setSelectedSearchPackageIds] = useState<number[]>([])
	const [searchResetToken, setSearchResetToken] = useState(0)

	const resetSearchState = useCallback(() => {
		setSelectedSearchServiceIds([])
		setSelectedSearchPackageIds([])
		setSearchResetToken(prev => prev + 1)
	}, [])

	const closeFormBase = useCallback(() => {
		setOpenedFromSearch(false)
		onCloseForm()
	}, [onCloseForm])

	const handleOpenFormManual = useCallback(() => {
		setOpenedFromSearch(false)
		resetSearchState()
		closeAvailableSearch()
		onOpenForm()
	}, [closeAvailableSearch, onOpenForm, resetSearchState])

	const handleCloseForm = useCallback(() => {
		resetSearchState()
		closeFormBase()
	}, [closeFormBase, resetSearchState])

	const handleBackToSearch = useCallback(() => {
		closeFormBase()
		setTimeout(() => {
			openAvailableSearch()
		}, 0)
	}, [closeFormBase, openAvailableSearch])

	const handleSearchDialogClose = useCallback(
		(options?: { reset?: boolean }) => {
			closeAvailableSearch()
			const shouldReset = options?.reset ?? true
			if (shouldReset) {
				resetSearchState()
			}
		},
		[closeAvailableSearch, resetSearchState]
	)

	const handleSlotSelect = useCallback(
		(slot: AvailableSlot, context: { packageIds: number[]; serviceIds: number[] }) => {
			if (!slot) {
				return
			}

			const start = dayjs(slot.start)
			const end = dayjs(slot.end)

			if (!start.isValid() || !end.isValid()) {
				return
			}

			closeAvailableSearch()
			setOpenedFromSearch(true)
			const baseServiceIds =
				Array.isArray(context?.serviceIds) && context.serviceIds.length
					? context.serviceIds
					: Array.isArray(slot.serviceIds)
						? slot.serviceIds
						: []
			const normalizedServiceIds = Array.from(
				new Set(
					baseServiceIds
						.map(serviceId => Number(serviceId))
						.filter(value => Number.isFinite(value) && value > 0)
				)
			)
			const normalizedPackageIds = Array.isArray(context?.packageIds)
				? Array.from(
						new Set(
							context.packageIds
								.map(id => Number(id))
								.filter(value => Number.isFinite(value) && value > 0)
						)
					)
				: []
			setSelectedSearchServiceIds(normalizedServiceIds)
			setSelectedSearchPackageIds(normalizedPackageIds)

			openFormWithRange({
				start: start.format(LOCAL_DATETIME_FORMAT),
				end: end.format(LOCAL_DATETIME_FORMAT),
				resourceId: Number.isFinite(slot.doctorId)
					? String(slot.doctorId)
					: slot.appointBookId !== null && slot.appointBookId !== undefined
						? String(slot.appointBookId)
						: undefined,
				resourceDoctorMainId: Number.isFinite(slot.doctorId) ? String(slot.doctorId) : undefined,
				serviceIds: normalizedServiceIds,
				packageIds: normalizedPackageIds
			})
		},
		[closeAvailableSearch, openFormWithRange]
	)

	return useMemo(
		() => ({
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
		}),
		[
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
		]
	)
}

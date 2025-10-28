import { varAlpha } from 'minimal-shared/utils'

import { styled } from '@mui/material/styles'

// ----------------------------------------------------------------------
export const CalendarRoot = styled('div')(({ theme }) => ({
	width: 'calc(100% + 2px)',
	marginLeft: -1,
	marginBottom: -1,
	overflowX: 'auto',

	'& .fc': {
		'--fc-border-color': varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
		'--fc-now-indicator-color': theme.vars.palette.error.main,
		'--fc-today-bg-color': varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
		'--fc-page-bg-color': theme.vars.palette.background.default,
		'--fc-neutral-bg-color': theme.vars.palette.background.neutral,
		'--fc-list-event-hover-bg-color': theme.vars.palette.action.hover,
		'--fc-highlight-color': theme.vars.palette.action.hover
	},

	'& .fc .fc-timegrid-axis-frame': {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'flex-end',
		justifyContent: 'flex-start'
	},
	'& .fc .fc-scrollgrid-sync-table': { minWidth: 'max-content' },

	'& .fc .fc-view-harness': {
		// minWidth: '1153px'
	},

	'& .fc .fc-license-message': { display: 'none' },
	'& .fc a': { color: theme.vars.palette.text.primary },
	'& .fc .fc-resource-label': {
		display: 'inline-flex',
		flexDirection: 'column',
		gap: theme.spacing(0.5)
	},
	'& .fc .fc-resource-label__doctor, & .fc .fc-resource-label__book': {
		display: 'block',
		whiteSpace: 'nowrap'
	},
	'& .fc .fc-resource-label__doctor': { fontWeight: theme.typography.fontWeightMedium },
	'& .fc .fc-resource-label__book': { color: theme.vars.palette.text.secondary },

	'& .fc .fc-resourceTimeGrid-view .fc-timegrid-cols': { minWidth: 'max-content' },
	'& .fc .fc-resourceTimeGrid-view .fc-timegrid-body table': { minWidth: 'max-content' },

	// '& .fc .fc-resourceTimeGrid-view .fc-timegrid-col': { width: 'auto !important' },

	'& .fc .fc-scrollgrid-liquid': {
		width: 'auto !important'
	},

	'.fc .fc-scrollgrid-sync-inner': {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		height: '100%'
	},

	'& .fc .fc-col-header-cell': {
		// minWidth: '150px'
		// width: '150px'
	},

	'& .fc .fc-timegrid-col': {
		// minWidth: '150px'
		// width: '150px'
	},

	'.fc .fc-col-header-cell-cushion': {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center'
	},

	// List Empty
	'& .fc .fc-list-empty': {
		...theme.typography.h6,
		backgroundColor: 'transparent',
		color: theme.vars.palette.text.secondary
	},

	// Event
	'& .fc .fc-event': {
		borderColor: 'transparent !important',
		backgroundColor: 'transparent !important'
	},

	'& .fc .fc-interval-item': {
		cursor: 'pointer !important'
	},

	'& .fc .fc-bg-event.fc-interval-block': {
		backgroundColor: '#d3d3d3 !important',
		cursor: 'not-allowed',
		opacity: '1 !important',
		pointerEvents: 'none'
	},

	'& .fc .fc-bg-event.fc-interval-block .fc-event-title': {
		display: 'none'
	},
	//Уже добавленный
	'& .fc .fc-event .fc-event-main': {
		padding: '2px 4px',
		borderRadius: 6,
		backgroundColor: theme.vars.palette.common.white,
		'&::before': {
			top: 0,
			left: 0,
			width: '100%',
			content: "''",
			opacity: 0.24,
			height: '100%',
			borderRadius: 6,
			position: 'absolute',
			backgroundColor: 'currentColor',
			transition: theme.transitions.create(['opacity']),
			'&:hover': { '&::before': { opacity: 0.32 } }
		}
	},
	'& .fc .fc-event .fc-event-main-frame': {
		fontSize: 13,
		lineHeight: '20px',
		filter: 'brightness(0.48)'
	},
	'& .fc .fc-daygrid-event .fc-event-title': {
		overflow: 'hidden',
		whiteSpace: 'nowrap',
		textOverflow: 'ellipsis'
	},
	'& .fc .fc-event .fc-event-time': {
		overflow: 'unset',
		fontWeight: theme.typography.fontWeightBold
	},

	// Popover
	'& .fc .fc-popover': {
		border: 0,
		overflow: 'hidden',
		boxShadow: theme.vars.customShadows.dropdown,
		borderRadius: 5,
		backgroundColor: theme.vars.palette.background.paper
	},
	'& .fc .fc-popover-header': {
		...theme.typography.subtitle2,
		padding: theme.spacing(1),
		backgroundColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08)
	},
	'& .fc .fc-popover-close': {
		opacity: 0.48,
		transition: theme.transitions.create(['opacity']),
		'&:hover': { opacity: 1 }
	},
	'& .fc .fc-more-popover .fc-popover-body': { padding: theme.spacing(1) },
	'& .fc .fc-popover-body': {
		'& .fc-daygrid-event.fc-event-start, & .fc-daygrid-event.fc-event-end': { margin: '2px 0' }
	},

	// Month View
	'& .fc .fc-day-other .fc-daygrid-day-top': {
		opacity: 1,
		'& .fc-daygrid-day-number': { color: theme.vars.palette.text.disabled }
	},
	'& .fc .fc-daygrid-day-number': { ...theme.typography.body2, padding: theme.spacing(1, 1, 0) },
	'& .fc .fc-daygrid-event': { marginTop: 4 },
	'& .fc .fc-daygrid-event.fc-event-start, & .fc .fc-daygrid-event.fc-event-end': {
		marginLeft: 4,
		marginRight: 4
	},
	'& .fc .fc-daygrid-more-link': {
		...theme.typography.caption,
		color: theme.vars.palette.text.secondary,
		'&:hover': {
			backgroundColor: 'unset',
			textDecoration: 'underline',
			color: theme.vars.palette.text.primary,
			fontWeight: theme.typography.fontWeightMedium
		}
	},

	// Week & Day View
	'& .fc .fc-timegrid-axis-cushion': {
		...theme.typography.body2,
		color: theme.vars.palette.text.secondary
	},

	'& .fc .fc-timegrid-slot-label-cushion': { ...theme.typography.body2 },
	'& .fc .fc-timegrid-slot': {
		height: 64,
		minHeight: 64
	},

	'& .fc-timegrid-slot-lane': {
		cursor: 'pointer'
	},

	// Agenda View
	'& .fc-direction-ltr .fc-list-day-text, .fc-direction-rtl .fc-list-day-side-text, .fc-direction-ltr .fc-list-day-side-text, .fc-direction-rtl .fc-list-day-text':
		{ ...theme.typography.subtitle2 },
	'& .fc .fc-list-event': {
		...theme.typography.body2,
		'& .fc-list-event-time': { color: theme.vars.palette.text.secondary }
	},
	'& .fc .fc-list-table': { '& th, td': { borderColor: 'transparent' } }
}))

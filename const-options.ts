const DEFAULT_GRID_MINUTES = 15
const DEFAULT_DURATION_MINUTES = 0
const DEFAULT_PAGE = 0
const DEFAULT_PAGE_SIZE = 50

const DAY_MINUTES = 24 * 60
const FALLBACK_MIN_MINUTES = 8 * 60
const FALLBACK_MAX_MINUTES = 20 * 60
const DEFAULT_RESOURCE_MIN_WIDTH = 200
const LOCAL_DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss'
const CALENDAR_SLOT_DURATION = '00:15:00'

const DAY_OPTIONS = [
	{ label: 'Monday', value: 'MONDAY' },
	{ label: 'Tuesday', value: 'TUESDAY' },
	{ label: 'Wednesday', value: 'WEDNESDAY' },
	{ label: 'Thursday', value: 'THURSDAY' },
	{ label: 'Friday', value: 'FRIDAY' },
	{ label: 'Saturday', value: 'SATURDAY' },
	{ label: 'Sunday', value: 'SUNDAY' }
]

const TIME_OF_DAY_OPTIONS = [
	{ label: 'Morning', value: 'MORNING' },
	{ label: 'Afternoon', value: 'AFTERNOON' },
	{ label: 'Evening', value: 'EVENING' }
]

export {
	DAY_OPTIONS,
	DAY_MINUTES,
	DEFAULT_PAGE,
	DEFAULT_PAGE_SIZE,
	TIME_OF_DAY_OPTIONS,
	FALLBACK_MAX_MINUTES,
	DEFAULT_GRID_MINUTES,
	FALLBACK_MIN_MINUTES,
	LOCAL_DATETIME_FORMAT,
	CALENDAR_SLOT_DURATION,
	DEFAULT_DURATION_MINUTES,
	DEFAULT_RESOURCE_MIN_WIDTH
}

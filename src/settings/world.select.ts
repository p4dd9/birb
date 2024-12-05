import type { SettingsFormField } from '@devvit/public-api/types/settings'

export const WorldSelect: SettingsFormField = {
	type: 'select',
	name: 'world-select',
	label: 'Select World',
	options: [
		{
			label: 'Sunset',
			value: 'sunset',
		},
		{
			label: 'Daylight',
			value: 'daylight',
		},
		{
			label: 'Evening',
			value: 'evening',
		},
		{
			label: 'Night',
			value: 'night',
		},
		{
			label: 'Midnight',
			value: 'midnight',
		},
	],
	multiSelect: false,
	helpText: 'Change the background',
	defaultValue: ['sunset'],
}

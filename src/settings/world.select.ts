import type { SettingsFormField } from '@devvit/public-api/types/settings'

export const WorldSelect: SettingsFormField = {
	type: 'select',
	name: 'world-select',
	label: 'Select World (This will change the background appearance within Reddibirds)',
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
			value: 'evenging',
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
	defaultValue: ['sunset'],
}

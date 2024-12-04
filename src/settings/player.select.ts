import type { SettingsFormField } from '@devvit/public-api/types/settings'

export const PlayerSelect: SettingsFormField = {
	type: 'select',
	name: 'player-select',
	label: 'Select Bird',
	options: [
		{
			label: 'Flix',
			value: '0',
		},
		{
			label: 'Zippy',
			value: '1',
		},
		{
			label: 'Dash',
			value: '2',
		},
		{
			label: 'Sprig',
			value: '3',
		},
		{
			label: 'Choco',
			value: '4',
		},
		{
			label: 'Frost',
			value: '5',
		},
		{
			label: 'Plum',
			value: '6',
		},
	],
	multiSelect: false,
	helpText: 'Change the bird character',
	defaultValue: ['0'],
}

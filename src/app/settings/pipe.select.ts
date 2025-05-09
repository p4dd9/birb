import type { SettingsFormField } from '@devvit/public-api/types/settings'

export const PipeSelect: SettingsFormField = {
	type: 'select',
	name: 'pipeSelect',
	label: 'Select Pipe',
	options: [
		{
			label: 'Green',
			value: '0',
		},
		{
			label: 'Yellow',
			value: '1',
		},
		{
			label: 'Red',
			value: '2',
		},
		{
			label: 'Teal',
			value: '3',
		},
		{
			label: 'White',
			value: '4',
		},
		{
			label: 'Purple',
			value: '5',
		},
		{
			label: 'Brown',
			value: '6',
		},
		{
			label: 'Orange',
			value: '7',
		},
	],
	multiSelect: false,
	helpText: 'Change the pipe colors',
	defaultValue: ['0'],
}

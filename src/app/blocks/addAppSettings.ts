import { Devvit } from '@devvit/public-api'
import { PipeSelect } from '../settings/pipe.select'
import { PlayerSelect } from '../settings/player.select'
import { WorldSelect } from '../settings/world.select'

Devvit.addSettings([PlayerSelect, WorldSelect, PipeSelect])
Devvit.addSettings([
	{
		type: 'group',
		label: 'Reddibirds Theme Customization',
		fields: [WorldSelect, PipeSelect, PlayerSelect],
		helpText:
			'The settings will change the appearance of the Game in your Community. Takes effect when a reddit user loads the game.',
	},
])

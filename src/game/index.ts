import { ReddiBirdsGame } from './game'
import { gameConfig } from './game.config'

window.addEventListener(
	'message',
	(event) => {
		if (event.origin !== 'https://www.reddit.com' || event.data.type !== 'devvit-message') return
		console.log(event)
	},
	false
)

const game = new ReddiBirdsGame(gameConfig)
game.scene.start('Boot', { ...gameConfig })

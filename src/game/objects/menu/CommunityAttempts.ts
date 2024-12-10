import type { RedisPlayer } from '../../../shared/messages'
import type { Menu } from '../../scenes/Menu'
import globalEventEmitter from '../../web/GlobalEventEmitter'
import { MagoText } from '../MagoText'

export class CommunityAttempts extends Phaser.GameObjects.Container {
	constructor(scene: Menu) {
		super(scene, 0, 0)

		this.setName('r/ GAMES')

		globalEventEmitter.once('updateBestPlayers', (bestPlayers: RedisPlayer[]) => {
			this.create(bestPlayers)
		})

		scene.add.existing(this)
	}

	create(bestPlayers: RedisPlayer[]) {
		bestPlayers.sort((a, b) => a.attempts - b.attempts)
		for (let i = 0; i < 5; i++) {
			this.add(
				new MagoText(
					this.scene,
					0,
					i * 50 + 100,
					`${i + 1}. ${bestPlayers[i]?.userName ?? 'This could be you!'} (${bestPlayers[i]?.attempts ?? '?'})`
				).setOrigin(0.5, 0)
			)
		}
	}
}

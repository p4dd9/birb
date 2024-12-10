import type { Player } from '../../../shared/messages'
import type { Menu } from '../../scenes/Menu'
import globalEventEmitter from '../../web/GlobalEventEmitter'
import { MagoText } from '../MagoText'

export class CommunityScores extends Phaser.GameObjects.Container {
	constructor(scene: Menu) {
		super(scene, 0, 0)

		this.setName('r/ SCORES')

		globalEventEmitter.once('updateBestPlayers', (bestPlayers: Player[]) => {
			this.create(bestPlayers)
		})

		scene.add.existing(this)
	}

	create(bestPlayers: Player[]) {
		for (let i = 0; i < 5; i++) {
			this.add(
				new MagoText(
					this.scene,
					0,
					i * 50 + 100,
					`${i + 1}. ${bestPlayers[i]?.userName} (${bestPlayers[i]?.score})`
				).setOrigin(0.5, 0)
			)
		}
	}
}

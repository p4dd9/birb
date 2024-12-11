import type { RedisPlayer } from '../../../shared/messages'
import type { Menu } from '../../scenes/Menu'
import { MagoText } from '../MagoText'

export class CommunityAttempts extends Phaser.GameObjects.Container {
	constructor(scene: Menu) {
		super(scene, 0, 0)

		this.setName('r/ GAMES')
		this.create(scene.registry.get('bestPlayers') ?? [])

		scene.add.existing(this)
	}

	create(bestPlayers: RedisPlayer[]) {
		const copyOfBestPlayers = [...bestPlayers]
		copyOfBestPlayers.sort((a, b) => b.attempts - a.attempts)
		for (let i = 0; i < 5; i++) {
			this.add(
				new MagoText(
					this.scene,
					0,
					i * 50 + 100,
					`${i + 1}. ${copyOfBestPlayers[i]?.userName ?? 'This could be you!'} (${copyOfBestPlayers[i]?.attempts ?? '?'})`
				).setOrigin(0.5, 0)
			)
		}
	}
}

import type { AppData, RedisPlayer } from '../../../shared/messages'
import type { Menu } from '../../scenes/Menu'
import { MagoText } from '../MagoText'

const TOP_PLAYERS_COUNT = 3

export class CommunityScores extends Phaser.GameObjects.Container {
	constructor(scene: Menu) {
		super(scene, 0, 0)

		this.setName('r/ SCORES')
		this.create(scene.registry.get('community:leaderboard') ?? [])

		scene.add.existing(this)
	}

	create(bestPlayers: RedisPlayer[]) {
		for (let i = 0; i < TOP_PLAYERS_COUNT; i++) {
			this.add(
				new MagoText(
					this.scene,
					0,
					i * 100 + 100,
					`#${i + 1} ${bestPlayers[i]?.userName ?? 'This could be you!'} (${bestPlayers[i]?.score ?? '?'})`
				).setOrigin(0.5, 0)
			)
		}
	}

	updateData(appData: AppData) {
		const players = appData.community.leaderboard
		const leaderboardPlayers = this.getAll()

		for (let i = 0; i < leaderboardPlayers.length; i++) {
			const child = leaderboardPlayers[i]
			if (child instanceof MagoText) {
				child.setText(`#${i + 1} ${players[i]?.userName ?? 'This could be you!'} (${players[i]?.score ?? '?'})`)
			}
		}
	}
}

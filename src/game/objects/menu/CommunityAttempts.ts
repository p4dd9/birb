import type { AppData, RedisPlayer } from '../../../shared/messages'
import type { Menu } from '../../scenes/Menu'
import { MagoText } from '../MagoText'

const TOP_ATTEMPT_PLAYERS_COUNT = 3

export class CommunityAttempts extends Phaser.GameObjects.Container {
	constructor(scene: Menu) {
		super(scene, 0, 0)

		this.setName('r/ GAMES')
		this.create(scene.registry.get('community:leaderboard'))

		scene.add.existing(this)
	}

	create(players: RedisPlayer[]) {
		const sortedPlayers = this.sortByAttempts(players)
		for (let i = 0; i < TOP_ATTEMPT_PLAYERS_COUNT; i++) {
			this.add(
				new MagoText(
					this.scene,
					0,
					i * 100 + 100,
					`#${i + 1} ${sortedPlayers[i]?.userName ?? 'This could be you!'} (${sortedPlayers[i]?.attempts ?? '?'})`
				).setOrigin(0.5, 0)
			)
		}
	}

	sortByAttempts(players: RedisPlayer[]) {
		const copyOfBestPlayers = [...players]
		copyOfBestPlayers.sort((a, b) => b.attempts - a.attempts)
		return copyOfBestPlayers
	}

	updateData(appData: AppData) {
		const players = appData.community.leaderboard
		const sortedPlayers = this.sortByAttempts(players)
		const leaderboardPlayers = this.getAll()

		for (let i = 0; i < leaderboardPlayers.length; i++) {
			const child = leaderboardPlayers[i]
			if (child instanceof MagoText) {
				child.setText(
					`#${i + 1} ${sortedPlayers[i]?.userName ?? 'This could be you!'} (${sortedPlayers[i]?.attempts ?? '?'})`
				)
			}
		}
	}
}

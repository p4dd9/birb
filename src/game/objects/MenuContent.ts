import type { AppData } from '../../shared/messages'
import type { Menu } from '../scenes/Menu'
import { MagoText } from './MagoText'
import { CommunityAttempts } from './menu/CommunityAttempts'
import { CommunityScores } from './menu/CommunityScores'
import { CommunityStats } from './menu/CommunityStats'
import { Daily } from './menu/Daily'
import { StartContent } from './menu/StartContent'
import { YouStats } from './menu/YouStats'

export class MenuContent extends Phaser.GameObjects.Container {
	contentTitle: MagoText
	arrowLeft: Phaser.GameObjects.Sprite
	arrowRight: Phaser.GameObjects.Sprite
	currentIndex: number = 0

	constructor(scene: Menu) {
		super(scene, scene.scale.width / 2, scene.scale.height / 2 - 100)

		this.create()
		this.add([
			new StartContent(scene),
			new Daily(scene),
			new YouStats(scene),
			new CommunityScores(scene),
			new CommunityAttempts(scene),
			new CommunityStats(scene),
		])
		this.updateContent(this.currentIndex)
		scene.add.existing(this)
	}

	create() {
		this.contentTitle = new MagoText(this.scene, 0, 0, 'REDDIBIRDS', 172)

		this.arrowLeft = this.scene.add
			.sprite(
				this.contentTitle.x - this.contentTitle.displayWidth / 2 - 40,
				this.contentTitle.y - 6,
				'Spritesheet_Animation_UI_Pumpkin_Arrow',
				0
			)
			.setOrigin(1, 0.5)
			.setDisplaySize(128, 128)
			.setInteractive({ cursor: 'pointer' })
			.on('pointerdown', () => {
				this.arrowLeft.play('arrows')
				this.navigateContent(-1)
			})

		this.arrowRight = this.scene.add
			.sprite(
				this.contentTitle.x + this.contentTitle.displayWidth / 2 + 40,
				this.contentTitle.y - 6,
				'Spritesheet_Animation_UI_Pumpkin_Arrow',
				0
			)

			.setOrigin(0, 0.5)
			.setDisplaySize(128, 128)
			.setInteractive({ cursor: 'pointer' })
			.setFlipX(true)
			.on('pointerdown', () => {
				this.arrowRight.play('arrows')
				this.navigateContent(1)
			})

		this.add([this.contentTitle, this.arrowLeft, this.arrowRight])
	}

	navigateContent(direction: number) {
		const navigableContent = this.getNavigableChildren()

		const currentNavigableContent = navigableContent[this.currentIndex]
		if (!currentNavigableContent) return
		currentNavigableContent.setVisible(false)

		this.currentIndex = (this.currentIndex + direction + navigableContent.length) % navigableContent.length

		const newContent = navigableContent[this.currentIndex]
		if (!newContent) return
		newContent.setVisible(true)
		this.contentTitle.setText(newContent.name)
		this.scene.sound.play('buttonclick1', { volume: 0.5 })

		const bestPlayer = this.scene.children.getByName('menu_bestplayer') as MagoText
		if (bestPlayer) {
			if (this.currentIndex === 0) {
				bestPlayer.setVisible(true)
			} else {
				bestPlayer.setVisible(false)
			}
		}
	}

	updateContent(index: number) {
		const navigableContent = this.getNavigableChildren()
		this.currentIndex = index

		navigableContent.forEach((child) => child.setVisible(false))
		if (navigableContent[index]) {
			const bestPlayer = this.scene.children.getByName('menu_bestplayer') as MagoText
			if (bestPlayer) {
				if (index === 0) {
					bestPlayer.setVisible(true)
				} else {
					bestPlayer.setVisible(false)
				}
			}

			navigableContent[index].setVisible(true)
			this.contentTitle.setText(navigableContent[index].name)
		}
	}

	getNavigableChildren() {
		return this.list.filter(
			(child) => child !== this.contentTitle && child !== this.arrowLeft && child !== this.arrowRight
		) as Phaser.GameObjects.Container[]
	}

	updateData(appData: AppData) {
		for (const menu of this.getNavigableChildren() as any) {
			if (menu.updateData && typeof menu.updateData === 'function') {
				menu.updateData(appData)
			}
		}
	}
}

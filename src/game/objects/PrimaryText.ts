export class PrimaryText extends Phaser.GameObjects.Text {
	constructor(
		scene: Phaser.Scene,
		x: number,
		y: number,
		text: string | string[],
		style?: Phaser.Types.GameObjects.Text.TextStyle
	) {
		super(scene, x, y, text, {
			...{
				fontFamily: 'mago3',
				color: '#000000',
				fontSize: 72,
				align: 'center',
			},
			...style,
		})
		this.setResolution(2)
		scene.add.existing(this)
	}
}

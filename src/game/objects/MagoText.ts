export enum MagoTextStyle {
	small = 48,
	normal = 72,
	big = 100,
	large = 121,
	gigantic = 172,
}

export class MagoText extends Phaser.GameObjects.BitmapText {
	constructor(
		scene: Phaser.Scene,
		x: number,
		y: number,
		text: string,
		fontSize: MagoTextStyle = MagoTextStyle.normal,
		fontFamily: 'mago3_black' = 'mago3_black'
	) {
		super(scene, x, y, fontFamily, text, fontSize)
		this.setOrigin(0.5, 0.5)
		scene.add.existing(this)
	}
}

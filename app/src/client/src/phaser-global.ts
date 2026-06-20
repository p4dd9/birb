import Phaser from 'phaser'

/** Phaser 4 ESM has no browser global; scenes still use the Phaser.* namespace style. */
;(globalThis as typeof globalThis & { Phaser: typeof Phaser }).Phaser = Phaser

export default Phaser

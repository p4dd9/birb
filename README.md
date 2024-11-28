# Devvit Web Views + [PhaserJS]https://phaser.io/)

This is my entry for the Reddit hackathon built with [PhaserJS]https://phaser.io/ and [Devvit](https://developers.reddit.com/docs) Web Views.

Please see the [Devvit documentation](https://developers.reddit.com/docs) or this [Youtube video](https://www.youtube.com/watch?v=BhbWn8TnXvo) (30min) to see how Web Views work inside of a Devvit app.

This project was inspired by [PixiJS example](https://www.reddit.com/r/Devvit/comments/1h0k7dl/devvit_web_views_pixijs) by Axolotl with my own adaptions.

See here a running example of this demo: [XXX]()

## Project architecture

### `blocks-app/` folder

Contains all the code for the Devvit app, built with Devvit blocks

### `web-view-app/` folder

Contains all the typescript source code for the app that runs in the embedded Web View. All code here will be bundled into `webroot/index.js` which is what the web view is actually importing

### `shared/` folder

Contains all types that are shared between the `web-view-app` and the `blocks-app`

## Devvit CLI

- npm install -g devvit
- devvit new
- devvit upload
- devvit playtest `<subredit>`

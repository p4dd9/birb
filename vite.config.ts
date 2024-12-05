import { sentryVitePlugin } from '@sentry/vite-plugin'
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
	appType: 'spa',
	root: resolve(__dirname, './src'),

	build: {
		copyPublicDir: true,
		outDir: resolve(__dirname, 'webroot'),
		emptyOutDir: true,
		sourcemap: true,
	},

	plugins: [
		sentryVitePlugin({
			org: 'hammertime-eu',
			project: 'reddibirds',
		}),
	],
})

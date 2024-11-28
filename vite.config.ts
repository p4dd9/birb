import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
	appType: 'spa',
	root: resolve(__dirname, './src'),
	build: {
		outDir: resolve(__dirname, 'webroot'),
		emptyOutDir: true,
		sourcemap: true,
	},
})

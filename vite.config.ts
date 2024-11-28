import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
	appType: 'spa',
	build: {
		outDir: 'webroot',
		emptyOutDir: false,
		copyPublicDir: true,
		sourcemap: true,
		rollupOptions: {
			input: {
				index: resolve(__dirname, './src/index.html'),
			},
		},
	},
})

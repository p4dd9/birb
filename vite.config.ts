import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
	appType: 'spa',
	root: resolve(__dirname, './src'),
	build: {
		copyPublicDir: true,
		outDir: resolve(__dirname, 'webroot'),
		emptyOutDir: true,
		chunkSizeWarningLimit: 1200,
		sourcemap: true,
		rollupOptions: {
			output: {
				manualChunks: {
					phaser: ['phaser'],
				},
			},
		},
		minify: 'terser',
		terserOptions: {
			compress: {
				passes: 2,
			},
			mangle: true,
			format: {
				comments: false,
			},
		},
	},
})

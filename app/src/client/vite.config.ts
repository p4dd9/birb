import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
	appType: 'spa',
	server: {
		port: 5173,
		open: false,
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@shared': path.resolve(__dirname, '../shared'),
		},
	},
	logLevel: 'warn',
	build: {
		outDir: '../../dist/client',
		emptyOutDir: true,
		sourcemap: false,
		copyPublicDir: true,
		chunkSizeWarningLimit: 3000,
		rollupOptions: {
			output: {
				manualChunks: {
					phaser: ['phaser'],
				},
			},
		},
	},
})

import { builtinModules } from 'module'
import { defineConfig } from 'vite'

export default defineConfig({
	ssr: {
		noExternal: true, // Bundle all dependencies
	},
	logLevel: 'warn',
	build: {
		ssr: 'src/index.ts', // Server-side entry point
		outDir: '../../dist/server',
		emptyOutDir: true,
		target: 'node22',
		sourcemap: true,
		commonjsOptions: {
			ignoreDynamicRequires: true,
		},
		rollupOptions: {
			external: [...builtinModules], // Don't bundle Node.js built-ins
			output: {
				format: 'cjs', // CommonJS output
				entryFileNames: 'index.cjs', // Output filename
				inlineDynamicImports: true, // Single bundle file
			},
		},
	},
})

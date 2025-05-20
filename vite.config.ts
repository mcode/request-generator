import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import dotenv from 'dotenv'

dotenv.config() // load env vars from .env
export default defineConfig({
    // depending on your application, base can also be "/"
    base: '',
    plugins: [react(), viteTsconfigPaths(), nodePolyfills()],
    preview: {
      allowedHosts: [".mitre.org", ".us-east-1.elb.amazonaws.com"],
    },
    define: {
        'process.env': process.env
    },
    optimizeDeps: {
        include: ['@mui/material/Tooltip', '@emotion/styled'],
    },
    server: {    
        // this sets a default port to 3000  
        port: 3000, 
        open: false,
        host: true
    },
    build: {
        outDir: 'build',
        emptyOutDir: true, // also necessary
    },
})

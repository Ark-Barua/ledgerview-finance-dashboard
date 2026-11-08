import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createApi } from './server/api.mjs'
import { openDatabase } from './server/database.mjs'

import { startScheduler } from "./server/scheduler.mjs"

function attachApi(server) {
  const db = openDatabase()
  server.middlewares.use(createApi(db))
  const stop = startScheduler(db)
  server.httpServer?.once('close', () => { stop(); db.close() })
}

export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'ledgerview-api',
    configureServer: attachApi,
    configurePreviewServer: attachApi,
  }],
})

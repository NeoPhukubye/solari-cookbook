import express from "express"
import cors from "cors"
import os from "os"

import { Solari } from "@solarisdk/browser"
import { DesktopClient } from "@solarisdk/desktop"
import { SandboxClient } from "@solarisdk/sandbox"

const app = express()
app.use(cors())
app.use(express.json())

const SOLARI_API_KEY = process.env.SOLARI_API_KEY
if (!SOLARI_API_KEY) {
  console.warn("SOLARI_API_KEY is not set — Solari calls will fail until you configure it.")
}

const BASE_URL = "https://api.getsolari.com"
const browser = new Solari({ apiKey: SOLARI_API_KEY, baseUrl: BASE_URL })
const desktop = new DesktopClient({ apiKey: SOLARI_API_KEY, baseUrl: BASE_URL })
const sandbox = new SandboxClient({ apiKey: SOLARI_API_KEY, baseUrl: BASE_URL })

const sessions = new Map()

async function withSession(id, fn) {
  const s = sessions.get(id)
  if (!s) throw Object.assign(new Error("Session not found"), { status: 404 })
  return fn(s)
}

app.get("/health", (_req, res) => res.json({ ok: true }))

app.get("/", (_req, res) => res.json({ status: "ok", service: "Solari Agent Backend" }))

app.get("/sessions", (_req, res) => {
  const list = Array.from(sessions.entries()).map(([id, meta]) => ({
    id,
    type: meta.type,
    created: meta.created,
  }))
  res.json({ sessions: list })
})

app.post("/sessions", async (req, res) => {
  const { type } = req.body
  let session

  if (type === "desktop") {
    session = await desktop.create({ template: "default", resolution: "1280x720", timeoutMs: 10 * 60_000 })
    await session.connect()
    for (let i = 0; i < 30; i++) {
      const health = await session.health()
      if (health.ready) break
      await new Promise((r) => setTimeout(r, 1000))
    }
  } else if (type === "browser") {
    session = await browser.launch()
  } else if (type === "sandbox") {
    session = await sandbox.create({ template: "base", timeoutMs: 5 * 60_000 })
    await session.connect()
  } else {
    return res.status(400).json({ error: "type must be desktop|browser|sandbox" })
  }

  sessions.set(session.id, { type, session, created: Date.now() })
  res.json({ id: session.id, type })
})

app.get("/sessions/:id", async (req, res) => {
  const { id } = req.params
  const meta = sessions.get(id)
  if (!meta) return res.status(404).json({ error: "Session not found" })
  res.json({ id: meta.session.id, type: meta.type })
})

app.post("/sessions/:id/close", async (req, res) => {
  const { id } = req.params
  try {
    await withSession(id, async ({ session, type }) => {
      if (type === "desktop") {
        await session.close()
        await desktop.destroy(session.sessionId)
      } else if (type === "browser") {
        await session.close()
        await browser.close()
      } else if (type === "sandbox") {
        await session.kill()
      }
    })
    sessions.delete(id)
    res.json({ closed: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.post("/sessions/:id/browser/action", async (req, res) => {
  const { id } = req.params
  const { action } = req.body
  try {
    const result = await withSession(id, async ({ session }) => {
      const page = await session.newPage()
      await page.goto(action.url || "https://example.com")
      const title = await page.title()
      const text = await page.locator("h1").innerText()
      await page.close()
      return { title, text }
    })
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.post("/sessions/:id/desktop/type", async (req, res) => {
  const { id } = req.params
  const { text } = req.body
  try {
    const result = await withSession(id, async ({ session }) => {
      await session.keyboard.type(text)
      const shot = await session.screenshot()
      return { typed: text, screenshotBytes: shot.length }
    })
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.post("/sessions/:id/sandbox/run", async (req, res) => {
  const { id } = req.params
  const { code } = req.body
  try {
    const result = await withSession(id, async ({ session }) => {
      const ctx = await session.create_code_context("python")
      const r = await session.run_code(code, { context_id: ctx })
      const out = (r.results || []).map((item) => item.text || "").join("\n")
      return { output: out, error: r.error || null }
    })
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`backend listening on ${PORT}`))

import React, { useState, useEffect, useCallback } from "react"

const DEFAULT_API = localStorage.getItem("API_URL") || "https://solari-cookbook.onrender.com"

export default function App() {
  const [sessions, setSessions] = useState([])
  const [busy, setBusy] = useState({})
  const [outputs, setOutputs] = useState({})
  const [backendUrl, setBackendUrl] = useState(DEFAULT_API)

  const api = useCallback(async (path, opts = {}) => {
    const base = backendUrl.replace(/\/+$/, '')
    const res = await fetch(`${base}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || `HTTP ${res.status}`)
    }
    return res.json()
  }, [backendUrl])

  const refresh = useCallback(async () => {
    try {
      const list = await api("/sessions")
      setSessions(list.sessions || [])
    } catch (e) {
      // Background poll silently fails if backend is waking up
    }
  }, [api])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 5000)
    return () => clearInterval(t)
  }, [refresh])

  const createSession = async (type) => {
    setBusy((b) => ({ ...b, [type]: true }))
    try {
      const data = await api("/sessions", {
        method: "POST",
        body: JSON.stringify({ type }),
      })
      setSessions((s) => [...s, data])
    } catch (e) {
      alert(`Error creating ${type}: ${e.message}`)
    } finally {
      setBusy((b) => ({ ...b, [type]: false }))
    }
  }

  const closeSession = async (id) => {
    try {
      await api(`/sessions/${id}/close`, { method: "POST" })
      setSessions((s) => s.filter((x) => x.id !== id))
      setOutputs((o) => {
        const n = { ...o }
        delete n[id]
        return n
      })
    } catch (e) {
      alert(e.message)
    }
  }

  const runBrowser = async (id) => {
    const url = prompt("URL to visit:")
    if (!url) return
    setBusy((b) => ({ ...b, [`browser-${id}`]: true }))
    try {
      const data = await api(`/sessions/${id}/browser/action`, {
        method: "POST",
        body: JSON.stringify({ action: { url } }),
      })
      setOutputs((o) => ({ ...o, [id]: JSON.stringify(data, null, 2) }))
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy((b) => ({ ...b, [`browser-${id}`]: false }))
    }
  }

  const runDesktop = async (id) => {
    const text = prompt("Text to type:")
    if (!text) return
    setBusy((b) => ({ ...b, [`desktop-${id}`]: true }))
    try {
      const data = await api(`/sessions/${id}/desktop/type`, {
        method: "POST",
        body: JSON.stringify({ text }),
      })
      setOutputs((o) => ({ ...o, [id]: JSON.stringify(data, null, 2) }))
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy((b) => ({ ...b, [`desktop-${id}`]: false }))
    }
  }

  const runSandbox = async (id) => {
    const code = prompt("Python code to run:")
    if (!code) return
    setBusy((b) => ({ ...b, [`sandbox-${id}`]: true }))
    try {
      const data = await api(`/sessions/${id}/sandbox/run`, {
        method: "POST",
        body: JSON.stringify({ code }),
      })
      setOutputs((o) => ({ ...o, [id]: JSON.stringify(data, null, 2) }))
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy((b) => ({ ...b, [`sandbox-${id}`]: false }))
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24, fontFamily: "sans-serif", color: "#f8fafc" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Solari Agent Dashboard</h1>
      <p style={{ color: "#94a3b8", marginTop: 0, marginBottom: 24 }}>
        Orchestrate desktop, browser, and sandbox sessions from one place.
      </p>

      <div style={{ marginBottom: 24, display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ color: "#94a3b8" }}>Backend URL:</label>
        <input
          value={backendUrl}
          onChange={(e) => {
            setBackendUrl(e.target.value)
            localStorage.setItem("API_URL", e.target.value)
          }}
          placeholder="https://solari-cookbook.onrender.com"
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #334155",
            background: "#1e293b",
            color: "#e2e8f0",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {["desktop", "browser", "sandbox"].map((type) => (
          <button
            key={type}
            onClick={() => createSession(type)}
            disabled={busy[type]}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "none",
              background: busy[type] ? "#475569" : "#3b82f6",
              color: "#fff",
              cursor: busy[type] ? "not-allowed" : "pointer",
              textTransform: "capitalize",
              fontWeight: 600
            }}
          >
            {busy[type] ? "Starting..." : `New ${type}`}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {sessions.map((s) => (
          <div
            key={s.id}
            style={{
              border: "1px solid #334155",
              borderRadius: 10,
              padding: 16,
              background: "#1e293b",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{s.type}</span>
                <span style={{ color: "#64748b", marginLeft: 8, fontFamily: "monospace" }}>{s.id}</span>
              </div>
              <button
                onClick={() => closeSession(s.id)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid #475569",
                  background: "transparent",
                  color: "#f87171",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {s.type === "browser" && (
                <button
                  onClick={() => runBrowser(s.id)}
                  disabled={busy[`browser-${s.id}`]}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: "#10b981",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {busy[`browser-${id}`] ? "Running..." : "Visit URL"}
                </button>
              )}
              {s.type === "desktop" && (
                <button
                  onClick={() => runDesktop(s.id)}
                  disabled={busy[`desktop-${s.id}`]}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: "#10b981",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {busy[`desktop-${s.id}`] ? "Typing..." : "Type text"}
                </button>
              )}
              {s.type === "sandbox" && (
                <button
                  onClick={() => runSandbox(s.id)}
                  disabled={busy[`sandbox-${s.id}`]}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: "#10b981",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {busy[`sandbox-${s.id}`] ? "Running..." : "Run Python"}
                </button>
              )}
            </div>

            {outputs[s.id] && (
              <pre
                style={{
                  background: "#0f172a",
                  padding: 12,
                  borderRadius: 8,
                  overflow: "auto",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {outputs[s.id]}
              </pre>
            )}
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <p style={{ color: "#64748b", textAlign: "center", marginTop: 40 }}>
          No active sessions. Create one above.
        </p>
      )}
    </div>
  )
}

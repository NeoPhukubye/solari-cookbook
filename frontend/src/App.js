import React, { useState, useEffect, useCallback } from "react"

const API_BASE = "https://solari-cookbook.onrender.com"

export default function App() {
  const [sessions, setSessions] = useState([])
  const [busy, setBusy] = useState({})
  const [outputs, setOutputs] = useState({})
  const [activeTab, setActiveTab] = useState("all")

  const api = useCallback(async (path, opts = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || `HTTP ${res.status}`)
    }
    return res.json()
  }, [])

  const refresh = useCallback(async () => {
    try {
      const list = await api("/sessions")
      if (list && Array.isArray(list.sessions)) {
        setSessions(list.sessions)
      }
    } catch (e) {
      // Backend polling error handled gracefully
    }
  }, [api])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [refresh])

  const createSession = async (type) => {
    setBusy((b) => ({ ...b, [type]: true }))
    try {
      const data = await api("/sessions", {
        method: "POST",
        body: JSON.stringify({ type }),
      })
      if (data && data.id) {
        setSessions((s) => [...(Array.isArray(s) ? s : []), data])
      }
    } catch (e) {
      alert(`Error creating ${type} session: ${e.message}`)
    } finally {
      setBusy((b) => ({ ...b, [type]: false }))
    }
  }

  const closeSession = async (id) => {
    try {
      await api(`/sessions/${id}/close`, { method: "POST" })
      setSessions((s) => (Array.isArray(s) ? s.filter((x) => x.id !== id) : []))
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
    const url = prompt("Enter target URL to navigate and extract:", "https://news.ycombinator.com")
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
    const text = prompt("Enter text or key commands to send to Desktop VM:", "echo 'Hello Solari Desktop'")
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
    const code = prompt("Enter Python code to execute in microVM sandbox:", "import sys\nprint(f'Python {sys.version} running in secure sandbox!')")
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

  const currentSessions = Array.isArray(sessions) ? sessions : []
  const filteredSessions = activeTab === "all" ? currentSessions : currentSessions.filter((s) => s.type === activeTab)

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0b0f19", color: "#f1f5f9", fontFamily: "system-ui, -apple-system, sans-serif", padding: "32px 16px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        <header style={{ marginBottom: "32px", borderBottom: "1px solid #1e293b", paddingBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "28px" }}>⚡</span>
                <h1 style={{ fontSize: "28px", fontWeight: "700", margin: 0, letterSpacing: "-0.02em" }}>Solari Agent Orchestrator</h1>
              </div>
              <p style={{ color: "#94a3b8", margin: "8px 0 0 0", fontSize: "15px" }}>
                Interactive control center for spawning, managing, and inspecting cloud-native AI agent runtimes.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#1e293b", padding: "6px 14px", borderRadius: "999px", fontSize: "13px", color: "#38bdf8", border: "1px solid #334155" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }}></span>
              Cloud API Connected
            </div>
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", marginBottom: "32px" }}>

          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <span style={{ fontSize: "20px" }}>🖥️</span>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "600", color: "#60a5fa" }}>Desktop MicroVM</h3>
              </div>
              <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.5", margin: "0 0 16px 0" }}>
                Launches a full sandboxed Linux X11 desktop environment. Enables computer-use agents, UI automation, and simulated keyboard/mouse interactions.
              </p>
            </div>
            <button
              onClick={() => createSession("desktop")}
              disabled={busy["desktop"]}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                background: busy["desktop"] ? "#374151" : "#2563eb",
                color: "#ffffff",
                fontWeight: "600",
                cursor: busy["desktop"] ? "not-allowed" : "pointer",
                transition: "0.2s"
              }}
            >
              {busy["desktop"] ? "Provisioning VM..." : "+ Launch Desktop VM"}
            </button>
          </div>

          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <span style={{ fontSize: "20px" }}>🌐</span>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "600", color: "#34d399" }}>Cloud Browser</h3>
              </div>
              <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.5", margin: "0 0 16px 0" }}>
                Spawns a stealth headless browser instance. Handles automated scraping, JavaScript-heavy sites, stealth proxies, and DOM element extractions.
              </p>
            </div>
            <button
              onClick={() => createSession("browser")}
              disabled={busy["browser"]}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                background: busy["browser"] ? "#374151" : "#059669",
                color: "#ffffff",
                fontWeight: "600",
                cursor: busy["browser"] ? "not-allowed" : "pointer",
                transition: "0.2s"
              }}
            >
              {busy["browser"] ? "Launching Browser..." : "+ Launch Cloud Browser"}
            </button>
          </div>

          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <span style={{ fontSize: "20px" }}>⚙️</span>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "600", color: "#a78bfa" }}>Code Sandbox</h3>
              </div>
              <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.5", margin: "0 0 16px 0" }}>
                Boots an untrusted, ephemeral execution microVM in under 1 second. Executes arbitrary LLM-generated Python scripts securely in isolation.
              </p>
            </div>
            <button
              onClick={() => createSession("sandbox")}
              disabled={busy["sandbox"]}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                background: busy["sandbox"] ? "#374151" : "#7c3aed",
                color: "#ffffff",
                fontWeight: "600",
                cursor: busy["sandbox"] ? "not-allowed" : "pointer",
                transition: "0.2s"
              }}
            >
              {busy["sandbox"] ? "Booting Sandbox..." : "+ Launch Code Sandbox"}
            </button>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>Active Agent Sessions ({currentSessions.length})</h2>
            <div style={{ display: "flex", gap: "8px" }}>
              {["all", "desktop", "browser", "sandbox"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #334155",
                    background: activeTab === tab ? "#334155" : "transparent",
                    color: activeTab === tab ? "#f8fafc" : "#94a3b8",
                    fontSize: "13px",
                    cursor: "pointer",
                    textTransform: "capitalize"
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 20px", background: "#0f172a", border: "1px dashed #334155", borderRadius: "12px", color: "#64748b" }}>
              <p style={{ fontSize: "16px", margin: "0 0 8px 0" }}>No running sessions active.</p>
              <p style={{ fontSize: "13px", margin: 0 }}>Click any of the launch buttons above to spin up an agent runtime.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {filteredSessions.map((s) => (
                <div key={s.id} style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "12px", padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        background: s.type === "desktop" ? "#1e3a8a" : s.type === "browser" ? "#064e3b" : "#4c1d95",
                        color: s.type === "desktop" ? "#93c5fd" : s.type === "browser" ? "#6ee7b7" : "#c4b5fd"
                      }}>
                        {s.type}
                      </span>
                      <span style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: "13px" }}>ID: {s.id}</span>
                    </div>
                    <button
                      onClick={() => closeSession(s.id)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "6px",
                        border: "1px solid #ef444433",
                        background: "#ef444415",
                        color: "#f87171",
                        fontSize: "13px",
                        cursor: "pointer",
                        fontWeight: "500"
                      }}
                    >
                      Terminate Session
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginBottom: outputs[s.id] ? "16px" : "0" }}>
                    {s.type === "desktop" && (
                      <button
                        onClick={() => runDesktop(s.id)}
                        disabled={busy[`desktop-${s.id}`]}
                        style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#2563eb", color: "#fff", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
                      >
                        {busy[`desktop-${s.id}`] ? "Simulating Input..." : "⌨️ Send Keystrokes & Capture"}
                      </button>
                    )}
                    {s.type === "browser" && (
                      <button
                        onClick={() => runBrowser(s.id)}
                        disabled={busy[`browser-${s.id}`]}
                        style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#059669", color: "#fff", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
                      >
                        {busy[`browser-${s.id}`] ? "Navigating..." : "🌐 Navigate & Extract DOM"}
                      </button>
                    )}
                    {s.type === "sandbox" && (
                      <button
                        onClick={() => runSandbox(s.id)}
                        disabled={busy[`sandbox-${s.id}`]}
                        style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#7c3aed", color: "#fff", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
                      >
                        {busy[`sandbox-${s.id}`] ? "Executing Script..." : "▶️ Execute Python Code"}
                      </button>
                    )}
                  </div>

                  {outputs[s.id] && (
                    <div style={{ marginTop: "12px", background: "#030712", border: "1px solid #1e293b", borderRadius: "8px", padding: "14px" }}>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: "600", textTransform: "uppercase" }}>Runtime Response Payload:</div>
                      <pre style={{ margin: 0, color: "#38bdf8", fontFamily: "monospace", fontSize: "13px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {outputs[s.id]}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

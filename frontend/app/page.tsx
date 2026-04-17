"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Zap, Brain, AlertCircle, Database } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import AgentStatus, { AgentInfo } from "@/components/AgentStatus";
import ResultDisplay from "@/components/ResultDisplay";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ResultSource = "deep_research" | "llm_knowledge" | "cache";
export type SearchMode   = "idle" | "deep_research" | "llm_knowledge" | "cache";

export interface RecentSearch {
  query:     string;
  timestamp: number;
  count:     number;
  source:    ResultSource;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "webuu_recent_searches";
const MAX_RECENT  = 15;

const INITIAL_AGENTS: AgentInfo[] = [
  {
    name: "Search Specialist",
    status: "Searching the web with multiple targeted queries…",
    isActive: false,
    isComplete: false,
  },
  {
    name: "Content Analyst",
    status: "Scraping and analyzing content from top sources…",
    isActive: false,
    isComplete: false,
  },
  {
    name: "Research Synthesizer",
    status: "Synthesizing all findings into a comprehensive report…",
    isActive: false,
    isComplete: false,
  },
];

const WEBUU_AI_AGENT: AgentInfo = {
  name: "WEBUU AI",
  status: "Answering from training knowledge…",
  isActive: false,
  isComplete: false,
};

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadRecentSearches(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentSearch[]) : [];
  } catch {
    return [];
  }
}

function persistRecentSearch(
  query: string,
  source: ResultSource,
  setCb: (list: RecentSearch[]) => void
) {
  try {
    const existing = loadRecentSearches();
    const idx = existing.findIndex(
      (s) => s.query.toLowerCase() === query.toLowerCase()
    );

    let updated: RecentSearch[];
    if (idx >= 0) {
      const entry: RecentSearch = {
        ...existing[idx],
        count:     existing[idx].count + 1,
        timestamp: Date.now(),
        source,
      };
      updated = [entry, ...existing.filter((_, i) => i !== idx)];
    } else {
      updated = [
        { query, timestamp: Date.now(), count: 1, source },
        ...existing,
      ];
    }

    updated = updated.slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setCb(updated);
  } catch {
    /* storage unavailable */
  }
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function Home() {
  const [isLoading, setIsLoading]           = useState(false);
  const [agents, setAgents]                 = useState<AgentInfo[]>([]);
  const [result, setResult]                 = useState("");
  const [resultSource, setResultSource]     = useState<ResultSource>("deep_research");
  const [currentQuery, setCurrentQuery]     = useState("");
  const [showAgents, setShowAgents]         = useState(false);
  const [searchMode, setSearchMode]         = useState<SearchMode>("idle");
  const [error, setError]                   = useState("");
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  const updateAgent = useCallback(
    (name: string, patch: Partial<AgentInfo>) =>
      setAgents((prev) =>
        prev.map((a) => (a.name === name ? { ...a, ...patch } : a))
      ),
    []
  );

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setCurrentQuery(query);
    setResult("");
    setError("");
    setShowAgents(true);
    setAgents([]);
    setSearchMode("idle");
    setResultSource("deep_research");

    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const response = await fetch(`${API}/api/search`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ query }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value, { stream: true }).split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const data = JSON.parse(raw);

            switch (data.type) {
              case "source_info":
                if (data.source === "cache") {
                  setSearchMode("cache");
                  setAgents([]);
                } else if (data.source === "llm_knowledge") {
                  setSearchMode("llm_knowledge");
                  setAgents([{ ...WEBUU_AI_AGENT }]);
                } else if (data.source === "deep_research") {
                  setSearchMode("deep_research");
                  setAgents(INITIAL_AGENTS);
                }
                break;

              case "agent_start":
                updateAgent(data.agent, {
                  isActive: true,
                  status:   data.status ?? "",
                });
                break;

              case "task_complete":
                updateAgent(data.agent, {
                  isActive:   false,
                  isComplete: true,
                });
                break;

              case "result": {
                const src = (data.source ?? "deep_research") as ResultSource;
                setResult(data.content ?? "");
                setResultSource(src);
                persistRecentSearch(query, src, setRecentSearches);
                break;
              }

              case "error":
                setError(data.content ?? "An unknown error occurred.");
                break;

              case "done":
                break;
            }
          } catch {
            /* skip malformed SSE line */
          }
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to backend. Make sure it is running on port 8000."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const agentLabel =
    searchMode === "llm_knowledge" ? "AI Knowledge Base" : "Research Agents";

  return (
    <div className="min-h-screen bg-[#080812] relative overflow-hidden">

      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none">
        <div className="orb-1 absolute w-[550px] h-[550px] rounded-full opacity-[0.18]"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 68%)", top: "-120px", left: "-120px" }} />
        <div className="orb-2 absolute w-[650px] h-[650px] rounded-full opacity-[0.13]"
          style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 68%)", top: "28%", right: "-160px" }} />
        <div className="orb-3 absolute w-[440px] h-[440px] rounded-full opacity-[0.10]"
          style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 68%)", bottom: "-60px", left: "32%" }} />
      </div>

      {/* Grid overlay */}
      <div className="fixed inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)`,
          backgroundSize: "52px 52px",
        }} />

      <div className="relative z-10 min-h-screen flex flex-col">

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}
          className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-wide">WEBUU</span>
          </div>
          <div className="flex items-center gap-5 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-yellow-400" />Groq Llama 3.3 70B</span>
            <span className="flex items-center gap-1.5"><Brain className="w-3 h-3 text-purple-400" />CrewAI</span>
          </div>
        </motion.header>

        {/* Main */}
        <main className="flex-1 flex flex-col items-center pt-14 pb-16 px-4 sm:px-6 gap-10">

          {/* Hero */}
          <AnimatePresence>
            {!showAgents && (
              <motion.section key="hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="text-center max-w-2xl">
                <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 220 }}
                  className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 text-xs text-purple-300 mb-7">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse inline-block" />
                  Multi-Agent Deep Research · 100% Free
                </motion.div>
                <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="text-5xl sm:text-6xl font-extrabold leading-tight mb-5">
                  <span className="gradient-text">WEBUU</span><br />
                  <span className="text-white">Research Agent</span>
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
                  className="text-slate-400 text-[17px] leading-relaxed mb-7">
                  Three specialized AI agents search the web, analyze sources,
                  and synthesize a comprehensive report — all in one query.
                </motion.p>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  className="flex items-center justify-center gap-5 flex-wrap text-[12px] text-slate-500">
                  {[
                    { color: "bg-purple-400", label: "DuckDuckGo Search" },
                    { color: "bg-blue-400",   label: "Web Scraping" },
                    { color: "bg-cyan-400",   label: "AI Synthesis" },
                    { color: "bg-green-400",  label: "Free · No limits" },
                  ].map(({ color, label }) => (
                    <span key={label} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${color} inline-block`} />{label}
                    </span>
                  ))}
                </motion.div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Query label */}
          <AnimatePresence>
            {showAgents && (
              <motion.div key="query-label" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <h2 className="text-xl font-bold text-white">
                  Researching: <span className="gradient-text">"{currentQuery}"</span>
                </h2>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search bar */}
          <SearchBar onSearch={handleSearch} isLoading={isLoading} recentSearches={recentSearches} />

          {/* Cache hit banner */}
          <AnimatePresence>
            {showAgents && searchMode === "cache" && (
              <motion.div key="cache-banner" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} className="w-full max-w-3xl">
                <div className="glass border border-blue-500/20 rounded-2xl px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                    <Database className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-blue-300">Instant Result</p>
                    <p className="text-[11px] text-slate-500">Served from WEBUU cache · No extra API calls needed</p>
                  </div>
                  <span className="ml-auto text-[11px] bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full px-2.5 py-1 flex-shrink-0">
                    Cached
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Agent cards */}
          <AnimatePresence>
            {showAgents && searchMode !== "cache" && agents.length > 0 && (
              <motion.div key="agents" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} className="w-full max-w-3xl">
                <AgentStatus agents={agents} label={agentLabel} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} className="w-full max-w-3xl glass border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-400 mb-0.5">Error</p>
                  <p className="text-xs text-red-400/80">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-3xl">
                <ResultDisplay content={result} query={currentQuery} source={resultSource} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="text-center py-4 text-[11px] text-slate-700 border-t border-white/[0.04]">
          WEBUU · CrewAI · Groq Llama 3.3 70B · DuckDuckGo · Free &amp; Open Source
        </motion.footer>
      </div>
    </div>
  );
}

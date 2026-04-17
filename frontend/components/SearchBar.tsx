"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Sparkles, Clock, TrendingUp } from "lucide-react";
import type { RecentSearch } from "@/app/page";

interface SearchBarProps {
  onSearch:        (query: string) => void;
  isLoading:       boolean;
  recentSearches?: RecentSearch[];
}

const EXAMPLES = [
  "Latest breakthroughs in quantum computing 2024",
  "How does CRISPR gene editing work?",
  "Best free AI tools for developers",
  "Climate change solutions being implemented globally",
  "History and future of space exploration",
];

function sourceColor(source: RecentSearch["source"]) {
  if (source === "llm_knowledge") return "text-emerald-400/70";
  if (source === "cache")         return "text-blue-400/70";
  return "text-slate-600";
}

export default function SearchBar({
  onSearch,
  isLoading,
  recentSearches = [],
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) onSearch(query.trim());
  };

  const fill = (text: string) => {
    setQuery(text);
    inputRef.current?.focus();
  };

  const frequent = [...recentSearches]
    .filter((s) => s.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const recent = [...recentSearches]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  const hasRecent = recent.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-3xl mx-auto"
    >
      <form onSubmit={handleSubmit}>
        <div className="gradient-border rounded-2xl">
          <div className="glass rounded-2xl flex items-center gap-3 px-4 py-2">
            <div className="flex-shrink-0">
              {isLoading
                ? <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                : <Search className="w-5 h-5 text-slate-500" />}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything — I'll research the web deeply for you…"
              className="search-input flex-1 bg-transparent text-white placeholder-slate-600 text-[15px] py-3 caret-purple-400"
              disabled={isLoading}
              autoFocus
            />

            <motion.button
              type="submit"
              disabled={!query.trim() || isLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="gradient-btn text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 flex-shrink-0"
            >
              {isLoading ? (
                <>
                  <span className="dot w-1.5 h-1.5 bg-white" />
                  <span className="dot w-1.5 h-1.5 bg-white" />
                  <span className="dot w-1.5 h-1.5 bg-white" />
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Research
                </>
              )}
            </motion.button>
          </div>
        </div>
      </form>

      <AnimatePresence mode="wait">
        {!isLoading && (
          <motion.div key="chips" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="mt-4 space-y-3">

            {/* Frequent searches */}
            {frequent.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1.5 justify-center">
                  <TrendingUp className="w-3 h-3" />Frequently Searched
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {frequent.map((item) => (
                    <motion.button key={item.query} type="button" whileHover={{ scale: 1.03 }}
                      onClick={() => fill(item.query)}
                      className="text-xs text-slate-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 hover:border-purple-500/50 rounded-full px-3 py-1.5 transition-all duration-200 cursor-pointer flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-purple-400" />
                      <span className="truncate max-w-[220px]">{item.query}</span>
                      <span className="text-[9px] bg-purple-500/30 text-purple-300 rounded-full px-1.5 py-0.5 ml-0.5">{item.count}×</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent searches */}
            {hasRecent && (
              <div>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1.5 justify-center">
                  <Clock className="w-3 h-3" />Recent
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {recent.map((item, i) => (
                    <motion.button key={item.query + item.timestamp} type="button"
                      initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                      onClick={() => fill(item.query)}
                      className="text-xs text-slate-400 hover:text-purple-300 bg-white/[0.04] hover:bg-purple-500/10 border border-white/[0.07] hover:border-purple-500/30 rounded-full px-3 py-1.5 transition-all duration-200 cursor-pointer flex items-center gap-1.5">
                      <Clock className={`w-3 h-3 ${sourceColor(item.source)}`} />
                      <span className="truncate max-w-[200px]">{item.query}</span>
                      {item.count > 1 && (
                        <span className="text-[9px] bg-white/10 text-slate-500 rounded-full px-1.5 py-0.5">{item.count}×</span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Example queries (shown only when no history) */}
            {!hasRecent && (
              <div className="flex flex-wrap gap-2 justify-center">
                {EXAMPLES.map((ex, i) => (
                  <motion.button key={ex} type="button"
                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.07 }}
                    onClick={() => fill(ex)}
                    className="text-xs text-slate-400 hover:text-purple-300 bg-white/[0.04] hover:bg-purple-500/10 border border-white/[0.07] hover:border-purple-500/30 rounded-full px-3 py-1.5 transition-all duration-200 cursor-pointer">
                    {ex}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

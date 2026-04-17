"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Copy, Check, FileText, ChevronDown, Brain, Database } from "lucide-react";
import type { ResultSource } from "@/app/page";

interface ResultDisplayProps {
  content: string;
  query:   string;
  source?: ResultSource;
}

const SOURCE_META: Record<ResultSource, {
  label: string; bannerBg: string; bannerBorder: string; bannerText: string; dot: string; badge: string;
}> = {
  deep_research: {
    label: "Deep Research", bannerBg: "bg-green-500/[0.07]", bannerBorder: "border-green-500/20",
    bannerText: "text-green-400", dot: "bg-green-400", badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  llm_knowledge: {
    label: "AI Knowledge", bannerBg: "bg-emerald-500/[0.07]", bannerBorder: "border-emerald-500/20",
    bannerText: "text-emerald-400", dot: "bg-emerald-400", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  cache: {
    label: "Cached", bannerBg: "bg-blue-500/[0.07]", bannerBorder: "border-blue-500/20",
    bannerText: "text-blue-400", dot: "bg-blue-400", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
};

const BANNER_TEXT: Record<ResultSource, string> = {
  deep_research: "Deep Research complete — 3 agents collaborated to generate this report",
  llm_knowledge: "Answered from AI training knowledge — instant result, no web search needed",
  cache:         "Instant result — served from WEBUU cache",
};

const SOURCE_ICON: Record<ResultSource, React.ElementType> = {
  deep_research: FileText,
  llm_knowledge: Brain,
  cache:         Database,
};

export default function ResultDisplay({ content, query, source = "deep_research" }: ResultDisplayProps) {
  const [copied, setCopied]     = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const wordCount = content.trim().split(/\s+/).length;
  const meta      = SOURCE_META[source];
  const Icon      = SOURCE_ICON[source];

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }} className="w-full max-w-3xl mx-auto">

      {/* Header */}
      <div className="glass rounded-t-2xl border border-white/[0.07] border-b-0 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/25 to-blue-500/25 flex items-center justify-center border border-purple-500/20">
            <Icon className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[13px] font-semibold text-white">Research Report</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${meta.badge}`}>{meta.label}</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-[280px]">
              {query} · {wordCount.toLocaleString()} words
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCopy}
            className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] rounded-lg px-3 py-1.5 transition-all duration-200">
            {copied ? <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">Copied!</span></>
              : <><Copy className="w-3 h-3" />Copy</>}
          </motion.button>
          <motion.button onClick={() => setExpanded((v) => !v)} animate={{ rotate: expanded ? 0 : -90 }}
            transition={{ duration: 0.25 }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors duration-200">
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Banner */}
      <div className={`flex items-center gap-2 px-5 py-2.5 border-x ${meta.bannerBg} ${meta.bannerBorder}`}>
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0 ${meta.dot}`} />
        <span className={`text-[11px] font-medium ${meta.bannerText}`}>{BANNER_TEXT[source]}</span>
      </div>

      {/* Markdown */}
      <motion.div initial={false} animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.35, ease: "easeInOut" }} className="overflow-hidden">
        <div className="glass rounded-b-2xl border border-white/[0.07] border-t-0 px-6 md:px-8 py-7">
          <div className="md">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

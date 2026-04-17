"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, BookOpen, Brain, CheckCircle2 } from "lucide-react";

export interface AgentInfo {
  name:       string;
  status:     string;
  isActive:   boolean;
  isComplete: boolean;
}

const META: Record<
  string,
  { Icon: React.ElementType; color: string; glowClass: string; dotColor: string; badge: string; iconBg: string; borderActive: string }
> = {
  "Search Specialist": {
    Icon: Search, color: "text-purple-400", glowClass: "pulse-glow-purple",
    dotColor: "bg-purple-400", badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    iconBg: "bg-purple-500/15", borderActive: "border-purple-500",
  },
  "Content Analyst": {
    Icon: FileText, color: "text-blue-400", glowClass: "pulse-glow-blue",
    dotColor: "bg-blue-400", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    iconBg: "bg-blue-500/15", borderActive: "border-blue-500",
  },
  "Research Synthesizer": {
    Icon: BookOpen, color: "text-cyan-400", glowClass: "pulse-glow-cyan",
    dotColor: "bg-cyan-400", badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    iconBg: "bg-cyan-500/15", borderActive: "border-cyan-500",
  },
  "WEBUU AI": {
    Icon: Brain, color: "text-emerald-400", glowClass: "pulse-glow-cyan",
    dotColor: "bg-emerald-400", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    iconBg: "bg-emerald-500/15", borderActive: "border-emerald-500",
  },
};

function AgentCard({ agent, index }: { agent: AgentInfo; index: number }) {
  const meta = META[agent.name] ?? META["Search Specialist"];
  const { Icon, color, glowClass, dotColor, badge, iconBg, borderActive } = meta;

  const borderClass = agent.isActive
    ? `border-opacity-60 ${borderActive} ${glowClass}`
    : agent.isComplete
    ? "border-green-500/30"
    : "border-white/[0.05] opacity-40";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.45, ease: "easeOut" }}
      className={`glass rounded-2xl p-5 border transition-all duration-500 ${borderClass}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${agent.isComplete ? "bg-green-500/15" : iconBg}`}>
          {agent.isComplete
            ? <CheckCircle2 className="w-5 h-5 text-green-400" />
            : <Icon className={`w-5 h-5 ${color}`} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[13px] font-semibold text-white leading-tight">{agent.name}</span>
            <AnimatePresence mode="wait">
              {agent.isActive && (
                <motion.span key="active" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge}`}>Active</motion.span>
              )}
              {agent.isComplete && (
                <motion.span key="done" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-green-500/20 text-green-300 border-green-500/30">Done ✓</motion.span>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {agent.isActive && (
              <motion.p key="active-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[11px] text-slate-400 leading-relaxed">{agent.status}</motion.p>
            )}
            {agent.isComplete && (
              <motion.p key="done-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-[11px] text-green-400/70">Task completed successfully</motion.p>
            )}
            {!agent.isActive && !agent.isComplete && (
              <motion.p key="wait-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-[11px] text-slate-600">Waiting…</motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-shrink-0 mt-1">
          {agent.isActive && (
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-60`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${dotColor}`} />
            </span>
          )}
          {agent.isComplete && <span className="w-3 h-3 rounded-full bg-green-400 block" />}
          {!agent.isActive && !agent.isComplete && <span className="w-3 h-3 rounded-full bg-slate-700 block" />}
        </div>
      </div>
    </motion.div>
  );
}

interface AgentStatusProps {
  agents: AgentInfo[];
  label?: string;
}

export default function AgentStatus({ agents, label = "Research Agents" }: AgentStatusProps) {
  const gridCols =
    agents.length === 1 ? "grid-cols-1 max-w-sm mx-auto"
    : agents.length === 2 ? "grid-cols-1 sm:grid-cols-2"
    : "grid-cols-1 sm:grid-cols-3";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse inline-block" />
        {label}
      </p>
      <div className={`grid gap-3 ${gridCols}`}>
        {agents.map((agent, i) => <AgentCard key={agent.name} agent={agent} index={i} />)}
      </div>
    </motion.div>
  );
}

import React from 'react';
import { PerformanceStats, FreecamConfig } from '../types/freecam';
import { Activity, Cpu, HardDrive, Zap, ShieldCheck, Layers, Gauge } from 'lucide-react';

interface PerformanceMonitorProps {
  stats: PerformanceStats;
  config: FreecamConfig;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ stats, config }) => {
  const memoryPercentage = Math.min(100, (stats.memoryUsedMb / stats.memoryLimitMb) * 100);
  const isOptimalSync = stats.currentFps >= 58 && stats.currentFps <= 62;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 60 FPS Frame Sync Gauge */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/40 transition">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            Hardware VSync
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
            isOptimalSync ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
          }`}>
            {stats.vsyncLocked ? '60Hz LOCK' : 'VSYNC ACTIVE'}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-cyan-400">{stats.currentFps}</span>
          <span className="text-xs text-slate-500 font-mono">FPS / 60.0</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
          <span>Frame Time: <strong className="text-slate-200 font-mono">{stats.frameTimeMs}ms</strong></span>
          <span>Jitter: <strong className="text-slate-200 font-mono">{stats.jitterMs}ms</strong></span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${Math.min(100, (stats.currentFps / 60) * 100)}%` }}
          />
        </div>
      </div>

      {/* Primary Asset Bundle System Telemetry */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/40 transition">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            Asset Tag System
          </span>
          <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px] font-mono font-semibold">
            {config.assetBundleTag}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-purple-300">{stats.cachedBundlesCount}</span>
          <span className="text-xs text-slate-500 font-mono">Cached Chunks</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
          <span>Worker Pool: <strong className="text-slate-200 font-mono">{config.backgroundWorkerThreads} Threads</strong></span>
          <span className="text-emerald-400">Streaming OK</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-3/4 animate-pulse" />
        </div>
      </div>

      {/* Memory Footprint Optimizer */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/40 transition">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            Memory Footprint
          </span>
          <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px] font-mono font-semibold">
            OFF-HEAP NATIVE
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-blue-300">{stats.memoryUsedMb}</span>
          <span className="text-xs text-slate-500 font-mono">/ {stats.memoryLimitMb} MB</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
          <span>DirectBuffer: <strong className="text-slate-200 font-mono">{config.enableDirectByteBuffer ? 'Active' : 'Heap'}</strong></span>
          <span className="text-emerald-400">Zero Crash GC</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${memoryPercentage}%` }}
          />
        </div>
      </div>

      {/* Target Bedrock Runtime */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Bedrock & LeviPack
          </span>
          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-mono font-semibold">
            AAR READY
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-emerald-400">v{config.version}</span>
          <span className="text-xs text-slate-500 font-mono">Target</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
          <span>Architecture: <strong className="text-slate-200 font-mono">arm64-v8a</strong></span>
          <span className="text-slate-300 font-mono">C++20 NDK</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-emerald-500 w-full" />
        </div>
      </div>
    </div>
  );
};

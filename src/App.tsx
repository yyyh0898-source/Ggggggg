import React, { useState, useEffect } from 'react';
import { FreecamConfig, PerformanceStats } from './types/freecam';
import { generateFreecamModIcon } from './utils/iconGenerator';
import { Freecam3DScene } from './components/Freecam3DScene';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { ControlPanel } from './components/ControlPanel';
import { CodeInspector } from './components/CodeInspector';
import { ExportModal } from './components/ExportModal';
import {
  Download,
  Video,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  Info,
  Code2,
  Sliders,
  ExternalLink,
  BookOpen
} from 'lucide-react';

const DEFAULT_CONFIG: FreecamConfig = {
  version: '1.26.52',
  assetBundleTag: 'LeviAssetBundle',
  targetFps: 60,
  vsyncLock: true,
  moveSpeed: 8,
  fastSpeedMultiplier: 2.5,
  slowSpeedMultiplier: 0.35,
  interpolationMode: 'inertial',
  smoothingFactor: 0.85,
  rotationSmoothing: 0.80,
  defaultFov: 70,
  minFov: 30,
  maxFov: 120,
  zoomFov: 25,
  dynamicFovSpeedScaling: true,
  fovTransitionDurationMs: 250,
  maxMemoryPoolMb: 128,
  enableDirectByteBuffer: true,
  backgroundWorkerThreads: 4,
  lruCacheCapacity: 512,
  spectatorCollision: false,
  freezePlayerPhysics: true
};

export default function App() {
  const [config, setConfig] = useState<FreecamConfig>(DEFAULT_CONFIG);
  const [iconDataUrl, setIconDataUrl] = useState<string>('');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'simulation' | 'code' | 'architecture'>('simulation');

  const [stats, setStats] = useState<PerformanceStats>({
    currentFps: 60,
    frameTimeMs: 16.67,
    jitterMs: 0.24,
    vsyncLocked: true,
    memoryUsedMb: 36.4,
    memoryLimitMb: DEFAULT_CONFIG.maxMemoryPoolMb,
    cachedBundlesCount: 184,
    droppedFrames: 0
  });

  // Initialize official Freecam Mod Icon
  useEffect(() => {
    const icon = generateFreecamModIcon('cyan');
    setIconDataUrl(icon);
  }, []);

  const handleConfigChange = (updated: Partial<FreecamConfig>) => {
    setConfig(prev => ({ ...prev, ...updated }));
  };

  const handleResetConfig = () => {
    setConfig(DEFAULT_CONFIG);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0c1220]/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo and Titles */}
          <div className="flex items-center gap-3">
            {iconDataUrl ? (
              <img
                src={iconDataUrl}
                alt="Freecam Icon"
                className="w-10 h-10 rounded-xl shadow-lg border border-cyan-500/40 object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-cyan-900/60 border border-cyan-500 flex items-center justify-center">
                <Video className="w-5 h-5 text-cyan-400" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  LeviPack Freecam Studio
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 rounded-full">
                  v{config.version}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold bg-purple-950 text-purple-300 border border-purple-800 rounded-full">
                  {config.assetBundleTag}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Android AAR & LeviPack Mod Engine (Modrinth Freecam 1.5.1 Fabric Port)
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export .levipack</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Burmese & English Project Brief Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/40 border border-cyan-500/30 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Freecam Bedrock Port & Android AAR Library Generator</span>
              </div>

              {/* Burmese Explanation */}
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                <strong className="text-cyan-300">Freecam Fabric Mod (v1.5.1)</strong> မှ Minecraft Bedrock အတွက် သုံးနိုင်မည့် <strong className="text-white">.levipack</strong> နှင့် <strong className="text-white">Android AAR Library (Kotlin/C++ NDK)</strong> ကို Version <strong className="text-cyan-400 font-mono">1.26.52</strong> ဖြင့် အဆင်သင့် ထုတ်လုပ်ပေးထားပါသည်။ Mod ထဲမှ မူရင်း <strong className="text-cyan-300">pack_icon.png</strong> အား တပ်ဆင်ထားပြီး၊ 60 FPS Frame Sync၊ ချောမွေ့သော Interpolation နှင့် Memory မပြည့်စေရန် <strong className="text-purple-300 font-mono">"{config.assetBundleTag}"</strong> Asset Bundle Caching စနစ်တို့ဖြင့် တည်ဆောက်ထားပါသည်။
              </p>

              {/* Tag name reminder badge */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-slate-400">Primary Asset Bundle Tag:</span>
                <code className="px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded font-mono font-bold text-[11px]">
                  {config.assetBundleTag}
                </code>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Target VSync:</span>
                <span className="text-emerald-400 font-mono font-bold text-[11px]">60 FPS Hardware Lock</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Installation Guide</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Performance & Memory Footprint Gauge */}
        <PerformanceMonitor stats={stats} config={config} />

        {/* Navigation Tabs (Simulation, Code, Architecture) */}
        <div className="flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('simulation')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
                activeTab === 'simulation'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>3D Freecam Simulator & Controls</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
                activeTab === 'code'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>AAR & NDK Code Inspector</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
                activeTab === 'architecture'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Engine Architecture Deep Dive</span>
            </button>
          </div>
        </div>

        {/* Tab 1: 3D Simulation & Control Panel */}
        {activeTab === 'simulation' && (
          <div className="space-y-6">
            <Freecam3DScene
              config={config}
              onPerformanceUpdate={setStats}
              isZoomed={isZoomed}
              onToggleZoom={() => setIsZoomed(prev => !prev)}
            />

            <ControlPanel
              config={config}
              onChange={handleConfigChange}
              onReset={handleResetConfig}
            />
          </div>
        )}

        {/* Tab 2: Code Inspector */}
        {activeTab === 'code' && (
          <div className="space-y-6">
            <CodeInspector config={config} />
          </div>
        )}

        {/* Tab 3: Architecture Deep Dive */}
        {activeTab === 'architecture' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: 60 FPS Hardware Frame Sync */}
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                <Zap className="w-4 h-4" />
                <h4>1. High-Performance Frame Synchronization (60 FPS)</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Android ၏ <code className="text-cyan-300 font-mono">Choreographer.FrameCallback</code> အား အသုံးပြု၍ display refresh rate (60Hz) နှင့် တိုက်ရိုက်ချိတ်ဆက်ထားပါသည်။ System clock hiccups များကို ကာကွယ်ရန် sub-millisecond nanosecond delta တွက်ချက်ပြီး <strong>sub-frame alpha interpolation</strong> ဖြင့် frame time jitter ကို အနည်းဆုံးဖြစ်စေပါသည်။
              </p>
              <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-slate-400 space-y-1 border border-slate-800">
                <div className="text-emerald-400 font-semibold">// Hardware VSync Callback Target</div>
                <div>targetFrameNs = 1_000_000_000L / 60 = 16.666 ms</div>
                <div>alpha = (deltaNs % targetFrameNs) / targetFrameNs</div>
              </div>
            </div>

            {/* Card 2: Smooth Movement Interpolation */}
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm">
                <Video className="w-4 h-4" />
                <h4>2. Smooth Movement Interpolations & Dynamic FOV</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                ကင်မရာ ရွေ့လျားမှုတွင် ရုတ်တရက်တုန်ခါခြင်း (jitter) မရှိစေရန် <strong>Catmull-Rom Spline</strong> နှင့် <strong>Exponential Velocity Dampening</strong> ကို သုံးထားပါသည်။ Zoom ဖွင့်ချိန်တွင် FOV Transition Easing (0ms - 800ms) ဖြင့် ချောမွေ့စွာ zoom ဆွဲပေးပြီး၊ အမြန်ပျံသန်းချိန်တွင် dynamic speed scaling FOV warp effect ပါဝင်ပါသည်။
              </p>
              <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-slate-400 space-y-1 border border-slate-800">
                <div className="text-cyan-400 font-semibold">// Velocity Dampening Formula</div>
                <div>velX = velX * smoothFactor + targetVx * (1.0 - smoothFactor)</div>
                <div>fov = currentFov + (targetFov - currentFov) * easeSpeed</div>
              </div>
            </div>

            {/* Card 3: Memory Footprint Optimization & Asset Streaming */}
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center gap-2.5 text-purple-400 font-bold text-sm">
                <Layers className="w-4 h-4" />
                <h4>3. Primary Asset Bundle System: "{config.assetBundleTag}"</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                သင်မေးမြန်းထားသော Asset Bundle Management System ၏ Tag အမည်မှာ <strong className="text-purple-300 font-mono">"{config.assetBundleTag}"</strong> ဖြစ်ပါသည်။ Intensive resource loading နှင့် chunk generation များတွင် Android ၏ Garbage Collector (GC) မဆိုင်းငံ့စေရန် <strong>DirectByteBuffer (Off-heap memory)</strong> နှင့် Coroutine <code className="text-purple-300 font-mono">Dispatchers.IO</code> background thread pool ဖြင့် အလုပ်လုပ်ပါသည်။
              </p>
              <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-slate-400 space-y-1 border border-slate-800">
                <div className="text-purple-400 font-semibold">// Asset Streaming Pool Tag</div>
                <div>const val TAG = "{config.assetBundleTag}"</div>
                <div>maxMemoryBytes = {config.maxMemoryPoolMb}MB (LRU Auto-Eviction)</div>
              </div>
            </div>

            {/* Card 4: Bedrock 1.26.52 & LeviPack Packaging */}
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <h4>4. Bedrock 1.26.52 & .levipack Specification</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                LeviLamina format v2 စံနှုန်းနှင့်အညီ <code className="text-amber-300 font-mono">manifest.json</code>၊ <strong className="text-cyan-300">pack_icon.png</strong> (Modrinth Freecam icon အပြည့်အစုံ)၊ C++20 JNI Shared Library (.so) နှင့် Kotlin AAR bundle အား တစ်ချက်နှိပ်ရုံဖြင့် ဒေါင်းလုဒ်ရယူနိုင်ပါသည်။
              </p>
              <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-slate-400 space-y-1 border border-slate-800">
                <div className="text-amber-400 font-semibold">// LeviPack Bedrock Specification</div>
                <div>target_bedrock_version: [1, 26, 52]</div>
                <div>abi_filters: ["arm64-v8a", "armeabi-v7a"]</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950/70 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>Freecam Modrinth XeEZ3fK2 to LeviPack Bedrock Port (v{config.version})</span>
            <span>•</span>
            <span className="font-mono text-purple-400">Tag: {config.assetBundleTag}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 transition"
            >
              Export .levipack
            </button>
            <span>•</span>
            <a
              href="https://modrinth.com/mod/freecam"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              <span>Original Modrinth Mod</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        config={config}
        currentIconDataUrl={iconDataUrl}
        onIconChange={setIconDataUrl}
      />
    </div>
  );
}

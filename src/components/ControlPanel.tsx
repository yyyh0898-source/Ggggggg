import React from 'react';
import { FreecamConfig, InterpolationMode } from '../types/freecam';
import { Sliders, Video, Cpu, HardDrive, RefreshCw, Layers, Sparkles } from 'lucide-react';

interface ControlPanelProps {
  config: FreecamConfig;
  onChange: (updated: Partial<FreecamConfig>) => void;
  onReset: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ config, onChange, onReset }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            Freecam Camera Engine & AAR Configuration
          </h2>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Smooth Interpolation & Motion */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Video className="w-4 h-4" />
            Smooth Movement Interpolation
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Algorithm Curve
            </label>
            <select
              value={config.interpolationMode}
              onChange={(e) => onChange({ interpolationMode: e.target.value as InterpolationMode })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="inertial">Exponential Inertia (Smooth Dampening)</option>
              <option value="catmull_rom">Catmull-Rom Spline (Cinematic Glide)</option>
              <option value="hermite">Hermite Spline (Curvature Continuity)</option>
              <option value="cubic_bezier">Cubic Bezier (S-Curve Acceleration)</option>
              <option value="linear">Linear (Raw Unsmoothed Debug)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Position Smoothing Factor</span>
              <span className="text-cyan-400 font-mono">{config.smoothingFactor.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.96"
              step="0.02"
              value={config.smoothingFactor}
              onChange={(e) => onChange({ smoothingFactor: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <span className="text-[11px] text-slate-500">Higher = cinematic momentum & float</span>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Rotation Look Smoothing</span>
              <span className="text-cyan-400 font-mono">{config.rotationSmoothing.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.20"
              max="0.95"
              step="0.05"
              value={config.rotationSmoothing}
              onChange={(e) => onChange({ rotationSmoothing: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Base Flight Speed</span>
              <span className="text-cyan-400 font-mono">{config.moveSpeed} m/s</span>
            </div>
            <input
              type="range"
              min="2"
              max="24"
              step="1"
              value={config.moveSpeed}
              onChange={(e) => onChange({ moveSpeed: parseInt(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Column 2: FOV Settings & Seamless Transitions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400">
            <Sparkles className="w-4 h-4" />
            Customizable FOV & Transitions
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Default Field of View (FOV)</span>
              <span className="text-purple-400 font-mono">{config.defaultFov}°</span>
            </div>
            <input
              type="range"
              min="40"
              max="110"
              step="2"
              value={config.defaultFov}
              onChange={(e) => onChange({ defaultFov: parseInt(e.target.value) })}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Telescope Zoom FOV (Key C)</span>
              <span className="text-purple-400 font-mono">{config.zoomFov}°</span>
            </div>
            <input
              type="range"
              min="15"
              max="45"
              step="1"
              value={config.zoomFov}
              onChange={(e) => onChange({ zoomFov: parseInt(e.target.value) })}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Transition Duration</span>
              <span className="text-purple-400 font-mono">{config.fovTransitionDurationMs} ms</span>
            </div>
            <input
              type="range"
              min="100"
              max="800"
              step="50"
              value={config.fovTransitionDurationMs}
              onChange={(e) => onChange({ fovTransitionDurationMs: parseInt(e.target.value) })}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.dynamicFovSpeedScaling}
                onChange={(e) => onChange({ dynamicFovSpeedScaling: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-950 accent-purple-500"
              />
              <span className="text-xs text-slate-300 font-medium">
                Dynamic FOV Speed Scaling (Warp effect when sprinting)
              </span>
            </label>
          </div>
        </div>

        {/* Column 3: Frame Sync, Memory & Asset Bundle Tag */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Cpu className="w-4 h-4" />
            Frame Sync & Memory Optimization
          </div>

          {/* Tag Name for Primary Asset Bundle Management System */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Primary Asset Bundle System Tag
              </label>
              <span className="text-[10px] text-slate-400 font-mono bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded">
                DESIGNATED TAG
              </span>
            </div>
            <input
              type="text"
              value={config.assetBundleTag}
              onChange={(e) => onChange({ assetBundleTag: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
              placeholder="LeviAssetBundle"
            />
            <p className="text-[11px] text-slate-400">
              Primary manager tag identifier for off-heap caching & background asset streaming.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Memory Footprint Ceiling</span>
              <span className="text-emerald-400 font-mono">{config.maxMemoryPoolMb} MB</span>
            </div>
            <input
              type="range"
              min="32"
              max="256"
              step="16"
              value={config.maxMemoryPoolMb}
              onChange={(e) => onChange({ maxMemoryPoolMb: parseInt(e.target.value) })}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <span className="text-[11px] text-slate-500">Prevents Out-Of-Memory crashes during chunk stream</span>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.vsyncLock}
                onChange={(e) => onChange({ vsyncLock: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-950 accent-emerald-500"
              />
              <span className="text-xs text-slate-300 font-medium">
                Hardware Choreographer 60 FPS Sync Lock
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableDirectByteBuffer}
                onChange={(e) => onChange({ enableDirectByteBuffer: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-950 accent-emerald-500"
              />
              <span className="text-xs text-slate-300 font-medium">
                DirectByteBuffer Off-Heap Recycling (Zero GC spikes)
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

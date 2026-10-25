import React, { useState } from 'react';
import { FreecamConfig } from '../types/freecam';
import { createLeviPackArchive, downloadBlob } from '../utils/levipackExporter';
import { generateFreecamModIcon } from '../utils/iconGenerator';
import { Download, X, Package, ShieldCheck, Check, Sparkles, Layers, Image as ImageIcon, Upload } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FreecamConfig;
  currentIconDataUrl: string;
  onIconChange: (dataUrl: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  config,
  currentIconDataUrl,
  onIconChange
}) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'download' | 'instructions'>('download');
  const [selectedTheme, setSelectedTheme] = useState<'cyan' | 'neon' | 'bedrock' | 'dark'>('cyan');

  if (!isOpen) return null;

  const handleExportLeviPack = async () => {
    try {
      setIsExporting(true);
      const blob = await createLeviPackArchive(config, currentIconDataUrl);
      downloadBlob(blob, `freecam-${config.version}.levipack`);
    } catch (err) {
      console.error('Failed to export .levipack:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleThemeChange = (theme: 'cyan' | 'neon' | 'bedrock' | 'dark') => {
    setSelectedTheme(theme);
    const newIcon = generateFreecamModIcon(theme);
    onIconChange(newIcon);
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          onIconChange(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              Export Freecam .levipack (v{config.version})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
          <button
            onClick={() => setActiveTab('download')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'download'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Export Package & Pack Icon
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'instructions'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            တပ်ဆင်နည်း လမ်းညွှန် (Install Guide)
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'download' ? (
            <>
              {/* Mod Icon & Pack Information */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="relative group shrink-0">
                  <img
                    src={currentIconDataUrl}
                    alt="Freecam Mod Icon"
                    className="w-24 h-24 rounded-2xl shadow-xl border border-cyan-500/40 object-cover"
                  />
                  <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/70 backdrop-blur rounded text-[9px] font-mono text-cyan-300">
                    256x256
                  </span>
                </div>

                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="text-sm font-bold text-white">Freecam Mod Icon (pack_icon.png)</span>
                    <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-mono">
                      XeEZ3fK2 Port
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Freecam mod မှ တရားဝင် icon စတိုင်လ်ကို pack_icon.png အဖြစ် အသုံးပြုထားပါသည်။
                  </p>

                  {/* Icon Theme Presets & Custom Upload */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-400">Icon Theme:</span>
                    {(['cyan', 'neon', 'bedrock', 'dark'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => handleThemeChange(t)}
                        className={`px-2 py-1 rounded text-[11px] font-medium capitalize transition ${
                          selectedTheme === t
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}

                    <label className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] cursor-pointer transition">
                      <Upload className="w-3 h-3 text-cyan-400" />
                      Upload Custom
                      <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Package Specs Summary */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-slate-400">Target Bedrock Version</span>
                  <div className="font-bold text-cyan-400 font-mono text-sm">{config.version}</div>
                  <span className="text-[11px] text-slate-500">1.26.52 Compatible</span>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-slate-400">Primary Asset Bundle Tag</span>
                  <div className="font-bold text-purple-300 font-mono text-sm">{config.assetBundleTag}</div>
                  <span className="text-[11px] text-slate-500">Off-heap DirectBuffer Cache</span>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-slate-400">Frame Synchronization</span>
                  <div className="font-bold text-emerald-400 font-mono text-sm">60 FPS Hardware VSync</div>
                  <span className="text-[11px] text-slate-500">Choreographer Lock</span>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-slate-400">Android Library Format</span>
                  <div className="font-bold text-amber-300 font-mono text-sm">AAR + C++ NDK (.so)</div>
                  <span className="text-[11px] text-slate-500">arm64-v8a / armeabi-v7a</span>
                </div>
              </div>

              {/* Package Content Listing */}
              <div className="p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-cyan-400" />
                  Package Contents Inside .levipack:
                </div>
                <div className="font-mono text-[11px] text-slate-400 grid grid-cols-2 gap-1.5 pl-2">
                  <div>📁 manifest.json (Bedrock 1.26.52)</div>
                  <div>🖼️ pack_icon.png (Freecam Mod 256x256)</div>
                  <div>⚙️ freecam_config.json</div>
                  <div>📦 aar/build.gradle.kts & AndroidManifest.xml</div>
                  <div>📄 aar/FreecamController.kt</div>
                  <div>⚡ aar/FrameSyncChoreographer.kt</div>
                  <div>🗂️ aar/{config.assetBundleTag}.kt</div>
                  <div>🔧 aar/NativeFreecamBridge.java & NDK .cpp</div>
                </div>
              </div>
            </>
          ) : (
            /* Burmese and English Instructions */
            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <div className="p-4 bg-cyan-950/30 border border-cyan-800/50 rounded-xl space-y-2">
                <h4 className="font-bold text-cyan-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  မြန်မာဘာသာ တပ်ဆင်နည်း (Burmese Instructions)
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-300">
                  <li>
                    <strong>.levipack ဒေါင်းလုဒ်ရယူပါ</strong>: အောက်ပါ Download ခလုတ်ကို နှိပ်၍ <code className="text-cyan-300">freecam-1.26.52.levipack</code> ဖိုင်ကို ရယူပါ။
                  </li>
                  <li>
                    <strong>LeviLamina သို့မဟုတ် Minecraft Bedrock</strong>: အဆိုပါ ဖိုင်အား LeviLamina modloader သို့မဟုတ် Android Bedrock ၏ <code className="text-cyan-300">games/com.mojang/development_behavior_packs/</code> (သို့မဟုတ် <code className="text-cyan-300">packs/</code>) ဖိုင်တွဲထဲသို့ ထည့်သွင်းပါ။
                  </li>
                  <li>
                    <strong>Android Studio / Custom AAR အသုံးပြုလိုပါက</strong>: .levipack အား zip အဖြစ် ဖြည်ပြီး <code className="text-cyan-300">aar/</code> ဖိုင်တွဲထဲမှ Kotlin, Java နှင့် C++ NDK ဖိုင်များကို Android Library project အဖြစ် အလွယ်တကူ တိုက်ရိုက် compile ပြုလုပ်နိုင်ပါသည်။
                  </li>
                  <li>
                    <strong>စွမ်းဆောင်ရည် အားသာချက်</strong>: <code className="text-cyan-300">{config.assetBundleTag}</code> စနစ်ကြောင့် chunk အများအပြား ဖွင့်ချိန်တွင် ဖုန်း crash မဖြစ်ဘဲ 60 FPS အပြည့် အမြဲတမ်း ငြိမ်နေစေပါသည်။
                  </li>
                </ol>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-200">
                  English Quick Start & Architecture Notes
                </h4>
                <p className="text-slate-400">
                  This bundle complies with LeviLamina 0.14+ and Bedrock 1.26.52 module manifest schema. The camera state is detached from player physics, synchronizing with the hardware display refresh rate at 60Hz via Android's <code className="text-cyan-300">Choreographer</code> frame callback.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ready for Minecraft Bedrock 1.26.52</span>
          </div>

          <button
            onClick={handleExportLeviPack}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating .levipack...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export .levipack (v{config.version})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

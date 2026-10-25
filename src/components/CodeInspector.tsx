import React, { useState } from 'react';
import { FreecamConfig } from '../types/freecam';
import {
  getLeviManifestJson,
  getKotlinFreecamController,
  getKotlinFrameSync,
  getKotlinAssetBundleTag,
  getCppNativeEngine,
  getBuildGradleKts
} from '../data/sourceCodeTemplates';
import { Code2, Copy, Check, FileCode, Folder, Shield, Cpu, Terminal } from 'lucide-react';

interface CodeInspectorProps {
  config: FreecamConfig;
}

export const CodeInspector: React.FC<CodeInspectorProps> = ({ config }) => {
  const [selectedFile, setSelectedFile] = useState<string>('FreecamController.kt');
  const [copied, setCopied] = useState<boolean>(false);

  const fileMap: { [key: string]: { code: string; lang: string; category: string } } = {
    'FreecamController.kt': {
      code: getKotlinFreecamController(config),
      lang: 'kotlin',
      category: 'Kotlin AAR'
    },
    'FrameSyncChoreographer.kt': {
      code: getKotlinFrameSync(config),
      lang: 'kotlin',
      category: 'Kotlin AAR'
    },
    [`${config.assetBundleTag}.kt`]: {
      code: getKotlinAssetBundleTag(config),
      lang: 'kotlin',
      category: 'Asset Bundle'
    },
    'freecam_engine.cpp': {
      code: getCppNativeEngine(config),
      lang: 'cpp',
      category: 'C++ NDK'
    },
    'manifest.json': {
      code: getLeviManifestJson(config),
      lang: 'json',
      category: 'LeviPack'
    },
    'build.gradle.kts': {
      code: getBuildGradleKts(config),
      lang: 'kotlin',
      category: 'Gradle Build'
    }
  };

  const currentFile = fileMap[selectedFile] || fileMap['FreecamController.kt'];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Android AAR & LeviPack Source Code Inspector
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
            v{config.version}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition border border-slate-700"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy File'}</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row min-h-[420px]">
        {/* Sidebar file tree */}
        <div className="w-full md:w-64 bg-slate-950/90 border-r border-slate-800 p-3 space-y-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
            Engine Project Files
          </div>

          <div className="space-y-1">
            {Object.keys(fileMap).map((fileName) => {
              const item = fileMap[fileName];
              const isSelected = selectedFile === fileName;
              return (
                <button
                  key={fileName}
                  onClick={() => setSelectedFile(fileName)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-mono transition text-left ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span className="truncate">{fileName}</span>
                  </div>
                  <span className="text-[9px] px-1 py-0.5 bg-slate-800 text-slate-400 rounded shrink-0">
                    {item.category}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>NDK & AAR Targets</span>
            </div>
            <p>
              Targeting Bedrock <strong>1.26.52</strong> with <strong>C++20 NDK</strong> and Kotlin Coroutine dispatchers.
            </p>
          </div>
        </div>

        {/* Code Content View */}
        <div className="flex-1 bg-slate-950 p-4 overflow-x-auto font-mono text-xs text-slate-300 leading-relaxed">
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-800 pb-2 mb-3">
            <span>Viewing: <strong className="text-cyan-400">{selectedFile}</strong></span>
            <span>{currentFile.code.split('\n').length} lines</span>
          </div>

          <pre className="overflow-x-auto whitespace-pre font-mono">
            {currentFile.code.split('\n').map((line, idx) => (
              <div key={idx} className="flex hover:bg-slate-900/60 py-0.5 rounded px-1">
                <span className="w-10 text-right pr-4 text-slate-600 select-none text-[11px]">
                  {idx + 1}
                </span>
                <span className="flex-1">{line}</span>
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
};

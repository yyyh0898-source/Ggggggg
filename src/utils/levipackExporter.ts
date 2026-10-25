import JSZip from 'jszip';
import { FreecamConfig } from '../types/freecam';
import {
  getLeviManifestJson,
  getKotlinFreecamController,
  getKotlinFrameSync,
  getKotlinAssetBundleTag,
  getCppNativeEngine,
  getBuildGradleKts
} from '../data/sourceCodeTemplates';
import { dataUrlToUint8Array } from './iconGenerator';

export async function createLeviPackArchive(config: FreecamConfig, iconDataUrl: string): Promise<Blob> {
  const zip = new JSZip();

  // 1. Manifest
  zip.file('manifest.json', getLeviManifestJson(config));

  // 2. Pack Icon (from Freecam mod)
  try {
    const iconBytes = dataUrlToUint8Array(iconDataUrl);
    zip.file('pack_icon.png', iconBytes);
  } catch (e) {
    console.warn('Could not parse icon bytes, storing placeholder', e);
  }

  // 3. Freecam Config
  zip.file('freecam_config.json', JSON.stringify(config, null, 2));

  // 4. Android AAR Library Structure
  const aarFolder = zip.folder('aar');
  if (aarFolder) {
    aarFolder.file('build.gradle.kts', getBuildGradleKts(config));
    
    // AndroidManifest.xml
    aarFolder.file('src/main/AndroidManifest.xml', `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.levipack.freecam">
    <!-- LeviPack Bedrock Freecam Engine v${config.version} -->
</manifest>`);

    // Kotlin Sources
    const ktFolder = aarFolder.folder('src/main/kotlin/com/levipack/freecam');
    if (ktFolder) {
      ktFolder.file('FreecamController.kt', getKotlinFreecamController(config));
      ktFolder.file('FrameSyncChoreographer.kt', getKotlinFrameSync(config));
      ktFolder.file(`${config.assetBundleTag}.kt`, getKotlinAssetBundleTag(config));
    }

    // Java Bridge
    const javaFolder = aarFolder.folder('src/main/java/com/levipack/freecam');
    if (javaFolder) {
      javaFolder.file('NativeFreecamBridge.java', `package com.levipack.freecam;

import java.nio.ByteBuffer;

public final class NativeFreecamBridge {
    static {
        System.loadLibrary("freecam_engine");
    }

    public static native void nativeUpdateCameraMatrix(
        double posX, double posY, double posZ,
        float yaw, float pitch,
        float fov, float alpha
    );

    public static native void nativeOnFreecamStateChanged(boolean active);
    public static native void nativeFreeDirectBuffer(ByteBuffer buffer);
}
`);
    }

    // C++ NDK Sources
    const cppFolder = aarFolder.folder('src/main/cpp');
    if (cppFolder) {
      cppFolder.file('freecam_engine.cpp', getCppNativeEngine(config));
      cppFolder.file('CMakeLists.txt', `cmake_minimum_required(VERSION 3.22.1)
project("freecam_engine")

add_library(freecam_engine SHARED
    freecam_engine.cpp
)

find_library(log-lib log)

target_link_libraries(freecam_engine
    \${log-lib}
)
`);
    }
  }

  // 5. Documentation in Burmese & English
  zip.file('README.md', `# LeviPack Freecam Android Engine (v${config.version})
**Primary Asset Bundle Tag:** \`${config.assetBundleTag}\`

---

## မြန်မာဘာသာ (Burmese Instructions)
LeviPack Freecam အား Minecraft Bedrock 1.26.52 တွင် အသုံးပြုရန် လမ်းညွှန်ချက်:
1. ရရှိလာသော \`.levipack\` ဖိုင်ကို LeviLamina သို့မဟုတ် Bedrock Modloader ၏ \`packs\` ဖိုင်တွဲထဲသို့ ထည့်သွင်းပါ။
2. Android Studio ဖြင့် ပြင်ဆင်အသုံးပြုလိုပါက \`aar/\` ဖိုင်တွဲကို Android Library (AAR) အဖြစ် build ပြုလုပ်နိုင်ပါသည်။
3. အဓိက အင်္ဂါရပ်များ:
   - **60 FPS Hardware VSync**: Choreographer နည်းပညာဖြင့် ဖုန်းအားလုံးတွင် frame နှုန်းတည်ငြိမ်စေခြင်း။
   - **Smooth Interpolation**: Catmull-Rom spline နှင့် exponential inertia ဖြင့် ကင်မရာ ရွေ့လျားမှု ချောမွေ့ခြင်း။
   - **Customizable FOV**: အနီး/အဝေး zoom နှင့် cinematic transitions များ။
   - **Memory Footprint Optimizer**: DirectByteBuffer နှင့် \`${config.assetBundleTag}\` asset caching စနစ်ဖြင့် memory crash မဖြစ်အောင် ထိန်းညှိထားခြင်း။

---

## English Technical Architecture
- **Target Bedrock Version:** ${config.version}
- **Frame Sync:** Hardware Choreographer 60 FPS (${config.targetFps} Hz Target)
- **Asset Streaming Tag:** \`${config.assetBundleTag}\` (LRU Caching & Async Coroutine Pool)
- **Native NDK:** C++20 Double-buffered Lock-free Camera Matrix Flip
- **Smoothing Algorithm:** ${config.interpolationMode.toUpperCase()}

Package generated with LeviPack Freecam Studio.
`);

  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

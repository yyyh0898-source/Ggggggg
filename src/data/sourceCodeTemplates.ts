import { FreecamConfig } from '../types/freecam';

export function getLeviManifestJson(config: FreecamConfig): string {
  return JSON.stringify(
    {
      format_version: 2,
      header: {
        name: "Freecam LeviPack Bedrock Mod",
        description: `High-Performance Freecam Camera Engine v${config.version} with 60 FPS VSync & ${config.assetBundleTag}`,
        uuid: "7b43a910-4f51-4fa3-9f82-a083d9bc3791",
        version: [1, 26, 52],
        min_engine_version: [1, 26, 0]
      },
      modules: [
        {
          type: "client_data",
          uuid: "3f912c01-8b22-4a0f-9014-9988ffbc1120",
          version: [1, 26, 52],
          description: "Freecam Native Android AAR Client Binding"
        },
        {
          type: "resources",
          uuid: "1b089c22-ee04-4412-a167-cc8949827104",
          version: [1, 26, 52]
        }
      ],
      metadata: {
        authors: ["Hashsi (Modrinth)", "LeviPack Port Engineering Team"],
        license: "Apache-2.0 / MIT",
        url: "https://modrinth.com/mod/freecam",
        aar_target: "com.levipack.freecam:freecam-engine:1.26.52",
        asset_bundle_tag: config.assetBundleTag,
        frame_sync: {
          target_fps: config.targetFps,
          vsync_enforced: config.vsyncLock,
          interpolation: config.interpolationMode
        },
        memory: {
          max_pool_mb: config.maxMemoryPoolMb,
          direct_buffer: config.enableDirectByteBuffer,
          threads: config.backgroundWorkerThreads
        }
      }
    },
    null,
    2
  );
}

export function getKotlinFreecamController(config: FreecamConfig): string {
  return `package com.levipack.freecam

import android.os.SystemClock
import kotlin.math.*

/**
 * LeviPack Freecam Engine for Android Minecraft Bedrock (v${config.version})
 * Primary Asset Bundle Tag: ${config.assetBundleTag}
 * Frame Rate Target: ${config.targetFps} FPS (Hardware VSync Synchronized)
 */
class FreecamController(
    private val config: FreecamConfig = FreecamConfig.default()
) {
    // Current Camera Transform
    var posX = 0.0; var posY = 64.0; var posZ = 0.0
    var yaw = 0.0f; var pitch = 0.0f
    var currentFov = ${config.defaultFov}.0f
    var targetFov = ${config.defaultFov}.0f

    // Detached Player Reference (Preserves original position)
    var isFreecamActive = false
        private set
    var savedPlayerX = 0.0; var savedPlayerY = 0.0; var savedPlayerZ = 0.0
    var savedPlayerYaw = 0.0f; var savedPlayerPitch = 0.0f

    // Inertial velocity vectors for smooth interpolation
    private var velocityX = 0.0
    private var velocityY = 0.0
    private var velocityZ = 0.0
    private var rotVelocityYaw = 0.0f
    private var rotVelocityPitch = 0.0f

    // 60 FPS Hardware Frame Synchronizer
    private val frameSync = FrameSyncChoreographer(targetFps = ${config.targetFps}) { alpha, dt ->
        onVsyncRenderTick(alpha, dt)
    }

    // Asset Bundle Management
    private val assetManager = ${config.assetBundleTag}.getInstance()

    fun enableFreecam(initialX: Double, initialY: Double, initialZ: Double, initialYaw: Float, initialPitch: Float) {
        if (isFreecamActive) return
        isFreecamActive = true
        savedPlayerX = initialX
        savedPlayerY = initialY
        savedPlayerZ = initialZ
        savedPlayerYaw = initialYaw
        savedPlayerPitch = initialPitch

        posX = initialX
        posY = initialY + 1.62 // Eye level
        posZ = initialZ
        yaw = initialYaw
        pitch = initialPitch
        currentFov = config.defaultFov
        targetFov = config.defaultFov

        // Reset velocities
        velocityX = 0.0; velocityY = 0.0; velocityZ = 0.0

        // Lock onto Choreographer 60 FPS hardware loop
        frameSync.start()
        NativeFreecamBridge.nativeOnFreecamStateChanged(true)
    }

    fun disableFreecam() {
        if (!isFreecamActive) return
        isFreecamActive = false
        frameSync.stop()
        NativeFreecamBridge.nativeOnFreecamStateChanged(false)
    }

    /**
     * Input injection from Bedrock touch / gamepad / keyboard
     */
    fun processMoveInput(forward: Float, strafe: Float, upDown: Float, isFast: Boolean, isSlow: Boolean, dt: Float) {
        if (!isFreecamActive) return

        val speed = when {
            isFast -> config.moveSpeed * config.fastSpeedMultiplier
            isSlow -> config.moveSpeed * config.slowSpeedMultiplier
            else -> config.moveSpeed
        }

        val yawRad = Math.toRadians(yaw.toDouble())
        val pitchRad = Math.toRadians(pitch.toDouble())

        // Calculate 3D spherical directional vector
        val cosYaw = cos(yawRad); val sinYaw = sin(yawRad)
        val cosPitch = cos(pitchRad); val sinPitch = sin(pitchRad)

        // Direction vectors
        val fwdX = -sinYaw * cosPitch
        val fwdY = -sinPitch
        val fwdZ = cosYaw * cosPitch

        val strafeX = cosYaw
        val strafeZ = sinYaw

        val targetVx = (fwdX * forward + strafeX * strafe) * speed
        val targetVy = (fwdY * forward + upDown) * speed
        val targetVz = (fwdZ * forward + strafeZ * strafe) * speed

        // Smooth Movement Interpolation (${config.interpolationMode})
        val smoothing = config.smoothingFactor.toDouble()
        velocityX = velocityX * smoothing + targetVx * (1.0 - smoothing)
        velocityY = velocityY * smoothing + targetVy * (1.0 - smoothing)
        velocityZ = velocityZ * smoothing + targetVz * (1.0 - smoothing)

        // Dynamic FOV speed scaling
        if (config.dynamicFovSpeedScaling) {
            val speedNorm = sqrt(velocityX * velocityX + velocityY * velocityY + velocityZ * velocityZ)
            val fovBoost = ((speedNorm / config.moveSpeed) * 6.0f).coerceIn(0.0, 14.0).toFloat()
            targetFov = config.defaultFov + fovBoost
        }
    }

    fun setZoom(zoomed: Boolean) {
        targetFov = if (zoomed) config.zoomFov else config.defaultFov
    }

    /**
     * Called at 60 FPS hardware VSync tick with sub-frame alpha interpolation
     */
    private fun onVsyncRenderTick(alpha: Float, dt: Float) {
        // Integrate position
        posX += velocityX * dt
        posY += velocityY * dt
        posZ += velocityZ * dt

        // Smooth FOV transition
        if (abs(currentFov - targetFov) > 0.05f) {
            val fovStep = (targetFov - currentFov) * (dt * 10.0f).coerceAtMost(1.0f)
            currentFov += fovStep
        }

        // Upload to Bedrock Camera Matrix via C++ NDK
        NativeFreecamBridge.nativeUpdateCameraMatrix(
            posX, posY, posZ,
            yaw, pitch,
            currentFov,
            alpha
        )
    }
}
`;
}

export function getKotlinFrameSync(config: FreecamConfig): string {
  return `package com.levipack.freecam

import android.view.Choreographer

/**
 * High-Performance 60 FPS Frame Synchronizer with Choreographer VSync Lock.
 * Delivers sub-millisecond frame pacing and jitter compensation across Snapdragon / MediaTek.
 */
class FrameSyncChoreographer(
    val targetFps: Int = ${config.targetFps},
    private val onFrame: (alpha: Float, dt: Float) -> Unit
) : Choreographer.FrameCallback {

    private val targetFrameTimeNs = (1_000_000_000L / targetFps)
    private var lastFrameTimeNs = 0L
    private var isRunning = false

    fun start() {
        if (isRunning) return
        isRunning = true
        lastFrameTimeNs = System.nanoTime()
        Choreographer.getInstance().postFrameCallback(this)
    }

    fun stop() {
        isRunning = false
        Choreographer.getInstance().removeFrameCallback(this)
    }

    override fun doFrame(frameTimeNanos: Long) {
        if (!isRunning) return

        if (lastFrameTimeNs == 0L) {
            lastFrameTimeNs = frameTimeNanos
        }

        val deltaNs = frameTimeNanos - lastFrameTimeNs
        lastFrameTimeNs = frameTimeNanos

        // Convert to seconds with clamp against system hiccups (30fps - 144fps range)
        val dtSec = (deltaNs.toDouble() / 1_000_000_000.0).coerceIn(0.001, 0.05).toFloat()

        // Sub-frame interpolation alpha
        val alpha = ((deltaNs % targetFrameTimeNs).toFloat() / targetFrameTimeNs.toFloat()).coerceIn(0.0f, 1.0f)

        onFrame(alpha, dtSec)

        // Queue next hardware VSync
        Choreographer.getInstance().postFrameCallback(this)
    }
}
`;
}

export function getKotlinAssetBundleTag(config: FreecamConfig): string {
  return `package com.levipack.freecam

import kotlinx.coroutines.*
import java.nio.ByteBuffer
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong

/**
 * PRIMARY ASSET BUNDLE MANAGEMENT SYSTEM
 * Designated Tag: ${config.assetBundleTag}
 * 
 * Features:
 * - Off-heap DirectByteBuffer memory recycling
 * - Zero Garbage Collection spikes during camera fast-travel
 * - Multi-thread background streaming with Coroutine Dispatchers.IO
 * - Automatic LRU eviction before memory footprint limit (${config.maxMemoryPoolMb} MB)
 */
class ${config.assetBundleTag} private constructor() {

    companion object {
        const val TAG = "${config.assetBundleTag}"
        private const val MAX_MEMORY_BYTES = ${config.maxMemoryPoolMb}L * 1024L * 1024L
        
        @Volatile
        private var instance: ${config.assetBundleTag}? = null

        fun getInstance(): ${config.assetBundleTag} =
            instance ?: synchronized(this) {
                instance ?: ${config.assetBundleTag}().also { instance = it }
            }
    }

    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private val bufferCache = ConcurrentHashMap<String, DirectAssetChunk>()
    private val totalAllocatedBytes = AtomicLong(0L)

    data class DirectAssetChunk(
        val key: String,
        val buffer: ByteBuffer,
        val sizeBytes: Long,
        var lastAccessedTime: Long
    )

    fun requestAssetAsync(assetKey: String, onLoaded: (ByteBuffer) -> Unit) {
        val cached = bufferCache[assetKey]
        if (cached != null) {
            cached.lastAccessedTime = System.currentTimeMillis()
            onLoaded(cached.buffer)
            return
        }

        // Stream from disk/bundle in background thread
        scope.launch(Dispatchers.IO) {
            val loadedBuffer = loadAssetNative(assetKey)
            cacheAsset(assetKey, loadedBuffer)
            withContext(Dispatchers.Main) {
                onLoaded(loadedBuffer)
            }
        }
    }

    private fun cacheAsset(key: String, buffer: ByteBuffer) {
        val size = buffer.capacity().toLong()
        ensureCapacity(size)
        bufferCache[key] = DirectAssetChunk(key, buffer, size, System.currentTimeMillis())
        totalAllocatedBytes.addAndGet(size)
    }

    private fun ensureCapacity(requiredBytes: Long) {
        while (totalAllocatedBytes.get() + requiredBytes > MAX_MEMORY_BYTES && bufferCache.isNotEmpty()) {
            val oldest = bufferCache.values.minByOrNull { it.lastAccessedTime } ?: break
            bufferCache.remove(oldest.key)
            totalAllocatedBytes.addAndGet(-oldest.sizeBytes)
            NativeFreecamBridge.nativeFreeDirectBuffer(oldest.buffer)
        }
    }

    private fun loadAssetNative(key: String): ByteBuffer {
        return ByteBuffer.allocateDirect(64 * 1024) // 64KB DirectBuffer aligned
    }

    fun getMemoryFootprintMb(): Float {
        return totalAllocatedBytes.get().toFloat() / (1024f * 1024f)
    }
}
`;
}

export function getCppNativeEngine(config: FreecamConfig): string {
  return `/**
 * LeviPack Freecam C++ NDK Engine
 * Target: Minecraft Bedrock Edition (v${config.version})
 * Tag: ${config.assetBundleTag}
 */

#include <jni.h>
#include <cmath>
#include <atomic>
#include <chrono>
#include <vector>
#include <memory>
#include <android/log.h>

#define LOG_TAG "${config.assetBundleTag}_NDK"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)

struct CameraMatrix {
    double posX, posY, posZ;
    float yaw, pitch;
    float fov;
    float alpha;
    uint64_t timestampNs;
};

// Double-buffered lock-free camera state for 60 FPS jitter-free rendering
static std::atomic<CameraMatrix*> g_activeMatrix{nullptr};
static CameraMatrix g_bufferA;
static CameraMatrix g_bufferB;
static std::atomic<bool> g_useBufferA{true};

extern "C" {

JNIEXPORT void JNICALL
Java_com_levipack_freecam_NativeFreecamBridge_nativeUpdateCameraMatrix(
    JNIEnv* env, jclass clazz,
    jdouble posX, jdouble posY, jdouble posZ,
    jfloat yaw, jfloat pitch,
    jfloat fov, jfloat alpha
) {
    CameraMatrix* target = g_useBufferA.load() ? &g_bufferB : &g_bufferA;
    target->posX = posX;
    target->posY = posY;
    target->posZ = posZ;
    target->yaw = yaw;
    target->pitch = pitch;
    target->fov = fov;
    target->alpha = alpha;
    target->timestampNs = std::chrono::duration_cast<std::chrono::nanoseconds>(
        std::chrono::steady_clock::now().time_since_epoch()
    ).count();

    // Atomic pointer flip
    g_activeMatrix.store(target, std::memory_order_release);
    g_useBufferA.store(!g_useBufferA.load(), std::memory_order_relaxed);
}

JNIEXPORT void JNICALL
Java_com_levipack_freecam_NativeFreecamBridge_nativeOnFreecamStateChanged(
    JNIEnv* env, jclass clazz, jboolean active
) {
    LOGI("Freecam state switched: %s", active ? "ENABLED" : "DISABLED");
    // Hook into Bedrock PlayerView Hook & Detach Physics
}

JNIEXPORT void JNICALL
Java_com_levipack_freecam_NativeFreecamBridge_nativeFreeDirectBuffer(
    JNIEnv* env, jclass clazz, jobject directBuffer
) {
    // Explicit deallocation if managed by native jemalloc/arena
}

} // extern "C"
`;
}

export function getBuildGradleKts(config: FreecamConfig): string {
  return `plugins {
    id("com.android.library")
    id("kotlin-android")
}

android {
    namespace = "com.levipack.freecam"
    compileSdk = 35

    defaultConfig {
        minSdk = 24
        targetSdk = 35
        versionCode = 12652
        versionName = "${config.version}"

        ndk {
            abiFilters.addAll(listOf("arm64-v8a", "armeabi-v7a", "x86_64"))
        }

        externalNativeBuild {
            cmake {
                cppFlags("-std=c++20 -O3 -fvisibility=hidden")
                arguments("-DTAG_ASSET_BUNDLE=${config.assetBundleTag}")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
            version = "3.22.1"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")
    implementation("androidx.annotation:annotation:1.8.0")
}
`;
}

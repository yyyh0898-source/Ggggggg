export type InterpolationMode = 'inertial' | 'catmull_rom' | 'hermite' | 'cubic_bezier' | 'linear';

export interface FreecamConfig {
  version: string; // e.g. "1.26.52"
  assetBundleTag: string; // "LeviAssetBundle"
  targetFps: number; // 60
  vsyncLock: boolean;
  
  // Camera Controls
  moveSpeed: number; // blocks per second (e.g. 8.0)
  fastSpeedMultiplier: number; // e.g. 2.5
  slowSpeedMultiplier: number; // e.g. 0.3
  
  // Interpolation & Smoothing
  interpolationMode: InterpolationMode;
  smoothingFactor: number; // 0.0 - 0.98 (e.g. 0.85)
  rotationSmoothing: number; // 0.0 - 0.95 (e.g. 0.80)
  
  // FOV Settings
  defaultFov: number; // 70
  minFov: number; // 30
  maxFov: number; // 120
  zoomFov: number; // 25
  dynamicFovSpeedScaling: boolean;
  fovTransitionDurationMs: number; // e.g. 250ms
  
  // Memory & Streaming
  maxMemoryPoolMb: number; // e.g. 128 MB
  enableDirectByteBuffer: boolean;
  backgroundWorkerThreads: number; // e.g. 4
  lruCacheCapacity: number; // e.g. 512 chunks/textures
  spectatorCollision: boolean;
  freezePlayerPhysics: boolean;
}

export interface CameraWaypoint {
  id: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  fov: number;
  timeSec: number;
}

export interface PerformanceStats {
  currentFps: number;
  frameTimeMs: number;
  jitterMs: number;
  vsyncLocked: boolean;
  memoryUsedMb: number;
  memoryLimitMb: number;
  cachedBundlesCount: number;
  droppedFrames: number;
}

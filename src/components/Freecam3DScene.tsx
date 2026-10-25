import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { FreecamConfig, PerformanceStats, CameraWaypoint } from '../types/freecam';
import { Camera, Play, Square, Plus, Trash2, Eye, Compass, Move3d, Sparkles } from 'lucide-react';

interface Freecam3DSceneProps {
  config: FreecamConfig;
  onPerformanceUpdate: (stats: PerformanceStats) => void;
  isZoomed: boolean;
  onToggleZoom: () => void;
}

export const Freecam3DScene: React.FC<Freecam3DSceneProps> = ({
  config,
  onPerformanceUpdate,
  isZoomed,
  onToggleZoom
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFreecamActive, setIsFreecamActive] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'freecam' | 'overview'>('freecam');
  const [waypoints, setWaypoints] = useState<CameraWaypoint[]>([
    { id: '1', x: -12, y: 14, z: 24, yaw: 25, pitch: -10, fov: 70, timeSec: 0 },
    { id: '2', x: 0, y: 18, z: 10, yaw: 0, pitch: -15, fov: 60, timeSec: 2 },
    { id: '3', x: 14, y: 12, z: -8, yaw: -45, pitch: -5, fov: 80, timeSec: 4 },
    { id: '4', x: 4, y: 8, z: -18, yaw: -120, pitch: 0, fov: 70, timeSec: 6 }
  ]);
  const [isPlayingPath, setIsPlayingPath] = useState<boolean>(false);
  const pathProgressRef = useRef<number>(0);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const freecamRef = useRef<THREE.PerspectiveCamera | null>(null);
  const overviewCamRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frustumHelperRef = useRef<THREE.CameraHelper | null>(null);
  const playerModelRef = useRef<THREE.Group | null>(null);
  const pathCurveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const pathLineRef = useRef<THREE.Line | null>(null);

  // Freecam state
  const camPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 10, 20));
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 10, 20));
  const camVelRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const yawPitchRef = useRef<{ yaw: number; pitch: number }>({ yaw: 0, pitch: -10 });
  const targetYawPitchRef = useRef<{ yaw: number; pitch: number }>({ yaw: 0, pitch: -10 });
  const currentFovRef = useRef<number>(config.defaultFov);

  // Input keys
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Telemetry
  const lastTimeRef = useRef<number>(performance.now());
  const frameTimesRef = useRef<number[]>([]);
  const simulatedMemoryMbRef = useRef<number>(34.5);

  // Setup Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0c192c');
    scene.fog = new THREE.FogExp2('#0c192c', 0.015);
    sceneRef.current = scene;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Cameras
    const freecam = new THREE.PerspectiveCamera(config.defaultFov, width / height, 0.1, 1000);
    freecam.position.set(0, 10, 20);
    freecamRef.current = freecam;

    const overviewCam = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    overviewCam.position.set(28, 30, 36);
    overviewCam.lookAt(0, 6, 0);
    overviewCamRef.current = overviewCam;

    // Frustum Helper for Freecam representation in overview mode
    const helper = new THREE.CameraHelper(freecam);
    helper.visible = false;
    scene.add(helper);
    frustumHelperRef.current = helper;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xd9eafd, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    dirLight.position.set(30, 50, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 120;
    const d = 35;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // Build Voxel Minecraft Landscape
    buildVoxelEnvironment(scene);

    // Build Player Model (Detached reference)
    const playerGroup = buildMinecraftPlayer();
    playerGroup.position.set(0, 3, 0);
    scene.add(playerGroup);
    playerModelRef.current = playerGroup;

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (freecamRef.current) {
        freecamRef.current.aspect = w / h;
        freecamRef.current.updateProjectionMatrix();
      }
      if (overviewCamRef.current) {
        overviewCamRef.current.aspect = w / h;
        overviewCamRef.current.updateProjectionMatrix();
      }
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Path line when waypoints change
  useEffect(() => {
    if (!sceneRef.current || waypoints.length < 2) return;

    if (pathLineRef.current) {
      sceneRef.current.remove(pathLineRef.current);
    }

    const points = waypoints.map(w => new THREE.Vector3(w.x, w.y, w.z));
    const curve = new THREE.CatmullRomCurve3(points, true);
    pathCurveRef.current = curve;

    const curvePoints = curve.getPoints(100);
    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const material = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      linewidth: 3,
      transparent: true,
      opacity: 0.8
    });

    const line = new THREE.Line(geometry, material);
    sceneRef.current.add(line);
    pathLineRef.current = line;
  }, [waypoints]);

  // Voxel World Builder
  const buildVoxelEnvironment = (scene: THREE.Scene) => {
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);

    // Materials
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x4ade80 });
    const dirtMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
    const stoneMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x92400e });
    const leavesMat = new THREE.MeshLambertMaterial({ color: 0x15803d, transparent: true, opacity: 0.9 });
    const waterMat = new THREE.MeshLambertMaterial({ color: 0x0284c7, transparent: true, opacity: 0.7 });
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

    // Ground plane blocks using instanced mesh or group
    const terrainGroup = new THREE.Group();

    for (let x = -20; x <= 20; x += 2) {
      for (let z = -20; z <= 20; z += 2) {
        const dist = Math.sqrt(x * x + z * z);
        let height = Math.floor(Math.sin(x * 0.15) * Math.cos(z * 0.15) * 3) + 2;

        if (dist > 18) height += 3;

        // Water pond in corner
        if (x > 8 && z > 8) {
          const waterBlock = new THREE.Mesh(boxGeo, waterMat);
          waterBlock.position.set(x, 1, z);
          waterBlock.scale.set(2, 1, 2);
          terrainGroup.add(waterBlock);
          continue;
        }

        const topBlock = new THREE.Mesh(boxGeo, grassMat);
        topBlock.position.set(x, height, z);
        topBlock.scale.set(2, 1, 2);
        topBlock.receiveShadow = true;
        topBlock.castShadow = true;
        terrainGroup.add(topBlock);

        const subBlock = new THREE.Mesh(boxGeo, dirtMat);
        subBlock.position.set(x, height - 1, z);
        subBlock.scale.set(2, 1, 2);
        terrainGroup.add(subBlock);
      }
    }

    // Add Trees
    const addTree = (tx: number, tz: number) => {
      for (let y = 3; y <= 7; y++) {
        const trunk = new THREE.Mesh(boxGeo, woodMat);
        trunk.position.set(tx, y, tz);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        terrainGroup.add(trunk);
      }
      for (let lx = -2; lx <= 2; lx++) {
        for (let lz = -2; lz <= 2; lz++) {
          for (let ly = 7; ly <= 9; ly++) {
            if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && ly === 9) continue;
            const leaf = new THREE.Mesh(boxGeo, leavesMat);
            leaf.position.set(tx + lx, ly, tz + lz);
            leaf.castShadow = true;
            terrainGroup.add(leaf);
          }
        }
      }
    };

    addTree(-8, -6);
    addTree(10, -10);
    addTree(-12, 12);

    // Glowing Freecam Beacon
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 40, 8), beaconMat);
    beacon.position.set(0, 20, 0);
    terrainGroup.add(beacon);

    scene.add(terrainGroup);
  };

  // Build Minecraft Player Model
  const buildMinecraftPlayer = (): THREE.Group => {
    const group = new THREE.Group();
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);

    const skinMat = new THREE.MeshLambertMaterial({ color: 0xfbcfe8 });
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1e3a8a });
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });

    // Head
    const head = new THREE.Mesh(boxGeo, skinMat);
    head.scale.set(0.8, 0.8, 0.8);
    head.position.set(0, 2.2, 0);
    head.castShadow = true;
    group.add(head);

    // Hair
    const hair = new THREE.Mesh(boxGeo, hairMat);
    hair.scale.set(0.84, 0.3, 0.84);
    hair.position.set(0, 2.5, 0);
    group.add(hair);

    // Body
    const body = new THREE.Mesh(boxGeo, shirtMat);
    body.scale.set(0.8, 1.1, 0.45);
    body.position.set(0, 1.3, 0);
    body.castShadow = true;
    group.add(body);

    // Arms
    const leftArm = new THREE.Mesh(boxGeo, skinMat);
    leftArm.scale.set(0.35, 1.1, 0.35);
    leftArm.position.set(-0.6, 1.3, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(boxGeo, skinMat);
    rightArm.scale.set(0.35, 1.1, 0.35);
    rightArm.position.set(0.6, 1.3, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    // Legs
    const leftLeg = new THREE.Mesh(boxGeo, pantsMat);
    leftLeg.scale.set(0.38, 1.1, 0.38);
    leftLeg.position.set(-0.22, 0.45, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(boxGeo, pantsMat);
    rightLeg.scale.set(0.38, 1.1, 0.38);
    rightLeg.position.set(0.22, 0.45, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // Detached Indicator Aura (Cyan Ring)
    const ringGeo = new THREE.RingGeometry(0.8, 0.95, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    group.add(ring);

    return group;
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;

      // C key for Zoom toggle
      if (e.code === 'KeyC') {
        onToggleZoom();
      }
      // V key for Freecam toggle
      if (e.code === 'KeyV') {
        setIsFreecamActive(prev => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onToggleZoom]);

  // Mouse drag look
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    const sensitivity = 0.25;
    targetYawPitchRef.current.yaw -= deltaX * sensitivity;
    targetYawPitchRef.current.pitch = Math.max(-89, Math.min(89, targetYawPitchRef.current.pitch - deltaY * sensitivity));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Animation Loop (60 FPS VSync Synchronized)
  useEffect(() => {
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const dtMs = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;
      const dtSec = Math.min(Math.max(dtMs / 1000, 0.001), 0.05);

      // Frame pacing calculation
      frameTimesRef.current.push(dtMs);
      if (frameTimesRef.current.length > 30) frameTimesRef.current.shift();
      const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
      const jitter = Math.abs(dtMs - avgFrameTime);

      // Memory simulation with LeviAssetBundle streaming
      if (Math.random() < 0.05) {
        simulatedMemoryMbRef.current = Number((32 + Math.random() * 8.5).toFixed(1));
      }

      onPerformanceUpdate({
        currentFps: Math.round(1000 / (avgFrameTime || 16.67)),
        frameTimeMs: Number(avgFrameTime.toFixed(2)),
        jitterMs: Number(jitter.toFixed(2)),
        vsyncLocked: config.vsyncLock && Math.abs(avgFrameTime - 16.67) < 3.0,
        memoryUsedMb: simulatedMemoryMbRef.current,
        memoryLimitMb: config.maxMemoryPoolMb,
        cachedBundlesCount: 184,
        droppedFrames: dtMs > 25 ? 1 : 0
      });

      // Target FOV with Zoom & Transitions
      const baseTargetFov = isZoomed ? config.zoomFov : config.defaultFov;
      const fovSmoothingSpeed = 10.0;
      currentFovRef.current += (baseTargetFov - currentFovRef.current) * Math.min(dtSec * fovSmoothingSpeed, 1.0);

      if (freecamRef.current) {
        freecamRef.current.fov = currentFovRef.current;
        freecamRef.current.updateProjectionMatrix();
        if (frustumHelperRef.current) {
          frustumHelperRef.current.update();
        }
      }

      // Handle Waypoint Path Playback
      if (isPlayingPath && pathCurveRef.current && waypoints.length >= 2) {
        pathProgressRef.current += dtSec * 0.12;
        if (pathProgressRef.current >= 1.0) {
          pathProgressRef.current = 0;
          setIsPlayingPath(false);
        } else {
          const pt = pathCurveRef.current.getPointAt(pathProgressRef.current);
          camPosRef.current.copy(pt);
          const tangent = pathCurveRef.current.getTangentAt(pathProgressRef.current);
          targetYawPitchRef.current.yaw = -Math.atan2(tangent.x, tangent.z) * (180 / Math.PI);
        }
      } else if (isFreecamActive) {
        // Freecam Manual Movement Logic
        const keys = keysRef.current;
        const isFast = keys['ShiftLeft'] || keys['ShiftRight'] || keys['ControlLeft'];
        const isSlow = keys['AltLeft'];
        const speed = (isFast ? config.moveSpeed * config.fastSpeedMultiplier :
                       isSlow ? config.moveSpeed * config.slowSpeedMultiplier :
                       config.moveSpeed) * dtSec;

        const forward = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);
        const strafe = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
        const upDown = (keys['Space'] ? 1 : 0) - (keys['KeyQ'] || keys['ShiftLeft'] ? 1 : 0);

        // Direction vectors
        const yawRad = (yawPitchRef.current.yaw * Math.PI) / 180;
        const pitchRad = (yawPitchRef.current.pitch * Math.PI) / 180;

        const fwdX = -Math.sin(yawRad) * Math.cos(pitchRad);
        const fwdY = Math.sin(pitchRad);
        const fwdZ = -Math.cos(yawRad) * Math.cos(pitchRad);

        const rightX = Math.cos(yawRad);
        const rightZ = -Math.sin(yawRad);

        const targetVelX = (fwdX * forward + rightX * strafe) * speed * 60;
        const targetVelY = (fwdY * forward + upDown * speed) * 60;
        const targetVelZ = (fwdZ * forward + rightZ * strafe) * speed * 60;

        // Smooth Interpolation Algorithm
        const smooth = config.interpolationMode === 'linear' ? 0.0 : config.smoothingFactor;
        camVelRef.current.x = camVelRef.current.x * smooth + targetVelX * (1 - smooth);
        camVelRef.current.y = camVelRef.current.y * smooth + targetVelY * (1 - smooth);
        camVelRef.current.z = camVelRef.current.z * smooth + targetVelZ * (1 - smooth);

        camPosRef.current.x += camVelRef.current.x * dtSec;
        camPosRef.current.y += camVelRef.current.y * dtSec;
        camPosRef.current.z += camVelRef.current.z * dtSec;
      }

      // Smooth Rotation Interpolation
      const rotSmooth = config.rotationSmoothing;
      yawPitchRef.current.yaw = yawPitchRef.current.yaw * rotSmooth + targetYawPitchRef.current.yaw * (1 - rotSmooth);
      yawPitchRef.current.pitch = yawPitchRef.current.pitch * rotSmooth + targetYawPitchRef.current.pitch * (1 - rotSmooth);

      // Apply to Freecam camera
      if (freecamRef.current) {
        freecamRef.current.position.copy(camPosRef.current);
        const yawRad = (yawPitchRef.current.yaw * Math.PI) / 180;
        const pitchRad = (yawPitchRef.current.pitch * Math.PI) / 180;

        const targetX = camPosRef.current.x - Math.sin(yawRad) * Math.cos(pitchRad);
        const targetY = camPosRef.current.y + Math.sin(pitchRad);
        const targetZ = camPosRef.current.z - Math.cos(yawRad) * Math.cos(pitchRad);
        freecamRef.current.lookAt(targetX, targetY, targetZ);
      }

      // Render Scene
      if (rendererRef.current && sceneRef.current) {
        const activeCam = viewMode === 'freecam' ? freecamRef.current : overviewCamRef.current;
        if (frustumHelperRef.current) {
          frustumHelperRef.current.visible = viewMode === 'overview';
        }
        if (activeCam) {
          rendererRef.current.render(sceneRef.current, activeCam);
        }
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [config, isZoomed, isPlayingPath, isFreecamActive, viewMode, waypoints, onPerformanceUpdate]);

  // Waypoints management
  const addCurrentAsWaypoint = () => {
    if (!freecamRef.current) return;
    const newWp: CameraWaypoint = {
      id: Date.now().toString(),
      x: Number(camPosRef.current.x.toFixed(1)),
      y: Number(camPosRef.current.y.toFixed(1)),
      z: Number(camPosRef.current.z.toFixed(1)),
      yaw: Number(yawPitchRef.current.yaw.toFixed(1)),
      pitch: Number(yawPitchRef.current.pitch.toFixed(1)),
      fov: Math.round(currentFovRef.current),
      timeSec: waypoints.length * 2
    };
    setWaypoints([...waypoints, newWp]);
  };

  const removeWaypoint = (id: string) => {
    setWaypoints(waypoints.filter(w => w.id !== id));
  };

  return (
    <div className="relative w-full h-[540px] rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950 shadow-2xl">
      {/* 3D Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {/* Crosshair (Freecam view only) */}
      {viewMode === 'freecam' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-4 h-4 relative">
            <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-cyan-400/80 -translate-y-1/2 shadow-[0_0_6px_#22d3ee]"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-cyan-400/80 -translate-x-1/2 shadow-[0_0_6px_#22d3ee]"></div>
            <div className="absolute inset-[5px] rounded-full border border-cyan-300/60"></div>
          </div>
        </div>
      )}

      {/* Top Floating Overlay Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none gap-2">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Mode Switcher */}
          <div className="flex bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-lg text-xs font-semibold">
            <button
              onClick={() => setViewMode('freecam')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'freecam'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Freecam Eye
            </button>
            <button
              onClick={() => setViewMode('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'overview'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Move3d className="w-3.5 h-3.5" />
              World Overview
            </button>
          </div>

          {/* Detached Player Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-cyan-500/40 text-xs shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-cyan-300 font-mono font-medium">Freecam Detached</span>
            <span className="text-slate-400 text-[11px]">(Player Locked at X:0 Y:3 Z:0)</span>
          </div>
        </div>

        {/* Quick Zoom & Path Actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onToggleZoom}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border transition-all shadow-lg ${
              isZoomed
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Zoom (C)</span>
            <span className="font-mono text-[10px] px-1 bg-black/40 rounded">
              {isZoomed ? `${config.zoomFov}°` : `${config.defaultFov}°`}
            </span>
          </button>

          <button
            onClick={() => {
              if (isPlayingPath) {
                setIsPlayingPath(false);
              } else {
                pathProgressRef.current = 0;
                setIsPlayingPath(true);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border transition-all shadow-lg ${
              isPlayingPath
                ? 'bg-red-500/20 text-red-300 border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30'
            }`}
          >
            {isPlayingPath ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlayingPath ? 'Stop Path' : 'Play Spline Path'}
          </button>
        </div>
      </div>

      {/* Bottom Floating Flight Stats & Controls Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none">
        {/* Navigation Key Hints */}
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 text-[11px] text-slate-300 shadow-xl pointer-events-auto">
          <span className="font-semibold text-cyan-400">Controls:</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono text-[10px]">W A S D</kbd>
          <span>Fly</span>
          <span className="text-slate-600">•</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono text-[10px]">Space</kbd>
          <span>Up</span>
          <span className="text-slate-600">•</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono text-[10px]">Q / Shift</kbd>
          <span>Down</span>
          <span className="text-slate-600">•</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono text-[10px]">Ctrl</kbd>
          <span>Fast</span>
          <span className="text-slate-600">•</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono text-[10px]">Drag Mouse</kbd>
          <span>Look</span>
        </div>

        {/* Waypoints quick adder */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl text-xs">
          <span className="text-slate-400 px-2 font-mono text-[11px]">
            Waypoints: <strong className="text-cyan-400">{waypoints.length}</strong>
          </span>
          <button
            onClick={addCurrentAsWaypoint}
            className="flex items-center gap-1 px-2.5 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Pos
          </button>
        </div>
      </div>
    </div>
  );
};

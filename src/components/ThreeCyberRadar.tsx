import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { X, Crosshair, Shield, Activity, Maximize2 } from 'lucide-react';

interface ThreeCyberRadarProps {
  isOpen: boolean;
  onClose: () => void;
  activeThreatCount?: number;
}

export const ThreeCyberRadar: React.FC<ThreeCyberRadarProps> = ({
  isOpen,
  onClose,
  activeThreatCount = 412,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Detect software WebGL per Three.js skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Renderer with ACESFilmicToneMapping and SRGBColorSpace
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 3. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070204, 0.05);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3, 7.5);
    camera.lookAt(0, 0, 0);

    // 4. Lighting Rig (Warm key light + cool hemisphere light fill)
    const keyLight = new THREE.DirectionalLight(0xff3344, 2.5);
    keyLight.position.set(4, 8, 5);
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0xff2233, 0x110205, 1.2);
    scene.add(hemiLight);

    // 5. Composite 3-12 Part Procedural Model (THREE.Group)
    const radarGroup = new THREE.Group();
    scene.add(radarGroup);

    // Part 1: Primary silhouette - Wireframe Cyber Sphere (Global Database Network)
    const sphereGeo = new THREE.SphereGeometry(2, 24, 18);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x88111a,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.9,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    radarGroup.add(sphereMesh);

    // Part 2: Inner Core Data Reactor
    const coreGeo = new THREE.IcosahedronGeometry(1.0, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xff2233,
      emissive: 0xaa0011,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.95,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    radarGroup.add(coreMesh);

    // Part 3: Secondary read - Concentric Radar Defense Rings
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0xff1122, wireframe: true });
    const ringGeo1 = new THREE.RingGeometry(2.4, 2.45, 48);
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2;
    radarGroup.add(ring1);

    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xcc2233, wireframe: true });
    const ringGeo2 = new THREE.RingGeometry(3.1, 3.15, 64);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 2;
    radarGroup.add(ring2);

    // Part 4: Sweeping Radar Beam (Sector)
    const sweepGeo = new THREE.RingGeometry(0.1, 3.1, 32, 1, 0, Math.PI / 4);
    const sweepMat = new THREE.MeshBasicMaterial({
      color: 0xff0022,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const sweepMesh = new THREE.Mesh(sweepGeo, sweepMat);
    sweepMesh.rotation.x = Math.PI / 2;
    radarGroup.add(sweepMesh);

    // Part 5: Accent Detail - 6 Procedural Attack Intercept Nodes on the sphere
    const nodeGroup = new THREE.Group();
    radarGroup.add(nodeGroup);
    const nodeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < 8; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2.02;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(x, y, z);
      nodeGroup.add(nodeMesh);
    }

    // 6. Animation Loop
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth rotations
      sphereMesh.rotation.y += delta * 0.25;
      coreMesh.rotation.x += delta * 0.5;
      coreMesh.rotation.y += delta * 0.4;
      sweepMesh.rotation.z -= delta * 1.8; // radar sweep

      // Pulsing node intensity
      const scale = 1 + 0.15 * Math.sin(elapsed * 4);
      nodeGroup.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      // Resource cleanup
      sphereGeo.dispose();
      sphereMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      sweepGeo.dispose();
      sweepMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      renderer.dispose();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 font-mono">
      <div className="w-full max-w-3xl bg-[#0e0406] border-2 border-red-700/80 rounded-2xl shadow-2xl shadow-red-950/80 overflow-hidden flex flex-col crimson-border-glow">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-red-950 bg-[#140508]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-950 border border-red-700 flex items-center justify-center text-red-400">
              <Crosshair className="w-5 h-5 animate-spin" style={{ animationDuration: '20s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white tracking-wide">
                  3D CYBER WARFARE RADAR // GLOBAL SQL INTERCEPT
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 font-bold">
                  THREE.JS PBR MATRIX
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Real-Time Spatial Vector Tracking Across Global Database Nodes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-red-950 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D WebGL Canvas Container */}
        <div className="relative w-full h-[400px] bg-[#070204]">
          <div ref={mountRef} className="w-full h-full" />

          {/* Tactical HUD Overlay Over 3D Scene */}
          <div className="absolute top-3 left-4 text-[11px] text-red-400 font-mono space-y-1 pointer-events-none bg-black/60 p-2.5 rounded-xl border border-red-950">
            <div>[SECTOR: GLOBAL_GRID_ALPHA]</div>
            <div>STATUS: <span className="text-emerald-400 font-bold">INTERCEPT_ARMED</span></div>
            <div>BLOCKED PROBES: <span className="text-white font-bold">{activeThreatCount} ATTACKS</span></div>
          </div>

          <div className="absolute bottom-3 right-4 text-[10px] text-zinc-500 font-mono pointer-events-none bg-black/60 px-2.5 py-1 rounded-lg border border-red-950">
            PBR GLSL // PROCEDURAL THREE.JS COMPOSITE MESH
          </div>
        </div>

        {/* Bottom Specs Bar */}
        <div className="px-5 py-3 bg-[#0a0204] border-t border-red-950 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-red-400">
              <Activity className="w-3.5 h-3.5" />
              <span>Real-Time Sweep: 60 FPS</span>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-300">
              Honeypots Screened: 14,820 Nodes
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-red-950 hover:bg-red-900 text-red-200 text-xs font-bold border border-red-800 transition-colors cursor-pointer"
          >
            Return to Command Center
          </button>
        </div>
      </div>
    </div>
  );
};

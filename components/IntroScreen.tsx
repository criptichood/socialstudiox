import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, ArrowRight, Compass } from 'lucide-react';
import * as THREE from 'three';

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // References for Three.js cleanup
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Interactive control refs
  const isDraggingRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const baseRotationRef = useRef({ x: 0.8, y: -0.4 });
  const targetRotationRef = useRef({ x: 0.8, y: -0.4 });
  const currentRotationRef = useRef({ x: 0.8, y: -0.4 });
  
  const targetPanRef = useRef({ x: 0, y: -3 }); // Set initial pan Y to beautifully frame the core slightly lower
  const currentPanRef = useRef({ x: 0, y: -3 });
  
  const targetZoomRef = useRef(22); // Closer start zoom to appreciate the detailed spiral geometry
  const currentZoomRef = useRef(22);

  // Camera Sliders and Control Deck React State
  const [pitch, setPitch] = useState(0.8);
  const [yaw, setYaw] = useState(-0.4);
  const [roll, setRoll] = useState(0.4); // Beautiful initial Z-axis tilt slant
  const [zoom, setZoom] = useState(22);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(-3);
  const [enableParallax, setEnableParallax] = useState(true);

  // Refs to let the render tick access slider states instantly without re-binding useEffect listeners
  const pitchRef = useRef(0.8);
  const yawRef = useRef(-0.4);
  const rollRef = useRef(0.4);
  const zoomRef = useRef(22);
  const panXRef = useRef(0);
  const panYRef = useRef(-3);
  const enableParallaxRef = useRef(true);

  // Synchronize camera state values to refs & animation targets
  useEffect(() => {
    pitchRef.current = pitch;
    targetRotationRef.current.x = pitch;
  }, [pitch]);

  useEffect(() => {
    yawRef.current = yaw;
    targetRotationRef.current.y = yaw;
  }, [yaw]);

  useEffect(() => {
    rollRef.current = roll;
  }, [roll]);

  useEffect(() => {
    zoomRef.current = zoom;
    targetZoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panXRef.current = panX;
    if (!enableParallax) targetPanRef.current.x = panX;
  }, [panX, enableParallax]);

  useEffect(() => {
    panYRef.current = panY;
    if (!enableParallax) targetPanRef.current.y = panY;
  }, [panY, enableParallax]);

  useEffect(() => {
    enableParallaxRef.current = enableParallax;
  }, [enableParallax]);

  // Apply predefined camera telemetry presets
  const applyPreset = (preset: { pitch: number; roll: number; zoom: number; panX: number; panY: number; yaw: number }) => {
    setPitch(preset.pitch);
    setRoll(preset.roll);
    setZoom(preset.zoom);
    setPanX(preset.panX);
    setPanY(preset.panY);
    setYaw(preset.yaw);
    targetRotationRef.current = { x: preset.pitch, y: preset.yaw };
    targetZoomRef.current = preset.zoom;
    targetPanRef.current = { x: preset.panX, y: preset.panY };
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = currentZoomRef.current;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    const clock = new THREE.Clock();
    clockRef.current = clock;

    // 2. High density Particle swarm setup (20,000 units)
    const count = 20000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const arms = 4;
    const spacing = 6;
    
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const theta = i * 0.1375; // Golden spiral angle distribution
      const r = Math.sqrt(i) * spacing * 0.12;

      const armOffset = (Math.floor(i / (count / arms)) * (Math.PI * 2)) / arms;
      const angle = theta + r * 0.04 + armOffset;

      positions[idx] = Math.cos(angle) * r;
      positions[idx+1] = (Math.sin(i * 0.4) * 0.15) * (18 / (r + 1));
      positions[idx+2] = Math.sin(angle) * r;

      const normR = r / 30;
      const colorHSL = new THREE.Color();
      // Neon cyan temperatures at the hot energetic core, turning into deep galactic indigo/rose on the wings
      colorHSL.setHSL(0.55 + normR * 0.35, 1.0, 0.45);
      colors[idx] = colorHSL.r;
      colors[idx+1] = colorHSL.g;
      colors[idx+2] = colorHSL.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Circular glowing particle texture
    const createCircleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.2, 'rgba(255,255,255,0.85)');
        grad.addColorStop(0.55, 'rgba(147,51,234,0.45)'); // Glowing violet ambient halo
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const material = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      map: createCircleTexture(),
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);
    pointsRef.current = points;

    // Mouse/Touch Interaction Listeners
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      pointerStartRef.current = { x: clientX, y: clientY };
      baseRotationRef.current = { x: targetRotationRef.current.x, y: targetRotationRef.current.y };
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (isDraggingRef.current) {
        const deltaX = clientX - pointerStartRef.current.x;
        const deltaY = clientY - pointerStartRef.current.y;

        // Rotate/tilt based on drag coordinates
        const nextYaw = baseRotationRef.current.y + deltaX * 0.007;
        const nextPitch = Math.max(0.1, Math.min(1.4, baseRotationRef.current.x + deltaY * 0.007));
        
        targetRotationRef.current.y = nextYaw;
        targetRotationRef.current.x = nextPitch;
        
        setYaw(nextYaw);
        setPitch(nextPitch);
      } else if (enableParallaxRef.current) {
        // Soft camera parallax tilt mapping when moving mouse over screen
        const normX = (clientX / window.innerWidth) - 0.5;
        const normY = (clientY / window.innerHeight) - 0.5;
        targetPanRef.current = { 
          x: normX * 10 + panXRef.current, 
          y: -normY * 10 + panYRef.current 
        };
      }
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      // Zoom in/out based on wheel scroll
      const nextZoom = Math.max(8, Math.min(65, targetZoomRef.current + e.deltaY * 0.03));
      targetZoomRef.current = nextZoom;
      setZoom(nextZoom);
    };

    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    
    container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
    window.addEventListener('touchcancel', onPointerUp);
    
    container.addEventListener('wheel', onWheel, { passive: true });

    // Handle container resizing
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', handleResize);

      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      
      container.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      window.removeEventListener('touchcancel', onPointerUp);
      
      container.removeEventListener('wheel', onWheel);

      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  // WebGL Render loop
  useEffect(() => {
    const tick = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !pointsRef.current || !clockRef.current) {
        animationFrameId.current = requestAnimationFrame(tick);
        return;
      }

      const time = clockRef.current.getElapsedTime();
      const points = pointsRef.current;
      const geometry = points.geometry;
      const positions = geometry.attributes.position.array as Float32Array;
      const colors = geometry.attributes.color.array as Float32Array;
      const count = positions.length / 3;

      const arms = 4;
      const spacing = 6;
      const spin = 0.08; // Slow orbits

      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const theta = i * 0.1375;
        const r = Math.sqrt(i) * spacing * 0.12;

        const armOffset = (Math.floor(i / (count / arms)) * (Math.PI * 2)) / arms;
        const angle = theta + r * 0.04 + armOffset + time * spin;

        positions[idx] = Math.cos(angle) * r;
        positions[idx+1] = (Math.sin(i * 0.4 + time) * 0.15) * (18 / (r + 1));
        positions[idx+2] = Math.sin(angle) * r;

        // Swirling hue fields
        const normR = r / 30;
        const baseHue = 0.55 + normR * 0.35 + Math.sin(r - time * 0.25) * 0.05;
        
        const c = new THREE.Color();
        c.setHSL(baseHue % 1.0, 0.95, 0.45 + Math.sin(r - time * 1.0) * 0.1);
        
        colors[idx] = c.r;
        colors[idx+1] = c.g;
        colors[idx+2] = c.b;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;

      // Smooth interpolation for rotation, panning and zoom values
      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.05;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.05;
      
      currentPanRef.current.x += (targetPanRef.current.x - currentPanRef.current.x) * 0.05;
      currentPanRef.current.y += (targetPanRef.current.y - currentPanRef.current.y) * 0.05;
      
      currentZoomRef.current += (targetZoomRef.current - currentZoomRef.current) * 0.05;

      // Apply coordinates
      points.rotation.x = currentRotationRef.current.x;
      points.rotation.y = currentRotationRef.current.y + time * 0.005; // Base automatic spin
      points.rotation.z = rollRef.current; // Majestic diagonal tilt angle slant (roll)

      cameraRef.current.position.x = currentPanRef.current.x;
      cameraRef.current.position.y = currentPanRef.current.y;
      cameraRef.current.position.z = currentZoomRef.current;
      cameraRef.current.lookAt(0, 0, 0); // Focus on core nucleus

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      animationFrameId.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center overflow-hidden font-sans select-none cursor-grab active:cursor-grabbing">
      
      {/* WebGL Particle Background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 w-full h-full pointer-events-none" />

      {/* Radial Gradient overlay to focus viewer eyes on high-contrast text */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_20%,rgba(2,6,23,0.95))] z-10"></div>
      <div className="absolute inset-0 opacity-5 pointer-events-none z-10" style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px' }}></div>



      {/* Onboarding Text Layout card */}
      <div className="relative z-20 max-w-3xl px-6 flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pointer-events-auto">
        
        {/* Sleek Sparkle Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-widest rounded-full shadow-lg shadow-purple-500/5 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Google Search Grounded Intelligence</span>
        </div>

        {/* Elegant Display Typography Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white font-display leading-[1.1] max-w-2xl animate-in fade-in zoom-in duration-700">
          Social Studio <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">X</span>
        </h1>

        {/* Descriptive onboarding paragraph */}
        <p className="text-slate-400 font-light text-sm sm:text-base md:text-lg max-w-xl leading-relaxed">
          Create high-converting social media copy, design eye-catching brand posts, research topics with search-grounding AI, generate custom visual assets, and edit your graphics on the fly in one comprehensive dashboard.
        </p>

        {/* Prominent centered launch trigger */}
        <div className="pt-4">
          <button 
            onClick={onComplete}
            className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-2xl flex items-center gap-3 cursor-pointer shadow-2xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {/* Background gradient & borders */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 border border-purple-400/30 rounded-2xl group-hover:border-purple-300/50 transition-colors"></div>
            
            <span className="relative z-10 text-white font-bold tracking-widest text-xs uppercase">
              Initialize System
            </span>
            <ArrowRight className="relative z-10 w-4.5 h-4.5 text-white transition-transform group-hover:translate-x-1 duration-300" />
          </button>
        </div>

      </div>

      {/* Humble aesthetic signature */}
      <div className="absolute bottom-6 flex flex-col items-center gap-1.5 text-[10px] text-slate-500 font-mono tracking-widest uppercase z-20 pointer-events-auto">
        <div className="text-slate-600/80 text-[9px] lowercase normal-case font-sans">
          (drag to rotate • scroll to zoom • use camera deck to pan or choose presets)
        </div>
        <div className="text-slate-500/80 text-[10px] font-medium tracking-wider">
          Build with ❤️ <span className="text-cyan-400 font-semibold font-mono hover:text-cyan-300 transition-colors">@criptichood</span>
        </div>
      </div>

    </div>
  );
};

export default IntroScreen;

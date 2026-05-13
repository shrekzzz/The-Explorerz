import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Float, Trail, Sparkles as DreiSparkles } from "@react-three/drei";
import * as THREE from "three";

// ── Glowing Globe ──────────────────────────────────────────────────────────────
function Globe() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const landTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    // deep ocean gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#0c1445");
    grad.addColorStop(1, "#0a2a6e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);
    // land masses (simplified blobs)
    ctx.fillStyle = "#1a6b3c";
    const lands = [
      [60, 60, 80, 60], [180, 50, 100, 70], [300, 80, 60, 50],
      [80, 140, 50, 40], [200, 130, 90, 55], [350, 110, 70, 60],
      [130, 170, 40, 30], [260, 160, 55, 45], [400, 150, 45, 35],
    ];
    lands.forEach(([x, y, w, h]) => {
      ctx.beginPath();
      ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    // grid lines
    ctx.strokeStyle = "rgba(100,180,255,0.15)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 512; i += 32) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke(); }
    for (let j = 0; j <= 256; j += 32) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(512, j); ctx.stroke(); }
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.rotation.y = clock.elapsedTime * 0.12;
    if (glowRef.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 1.5) * 0.02;
      glowRef.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      {/* Core globe */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshStandardMaterial map={landTexture} metalness={0.1} roughness={0.7} />
      </mesh>
      {/* Atmosphere glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.62, 32, 32]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      {/* Outer halo */}
      <mesh>
        <sphereGeometry args={[1.75, 32, 32]} />
        <meshStandardMaterial
          color="#818cf8"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ── Orbit Ring ─────────────────────────────────────────────────────────────────
function OrbitRing({ radius, tilt, color, speed }: { radius: number; tilt: number; color: string; speed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = clock.elapsedTime * speed;
  });
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return pts;
  }, [radius]);
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <group rotation={[tilt, 0, 0]}>
      <group ref={ref}>
        <line geometry={geo}>
          <lineBasicMaterial color={color} transparent opacity={0.35} />
        </line>
      </group>
    </group>
  );
}

// ── Orbiting Satellite ─────────────────────────────────────────────────────────
function Satellite({ radius, tilt, speed, color }: { radius: number; tilt: number; speed: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.elapsedTime * speed;
      ref.current.position.set(
        Math.cos(t) * radius,
        Math.sin(tilt) * Math.sin(t) * radius,
        Math.sin(t) * radius * Math.cos(tilt)
      );
    }
  });
  return (
    <Trail width={0.04} length={6} color={color} attenuation={(t) => t * t}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
    </Trail>
  );
}

// ── Destination Pin ────────────────────────────────────────────────────────────
function DestinationPin({ lat, lon, label }: { lat: number; lon: number; label: string }) {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const r = 1.52;
  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const z = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = y + Math.sin(clock.elapsedTime * 2 + lon) * 0.03;
    }
  });

  return (
    <group ref={ref} position={[x, y, z]} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <mesh>
        <sphereGeometry args={[hovered ? 0.07 : 0.05, 8, 8]} />
        <meshStandardMaterial color={hovered ? "#f97316" : "#ef4444"} emissive={hovered ? "#f97316" : "#ef4444"} emissiveIntensity={2} />
      </mesh>
      {/* Pulse ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.07, 0.1, 16]} />
        <meshStandardMaterial color="#ef4444" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── Aurora Particles ───────────────────────────────────────────────────────────
function AuroraParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 300;
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [[0.2, 0.8, 1], [0.5, 0.3, 1], [0.1, 1, 0.6], [1, 0.4, 0.8]];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 2.2 + Math.random() * 0.8;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.05;
  });

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.025} vertexColors transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

// ── Camera auto-rotate ─────────────────────────────────────────────────────────
function CameraRig() {
  const { camera } = useThree();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.08;
    camera.position.x = Math.sin(t) * 5;
    camera.position.z = Math.cos(t) * 5;
    camera.position.y = 1.5 + Math.sin(t * 0.5) * 0.5;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ── Main Export ────────────────────────────────────────────────────────────────
export default function TravelScene3D() {
  return (
    <div className="w-full h-[480px] sm:h-[540px] lg:h-[600px] relative">
      <Canvas camera={{ position: [0, 1.5, 5], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={2} color="#38bdf8" />
        <pointLight position={[-5, -3, -5]} intensity={1} color="#818cf8" />
        <pointLight position={[0, 6, 0]} intensity={0.8} color="#f0abfc" />

        <Stars radius={80} depth={50} count={2000} factor={4} saturation={0.8} fade speed={0.5} />

        <DreiSparkles count={60} scale={6} size={1.5} speed={0.4} color="#38bdf8" />

        <Float speed={0.4} rotationIntensity={0.1} floatIntensity={0.2}>
          <Globe />
          <OrbitRing radius={2.1} tilt={0.4} color="#38bdf8" speed={0.3} />
          <OrbitRing radius={2.4} tilt={-0.6} color="#818cf8" speed={-0.2} />
          <OrbitRing radius={2.7} tilt={1.0} color="#f0abfc" speed={0.15} />
          <Satellite radius={2.1} tilt={0.4} speed={0.8} color="#38bdf8" />
          <Satellite radius={2.4} tilt={-0.6} speed={-0.6} color="#a78bfa" />
          <DestinationPin lat={28.6} lon={77.2} label="Delhi" />
          <DestinationPin lat={19.0} lon={72.8} label="Mumbai" />
          <DestinationPin lat={13.0} lon={80.2} label="Chennai" />
          <DestinationPin lat={27.1} lon={78.0} label="Agra" />
          <DestinationPin lat={26.9} lon={70.9} label="Jaisalmer" />
          <DestinationPin lat={8.5} lon={76.9} label="Kerala" />
        </Float>

        <AuroraParticles />
        <CameraRig />
      </Canvas>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      {/* Side fades */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
}

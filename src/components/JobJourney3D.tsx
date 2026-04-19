import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Environment, RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import { FileText, Search, PenTool, MessageSquare, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  { id: 0, title: "起步", subtitle: "初版简历", desc: "刚毕业，做了一份简单的简历，不知从何投起", icon: FileText, color: "#94a3b8" },
  { id: 1, title: "探索", subtitle: "智能匹配", desc: "AI 帮我找到最适合的岗位，看清差距在哪里", icon: Search, color: "#60a5fa" },
  { id: 2, title: "打磨", subtitle: "简历改写", desc: "针对目标岗位优化简历，匹配度从 40% 提升到 85%", icon: PenTool, color: "#a78bfa" },
  { id: 3, title: "练兵", subtitle: "模拟面试", desc: "语音 AI 面试官陪练，回答越来越自信", icon: MessageSquare, color: "#fb923c" },
  { id: 4, title: "登顶", subtitle: "拿到 Offer", desc: "成功入职心仪公司，开启职业新篇章", icon: Trophy, color: "#10b981" },
];

// ===== 3D 数字人角色 =====
function Avatar({ stage }: { stage: number }) {
  const group = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);

  // 颜色随阶段渐变
  const bodyColor = useMemo(() => new THREE.Color(STAGES[stage].color), [stage]);
  const targetColor = useRef(new THREE.Color(STAGES[stage].color));
  useEffect(() => {
    targetColor.current = new THREE.Color(STAGES[stage].color);
  }, [stage]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      // 轻微呼吸
      group.current.position.y = Math.sin(t * 1.5) * 0.05;
      // 朝向略微浮动
      group.current.rotation.y = Math.sin(t * 0.5) * 0.15;
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.8) * 0.2;
    }
    // 阶段动作
    if (leftArm.current && rightArm.current) {
      if (stage === 4) {
        // 庆祝：举手
        leftArm.current.rotation.z = Math.PI / 2 + Math.sin(t * 4) * 0.2;
        rightArm.current.rotation.z = -Math.PI / 2 - Math.sin(t * 4) * 0.2;
      } else if (stage === 3) {
        // 说话：手臂微动
        leftArm.current.rotation.z = 0.3 + Math.sin(t * 3) * 0.15;
        rightArm.current.rotation.z = -0.3 - Math.sin(t * 3) * 0.15;
      } else if (stage === 2) {
        // 打字：双手向前
        leftArm.current.rotation.z = 0.5;
        rightArm.current.rotation.z = -0.5;
        leftArm.current.rotation.x = Math.sin(t * 6) * 0.1 - 0.4;
        rightArm.current.rotation.x = Math.cos(t * 6) * 0.1 - 0.4;
      } else {
        leftArm.current.rotation.z = 0.2;
        rightArm.current.rotation.z = -0.2;
        leftArm.current.rotation.x = 0;
        rightArm.current.rotation.x = 0;
      }
    }
  });

  return (
    <group ref={group}>
      {/* 头 */}
      <mesh ref={headRef} position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial color="#fde7d3" roughness={0.6} />
      </mesh>
      {/* 头发 */}
      <mesh position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.46, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
        <meshStandardMaterial color="#3a2a1f" roughness={0.8} />
      </mesh>
      {/* 眼睛 */}
      <mesh position={[-0.15, 1.62, 0.4]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.15, 1.62, 0.4]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* 嘴 - 微笑 */}
      <mesh position={[0, 1.45, 0.42]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.08, 0.015, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#c4524f" />
      </mesh>

      {/* 身体 - 渐变颜色随进度 */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <capsuleGeometry args={[0.4, 0.8, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* 左臂 */}
      <mesh ref={leftArm} position={[-0.5, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.6, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} />
      </mesh>
      {/* 右臂 */}
      <mesh ref={rightArm} position={[0.5, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.6, 8, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} />
      </mesh>

      {/* 腿 */}
      <mesh position={[-0.18, -0.2, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.7, 8, 16]} />
        <meshStandardMaterial color="#2d3748" roughness={0.6} />
      </mesh>
      <mesh position={[0.18, -0.2, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.7, 8, 16]} />
        <meshStandardMaterial color="#2d3748" roughness={0.6} />
      </mesh>

      {/* 阶段道具 */}
      <StageProp stage={stage} />
    </group>
  );
}

// ===== 阶段道具 =====
function StageProp({ stage }: { stage: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.y = s.clock.elapsedTime * 0.5;
      ref.current.position.y = 1.0 + Math.sin(s.clock.elapsedTime * 2) * 0.05;
    }
  });

  if (stage === 0) {
    // 一张简单的纸
    return (
      <Float floatIntensity={0.3} speed={2}>
        <mesh position={[0.7, 1.0, 0.3]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.4, 0.55, 0.02]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
      </Float>
    );
  }
  if (stage === 1) {
    // 搜索：浮动卡片
    return (
      <group ref={ref}>
        {[0, 1, 2].map((i) => (
          <RoundedBox
            key={i}
            args={[0.35, 0.22, 0.02]}
            radius={0.03}
            position={[Math.cos((i / 3) * Math.PI * 2) * 0.9, 1.2 + i * 0.15, Math.sin((i / 3) * Math.PI * 2) * 0.9]}
          >
            <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.3} />
          </RoundedBox>
        ))}
      </group>
    );
  }
  if (stage === 2) {
    // 笔 + 优化中的简历
    return (
      <Float floatIntensity={0.4} speed={2.5}>
        <group position={[0.7, 1.1, 0.3]}>
          <mesh rotation={[0, 0, -0.15]}>
            <boxGeometry args={[0.45, 0.6, 0.03]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </mesh>
          {/* 高亮线 */}
          <mesh position={[0, 0.1, 0.025]}>
            <boxGeometry args={[0.35, 0.04, 0.001]} />
            <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, -0.05, 0.025]}>
            <boxGeometry args={[0.3, 0.04, 0.001]} />
            <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.5} />
          </mesh>
        </group>
      </Float>
    );
  }
  if (stage === 3) {
    // 麦克风 / 对话气泡
    return (
      <Float floatIntensity={0.3} speed={2}>
        <group position={[0.8, 1.4, 0.3]}>
          <mesh>
            <capsuleGeometry args={[0.1, 0.2, 8, 16]} />
            <meshStandardMaterial color="#fb923c" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
            <meshStandardMaterial color="#525252" />
          </mesh>
        </group>
      </Float>
    );
  }
  if (stage === 4) {
    // 奖杯
    return (
      <Float floatIntensity={0.5} speed={3}>
        <group position={[0, 2.5, 0]}>
          <mesh>
            <coneGeometry args={[0.25, 0.5, 8]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} emissive="#fbbf24" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, -0.35, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 0.15, 8]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      </Float>
    );
  }
  return null;
}

// ===== 进度环 =====
function ProgressRing({ stage }: { stage: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const progress = (stage + 1) / STAGES.length;

  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.z = -s.clock.elapsedTime * 0.3;
    }
  });

  return (
    <mesh ref={ref} position={[0, -0.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.2, 1.35, 64, 1, 0, Math.PI * 2 * progress]} />
      <meshStandardMaterial color={STAGES[stage].color} emissive={STAGES[stage].color} emissiveIntensity={0.6} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ===== 粒子背景 =====
function Particles() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return arr;
  }, []);

  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.y = s.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#94a3b8" transparent opacity={0.6} />
    </points>
  );
}

// ===== 主组件 =====
const JobJourney3D = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / total));
      setProgress(p);
      const newStage = Math.min(STAGES.length - 1, Math.floor(p * STAGES.length));
      setStage(newStage);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const current = STAGES[stage];
  const Icon = current.icon;

  return (
    <section ref={sectionRef} className="relative" style={{ height: `${STAGES.length * 80}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
        {/* 装饰光晕 */}
        <div
          className="absolute inset-0 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle at 30% 50%, ${current.color}22, transparent 60%)`,
          }}
        />

        <div className="container relative z-10 grid h-full grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* 左侧：文案 */}
          <div className="flex flex-col justify-center">
            {/* 阶段指示器 */}
            <div className="mb-8 flex items-center gap-2">
              {STAGES.map((s, i) => (
                <div
                  key={s.id}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    i === stage ? "w-12" : i < stage ? "w-6 opacity-60" : "w-6 opacity-25"
                  )}
                  style={{ background: i <= stage ? s.color : "hsl(var(--muted-foreground))" }}
                />
              ))}
            </div>

            <div
              className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
              style={{ borderColor: current.color + "44", background: current.color + "11", color: current.color }}
            >
              <Icon className="h-4 w-4" />
              第 {stage + 1} 阶段 · {current.title}
            </div>

            <h2 key={stage} className="animate-fade-in text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              {current.subtitle}
            </h2>

            <p key={`desc-${stage}`} className="mt-6 max-w-md animate-fade-in text-lg leading-relaxed text-muted-foreground">
              {current.desc}
            </p>

            {/* 匹配度仪表 */}
            <div className="mt-10 max-w-sm">
              <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground">
                <span>简历匹配度</span>
                <span style={{ color: current.color }}>{Math.round((stage / 4) * 60 + 40)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${(stage / 4) * 60 + 40}%`,
                    background: `linear-gradient(90deg, ${STAGES[0].color}, ${current.color})`,
                  }}
                />
              </div>
            </div>

            <p className="mt-12 text-xs text-muted-foreground/70">↓ 继续向下滚动，见证完整旅程</p>
          </div>

          {/* 右侧：3D 画布 */}
          <div className="relative h-[60vh] lg:h-full">
            <Canvas shadows camera={{ position: [0, 1.5, 4.5], fov: 45 }} dpr={[1, 2]}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
              <pointLight position={[-3, 2, -3]} intensity={0.5} color={current.color} />
              <pointLight position={[3, 3, 2]} intensity={0.8} color={current.color} />

              <Particles />
              <Avatar stage={stage} />
              <ProgressRing stage={stage} />

              {/* 地面 */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.95, 0]} receiveShadow>
                <circleGeometry args={[2.5, 64]} />
                <meshStandardMaterial color="#1e293b" roughness={0.9} transparent opacity={0.3} />
              </mesh>

              <Environment preset="city" />
              <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 3} />
            </Canvas>

            {/* 角落标签 */}
            <div className="pointer-events-none absolute bottom-4 right-4 rounded-full border bg-card/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              {Math.round(progress * 100)}% · 旅程进度
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JobJourney3D;

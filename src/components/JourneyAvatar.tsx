import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface JourneyAvatarProps {
  step: number; // 0..3 对应 岗位推荐/简历匹配/简历改写/面试辅导
  className?: string;
}

/**
 * 灵动 2D SVG 数字人
 * step 0: 拿着简历思考（岗位推荐）
 * step 1: 拿放大镜对比（简历匹配）
 * step 2: 拿笔改写（简历改写）
 * step 3: 戴耳机说话（面试辅导）
 */
const STAGE_COLORS = ["#94a3b8", "#60a5fa", "#a78bfa", "#fb923c"];

const JourneyAvatar = ({ step, className }: JourneyAvatarProps) => {
  const [blink, setBlink] = useState(false);
  const [bounce, setBounce] = useState(false);
  const accent = STAGE_COLORS[Math.max(0, Math.min(3, step))];

  // 眨眼
  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  // 阶段切换时弹跳一次
  useEffect(() => {
    setBounce(true);
    const t = setTimeout(() => setBounce(false), 600);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div
      className={cn(
        "relative flex h-20 w-20 flex-shrink-0 items-end justify-center transition-transform duration-500",
        bounce && "animate-[bounce_0.6s_ease-out]",
        className
      )}
      style={{ filter: `drop-shadow(0 4px 12px ${accent}55)` }}
    >
      <svg
        viewBox="0 0 120 140"
        className="h-full w-full"
        style={{ overflow: "visible" }}
      >
        {/* 地面阴影 */}
        <ellipse cx="60" cy="132" rx="22" ry="3" fill="#000" opacity="0.12" />

        {/* 浮动小群组 - 上下呼吸 */}
        <g className="animate-[breathe_3s_ease-in-out_infinite]" style={{ transformOrigin: "center" }}>
          {/* ===== 腿 ===== */}
          <rect x="50" y="98" width="8" height="28" rx="4" fill="#334155" />
          <rect x="62" y="98" width="8" height="28" rx="4" fill="#334155" />
          {/* 鞋 */}
          <ellipse cx="54" cy="128" rx="7" ry="3" fill="#1e293b" />
          <ellipse cx="66" cy="128" rx="7" ry="3" fill="#1e293b" />

          {/* ===== 身体 (颜色随阶段) ===== */}
          <path
            d="M 38 70 Q 38 62 46 60 L 74 60 Q 82 62 82 70 L 82 100 Q 82 104 78 104 L 42 104 Q 38 104 38 100 Z"
            fill={accent}
          />
          {/* 衣领 V */}
          <path d="M 56 60 L 60 68 L 64 60 Z" fill="#fde7d3" />
          {/* 衣服高光 */}
          <path
            d="M 42 66 Q 44 64 46 64 L 46 100"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.25"
            fill="none"
          />

          {/* ===== 阶段道具 / 手臂 ===== */}
          <StageArms step={step} accent={accent} />

          {/* ===== 头 ===== */}
          <g className={cn(step === 0 && "animate-[think_4s_ease-in-out_infinite]")} style={{ transformOrigin: "60px 50px" }}>
            {/* 脖子 */}
            <rect x="56" y="55" width="8" height="8" fill="#fde7d3" />
            {/* 脸 */}
            <ellipse cx="60" cy="44" rx="16" ry="17" fill="#fde7d3" />
            {/* 头发 */}
            <path
              d="M 44 40 Q 44 26 60 24 Q 76 26 76 40 Q 76 36 72 34 Q 68 32 60 33 Q 52 32 48 34 Q 44 36 44 40 Z"
              fill="#3a2a1f"
            />
            {/* 耳朵 */}
            <ellipse cx="44" cy="46" rx="2.5" ry="3.5" fill="#f5d4b6" />
            <ellipse cx="76" cy="46" rx="2.5" ry="3.5" fill="#f5d4b6" />

            {/* 眼睛 */}
            {blink ? (
              <>
                <line x1="50" y1="46" x2="56" y2="46" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="64" y1="46" x2="70" y2="46" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="53" cy="46" rx="2" ry="2.5" fill="#1a1a1a" />
                <ellipse cx="67" cy="46" rx="2" ry="2.5" fill="#1a1a1a" />
                {/* 眼神高光 */}
                <circle cx="53.7" cy="45.3" r="0.6" fill="#fff" />
                <circle cx="67.7" cy="45.3" r="0.6" fill="#fff" />
              </>
            )}

            {/* 腮红 */}
            <ellipse cx="48" cy="51" rx="2.5" ry="1.5" fill="#fbb6a3" opacity="0.6" />
            <ellipse cx="72" cy="51" rx="2.5" ry="1.5" fill="#fbb6a3" opacity="0.6" />

            {/* 嘴 - 根据阶段 */}
            {step === 3 ? (
              // 说话：椭圆
              <ellipse cx="60" cy="53" rx="2" ry="1.5" fill="#7a1f1f" className="animate-[talk_0.6s_ease-in-out_infinite]" />
            ) : step === 2 ? (
              // 专注：抿嘴
              <line x1="56" y1="53" x2="64" y2="53" stroke="#7a1f1f" strokeWidth="1.4" strokeLinecap="round" />
            ) : (
              // 微笑
              <path d="M 56 52 Q 60 56 64 52" stroke="#7a1f1f" strokeWidth="1.4" strokeLinecap="round" fill="none" />
            )}

            {/* 阶段3：耳机 */}
            {step === 3 && (
              <>
                <path d="M 42 40 Q 42 28 60 28 Q 78 28 78 40" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <rect x="40" y="40" width="6" height="9" rx="2" fill="#1e293b" />
                <rect x="74" y="40" width="6" height="9" rx="2" fill="#1e293b" />
                <circle cx="43" cy="44.5" r="1.2" fill={accent} />
                <circle cx="77" cy="44.5" r="1.2" fill={accent} />
              </>
            )}
          </g>

          {/* 阶段0 思考气泡 */}
          {step === 0 && (
            <g className="animate-[float_2s_ease-in-out_infinite]">
              <circle cx="86" cy="22" r="3" fill="#fff" stroke="#cbd5e1" strokeWidth="1" opacity="0.95" />
              <circle cx="92" cy="14" r="5" fill="#fff" stroke="#cbd5e1" strokeWidth="1" opacity="0.95" />
              <text x="92" y="17" fontSize="7" textAnchor="middle" fill="#64748b" fontWeight="bold">?</text>
            </g>
          )}

          {/* 阶段1 上方搜索星光 */}
          {step === 1 && (
            <g className="animate-[twinkle_1.8s_ease-in-out_infinite]">
              <path d="M 92 18 L 94 22 L 98 24 L 94 26 L 92 30 L 90 26 L 86 24 L 90 22 Z" fill={accent} />
            </g>
          )}

          {/* 阶段3 声波 */}
          {step === 3 && (
            <g>
              <path
                d="M 90 50 Q 96 50 96 56"
                stroke={accent}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                className="animate-[wave_1.5s_ease-out_infinite]"
              />
              <path
                d="M 94 46 Q 104 50 104 60"
                stroke={accent}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                opacity="0.6"
                className="animate-[wave_1.5s_ease-out_infinite_0.3s]"
              />
            </g>
          )}
        </g>
      </svg>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes think {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes talk {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1.3); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); opacity: 0.95; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes twinkle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        @keyframes wave {
          0% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(6px); }
        }
        @keyframes typing {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-2px) rotate(-3deg); }
        }
        @keyframes scan {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          50% { transform: translateX(3px) rotate(8deg); }
        }
      `}</style>
    </div>
  );
};

// ===== 阶段对应的手臂和道具 =====
const StageArms = ({ step, accent }: { step: number; accent: string }) => {
  if (step === 0) {
    // 拿简历
    return (
      <g>
        {/* 左臂下垂 */}
        <rect x="34" y="68" width="6" height="22" rx="3" fill={accent} />
        {/* 右臂抬起拿纸 */}
        <rect x="80" y="68" width="6" height="20" rx="3" fill={accent} transform="rotate(-15 83 78)" />
        {/* 简历 */}
        <g transform="translate(86 64)">
          <rect x="0" y="0" width="22" height="28" rx="2" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="3" y1="6" x2="19" y2="6" stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1="3" y1="11" x2="16" y2="11" stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1="3" y1="16" x2="19" y2="16" stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1="3" y1="21" x2="14" y2="21" stroke="#cbd5e1" strokeWidth="1.2" />
        </g>
      </g>
    );
  }
  if (step === 1) {
    // 拿放大镜
    return (
      <g>
        <rect x="34" y="68" width="6" height="22" rx="3" fill={accent} />
        <g style={{ transformOrigin: "85px 75px" }} className="animate-[scan_2s_ease-in-out_infinite]">
          <rect x="80" y="68" width="6" height="18" rx="3" fill={accent} transform="rotate(-25 83 77)" />
          {/* 放大镜 */}
          <circle cx="96" cy="60" r="9" fill="none" stroke="#1e293b" strokeWidth="2.5" />
          <circle cx="96" cy="60" r="7" fill={accent} opacity="0.2" />
          <line x1="103" y1="67" x2="110" y2="74" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="93" cy="57" r="2" fill="#fff" opacity="0.7" />
        </g>
      </g>
    );
  }
  if (step === 2) {
    // 打字 + 笔
    return (
      <g>
        {/* 双手向前 */}
        <rect x="36" y="70" width="6" height="18" rx="3" fill={accent} transform="rotate(20 39 79)" className="animate-[typing_0.8s_ease-in-out_infinite]" style={{ transformOrigin: "39px 70px" }} />
        <rect x="78" y="70" width="6" height="18" rx="3" fill={accent} transform="rotate(-20 81 79)" className="animate-[typing_0.8s_ease-in-out_infinite_0.4s]" style={{ transformOrigin: "81px 70px" }} />
        {/* 文档+笔 */}
        <g transform="translate(45 86)">
          <rect x="0" y="0" width="30" height="18" rx="2" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
          <rect x="3" y="3" width="20" height="2" fill={accent} opacity="0.7" />
          <rect x="3" y="7" width="16" height="2" fill={accent} opacity="0.5" />
          <rect x="3" y="11" width="22" height="2" fill={accent} opacity="0.7" />
          {/* 笔 */}
          <g transform="translate(24 -2) rotate(35)">
            <rect x="0" y="0" width="2" height="14" fill="#1e293b" />
            <polygon points="0,14 2,14 1,17" fill={accent} />
          </g>
        </g>
      </g>
    );
  }
  // step 3 - 面试，举手势
  return (
    <g>
      {/* 左臂自然 */}
      <rect x="34" y="68" width="6" height="22" rx="3" fill={accent} />
      {/* 右臂抬起做手势 */}
      <g style={{ transformOrigin: "82px 70px" }} className="animate-[think_2.5s_ease-in-out_infinite]">
        <rect x="80" y="50" width="6" height="22" rx="3" fill={accent} transform="rotate(20 83 60)" />
        {/* 手 */}
        <circle cx="92" cy="48" r="4" fill="#fde7d3" />
      </g>
    </g>
  );
};

export default JourneyAvatar;

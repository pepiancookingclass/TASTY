'use client';

import { useId } from 'react';

interface AnimatedSwanProps {
  size?: number;
  className?: string;
}

export function AnimatedSwan({ size = 32, className = '' }: AnimatedSwanProps) {
  const uid = useId();
  const bgId = `swanBg-${uid}`;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size, overflow: 'visible' }}>
      <svg
        viewBox="-10 -5 120 110"
        width={size}
        height={size}
        overflow="visible"
      >
        <defs>
          <radialGradient id={bgId} cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#FFE0B2" />
            <stop offset="60%" stopColor="#F9A87A" />
            <stop offset="100%" stopColor="#F472B6" />
          </radialGradient>
        </defs>

        <circle cx="50" cy="50" r="48" fill={`url(#${bgId})`} stroke="#F472B6" strokeWidth="2" />

        {/* Agua azul - ESTÁTICA */}
        <path d="M10,84 Q20,80 30,84 Q40,88 50,84 Q60,80 70,84 Q80,88 90,84"
          stroke="#7DD3FC" fill="none" strokeWidth="1.5" opacity="0.7" />
        <path d="M5,89 Q15,86 25,89 Q35,92 45,89 Q55,86 65,89 Q75,92 85,89 Q95,86 100,89"
          stroke="#7DD3FC" fill="none" strokeWidth="1.2" opacity="0.5" />
        <path d="M12,94 Q22,91 32,94 Q42,97 52,94 Q62,91 72,94 Q82,97 92,94"
          stroke="#93C5FD" fill="none" strokeWidth="1" opacity="0.35" />

        {/* Cisne completo - flota independiente del agua */}
        <g className="animate-swan-hover">

          {/* Alas */}
          <g className="animate-swan-wing-left" style={{ transformOrigin: '36px 50px' }}>
            <path
              d="M36,44 C26,34 14,26 5,22 C2,30 8,42 18,50 C26,56 33,58 38,57 Z"
              fill="#FFFFFF"
              stroke="#F9A8D4"
              strokeWidth="1"
            />
            <path d="M22,36 C16,32 10,28 6,24" stroke="#E5E7EB" fill="none" strokeWidth="0.8" />
            <path d="M24,43 C17,40 10,37 5,33" stroke="#E5E7EB" fill="none" strokeWidth="0.8" />
          </g>

          <g className="animate-swan-wing-right" style={{ transformOrigin: '64px 50px' }}>
            <path
              d="M64,44 C74,34 86,26 95,22 C98,30 92,42 82,50 C74,56 67,58 62,57 Z"
              fill="#FFFFFF"
              stroke="#F9A8D4"
              strokeWidth="1"
            />
            <path d="M78,36 C84,32 90,28 94,24" stroke="#E5E7EB" fill="none" strokeWidth="0.8" />
            <path d="M76,43 C83,40 90,37 95,33" stroke="#E5E7EB" fill="none" strokeWidth="0.8" />
          </g>

          {/* Patitas naranjas */}
          <g className="animate-swan-feet">
            <line x1="42" y1="76" x2="42" y2="82" stroke="#FF4400" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M38,82 L40,86 L42,83 L44,86 L46,82" stroke="#FF4400" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="58" y1="76" x2="58" y2="82" stroke="#FF4400" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M54,82 L56,86 L58,83 L60,86 L62,82" stroke="#FF4400" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Cuerpo */}
          <ellipse cx="50" cy="60" rx="20" ry="22" fill="#FFFFFF" stroke="#F9A8D4" strokeWidth="1.2" />
          <path d="M42,52 Q50,56 58,52" stroke="#F3F4F6" fill="none" strokeWidth="0.6" opacity="0.6" />
          <path d="M40,58 Q50,62 60,58" stroke="#F3F4F6" fill="none" strokeWidth="0.6" opacity="0.5" />
          <path d="M41,64 Q50,68 59,64" stroke="#F3F4F6" fill="none" strokeWidth="0.6" opacity="0.4" />

          {/* Cuello */}
          <ellipse cx="50" cy="38" rx="5" ry="14" fill="#FFFFFF" stroke="#F9A8D4" strokeWidth="1" />

          {/* Cabeza */}
          <circle cx="50" cy="22" r="11" fill="#FFFFFF" stroke="#F9A8D4" strokeWidth="1.2" />
          <circle cx="47" cy="18" r="4" fill="white" opacity="0.4" />

          {/* Corona dorada */}
          <polygon points="44,12 46,7 48,12" fill="#FBBF24" opacity="0.7" />
          <polygon points="48,11 50,5 52,11" fill="#F59E0B" opacity="0.8" />
          <polygon points="52,12 54,7 56,12" fill="#FBBF24" opacity="0.7" />

          {/* Ojos */}
          <circle cx="44" cy="20" r="2.5" fill="#1E1B4B" />
          <circle cx="56" cy="20" r="2.5" fill="#1E1B4B" />
          <circle cx="43" cy="19" r="1" fill="white" opacity="0.9" />
          <circle cx="55" cy="19" r="1" fill="white" opacity="0.9" />

          {/* Pico naranja TASTY */}
          <polygon points="47,26 50,32 53,26" fill="#FF4400" stroke="#CC3700" strokeWidth="0.5" />
          <polygon points="48,27 50,30 51,27" fill="#FF6633" opacity="0.5" />

          {/* Rubor mejillas */}
          <ellipse cx="44" cy="26" rx="2.5" ry="1.5" fill="#FB7185" opacity="0.3" />
          <ellipse cx="56" cy="26" rx="2.5" ry="1.5" fill="#FB7185" opacity="0.3" />

        </g>
      </svg>

      <style jsx global>{`
        @keyframes swan-hover {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes swan-wing-left {
          0%, 100% { transform: rotate(0deg) translateY(0px); }
          50% { transform: rotate(-12deg) translateY(-3px); }
        }
        @keyframes swan-wing-right {
          0%, 100% { transform: rotate(0deg) translateY(0px); }
          50% { transform: rotate(12deg) translateY(-3px); }
        }
        @keyframes swan-feet {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(3deg); }
        }
        .animate-swan-hover {
          animation: swan-hover 2s ease-in-out infinite;
        }
        .animate-swan-wing-left {
          animation: swan-wing-left 0.8s ease-in-out infinite;
        }
        .animate-swan-wing-right {
          animation: swan-wing-right 0.8s ease-in-out infinite;
        }
        .animate-swan-feet {
          animation: swan-feet 1s ease-in-out infinite;
          transform-origin: 50px 76px;
        }
      `}</style>
    </div>
  );
}

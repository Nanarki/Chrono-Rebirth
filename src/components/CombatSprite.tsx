import React from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, AlertCircle } from 'lucide-react';

interface HeroSpriteProps {
  jobId: string;
  name: string;
  isCurrentTurn: boolean;
  isDead: boolean;
  isAttacking?: boolean;
  isHit?: boolean;
}

export const HeroCombatSprite: React.FC<HeroSpriteProps> = ({
  jobId,
  isCurrentTurn,
  isDead,
  isAttacking,
  isHit,
}) => {
  if (isDead) {
    return (
      <div className="relative flex h-28 w-24 items-center justify-center opacity-40 grayscale">
        <svg viewBox="0 0 100 120" className="h-full w-full">
          {/* Defeated marker / gravestone symbol */}
          <rect x="25" y="45" width="50" height="60" rx="15" fill="#334155" stroke="#475569" strokeWidth="2" />
          <path d="M50 60 V90 M35 75 H65" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // Choose colors & weapon styling by jobId
  let primaryColor = '#3b82f6'; // Sky/Blue
  let secondaryColor = '#6366f1'; // Indigo
  let glowColor = 'rgba(59, 130, 246, 0.4)';

  if (jobId.includes('weaver') || jobId.includes('mage')) {
    primaryColor = '#8b5cf6'; // Violet
    secondaryColor = '#ec4899'; // Pink
    glowColor = 'rgba(139, 92, 246, 0.5)';
  } else if (jobId.includes('stalker') || jobId.includes('rogue')) {
    primaryColor = '#10b981'; // Emerald
    secondaryColor = '#06b6d4'; // Cyan
    glowColor = 'rgba(16, 185, 129, 0.4)';
  } else if (jobId.includes('templar')) {
    primaryColor = '#f59e0b'; // Amber
    secondaryColor = '#eab308'; // Yellow
    glowColor = 'rgba(245, 158, 11, 0.5)';
  } else if (jobId.includes('void')) {
    primaryColor = '#a855f7'; // Purple
    secondaryColor = '#3b82f6'; // Blue
    glowColor = 'rgba(168, 85, 247, 0.5)';
  }

  return (
    <motion.div
      animate={{
        y: isCurrentTurn ? [0, -6, 0] : [0, -2, 0],
        x: isAttacking ? 35 : 0,
        filter: isHit ? 'brightness(1.8) drop-shadow(0 0 10px #f43f5e)' : 'brightness(1)',
      }}
      transition={{
        y: { duration: isCurrentTurn ? 1.4 : 2.5, repeat: Infinity, ease: 'easeInOut' },
        x: { duration: 0.25, ease: 'easeOut' },
        filter: { duration: 0.15 },
      }}
      className="relative flex h-32 w-28 items-center justify-center"
    >
      {/* Turn indicator glow puddle */}
      {isCurrentTurn && (
        <div
          className="absolute -bottom-2 h-5 w-24 rounded-full blur-sm"
          style={{ background: `radial-gradient(ellipse, ${glowColor} 0%, transparent 75%)` }}
        />
      )}

      <svg viewBox="0 0 120 140" className="h-full w-full drop-shadow-md">
        <defs>
          <linearGradient id={`hero_grad_${jobId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>
          <filter id="aura">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Cloak / Cape */}
        <path
          d="M40 50 Q25 90 20 115 Q50 110 65 112 Q65 75 60 50 Z"
          fill={secondaryColor}
          opacity="0.8"
        />

        {/* Hero Legs / Boots */}
        <rect x="42" y="92" width="12" height="26" rx="4" fill="#1e293b" />
        <rect x="58" y="92" width="12" height="26" rx="4" fill="#1e293b" />
        <rect x="40" y="112" width="16" height="8" rx="2" fill="#0f172a" />
        <rect x="56" y="112" width="16" height="8" rx="2" fill="#0f172a" />

        {/* Armor / Body */}
        <path
          d="M38 52 Q35 90 40 94 L72 94 Q77 90 74 52 Z"
          fill={`url(#hero_grad_${jobId})`}
          stroke="#0f172a"
          strokeWidth="1.5"
        />

        {/* Breastplate Plate Inlay */}
        <polygon points="56,56 64,68 56,84 48,68" fill="#ffffff" opacity="0.25" />

        {/* Head / Helmet */}
        <circle cx="56" cy="36" r="16" fill="#cbd5e1" stroke="#334155" strokeWidth="1.5" />
        {/* Helmet Visor / Eyes */}
        <path d="M46 34 Q56 31 66 34 Q56 40 46 34 Z" fill="#0f172a" />
        <circle cx="52" cy="35" r="2" fill={primaryColor} />
        <circle cx="60" cy="35" r="2" fill={primaryColor} />

        {/* Class Helm Crest / Crown */}
        {jobId.includes('weaver') ? (
          <path d="M48 22 L56 12 L64 22 Z" fill="#f59e0b" />
        ) : jobId.includes('stalker') ? (
          <path d="M44 26 Q56 18 68 26 Z" fill="#0f172a" />
        ) : (
          <path d="M52 24 L56 14 L60 24 Z" fill="#f59e0b" />
        )}

        {/* Arms & Class Weapons */}
        {jobId.includes('weaver') ? (
          /* Staff with glowing hourglass orb */
          <g>
            <rect x="80" y="24" width="4" height="90" rx="2" fill="#78350f" />
            <circle cx="82" cy="20" r="11" fill={primaryColor} opacity="0.4" filter="url(#aura)" />
            <circle cx="82" cy="20" r="6" fill="#fef08a" />
            {/* Hand */}
            <circle cx="75" cy="65" r="5" fill="#cbd5e1" />
          </g>
        ) : jobId.includes('stalker') ? (
          /* Twin daggers */
          <g>
            <path d="M74 65 L94 52 L91 62 Z" fill="#94a3b8" stroke="#334155" />
            <rect x="70" y="62" width="6" height="4" fill="#78350f" />
            <path d="M36 68 L20 78 L26 84 Z" fill="#94a3b8" stroke="#334155" />
          </g>
        ) : (
          /* Broadsword / Blade */
          <g>
            <path d="M75 58 L104 22 L100 20 L72 54 Z" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
            <rect x="68" y="55" width="10" height="3" rx="1" fill="#f59e0b" transform="rotate(40 73 56)" />
            <circle cx="68" cy="60" r="5" fill="#64748b" />
          </g>
        )}
      </svg>
    </motion.div>
  );
};

interface EnemySpriteProps {
  name: string;
  isBoss?: boolean;
  isElite?: boolean;
  isBroken?: boolean;
  isHit?: boolean;
  isCurrentTurn: boolean;
  isDead: boolean;
  elementWeaknesses: string[];
}

export const EnemyCombatSprite: React.FC<EnemySpriteProps> = ({
  name,
  isBoss,
  isElite,
  isBroken,
  isHit,
  isCurrentTurn,
  isDead,
}) => {
  if (isDead) {
    return (
      <div className="relative flex h-28 w-24 items-center justify-center opacity-30 grayscale scale-90 transition-opacity">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle cx="50" cy="50" r="30" fill="#1e293b" />
          <path d="M35 35 L65 65 M65 35 L35 65" stroke="#ef4444" strokeWidth="4" />
        </svg>
      </div>
    );
  }

  // Determine silhouette & color theme based on enemy name keywords
  let bodyColor = '#dc2626'; // Red fiend default
  let accentColor = '#f97316';
  let isConstruct = name.toLowerCase().includes('construct') || name.toLowerCase().includes('sentinel');
  let isDragon = name.toLowerCase().includes('drake') || name.toLowerCase().includes('dragon');
  let isShaman = name.toLowerCase().includes('shaman') || name.toLowerCase().includes('spore');
  let isVoid = name.toLowerCase().includes('void') || name.toLowerCase().includes('chrono') || name.toLowerCase().includes('abyssal');

  if (isVoid) {
    bodyColor = '#7c3aed';
    accentColor = '#38bdf8';
  } else if (isConstruct) {
    bodyColor = '#64748b';
    accentColor = '#f59e0b';
  } else if (isDragon) {
    bodyColor = '#b91c1c';
    accentColor = '#fbbf24';
  } else if (isShaman) {
    bodyColor = '#059669';
    accentColor = '#a7f3d0';
  }

  const spriteSize = isBoss ? 'h-48 w-44' : isElite ? 'h-36 w-32' : 'h-32 w-28';

  return (
    <motion.div
      animate={{
        y: isBroken ? [2, -2, 2] : [0, -5, 0],
        rotate: isBroken ? [-3, 3, -3] : 0,
        filter: isHit ? 'brightness(2.2) drop-shadow(0 0 12px #f43f5e)' : 'brightness(1)',
        scale: isCurrentTurn ? 1.08 : 1.0,
      }}
      transition={{
        y: { duration: isBroken ? 0.4 : isBoss ? 3.0 : 2.0, repeat: Infinity, ease: 'easeInOut' },
        rotate: { duration: 0.3, repeat: isBroken ? Infinity : 0 },
        filter: { duration: 0.15 },
        scale: { duration: 0.25 },
      }}
      className={`relative flex ${spriteSize} items-center justify-center select-none`}
    >
      {/* Broken state stun effect */}
      {isBroken && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="flex items-center gap-1"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <AlertCircle className="h-4 w-4 text-rose-400" />
            <Sparkles className="h-4 w-4 text-amber-300" />
          </motion.div>
        </div>
      )}

      {/* Boss / Elite aura back-glow */}
      {(isBoss || isElite) && (
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-40 animate-pulse pointer-events-none"
          style={{ background: isBoss ? 'radial-gradient(circle, #f59e0b 0%, #7c3aed 70%, transparent 100%)' : bodyColor }}
        />
      )}

      <svg viewBox="0 0 140 160" className="h-full w-full drop-shadow-xl overflow-visible">
        <defs>
          <linearGradient id={`enemy_grad_${name}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={bodyColor} />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <radialGradient id="eye_glow">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#dc2626" />
          </radialGradient>
        </defs>

        {/* Boss Wings / Back Appendages */}
        {isBoss && (
          <g opacity="0.85">
            <path d="M70 70 Q15 20 5 60 Q25 90 70 85 Z" fill="#475569" stroke="#f59e0b" strokeWidth="2" />
            <path d="M70 70 Q125 20 135 60 Q115 90 70 85 Z" fill="#475569" stroke="#f59e0b" strokeWidth="2" />
          </g>
        )}

        {/* Enemy Monster Body */}
        {isConstruct ? (
          /* Golem / Construct Silhouette */
          <g>
            <rect x="42" y="55" width="56" height="60" rx="10" fill={`url(#enemy_grad_${name})`} stroke="#1e293b" strokeWidth="2" />
            <circle cx="70" cy="78" r="12" fill={accentColor} />
            <circle cx="70" cy="78" r="6" fill="#ffffff" />
            {/* Heavy Arms */}
            <rect x="22" y="60" width="18" height="50" rx="8" fill="#334155" />
            <rect x="100" y="60" width="18" height="50" rx="8" fill="#334155" />
            {/* Construct Head */}
            <polygon points="50,55 70,30 90,55" fill="#475569" stroke="#1e293b" strokeWidth="2" />
          </g>
        ) : isDragon ? (
          /* Drake / Wyrm Silhouette */
          <g>
            <path d="M45 125 Q70 135 95 125 L90 75 Q70 65 50 75 Z" fill={`url(#enemy_grad_${name})`} />
            <path d="M70 75 Q85 40 100 35 Q90 55 80 75 Z" fill={bodyColor} />
            {/* Dragon Head */}
            <polygon points="90,32 120,40 100,52 85,46" fill={bodyColor} stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="102" cy="40" r="2.5" fill="#fef08a" />
            {/* Horns */}
            <path d="M88 34 Q92 15 80 10" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M94 36 Q100 20 92 14" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>
        ) : (
          /* Fiend / Demon / Beast Silhouette */
          <g>
            {/* Tail */}
            <path d="M45 105 Q15 110 20 135" stroke={bodyColor} strokeWidth="5" fill="none" strokeLinecap="round" />
            {/* Legs */}
            <rect x="44" y="105" width="16" height="32" rx="4" fill="#0f172a" />
            <rect x="80" y="105" width="16" height="32" rx="4" fill="#0f172a" />
            {/* Torso */}
            <path d="M40 55 Q35 110 70 110 Q105 110 100 55 Q70 45 40 55 Z" fill={`url(#enemy_grad_${name})`} stroke="#1e293b" strokeWidth="2" />
            {/* Claws */}
            <path d="M35 70 L15 88 L25 94 L42 78 Z" fill={bodyColor} stroke="#0f172a" strokeWidth="1.5" />
            <path d="M105 70 L125 88 L115 94 L98 78 Z" fill={bodyColor} stroke="#0f172a" strokeWidth="1.5" />
            {/* Head */}
            <circle cx="70" cy="42" r="20" fill={bodyColor} stroke="#1e293b" strokeWidth="2" />
            {/* Glowing Demonic Eyes */}
            <circle cx="62" cy="40" r="3.5" fill="url(#eye_glow)" />
            <circle cx="78" cy="40" r="3.5" fill="url(#eye_glow)" />
            {/* Curved Horns */}
            <path d="M56 30 Q45 10 32 18" stroke="#f59e0b" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M84 30 Q95 10 108 18" stroke="#f59e0b" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
        )}

        {/* Elite / Boss Spikes & Runes */}
        {(isElite || isBoss) && (
          <g>
            <circle cx="70" cy="80" r="18" fill="none" stroke={accentColor} strokeWidth="1.5" strokeDasharray="4 2" opacity="0.7" />
          </g>
        )}
      </svg>
    </motion.div>
  );
};

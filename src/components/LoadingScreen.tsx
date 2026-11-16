import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BrandLogo } from './BrandLogo';

interface LoadingScreenProps {
  isDataReady: boolean;
  onComplete: () => void;
}

export function LoadingScreen({ isDataReady, onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const minDuration = 1650;
    let rafId = 0;
    let completed = false;

    const tick = (now: number) => {
      const elapsed = now - start;
      const timeRatio = Math.min(1, elapsed / minDuration);
      const eased = 1 - Math.pow(1 - timeRatio, 3);
      const targetProgress = isDataReady
        ? Math.round(eased * 100)
        : Math.min(88, Math.round(eased * 88));

      setProgress(targetProgress);

      if (timeRatio >= 1 && isDataReady && !completed) {
        completed = true;
        setProgress(100);
        window.setTimeout(onComplete, 260);
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isDataReady, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050A14] px-6"
    >
      <div className="w-full max-w-md flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-8"
        >
          <div className="absolute -inset-3 rounded-3xl bg-[#EAB308]/12 blur-2xl pointer-events-none" />
          <BrandLogo
            size="xl"
            className="relative shadow-2xl shadow-black/60 ring-1 ring-[#EAB308]/30"
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12 }}
          className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white"
        >
          SAGOR MARKETING TEAM
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.22 }}
          className="mt-2.5 text-sm font-medium tracking-wider text-[#FACC15]"
        >
          Grow Together • Achieve More
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-10 w-full max-w-xs"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Preparing team workspace</span>
            <span className="font-mono tabular-nums text-[#FACC15]">
              {progress}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#111E36] border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#CA8A04] via-[#EAB308] to-[#FACC15] transition-transform duration-150 ease-out origin-left"
              style={{ transform: `scaleX(${progress / 100})` }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

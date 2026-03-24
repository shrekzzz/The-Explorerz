import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<"mantra" | "welcome" | "exit">("mantra");

  useEffect(() => {
    // Phase 1: show mantra for 2s
    const t1 = setTimeout(() => setPhase("welcome"), 2200);
    // Phase 2: show welcome for 1.8s then exit
    const t2 = setTimeout(() => setPhase("exit"), 4200);
    // Phase 3: unmount after exit animation
    const t3 = setTimeout(() => onDone(), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== "exit" ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
        >
          {/* Subtle radial glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/10 via-accent/5 to-white opacity-80 blur-3xl" />
          </div>

          <div className="relative flex flex-col items-center gap-6 px-6 text-center">
            {/* Om symbol */}
            <AnimatePresence mode="wait">
              {phase === "mantra" && (
                <motion.div
                  key="om"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="flex flex-col items-center gap-4"
                >
                  {/* ॐ symbol */}
                  <motion.span
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="text-7xl sm:text-8xl font-bold bg-gradient-to-br from-primary via-accent to-violet-500 bg-clip-text text-transparent drop-shadow-sm select-none"
                    style={{ fontFamily: "serif" }}
                  >
                    ॐ
                  </motion.span>

                  {/* नमः शिवाय */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-violet-500 bg-clip-text text-transparent select-none"
                    style={{ fontFamily: "'Noto Sans Devanagari', 'Mangal', serif", lineHeight: 1.4 }}
                  >
                    नमः शिवाय
                  </motion.p>

                  {/* Transliteration */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="text-sm tracking-[0.3em] uppercase font-medium select-none bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                  >
                    Om Namah Shivaya
                  </motion.p>

                  {/* Decorative dots */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex gap-2 mt-2"
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary to-accent"
                      />
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {phase === "welcome" && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="flex flex-col items-center gap-3"
                >
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-sm tracking-[0.4em] uppercase text-gray-400 font-medium select-none"
                  >
                    Welcome to
                  </motion.p>

                  <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-primary via-accent to-violet-500 bg-clip-text text-transparent select-none"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    The Explorerz
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm text-gray-400 tracking-wider select-none"
                  >
                    Your journey begins here ✈️
                  </motion.p>

                  {/* Loading bar */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="w-48 h-0.5 bg-gray-100 rounded-full overflow-hidden mt-4"
                  >
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.4, ease: "easeInOut", delay: 0.6 }}
                      className="h-full bg-gradient-to-r from-primary via-accent to-violet-500 rounded-full"
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

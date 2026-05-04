import React, { useState, useEffect, useRef } from 'react';

export const ElHomunStare: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'staring' | 'failed' | 'success'>('idle');
  const [timeLeft, setTimeLeft] = useState(30);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleMovement = () => {
      if (status === 'staring') {
        setStatus('failed');
      }
    };

    // Accelerometer detection
    let initialAcc: number | null = null;
    let baselineSet = false;
    
    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      if (status !== 'staring') return;
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;
      
      const currentAcc = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
      
      if (!baselineSet) {
        initialAcc = currentAcc;
        baselineSet = true;
        return;
      }
      
      // If the phone accelerates/tilts beyond 1.5 units from initial baseline, they moved.
      if (Math.abs(currentAcc - initialAcc!) > 1.5) {
        handleMovement();
      }
    };

    if (status === 'staring') {
      window.addEventListener('mousemove', handleMovement);
      window.addEventListener('scroll', handleMovement);
      window.addEventListener('keydown', handleMovement);
      window.addEventListener('touchstart', handleMovement);
      window.addEventListener('click', handleMovement);
      window.addEventListener('devicemotion', handleDeviceMotion);

      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setStatus('success');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      window.removeEventListener('mousemove', handleMovement);
      window.removeEventListener('scroll', handleMovement);
      window.removeEventListener('keydown', handleMovement);
      window.removeEventListener('touchstart', handleMovement);
      window.removeEventListener('click', handleMovement);
      window.removeEventListener('devicemotion', handleDeviceMotion);
      
      if (timer) clearInterval(timer);
    };
  }, [status]);

  const startStaring = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Request permission for device motion on iOS 13+ devices
    if (typeof (DeviceMotionEvent as any) !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        await (DeviceMotionEvent as any).requestPermission();
      } catch (err) {
        console.warn("Device motion request blocked or denied", err);
      }
    }
    
    setStatus('staring');
    setTimeLeft(30);
  };

  const reset = () => {
    setStatus('idle');
    setTimeLeft(30);
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center p-8 mt-8 border border-[#95A5A6]/20 rounded-xl bg-black/40 relative overflow-hidden group">
      {/* Background ambient glow based on status */}
      <div 
        className={`absolute inset-0 opacity-20 transition-colors duration-1000 pointer-events-none ${
          status === 'staring' ? 'bg-[#85C1E9]' : 
          status === 'failed' ? 'bg-[#E74C3C]' : 
          status === 'success' ? 'bg-[#F1C40F]' : 'bg-transparent'
        }`}
      />

      <h3 className="text-2xl font-bold mb-4 text-[#85C1E9] display-font text-center">
        The Stare of El Homun
      </h3>
      <p className="text-[#F8F9FA]/80 mb-8 text-center max-w-md">
        El Homun does not speak. He does not move. Can you synchronize your soul with his? Stare deeply and do absolutely nothing for 30 seconds. No mouse movement, scrolling, typing, or clicking.
      </p>

      <div className="relative mb-6 cursor-pointer">
        <img 
          src="/homun.webp" 
          alt="El Homun" 
          className={`w-48 h-48 rounded-full border-4 shadow-2xl transition-all duration-700 object-cover ${
            status === 'staring' ? 'border-[#85C1E9] scale-110 shadow-[0_0_40px_rgba(133,193,233,0.4)]' : 
            status === 'failed' ? 'border-[#E74C3C] scale-95 opacity-50 grayscale' : 
            status === 'success' ? 'border-[#F1C40F] scale-110 shadow-[0_0_40px_rgba(241,196,15,0.6)]' : 'border-[#95A5A6] grayscale group-hover:grayscale-0'
          }`}
        />
        
        {/* Timer overlay */}
        {status === 'staring' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-5xl font-bold text-white/90 drop-shadow-[0_0_10px_rgba(133,193,233,0.8)] display-font">
              {timeLeft}
            </span>
          </div>
        )}
      </div>

      <div className="min-h-[60px] flex items-center justify-center relative z-10">
        {status === 'idle' && (
          <button 
            onClick={startStaring}
            className="px-6 py-3 bg-[#85C1E9]/20 hover:bg-[#85C1E9]/30 text-[#85C1E9] border border-[#85C1E9]/50 font-bold rounded-lg uppercase tracking-wider transition-all hover:scale-[1.05]"
          >
            Initiate Stare
          </button>
        )}

        {status === 'staring' && (
          <p className="text-[#85C1E9] font-bold animate-pulse tracking-widest uppercase text-lg">
            Do not move...
          </p>
        )}

        {status === 'failed' && (
          <div className="text-center">
            <p className="text-[#E74C3C] font-bold mb-4 uppercase tracking-wider text-xl drop-shadow-md">
              You Have Disturbed The Silence
            </p>
            <button 
              onClick={reset}
              className="px-6 py-2 bg-transparent border border-[#E74C3C] text-[#E74C3C] hover:bg-[#E74C3C]/20 font-bold rounded-lg uppercase tracking-wider transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center animate-pulse">
            <p className="text-[#F1C40F] font-bold mb-2 uppercase tracking-widest text-2xl drop-shadow-[0_0_10px_rgba(241,196,15,0.5)]">
              Perfect Harmony
            </p>
            <p className="text-[#F8F9FA]/80 italic mb-4 max-w-sm mx-auto">
              You have attained the stagnant knowledge of El Homun. You are now officially a Silent Pioneer.
            </p>
            <button 
              onClick={reset}
              className="px-6 py-2 bg-[#F1C40F]/20 border border-[#F1C40F] text-[#F1C40F] hover:bg-[#F1C40F]/30 font-bold rounded-lg uppercase tracking-wider transition-all"
            >
              Return
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Gateway() {
  const router = useRouter();
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let currentProgress = 0;

    // Simulasi pergerakan Progress Bar yang mulus
    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 20 + 10; // Naik secara acak agar natural
      
      if (currentProgress >= 100) {
        setLoadingProgress(100);
        clearInterval(progressInterval);
        
        // Setelah bar penuh, beri jeda setengah detik agar elegan, lalu otomatis lempar ke Beranda
        setTimeout(() => {
          router.push("/beranda");
        }, 500);
      } else {
        setLoadingProgress(currentProgress);
      }
    }, 200);

    return () => clearInterval(progressInterval);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#171412] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Efek Spotlight Terang di Tengah */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="flex flex-col items-center z-10 w-full max-w-3xl relative animate-[fadeIn_0.5s_ease-out]">
        
        {/* LOGO: Lingkaran Putih Solid */}
        <div className="flex justify-center items-center gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full p-3 md:p-3.5 shadow-[0_0_30px_rgba(0,0,0,0.6)] flex items-center justify-center">
            <img src="/mersi.png" alt="Logo Mersi" className="w-full h-full object-contain" />
          </div>
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full p-3 md:p-3.5 shadow-[0_0_30px_rgba(0,0,0,0.6)] flex items-center justify-center">
            <img src="/BK.png" alt="Logo Bundo Kanduang" className="w-full h-full object-contain" />
          </div>
        </div>
        
        {/* Garis Horizontal Halus */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-stone-700/60 to-transparent mb-6"></div>
        
        {/* Teks Judul */}
        <div className="text-center mb-10">
          <h2 className="text-yellow-600 font-semibold tracking-[0.15em] text-xs md:text-sm mb-3 uppercase">
            Asrama Pemerintah Sumatera Barat
          </h2>
          <h1 className="text-2xl md:text-4xl font-serif text-white italic tracking-wide leading-snug">
            Merapi Singgalang <br className="md:hidden" /> & Bundo Kanduang
          </h1>
        </div>

        {/* Progress Bar & Keterangan */}
        <div className="flex flex-col items-center gap-5 w-full max-w-[260px]">
          {/* Trek Bar */}
          <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden relative">
            {/* Isi Bar Kuning (Berjalan Otomatis) */}
            <div 
              className="h-full bg-yellow-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          
          {/* Teks Pemuatan */}
          <span className="text-stone-400/80 text-[11px] font-medium tracking-wide animate-pulse">
            Memuat portal perantau Minangkabau...
          </span>
        </div>

      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Gateway() {
  const [bgImages, setBgImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // State untuk Loading Screen Klasik
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Simulasi pergerakan Progress Bar
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) return prev; // Tahan di 90% sampai data dari Firebase benar-benar selesai
        return prev + Math.random() * 15; 
      });
    }, 150);

    const fetchBg = async () => {
      try {
        const snap = await getDoc(doc(db, "pengaturan", "tampilan"));
        if (snap.exists()) {
          const data = snap.data();
          const images = [];
          if (data.gateway1) images.push(data.gateway1);
          if (data.gateway2) images.push(data.gateway2);
          if (data.gateway3) images.push(data.gateway3);
          // Jika admin menggunakan format upload dinamis (array)
          if (data.gateway && Array.isArray(data.gateway)) {
            images.push(...data.gateway);
          }
          setBgImages(images);
        }
      } catch (error) {
        console.error("Gagal memuat latar:", error);
      } finally {
        // Data selesai dimuat, dorong bar ke 100%
        setLoadingProgress(100); 
        
        // Beri waktu 1 detik agar pengunjung bisa melihat bar-nya penuh sebelum layar terbuka
        setTimeout(() => {
          setIsInitialLoading(false);
          clearInterval(progressInterval);
        }, 1000); 
      }
    };
    fetchBg();

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    if (bgImages.length > 1 && !isInitialLoading) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % bgImages.length);
      }, 5000); // Ganti foto setiap 5 detik
      return () => clearInterval(interval);
    }
  }, [bgImages, isInitialLoading]);

  // --- TAMPILAN SPLASH SCREEN (LOADING PREMIUM) ---
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#171412] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        
        {/* Efek Spotlight Terang di Tengah */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-900/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col items-center z-10 w-full max-w-3xl relative">
          
          {/* Box Logo Mersi & BK Berdampingan */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 bg-[#24211f] rounded-2xl flex items-center justify-center shadow-2xl border border-stone-700/40 backdrop-blur-sm p-3">
              <img src="/mersi.png" alt="Logo Mersi" className="w-full h-full object-contain" />
            </div>
            <div className="w-20 h-20 bg-[#24211f] rounded-2xl flex items-center justify-center shadow-2xl border border-stone-700/40 backdrop-blur-sm p-3">
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
            <span className="text-stone-400/80 text-[11px] font-medium tracking-wide">
              Memuat portal perantau Minangkabau...
            </span>
          </div>

        </div>
      </div>
    );
  }

  // --- TAMPILAN UTAMA GATEWAY ---
  return (
    <div className="min-h-screen bg-[#171412] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Slideshow Dinamis */}
      <div className="absolute inset-0 w-full h-full">
        {bgImages.map((img, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${idx === currentIndex ? "opacity-30" : "opacity-0"}`}
            style={{ backgroundImage: `url('${img}')` }}
          ></div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#171412] via-[#171412]/80 to-[#171412]/40 backdrop-blur-[1px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center animate-[fadeIn_1s_ease-out]">
        <div className="mb-12 text-center w-full">
          
          {/* Dua Logo Asrama */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-800/90 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-md border border-slate-700 p-2.5">
              <img src="/mersi.png" alt="Logo Mersi" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-800/90 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-md border border-slate-700 p-2.5">
              <img src="/BK.png" alt="Logo Bundo Kanduang" className="w-full h-full object-contain drop-shadow-md" />
            </div>
          </div>

          <h2 className="text-amber-500 font-bold tracking-[0.15em] text-xs md:text-sm mb-3 uppercase drop-shadow-md">
            Asrama Pemerintah Sumatera Barat
          </h2>
          <h1 className="text-4xl md:text-6xl font-serif text-white italic drop-shadow-lg leading-tight">
            Merapi Singgalang & Bundo Kanduang <br/>
          </h1>
          
          <p className="text-slate-300 mt-6 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Selamat datang di portal resmi asrama. Rumah bagi mahasiswa perantau asal Sumatera Barat yang menuntut ilmu di Daerah Istimewa Yogyakarta. Silakan pilih cara Anda ingin masuk.
          </p>
          
          <div className="w-16 h-1 bg-red-800 mx-auto rounded-full mt-8 shadow-[0_0_10px_rgba(153,27,27,0.5)]"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          <Link href="/beranda" className="group relative bg-[#1c1917]/80 backdrop-blur-md border border-stone-800 p-6 md:p-8 rounded-2xl hover:bg-[#292524] hover:border-amber-500/50 transition-all duration-300 flex flex-col items-start overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
            <div className="w-12 h-12 bg-amber-600/10 rounded-xl flex items-center justify-center mb-6 border border-amber-600/20 group-hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-400 transition-colors">Masuk sebagai Pengunjung</h3>
            <p className="text-stone-400 text-sm mb-6 leading-relaxed flex-grow">Jelajahi situs publik — beranda, profil asrama, kehidupan warga, dan repositori skripsi alumni tanpa perlu login.</p>
            <span className="text-amber-500 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all uppercase tracking-widest">Lanjut ke beranda <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></span>
          </Link>

          <Link href="/admin/login" className="group relative bg-[#1c1917]/80 backdrop-blur-md border border-stone-800 p-6 md:p-8 rounded-2xl hover:bg-[#292524] hover:border-red-800/50 transition-all duration-300 flex flex-col items-start overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-800 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
            <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center mb-6 border border-red-600/20 group-hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-red-400 transition-colors">Masuk sebagai Admin</h3>
            <p className="text-stone-400 text-sm mb-6 leading-relaxed flex-grow">Khusus Pengurus Asrama — kelola pengumuman, fasilitas, data pendaftaran, dan repositori. Wajib menggunakan akun Google.</p>
            <span className="text-red-500 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all uppercase tracking-widest">Masuk dengan Google <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></span>
          </Link>
        </div>
      </div>
    </div>
  );
}

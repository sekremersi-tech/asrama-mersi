"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Gateway() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  // Efek Animasi Loading
  useEffect(() => {
    const duration = 2500; // Durasi loading 2.5 detik
    const intervalTime = 50;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          // Beri jeda sedikit setelah 100% sebelum ganti layar
          setTimeout(() => setIsLoading(false), 400);
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // Tampilan Layar Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1715] flex flex-col items-center justify-center p-4">
        {/* Logo Mockup */}
        <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-900 rounded-3xl flex items-center justify-center shadow-2xl mb-8 border border-slate-700/50">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
            <path d="m8 3 4 8 5-5 5 15H2L8 3z"></path>
            <path d="M8 11v10" className="text-red-500"></path>
            <path d="M17 6v15" className="text-red-500"></path>
          </svg>
        </div>

        <div className="text-center space-y-3 mb-12">
          <h2 className="text-yellow-600/90 text-sm font-bold tracking-[0.3em] uppercase">
            Asrama Mahasiswa
          </h2>
          <h1 className="text-white text-4xl md:text-5xl font-serif italic tracking-wide">
            Merapi Singgalang
          </h1>
        </div>

        {/* Progress Bar */}
        <div className="w-64 md:w-80 h-1.5 bg-stone-800 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-red-600 rounded-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-stone-500 text-sm">Memuat rumah perantau Minangkabau...</p>
      </div>
    );
  }

  // Tampilan Layar Pemilihan (Gateway)
  return (
    <div className="min-h-screen bg-[#1a1715] flex flex-col items-center justify-center p-4 md:p-8">
      {/* Header Kecil */}
      <div className="text-center mb-10 mt-8 md:mt-0 flex flex-col items-center">
        <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center shadow-lg mb-6 border border-slate-700/50">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
            <path d="m8 3 4 8 5-5 5 15H2L8 3z"></path>
          </svg>
        </div>
        <h2 className="text-yellow-600/90 text-xs md:text-sm font-bold tracking-[0.3em] uppercase mb-2">
          Asrama Mahasiswa
        </h2>
        <h1 className="text-white text-4xl md:text-5xl font-serif italic mb-6">
          Merapi Singgalang
        </h1>
        <p className="text-stone-400 text-base md:text-lg max-w-2xl leading-relaxed px-4">
          Selamat datang di portal resmi asrama. Rumah bagi perantau anak nagari dari Sumatera Barat yang menuntut ilmu di Yogyakarta. Silakan pilih cara Anda ingin masuk.
        </p>
      </div>

      {/* Grid Pilihan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        
        {/* Card Pengunjung */}
        <Link 
          href="/beranda" 
          className="group flex flex-col p-8 rounded-2xl bg-[#24211f] border border-stone-800 hover:border-yellow-600/50 hover:bg-[#2a2624] transition-all duration-300 shadow-lg"
        >
          <div className="w-12 h-12 bg-yellow-600/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <h3 className="text-white text-2xl font-semibold mb-3">Masuk sebagai Pengunjung</h3>
          <p className="text-stone-400 leading-relaxed flex-grow mb-8">
            Jelajahi situs publik — beranda, profil asrama, kehidupan warga, dan repositori skripsi alumni tanpa perlu login.
          </p>
          <div className="flex items-center text-yellow-500 font-medium group-hover:gap-3 gap-2 transition-all">
            Lanjut ke beranda 
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
        </Link>

        {/* Card Admin */}
        <Link 
          href="/admin/login" 
          className="group flex flex-col p-8 rounded-2xl bg-[#2a1c1a] border border-red-900/30 hover:border-red-500/50 hover:bg-[#32201e] transition-all duration-300 shadow-lg"
        >
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h3 className="text-white text-2xl font-semibold mb-3">Masuk sebagai Admin</h3>
          <p className="text-stone-400 leading-relaxed flex-grow mb-8">
            Khusus Sekretariat Asrama — kelola pengumuman, prestasi, dan unggah skripsi ke repositori. Wajib menggunakan Akun Google Sekre.
          </p>
          <div className="flex items-center text-red-400 font-medium group-hover:gap-3 gap-2 transition-all">
            Masuk dengan Google Sekre
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
        </Link>

      </div>

      {/* Footer Gateway */}
      <div className="mt-16 text-center text-sm text-stone-500">
        &copy; {new Date().getFullYear()} Asrama Mahasiswa Merapi Singgalang &middot; Yayasan Baringin
      </div>
    </div>
  );
}

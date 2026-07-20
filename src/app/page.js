"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Gateway() {
  const [bgImages, setBgImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Tambahan state loading

  useEffect(() => {
    const fetchBg = async () => {
      try {
        const snap = await getDoc(doc(db, "pengaturan", "tampilan"));
        if (snap.exists()) {
          const data = snap.data();
          const images = [];
          if (data.gateway1) images.push(data.gateway1);
          if (data.gateway2) images.push(data.gateway2);
          if (data.gateway3) images.push(data.gateway3);
          setBgImages(images);
        }
      } catch (error) {
        console.error("Gagal memuat latar:", error);
      } finally {
        // Beri jeda 800ms agar animasi loading terlihat sebelum masuk ke menu utama
        setTimeout(() => {
          setIsInitialLoading(false);
        }, 800);
      }
    };
    fetchBg();
  }, []);

  useEffect(() => {
    if (bgImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % bgImages.length);
      }, 5000); // Ganti foto setiap 5 detik
      return () => clearInterval(interval);
    }
  }, [bgImages]);

  // --- TAMPILAN SPLASH SCREEN (LOADING) ---
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#171412] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="flex flex-col items-center gap-6">
          {/* Logo dengan animasi berdenyut (Pulse) */}
          <div className="w-24 h-24 bg-slate-800/90 rounded-2xl flex items-center justify-center shadow-2xl border border-slate-700 animate-pulse">
            <img src="/mersi.png" alt="Logo Mersi" className="w-16 h-16 object-contain" />
          </div>
          
          <div className="flex flex-col items-center gap-4">
            {/* Spinner berputar */}
            <svg className="animate-spin h-8 w-8 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-stone-400 text-sm font-medium tracking-widest animate-pulse">MEMUAT PORTAL...</span>
          </div>
        </div>
      </div>
    );
  }

  // --- TAMPILAN UTAMA GATEWAY ---
  return (
    <div className="min-h-screen bg-[#171412] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Slideshow Dinamis */}
      {bgImages.map((img, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${idx === currentIndex ? "opacity-30" : "opacity-0"}`}
          style={{ backgroundImage: `url('${img}')` }}
        ></div>
      ))}
      <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-slate-800/90 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl backdrop-blur-md border border-slate-700">
            <img src="/mersi.png" alt="Logo Mersi" className="w-12 h-12 object-contain" />
          </div>
          <h2 className="text-yellow-600 font-bold tracking-[0.2em] text-sm mb-3 uppercase">Asrama Mahasiswa</h2>
          <h1 className="text-4xl md:text-6xl font-serif text-white italic">Merapi Singgalang</h1>
          <p className="text-slate-400 mt-6 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
            Selamat datang di portal resmi asrama. Rumah bagi perantau anak nagari dari Sumatera Barat yang menuntut ilmu di Yogyakarta. Silakan pilih cara Anda ingin masuk.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          <Link href="/beranda" className="group bg-[#24211f]/90 hover:bg-[#2a2624] border border-stone-800 p-6 md:p-8 rounded-2xl transition-all duration-300 backdrop-blur-sm">
            <div className="w-12 h-12 bg-yellow-600/10 rounded-xl flex items-center justify-center mb-6 border border-yellow-600/20 group-hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Masuk sebagai Pengunjung</h3>
            <p className="text-stone-400 text-sm mb-6 leading-relaxed">Jelajahi situs publik — beranda, profil asrama, kehidupan warga, dan repositori skripsi alumni tanpa perlu login.</p>
            <span className="text-yellow-600 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all">Lanjut ke beranda <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></span>
          </Link>

          <Link href="/admin/login" className="group bg-[#24211f]/90 hover:bg-[#2a2624] border border-stone-800 p-6 md:p-8 rounded-2xl transition-all duration-300 backdrop-blur-sm">
            <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center mb-6 border border-red-600/20 group-hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Masuk sebagai Admin</h3>
            <p className="text-stone-400 text-sm mb-6 leading-relaxed">Khusus Sekretariat Asrama — kelola pengumuman, prestasi, dan unggah skripsi ke repositori. Wajib menggunakan Akun Google Sekre.</p>
            <span className="text-red-500 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all">Masuk dengan Google Sekre <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></span>
          </Link>
        </div>
      </div>
    </div>
  );
}

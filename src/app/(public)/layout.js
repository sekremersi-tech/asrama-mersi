"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function PublicLayout({ children }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // STATE KONTAK YANG DIPERLUAS (Mersi & BK Dipisah)
  const [kontak, setKontak] = useState({ 
    namaKetuaMersi: "", noTelponMersi: "", 
    namaKetuaBk: "", noTelponBk: "",
    emailMersi: "", emailBk: "",
    namaIgMersi: "", linkIgMersi: "",
    namaIgBk: "", linkIgBk: "",
    namaTiktok: "", linkTiktok: "",
    alamatMersi: "", linkMapMersi: "",
    alamatBk: "", linkMapBk: ""
  });

  // CEK APAKAH INI HALAMAN VIEWER SKRIPSI
  const isViewerPage = pathname === "/skripsi-viewer";

  // 1. EFEK ANIMASI MUNCUL
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-12');
        }
      });
    }, { threshold: 0.05 });

    const observeElements = () => {
      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    };

    observeElements();
    const mutationObserver = new MutationObserver(observeElements);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => { observer.disconnect(); mutationObserver.disconnect(); };
  }, [pathname]);

  // 2. AMBIL DATA KONTAK DINAMIS DARI DATABASE
  useEffect(() => {
    const fetchKontak = async () => {
      const snap = await getDoc(doc(db, "pengaturan", "kontak"));
      if(snap.exists()) {
        const data = snap.data();
        setKontak({
          namaKetuaMersi: data.namaKetuaMersi || data.namaKetua || "Ketua Mersi",
          noTelponMersi: data.noTelponMersi || data.noTelpon || "-",
          namaKetuaBk: data.namaKetuaBk || "Ketua BK",
          noTelponBk: data.noTelponBk || "-",
          emailMersi: data.emailMersi || data.email || "sekremersi@gmail.com",
          emailBk: data.emailBk || "",
          namaIgMersi: data.namaIgMersi || data.namaIg || "@asramamerapisinggalang",
          linkIgMersi: data.linkIgMersi || data.linkIg || "https://instagram.com",
          namaIgBk: data.namaIgBk || "@asramaputribk",
          linkIgBk: data.linkIgBk || "https://instagram.com",
          namaTiktok: data.namaTiktok || "@asrama.mersi",
          linkTiktok: data.linkTiktok || "https://tiktok.com",
          alamatMersi: data.alamatMersi || "Jl. Marga Agung, Karangwaru, Kec. Tegalrejo, Kota Yogyakarta 55241",
          linkMapMersi: data.linkMapMersi || "https://www.google.com/maps/search/?api=1&query=Asrama+Mahasiswa+Merapi+Singgalang",
          alamatBk: data.alamatBk || "",
          linkMapBk: data.linkMapBk || ""
        });
      }
    };
    fetchKontak();
  }, []);

  // 3. SISTEM PELACAK PENGUNJUNG (CCTV ANALITIK TANPA GPS)
  useEffect(() => {
    const trackVisitor = async () => {
      if (sessionStorage.getItem('mersi_tracked')) return;
      try {
        const res = await fetch('https://ipinfo.io/json');
        const data = await res.json();
        
        await addDoc(collection(db, "log_pengunjung"), {
          ip: data.ip || "Tidak diketahui",
          kota: data.city || "Tidak diketahui",
          provinsi: data.region || "Tidak diketahui",
          negara: data.country || "Tidak diketahui",
          isp: data.org || "Provider tidak diketahui",
          userAgent: navigator.userAgent, 
          waktu: serverTimestamp()
        });
        sessionStorage.setItem('mersi_tracked', 'true');
      } catch (error) {
        console.error("Log kunjungan dilewati.");
      }
    };
    trackVisitor();
  }, []);

  const formatWhatsAppLink = (nomor) => {
    if (!nomor || nomor === "-") return "#";
    let bersihkanNomor = nomor.replace(/\D/g, '');
    if (bersihkanNomor.startsWith('0')) bersihkanNomor = '62' + bersihkanNomor.substring(1);
    return `https://wa.me/${bersihkanNomor}`;
  };

  const navLinks = [
    { name: "Beranda", path: "/beranda" },
    { 
      name: "Profil", 
      path: "/profil",
      subLinks: [
        { name: "Catatan Sejarah", path: "/profil#sejarah" },
        { name: "Visi & Misi", path: "/profil#visimisi" },
        { name: "Garis Waktu", path: "/profil#timeline" },
        { name: "Struktur Kepengurusan", path: "/profil#kepengurusan" },
        { name: "Titik Temu", path: "/profil#lokasi" }
      ]
    },
    { 
      name: "Fasilitas & Penyewaan", 
      path: "/fasilitas",
      subLinks: [
        { name: "Informasi Pendaftaran", path: "/fasilitas#pendaftaran" },
        { name: "Fasilitas Asrama", path: "/fasilitas#fasilitas" },
        { name: "Layanan Penyewaan", path: "/fasilitas#penyewaan" }
      ]
    },
    { 
      name: "Media & Publikasi", 
      path: "/kehidupan",
      subLinks: [
        { name: "Galeri Kegiatan Asrama", path: "/kehidupan#galeri" },
        { name: "Kabar Terbaru Warga", path: "/kehidupan#kabar" }
      ]
    },
    { 
      name: "Jejak & Prestasi", 
      path: "/alumni",
      subLinks: [
        { name: "Jejak Alumni", path: "/alumni#jejak" },
        { name: "Prestasi Warga", path: "/alumni#prestasi" },
        { name: "Repositori Skripsi", path: "/alumni#repositori" }
      ]
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f9f8f6] font-lora relative">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,500;0,700;1,500;1,700&display=swap');
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-lora { font-family: 'Lora', serif; }
        html { scroll-behavior: smooth; }
        html, body { max-width: 100vw; overflow-x: hidden; }
      `}</style>

      {/* JIKA BUKAN HALAMAN VIEWER SKRIPSI, TAMPILKAN HEADER */}
      {!isViewerPage && (
        <nav className="bg-[#fcfbf9]/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-[#e8e4db]">
          <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20 items-center">
              
              <Link href="/" className="flex items-center gap-4 group shrink-0">
                {/* LOGO NAVBAR OVERLAPPING */}
                <div className="flex items-center">
                  <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-md border border-stone-200 z-20 group-hover:scale-105 transition-transform duration-300">
                    <img src="/mersi.png" alt="Logo Mersi" className="w-7 h-7 object-contain" />
                  </div>
                  <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-md border border-stone-200 -ml-4 z-10 group-hover:scale-105 transition-transform duration-300">
                    <img src="/BK.png" alt="Logo Bundo Kanduang" className="w-7 h-7 object-contain" />
                  </div>
                </div>
                
                {/* TEKS NAVBAR */}
                <div className="hidden sm:flex flex-col justify-center">
                  <span className="font-playfair font-bold text-xl md:text-2xl text-[#2a2626] tracking-wide leading-tight">
                    Asrama Mahasiswa Daerah Sumbar
                  </span>
                  <span className="text-[10px] text-stone-500 tracking-[0.15em] font-bold uppercase font-sans mt-0.5 hidden lg:block">
                    Merapi Singgalang & Bundo Kanduang
                  </span>
                </div>
              </Link>

              <div className="hidden xl:flex space-x-6 h-full">
                {navLinks.map((link, index) => (
                  <div key={link.name} className="relative group h-full flex items-center cursor-pointer">
                    <Link href={link.path} className={`text-[15px] font-semibold transition-all py-2 border-b-[3px] ${pathname === link.path ? "border-red-800 text-red-800" : "border-transparent text-stone-600 hover:text-amber-600"}`}>
                      {link.name}
                    </Link>

                    {link.subLinks && (
                      <div className={`absolute top-full pt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 ${index >= 3 ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}>
                        <div className="bg-[#fcfbf9] border border-[#e8e4db] rounded-sm shadow-2xl relative">
                          <div className={`absolute -top-2 w-4 h-4 bg-[#fcfbf9] border-l border-t border-[#e8e4db] rotate-45 ${index >= 3 ? 'right-8' : 'left-1/2 -translate-x-1/2'}`}></div>
                          <ul className="relative z-10 flex flex-col py-2">
                            {link.subLinks.map((sub, idx) => (
                              <li key={idx}>
                                <Link href={sub.path} className="block px-6 py-3 text-sm font-lora font-medium text-stone-600 hover:text-red-800 hover:bg-[#f4f2ec] border-l-2 border-transparent hover:border-red-800 transition-colors">
                                  {sub.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="xl:hidden p-2 text-stone-500 hover:text-amber-600 shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>
              </button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="xl:hidden bg-white border-t border-stone-100 px-4 py-4 space-y-2 shadow-lg max-h-[80vh] overflow-y-auto">
              {navLinks.map((link) => (
                <div key={link.name}>
                  <Link href={link.path} onClick={() => setIsMenuOpen(false)} className={`block px-4 py-3 rounded-lg font-medium text-sm transition-colors ${pathname === link.path ? "bg-red-50 text-red-800 border-l-4 border-red-800" : "text-stone-600 hover:bg-stone-50"}`}>
                    {link.name}
                  </Link>
                  {link.subLinks && (
                    <div className="pl-6 flex flex-col space-y-1 mt-1 border-l-2 border-stone-100 ml-6">
                      {link.subLinks.map((sub, idx) => (
                        <Link key={idx} href={sub.path} onClick={() => setIsMenuOpen(false)} className="text-sm font-lora text-stone-500 hover:text-red-800 py-2">
                          • {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </nav>
      )}

      {/* KONTEN UTAMA */}
      <main className="flex-grow w-full overflow-x-hidden">{children}</main>

      {/* JIKA BUKAN HALAMAN VIEWER SKRIPSI, TAMPILKAN FOOTER */}
      {!isViewerPage && (
        <footer className="bg-[#171412] text-stone-300 py-16 md:py-20 relative overflow-hidden border-t-8 border-t-amber-500">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-red-800 via-amber-500 to-red-800 opacity-50"></div>
          
          <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 relative z-10">
            
            {/* BLOK 1: IDENTITAS (Col-4) */}
            <div className="lg:col-span-4 pr-0 lg:pr-8 border-r-0 lg:border-r border-white/5">
              <div className="flex items-center gap-4 mb-6">
                {/* WADAH LOGO PUTIH SOLID SEPERTI DI BERANDA */}
                <div className="flex items-center">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg p-2 z-20">
                    <img src="/mersi.png" alt="Logo Mersi" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg p-2 -ml-3 z-10">
                    <img src="/BK.png" alt="Logo BK" className="w-full h-full object-contain" />
                  </div>
                </div>
                
                {/* TEKS IDENTITAS FOOTER */}
                <div className="flex flex-col">
                  <span className="font-playfair font-bold text-2xl text-white tracking-wide leading-tight">Asrama <br/> Pemerintah <br/> Sumatera Barat</span>
                </div>
              </div>
              <p className="text-amber-500 font-bold tracking-[0.1em] text-[10px] uppercase font-sans mb-4 ml-1">
                Merapi Singgalang & Bundo Kanduang
              </p>
              <p className="text-[14px] leading-relaxed text-stone-400 font-lora">
                Asrama mahasiswa untuk mahasiswa asal Sumatera Barat yang sedang menuntut ilmu di Daerah Istimewa Yogyakarta. Menjadi rumah tumbuh bersama, etalase prestasi, dan repositori intelektual bagi perantau Minangkabau.
              </p>
            </div>

            {/* BLOK 2: NAVIGASI (Col-2) */}
            <div className="lg:col-span-2 lg:pl-4">
              <h3 className="text-amber-500 font-bold mb-6 tracking-widest uppercase text-[12px] font-sans">Navigasi Utama</h3>
              <ul className="space-y-3 text-[14px] text-stone-400 font-lora">
                <li><Link href="/beranda" className="hover:text-amber-400 hover:translate-x-1 transition-all flex items-center gap-2"><span className="text-stone-600 font-sans">›</span> Beranda</Link></li>
                <li><Link href="/profil" className="hover:text-amber-400 hover:translate-x-1 transition-all flex items-center gap-2"><span className="text-stone-600 font-sans">›</span> Profil Asrama</Link></li>
                <li><Link href="/fasilitas" className="hover:text-amber-400 hover:translate-x-1 transition-all flex items-center gap-2"><span className="text-stone-600 font-sans">›</span> Fasilitas & Layanan</Link></li>
                <li><Link href="/kehidupan" className="hover:text-amber-400 hover:translate-x-1 transition-all flex items-center gap-2"><span className="text-stone-600 font-sans">›</span> Publikasi</Link></li>
                <li><Link href="/alumni" className="hover:text-amber-400 hover:translate-x-1 transition-all flex items-center gap-2"><span className="text-stone-600 font-sans">›</span> Jejak & Prestasi</Link></li>
              </ul>
            </div>

            {/* BLOK 3: HUBUNGI KAMI (Col-3) */}
            <div className="lg:col-span-3">
              <h3 className="text-amber-500 font-bold mb-6 tracking-widest uppercase text-[12px] font-sans">Pusat Informasi Mersi</h3>
              <ul className="space-y-4 text-[13px] text-stone-400 font-lora border-l-2 border-red-800/50 pl-4 py-1">
                {kontak.alamatMersi && (
                  <li>
                    <a href={kontak.linkMapMersi} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group hover:text-white transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 shrink-0 mt-0.5 group-hover:text-red-400 transition-colors"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      <span className="leading-relaxed">{kontak.alamatMersi}</span>
                    </a>
                  </li>
                )}
                {(kontak.noTelponMersi !== "-" && kontak.noTelponMersi !== "") && (
                  <li>
                    <a href={formatWhatsAppLink(kontak.noTelponMersi)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group hover:text-white transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 shrink-0 group-hover:text-red-400 transition-colors"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      <span>Ketua: {kontak.namaKetuaMersi}</span>
                    </a>
                  </li>
                )}
                {kontak.emailMersi && (
                  <li>
                    <a href={`mailto:${kontak.emailMersi}`} className="flex items-center gap-3 group hover:text-white transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 shrink-0 group-hover:text-red-400 transition-colors"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      <span>{kontak.emailMersi}</span>
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* BLOK 4: INFO BUNDO KANDUANG & SOSMED (Col-3) */}
            <div className="lg:col-span-3">
              <h3 className="text-amber-500 font-bold mb-6 tracking-widest uppercase text-[12px] font-sans">Pusat Informasi Bundo Kanduang</h3>
              <ul className="space-y-4 text-[13px] text-stone-400 font-lora border-l-2 border-amber-500/50 pl-4 py-1 mb-8">
                {kontak.alamatBk && (
                  <li>
                    <a href={kontak.linkMapBk} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group hover:text-white transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500 shrink-0 mt-0.5 group-hover:text-amber-400 transition-colors"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      <span className="leading-relaxed">{kontak.alamatBk}</span>
                    </a>
                  </li>
                )}
                {(kontak.noTelponBk !== "-" && kontak.noTelponBk !== "") && (
                  <li>
                    <a href={formatWhatsAppLink(kontak.noTelponBk)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group hover:text-white transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500 shrink-0 group-hover:text-amber-400 transition-colors"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      <span>Ketua: {kontak.namaKetuaBk}</span>
                    </a>
                  </li>
                )}
                {kontak.emailBk && (
                  <li>
                    <a href={`mailto:${kontak.emailBk}`} className="flex items-center gap-3 group hover:text-white transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500 shrink-0 group-hover:text-amber-400 transition-colors"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      <span>{kontak.emailBk}</span>
                    </a>
                  </li>
                )}
              </ul>

              {/* SOSIAL MEDIA ICONS */}
              <div className="flex items-center gap-4">
                {kontak.linkIgMersi && (
                  <a href={kontak.linkIgMersi} target="_blank" rel="noopener noreferrer" title={`Instagram Mersi: ${kontak.namaIgMersi}`} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:border-red-500 hover:bg-red-500/10 text-stone-400 hover:text-red-500 transition-all shadow-md group">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  </a>
                )}
                {kontak.linkIgBk && (
                  <a href={kontak.linkIgBk} target="_blank" rel="noopener noreferrer" title={`Instagram Bundo Kanduang: ${kontak.namaIgBk}`} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:border-amber-500 hover:bg-amber-500/10 text-stone-400 hover:text-amber-500 transition-all shadow-md group">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  </a>
                )}
                {kontak.linkTiktok && (
                  <a href={kontak.linkTiktok} target="_blank" rel="noopener noreferrer" title={`Tiktok Asrama: ${kontak.namaTiktok}`} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:border-white hover:bg-white/10 text-stone-400 hover:text-white transition-all shadow-md group">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
                  </a>
                )}
              </div>
            </div>

          </div>

          {/* HAK CIPTA & KREDIT */}
          <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-white/10 flex flex-col items-center gap-4 relative z-10">
            <p className="text-xs text-stone-500 font-sans tracking-wider text-center">
              © {new Date().getFullYear()} Asrama Pemerintah Sumatera Barat (Merapi Singgalang & Bundo Kanduang). Hak Cipta Dilindungi.
            </p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-[11px] text-stone-500 font-sans mt-2">
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                <span>Dirancang oleh</span>
                <a href="https://imam-portfolio-qb5g.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-400 font-bold transition-colors">Imam akbari majid</a>
              </div>
              <span className="hidden md:block text-stone-700">•</span>
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <span>Masukan dari Uda, Uni, & Sanak Asrama</span>
              </div>
              <span className="hidden md:block text-stone-700">•</span>
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
                <span>Ditenagai Kopi Susu</span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

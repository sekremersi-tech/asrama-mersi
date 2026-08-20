"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import ProfileCard from "@/components/ProfileCard";
import DepthCarousel from "@/components/DepthCarousel";

const HeroSlider = ({ images, title }) => {
  const imgArray = Array.isArray(images) ? images : (images ? [images] : []);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (imgArray.length <= 1) return;
    const timer = setInterval(() => setIdx(p => (p + 1) % imgArray.length), 4000);
    return () => clearInterval(timer);
  }, [imgArray.length]);

  return (
    <div className="relative py-28 md:py-36 w-full bg-[#171412] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 w-full h-full bg-[#171412]">
        {imgArray.map((bg, i) => (
          <div key={i} className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${i === idx ? 'opacity-70' : 'opacity-0'}`} style={{ backgroundImage: `url('${bg}')` }}></div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#171412] via-[#171412]/80 to-[#171412]/40 backdrop-blur-[1px]"></div>
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-playfair drop-shadow-lg">{title}</h1>
        <div className="w-16 h-1.5 bg-amber-500 mx-auto rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
      </div>
    </div>
  );
};

export default function ProfilAsrama() {
  const [bgProfil, setBgProfil] = useState([]);
  const [profilText, setProfilText] = useState({ visi: "", misi: "" });
  const [dataTimeline, setDataTimeline] = useState([]);
  const [dataFotoProfil, setDataFotoProfil] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [pengurusInti, setPengurusInti] = useState(null);
  const [dataDivisi, setDataDivisi] = useState([]);
  const [dataAnggota, setDataAnggota] = useState([]);

  const [halamanSejarah, setHalamanSejarah] = useState([]);
  const [halAktif, setHalAktif] = useState(0);
  const [isAnimasiFlip, setIsAnimasiFlip] = useState(false);
  const [arahFlip, setArahFlip] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapFoto = await getDoc(doc(db, "pengaturan", "tampilan"));
        if (snapFoto.exists() && snapFoto.data().profil) setBgProfil(snapFoto.data().profil);
        
        const snapText = await getDoc(doc(db, "pengaturan", "profilText"));
        if (snapText.exists()) {
          setProfilText(snapText.data());
        }

        const sejSnap = await getDocs(query(collection(db, "sejarah_asrama"), orderBy("createdAt", "asc")));
        const sejData = sejSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (sejData.length > 0) {
          setHalamanSejarah(sejData);
        } else {
          setHalamanSejarah([{ judul: "Bagian 1", isi: "Belum ada catatan sejarah yang ditambahkan oleh Admin." }]);
        }

        const fotoProfSnap = await getDocs(query(collection(db, "profil_galeri"), orderBy("createdAt", "desc")));
        setDataFotoProfil(fotoProfSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const timeSnap = await getDocs(query(collection(db, "timeline_sejarah"), orderBy("tahun", "asc")));
        setDataTimeline(timeSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const docInti = await getDoc(doc(db, "pengaturan", "pengurus_inti"));
        if (docInti.exists()) setPengurusInti(docInti.data());
        
        const divSnap = await getDocs(query(collection(db, "divisi_asrama"), orderBy("createdAt", "asc")));
        setDataDivisi(divSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const angSnap = await getDocs(query(collection(db, "anggota_divisi"), orderBy("createdAt", "asc")));
        setDataAnggota(angSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const changePage = (newIndex, direction) => {
    if (newIndex >= 0 && newIndex < halamanSejarah.length) {
      setArahFlip(direction);
      setIsAnimasiFlip(true);
      setTimeout(() => {
        setHalAktif(newIndex);
        setIsAnimasiFlip(false);
      }, 500); 
    }
  };

  // MAPPING DATA UNTUK DEPTH CAROUSEL
  const carouselItems = dataFotoProfil.map(item => {
    const imageUrl = Array.isArray(item.linkGambar) ? item.linkGambar[0] : item.linkGambar;
    return {
      image: imageUrl || "https://placehold.co/600x400/e2e8f0/64748b?text=Tanpa+Gambar",
      alt: item.konteks || "Dokumentasi Asrama",
      caption: item.konteks || ""
    };
  });

  return (
    <div className="bg-[#f9f8f6] pb-24 font-lora overflow-x-hidden relative">
      <style jsx global>{`
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        
        /* Custom Scrollbar untuk Timeline */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d6d3c9; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }

        /* MENGURANGI SILAU PADA PROFILE CARD 3D */
        .pc-shine { filter: brightness(0.4) contrast(1.1) saturate(0.3) opacity(0.3) !important; }
        .pc-card:hover .pc-shine, .pc-card.active .pc-shine { filter: brightness(0.6) contrast(1.2) saturate(0.5) !important; }
        .pc-glare { opacity: 0.1 !important; }

        /* DROP CAP KLASIK UNTUK CERITA SEJARAH */
        .drop-cap::first-letter {
          float: left;
          font-size: 4rem;
          line-height: 0.8;
          padding-right: 0.15em;
          padding-top: 0.05em;
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          color: #991b1b; 
        }

        /* --- ANIMASI BUKU 3D YANG SUPER REALISTIS --- */
        .perspective-2000 { perspective: 2000px; }
        .origin-spine { transform-origin: left center; }
        
        .book-flip-next { animation: bookFoldLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .book-enter-next { animation: bookUnfoldRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        
        .book-flip-prev { animation: bookFoldRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .book-enter-prev { animation: bookUnfoldLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }

        @keyframes bookFoldLeft {
          0% { transform: rotateY(0deg) skewY(0deg); opacity: 1; }
          100% { transform: rotateY(-90deg) skewY(-5deg); opacity: 0; }
        }
        @keyframes bookUnfoldRight {
          0% { transform: rotateY(90deg) skewY(5deg); opacity: 0; }
          100% { transform: rotateY(0deg) skewY(0deg); opacity: 1; }
        }
        @keyframes bookFoldRight {
          0% { transform: rotateY(0deg) skewY(0deg); opacity: 1; }
          100% { transform: rotateY(90deg) skewY(5deg); opacity: 0; }
        }
        @keyframes bookUnfoldLeft {
          0% { transform: rotateY(-90deg) skewY(-5deg); opacity: 0; }
          100% { transform: rotateY(0deg) skewY(0deg); opacity: 1; }
        }
      `}</style>

      <HeroSlider images={bgProfil} title="Profil Asrama" />

      {/* 1. SEJARAH - DESAIN BUKU HARDCOVER ELEGAN & ANIMASI UNIK */}
      <div id="sejarah" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-24 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="relative w-full perspective-2000 mt-12">
          
          {/* Cover Buku Belakang (Dark / Hardcover) */}
          <div className="absolute -inset-3 md:-inset-4 bg-[#1e1a17] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] transform translate-y-2"></div>
          <div className="absolute -inset-3 md:-inset-4 bg-gradient-to-b from-[#2a2522] to-[#171412] rounded-xl shadow-inner border border-stone-800"></div>

          {/* Kertas Buku Kiri & Kanan */}
          <div className="relative w-full bg-[#fdfcf7] rounded-sm flex shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] overflow-hidden min-h-[450px]">
            
            {/* Garis Tengah (Spine/Jilid) */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-12 lg:w-16 bg-gradient-to-r from-transparent via-black/10 to-transparent z-20 pointer-events-none hidden md:block"></div>
            
            {/* Pita Buku (Bookmark) */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-12 bg-red-800 shadow-md z-30 hidden md:block" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)" }}></div>

            {/* HALAMAN KIRI (Statis) */}
            <div className="hidden md:flex w-1/2 p-12 lg:p-16 flex-col justify-between relative z-10 border-r border-[#d9d4c5] shadow-[inset_-20px_0_30px_-15px_rgba(0,0,0,0.1)]">
              <div>
                <span className="text-amber-600 font-bold tracking-widest uppercase font-sans text-xs">Profil & Rekam Jejak</span>
                <h2 className="text-5xl lg:text-6xl font-bold text-stone-900 font-playfair tracking-wide mt-4 leading-tight">
                  Catatan<br/>Sejarah
                </h2>
                <div className="w-16 h-1.5 bg-red-800 mt-6 rounded-full"></div>
              </div>
              <div className="mt-auto pt-12">
                <p className="text-stone-500 italic font-lora text-base leading-relaxed border-l-4 border-amber-500 pl-4">
                  "Merawat ingatan, menapaki masa depan. Menjadi saksi perjalanan intelektualitas perantau Minang di sudut nyaman Kota Pelajar."
                </p>
              </div>
            </div>

            {/* HALAMAN KANAN (Dinamis & Animasi 3D Flip) */}
            <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 relative z-10 perspective-2000 shadow-[inset_20px_0_30px_-15px_rgba(0,0,0,0.1)] bg-[#fdfcf7]">
              
              <div className={`flex flex-col h-full transform-style-3d origin-spine ${isAnimasiFlip ? (arahFlip === 'next' ? 'book-flip-next' : 'book-flip-prev') : (arahFlip ? (arahFlip === 'next' ? 'book-enter-next' : 'book-enter-prev') : 'transform rotateY-0 opacity-100 transition-all duration-500')}`}>
                
                {/* Header Kanan */}
                <div className="flex justify-between items-center mb-8 border-b-2 border-stone-200 pb-4">
                  <span className="text-red-800 font-bold tracking-widest uppercase font-sans text-xs">{halamanSejarah[halAktif]?.judul}</span>
                  <span className="text-stone-400 font-serif italic text-sm">{halAktif + 1} / {halamanSejarah.length || 1}</span>
                </div>
                
                {/* Isi Sejarah */}
                <div className="flex-grow">
                  <p className="text-stone-700 leading-[2.2] text-base lg:text-lg text-justify whitespace-pre-line font-lora drop-cap">
                    {loading ? "Menyibak lembaran sejarah..." : halamanSejarah[halAktif]?.isi}
                  </p>
                </div>
                
                {/* Navigasi Kertas */}
                <div className="mt-12 flex justify-between items-center text-xs lg:text-sm font-bold tracking-widest font-sans uppercase pt-6">
                  <button onClick={() => changePage(halAktif - 1, 'prev')} disabled={halAktif === 0 || isAnimasiFlip} className={`flex items-center gap-2 transition-colors ${halAktif === 0 ? 'text-stone-300 cursor-not-allowed' : 'text-stone-600 hover:text-red-800'}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg> Prev
                  </button>
                  <button onClick={() => changePage(halAktif + 1, 'next')} disabled={halAktif === halamanSejarah.length - 1 || isAnimasiFlip} className={`flex items-center gap-2 transition-colors ${halAktif === halamanSejarah.length - 1 ? 'text-stone-300 cursor-not-allowed' : 'text-stone-900 hover:text-amber-600'}`}>
                    Next <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DOKUMENTASI MENGGUNAKAN DEPTH CAROUSEL 3D */}
      {dataFotoProfil.length > 0 && (
        <div className="w-full px-4 sm:px-6 lg:px-8 mt-32 mb-32 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
          <div className="text-center mb-12">
            <h4 className="text-amber-600 font-bold tracking-widest text-xs uppercase font-sans mb-3">Kilas Balik Suasana</h4>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 font-playfair mb-4">Dokumentasi Profil Asrama</h2>
            <div className="w-12 h-1 bg-red-800 mx-auto rounded-full"></div>
          </div>
          
          <div style={{ height: '600px', position: 'relative' }}>
            <DepthCarousel
              items={carouselItems}
              depth={220}
              spread={90}
              tilt={22}
              tiltDirection="right"
              perspective={1400}
              visibleCards={4}
              falloff={0.2}
              blur={6}
              autoplay={true}
              loop={true}
              cardWidth={350}
              cardHeight={450}
              radius={8}
              tint="#05060a"
              duration={700}
              ease="power3.out"
              autoplayDelay={3500}
              showControls={true}
              showIndicators={true}
            />
          </div>
        </div>
      )}

      {/* 3 & 4. VISI MISI & TIMELINE */}
      <div id="visimisi" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 scroll-mt-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          <div className="lg:col-span-5 flex flex-col gap-6 reveal opacity-0 translate-x-[-20px] transition-all duration-1000 ease-out">
            <div className="text-left mb-2"><h2 className="text-3xl font-bold text-stone-900 font-playfair mb-3">Tujuan Asrama</h2><div className="w-12 h-1 bg-amber-500 rounded-full"></div></div>
            <div className="bg-[#171412] text-white p-6 md:p-8 rounded-sm shadow-lg relative overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <h3 className="text-2xl font-bold font-playfair mb-4 text-amber-500">Visi Kami</h3>
              <p className="text-stone-300 leading-relaxed text-base">{loading ? "Memuat..." : profilText.visi}</p>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] border border-[#e8e4db] hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-2xl font-bold font-playfair mb-4 text-red-800">Misi Kami</h3>
              <p className="text-stone-600 leading-relaxed text-base whitespace-pre-line">{loading ? "Memuat..." : profilText.misi}</p>
            </div>
          </div>

          <div id="timeline" className="lg:col-span-7 reveal opacity-0 translate-x-[20px] transition-all duration-1000 ease-out delay-200">
            
            {/* Header Timeline Tanpa Tombol Slide */}
            <div className="flex justify-between items-center mb-8 border-b border-[#e8e4db] pb-4">
              <div className="text-left">
                <h2 className="text-3xl font-bold text-stone-900 font-playfair mb-3">Garis Waktu</h2>
                <div className="w-12 h-1 bg-amber-500 rounded-full"></div>
              </div>
            </div>

            {/* Container Scroll Timeline */}
            {loading ? <p className="text-stone-500">Memuat timeline...</p> : dataTimeline.length === 0 ? <p className="text-stone-500">Belum ada catatan waktu.</p> : (
              <div className="max-h-[600px] overflow-y-auto pr-4 custom-scrollbar pb-6">
                <div className="relative border-l-2 border-amber-200 ml-3 md:ml-4 space-y-8 py-2 animate-[fadeIn_0.5s_ease-out]">
                  {dataTimeline.map((item, idx) => (
                    <div key={item.id} className="relative pl-8 md:pl-10 group" style={{ transitionDelay: `${idx * 100}ms` }}>
                      <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-amber-500 rounded-full border-4 border-[#f9f8f6] group-hover:scale-150 group-hover:bg-red-800 transition-all duration-300"></div>
                      <div className="bg-white p-5 rounded-sm border border-stone-100 shadow-sm group-hover:shadow-md group-hover:border-amber-200 transition-all duration-300 transform group-hover:translate-x-2">
                        <div className="mb-2"><span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold tracking-widest rounded-sm">{item.tahun}</span></div>
                        <h3 className="text-lg font-bold text-stone-900 font-playfair mb-2 group-hover:text-amber-600 transition-colors">{item.judul}</h3>
                        <p className="text-stone-600 text-sm leading-relaxed">{item.deskripsi}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. STRUKTUR KEPENGURUSAN DENGAN PROFILE CARD 3D */}
      <div id="kepengurusan" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 mb-20 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="text-center mb-16">
          <h4 className="text-amber-600 font-bold tracking-widest text-xs uppercase font-sans mb-3">Struktur Organisasi</h4>
          <h2 className="text-4xl font-bold text-stone-900 font-playfair mb-4">Kepengurusan Asrama</h2>
          <div className="w-16 h-1 bg-red-800 mx-auto rounded-full"></div>
          <p className="text-stone-500 text-sm mt-4 italic">Gerakkan kursor atau miringkan HP Anda untuk melihat efek 3D.</p>
        </div>

        {loading ? <p className="text-center text-stone-500">Memuat struktur organisasi...</p> : (
          <>
            {/* PENGURUS INTI: KETUA DI TENGAH DITINGGIKAN */}
            {pengurusInti && (
              <div className="mb-20">
                <h3 className="text-center text-xl font-bold text-stone-400 uppercase tracking-widest font-sans mb-10 pb-4 border-b border-stone-200 max-w-xs mx-auto">Pengurus Inti</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 justify-items-center items-start max-w-5xl mx-auto pt-8">
                  {/* Kolom 1: Sekretaris (Turun) */}
                  {pengurusInti.sekreNama && (
                    <div className="w-full max-w-[260px] md:mt-16 relative z-10 hover:z-20 transition-all duration-300">
                      <ProfileCard 
                        name={pengurusInti.sekreNama} 
                        status="Sekretaris" 
                        avatarUrl={pengurusInti.sekreFoto} 
                        enableMobileTilt={true} 
                        behindGlowColor="rgba(245, 158, 11, 0.15)"
                        innerGradient="linear-gradient(145deg, rgba(23,20,18,0.9) 0%, rgba(23,20,18,0.7) 100%)"
                      />
                    </div>
                  )}
                  {/* Kolom 2: Ketua (Di Tengah, Ditinggikan / Margin Negatif) */}
                  {pengurusInti.ketuaNama && (
                    <div className="w-full max-w-[260px] md:-mt-8 relative z-10 hover:z-20 transition-all duration-300">
                      <ProfileCard 
                        name={pengurusInti.ketuaNama} 
                        status="Ketua Asrama" 
                        avatarUrl={pengurusInti.ketuaFoto} 
                        enableMobileTilt={true} 
                        behindGlowColor="rgba(220, 38, 38, 0.25)"
                        innerGradient="linear-gradient(145deg, rgba(23,20,18,0.95) 0%, rgba(23,20,18,0.7) 100%)"
                      />
                    </div>
                  )}
                  {/* Kolom 3: Bendahara (Turun) */}
                  {pengurusInti.bendaharaNama && (
                    <div className="w-full max-w-[260px] md:mt-16 relative z-10 hover:z-20 transition-all duration-300">
                      <ProfileCard 
                        name={pengurusInti.bendaharaNama} 
                        status="Bendahara" 
                        avatarUrl={pengurusInti.bendaharaFoto} 
                        enableMobileTilt={true} 
                        behindGlowColor="rgba(245, 158, 11, 0.15)"
                        innerGradient="linear-gradient(145deg, rgba(23,20,18,0.9) 0%, rgba(23,20,18,0.7) 100%)"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DIVISI & ANGGOTA */}
            {dataDivisi.length > 0 && (
              <div>
                <h3 className="text-center text-xl font-bold text-stone-400 uppercase tracking-widest font-sans mb-10 pb-4 border-b border-stone-200 max-w-xs mx-auto">Divisi & Anggota</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:[&>*:nth-child(odd):last-child]:col-span-2 lg:[&>*:nth-child(odd):last-child]:max-w-2xl lg:[&>*:nth-child(odd):last-child]:mx-auto lg:[&>*:nth-child(odd):last-child]:w-full">
                  {dataDivisi.map(div => {
                    // MEMISAHKAN KOORDINATOR DAN ANGGOTA
                    const anggotaDivisiIni = dataAnggota.filter(a => a.divisiId === div.id);
                    const koordinators = anggotaDivisiIni.filter(a => a.peran === "Koordinator");
                    const anggotas = anggotaDivisiIni.filter(a => a.peran !== "Koordinator");

                    return (
                      <div key={div.id} className="bg-white rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] border border-[#e8e4db] flex flex-col hover:shadow-xl transition-all duration-300 w-full relative z-10 hover:z-20">
                        <div className="bg-[#171412] py-4 px-6 text-center border-b-2 border-red-800 rounded-t-sm">
                          <h4 className="text-white font-bold tracking-wider font-sans uppercase">{div.namaDivisi}</h4>
                        </div>
                        <div className="p-8 flex-grow bg-stone-50 rounded-b-sm">
                          {anggotaDivisiIni.length === 0 ? <p className="text-sm text-stone-400 text-center italic">Belum ada anggota</p> : (
                            <div className="flex flex-col gap-10">
                              
                              {/* BARIS KOORDINATOR (SELALU DI ATAS & DI TENGAH) */}
                              {koordinators.length > 0 && (
                                <div className="flex justify-center flex-wrap gap-8">
                                  {koordinators.map(koor => (
                                    <div key={koor.id} className="w-full max-w-[260px] relative z-10 hover:z-20 transition-all duration-300">
                                      <ProfileCard 
                                        name={koor.nama} 
                                        status={koor.peran} 
                                        avatarUrl={koor.foto} 
                                        enableMobileTilt={true} 
                                        behindGlowColor="rgba(220, 38, 38, 0.15)"
                                        innerGradient="linear-gradient(145deg, rgba(23,20,18,0.9) 0%, rgba(23,20,18,0.7) 100%)"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* BARIS ANGGOTA (DI BAWAH & DI TENGAH) */}
                              {anggotas.length > 0 && (
                                <div className="flex justify-center flex-wrap gap-8">
                                  {anggotas.map(anggota => (
                                    <div key={anggota.id} className="w-full max-w-[260px] relative z-10 hover:z-20 transition-all duration-300">
                                      <ProfileCard 
                                        name={anggota.nama} 
                                        status={anggota.peran || "Anggota"} 
                                        avatarUrl={anggota.foto} 
                                        enableMobileTilt={true} 
                                        behindGlowColor="rgba(245, 158, 11, 0.1)"
                                        innerGradient="linear-gradient(145deg, rgba(23,20,18,0.9) 0%, rgba(23,20,18,0.7) 100%)"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}

                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 6. TITIK TEMU & MAPS INTERAKTIF */}
      <div id="lokasi" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 mb-10 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8 bg-white p-10 md:p-16 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e8e4db]">
          <div className="w-full lg:w-1/2 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100 shadow-sm"><div className="w-2 h-2 bg-red-800 rounded-full"></div></div>
            <h2 className="text-4xl md:text-5xl font-bold text-stone-900 font-playfair mb-6 leading-tight">Titik <br className="hidden md:block"/> Temu</h2>
            <p className="text-stone-600 text-lg leading-relaxed mb-8 max-w-sm">Jantung pergerakan dan ruang tumbuh bersama perantau Minang di sudut nyaman Kota Pelajar. Kami selalu terbuka untuk silaturahmi.</p>
            <div className="bg-stone-50 border-l-4 border-amber-500 p-5 rounded-r-lg shadow-sm w-full md:w-auto"><p className="text-sm text-stone-700 font-medium leading-relaxed font-sans">Jl. Marga Agung, Karangwaru, Kec. Tegalrejo,<br/>Kota Yogyakarta, Daerah Istimewa Yogyakarta 55241</p></div>
          </div>
          
          {/* AREA GOOGLE MAPS YANG BISA DIKLIK */}
          <div className="w-full lg:w-1/2 relative flex justify-center lg:justify-end animate-float">
            <a href="https://www.google.com/maps/search/?api=1&query=Asrama+Mahasiswa+Merapi+Singgalang+Yogyakarta" target="_blank" rel="noopener noreferrer" className="w-full max-w-md h-[400px] rounded-3xl overflow-hidden shadow-2xl relative z-10 border-4 border-white bg-stone-200 block group cursor-pointer">
              
              {/* Overlay Efek Hover untuk UX */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 z-20 transition-colors duration-300 flex items-center justify-center">
                 <div className="bg-white text-stone-900 px-6 py-3 rounded-full font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 shadow-lg transform translate-y-4 group-hover:translate-y-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> Buka di Google Maps
                 </div>
              </div>
              
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.111956550505!2d110.36388911477484!3d-7.778007694394982!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a584a5a543593%3A0xc3baab4d7b7dbd76!2sAsrama%20Mahasiswa%20Merapi%20Singgalang!5e0!3m2!1sen!2sid!4v1689264560000!5m2!1sen!2sid" width="100%" height="100%" style={{ border: 0, pointerEvents: 'none' }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Lokasi Asrama Merapi Singgalang"></iframe>
            </a>
            
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[80%] h-8 bg-black/20 blur-xl rounded-[100%]"></div>
          </div>
        </div>
      </div>

    </div>
  );
}

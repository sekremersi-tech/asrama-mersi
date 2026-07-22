"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";

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

const AutoSliderCard = ({ images, className }) => {
  const imgArray = Array.isArray(images) ? images : (images ? [images] : []);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (imgArray.length <= 1) return;
    const timer = setInterval(() => setIdx(p => (p + 1) % imgArray.length), 3500);
    return () => clearInterval(timer);
  }, [imgArray.length]);

  if (imgArray.length === 0) return <div className={`bg-stone-200 ${className}`}></div>;
  return (
    <div className={`relative overflow-hidden w-full h-full ${className}`}>
      {imgArray.map((src, i) => (
        <img key={i} src={src} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === idx ? "opacity-100 scale-105" : "opacity-0 scale-100"}`} alt="Visual" />
      ))}
      {imgArray.length > 1 && (
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-lg border border-white/10 z-10 font-sans">
          +{imgArray.length} Foto
        </div>
      )}
    </div>
  );
};

// KOMPONEN GALERI TUMPUK
const StackedGallery = ({ data }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full max-w-4xl h-[350px] md:h-[500px] flex items-center justify-center">
        {data.map((item, idx) => {
          const isActive = idx === activeIdx;
          const isPrev = idx === (activeIdx - 1 + data.length) % data.length;
          const isNext = idx === (activeIdx + 1) % data.length;
          
          let zIndex = 0;
          let transform = 'scale(0.75) translateY(-30px)';
          let opacity = 0;
          
          if (isActive) { zIndex = 30; transform = 'scale(1) translateY(0)'; opacity = 1; }
          else if (isPrev) { zIndex = 20; transform = 'scale(0.85) translateX(-50px) translateY(10px) rotate(-4deg)'; opacity = 0.5; }
          else if (isNext) { zIndex = 20; transform = 'scale(0.85) translateX(50px) translateY(10px) rotate(4deg)'; opacity = 0.5; }

          const images = Array.isArray(item.linkGambar) ? item.linkGambar : [item.linkGambar];
          
          return (
            <div 
              key={item.id} 
              className="absolute w-[85%] md:w-[65%] h-[90%] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer shadow-2xl rounded-sm overflow-hidden border border-stone-200 bg-white"
              style={{ zIndex, transform, opacity, pointerEvents: isActive ? 'auto' : 'none' }}
              onClick={() => !isActive && setActiveIdx(idx)}
            >
               <AutoSliderCard images={images} className="w-full h-[75%]" />
               <div className="h-[25%] bg-white p-4 flex items-center justify-center border-t border-stone-100">
                 <p className="text-stone-600 italic font-lora text-sm md:text-base text-center line-clamp-2">"{item.konteks}"</p>
               </div>
            </div>
          );
        })}

        {/* Panah Navigasi */}
        <button onClick={() => setActiveIdx((activeIdx - 1 + data.length) % data.length)} className="absolute left-0 md:left-4 z-40 bg-white/90 p-4 rounded-full shadow-lg text-stone-600 hover:text-red-800 transition-colors backdrop-blur-sm"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
        <button onClick={() => setActiveIdx((activeIdx + 1) % data.length)} className="absolute right-0 md:right-4 z-40 bg-white/90 p-4 rounded-full shadow-lg text-stone-600 hover:text-red-800 transition-colors backdrop-blur-sm"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
      </div>

      {/* Indikator Titik (Dots) */}
      <div className="flex gap-2 mt-8 z-50">
        {data.map((_, i) => (
          <button key={i} onClick={() => setActiveIdx(i)} className={`h-2.5 rounded-full transition-all duration-500 ${i === activeIdx ? 'w-10 bg-amber-500' : 'w-2.5 bg-stone-300 hover:bg-stone-400'}`}></button>
        ))}
      </div>
    </div>
  )
}

// KOMPONEN KARTU KEPENGURUSAN (KLIK UNTUK FLIP 3D)
const MemberCard = ({ member, role, isMain = false }) => {
  const [flipped, setFlipped] = useState(false);
  const f1 = member.foto1 || `https://ui-avatars.com/api/?name=${member.nama}&background=991b1b&color=fff&size=256`;
  const f2 = member.foto2 || f1; 
  const sizeClasses = isMain ? "w-48 h-48 md:w-56 md:h-56" : "w-36 h-36 md:w-44 md:h-44";

  return (
    <div className="flex flex-col items-center perspective-1000 group">
      <div 
        onClick={() => setFlipped(!flipped)}
        className={`relative ${sizeClasses} rounded-xl shadow-lg border-4 border-white mb-4 cursor-pointer transform-style-3d transition-transform duration-700 ease-in-out ${flipped ? 'rotate-y-180' : ''} hover:shadow-2xl hover:-translate-y-1`}
      >
        {/* Bagian Depan (Foto 1) */}
        <div className="absolute inset-0 backface-hidden bg-stone-100 rounded-lg overflow-hidden">
           <img src={f1} className="w-full h-full object-cover" alt={member.nama} />
           <div className="absolute bottom-2 right-2 bg-black/60 p-1.5 rounded-full text-white opacity-60 group-hover:opacity-100 transition-opacity">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
           </div>
        </div>
        {/* Bagian Belakang (Foto 2) */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-stone-100 rounded-lg overflow-hidden">
           <img src={f2} className="w-full h-full object-cover" alt={`${member.nama} Alternate`} />
           <div className="absolute bottom-2 right-2 bg-amber-500/90 p-1.5 rounded-full text-white shadow-sm">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
           </div>
        </div>
      </div>
      <h4 className={`font-bold text-stone-900 text-center leading-tight mb-1 ${isMain ? 'text-xl' : 'text-base'}`}>{member.nama}</h4>
      {role && <p className={`font-bold text-red-800 uppercase tracking-widest font-sans ${isMain ? 'text-xs' : 'text-[10px]'}`}>{role}</p>}
    </div>
  );
}

export default function ProfilAsrama() {
  const [bgProfil, setBgProfil] = useState([]);
  const [profilText, setProfilText] = useState({ sejarah: "", visi: "", misi: "" });
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
          const dataText = snapText.data();
          setProfilText(dataText);
          if (dataText.sejarah) {
            const pecah = dataText.sejarah.split(/\n\s*\n/).filter(p => p.trim() !== "");
            setHalamanSejarah(pecah.length > 0 ? pecah : [dataText.sejarah]);
          }
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
      }, 400);
    }
  };

  return (
    <div className="bg-[#f9f8f6] pb-24 font-lora overflow-x-hidden relative">
      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .flip-next { animation: flipNext 0.4s ease-in forwards; transform-origin: left center; }
        .flip-prev { animation: flipPrev 0.4s ease-in forwards; transform-origin: right center; }
        @keyframes flipNext { 0% { transform: rotateY(0deg); opacity: 1; } 100% { transform: rotateY(-90deg); opacity: 0; } }
        @keyframes flipPrev { 0% { transform: rotateY(0deg); opacity: 1; } 100% { transform: rotateY(90deg); opacity: 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>

      <HeroSlider images={bgProfil} title="Profil Asrama" />

      {/* 1. SEJARAH */}
      <div id="sejarah" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-24 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="text-center mb-10"><div className="w-12 h-1 bg-red-800 mx-auto rounded-full mb-6"></div></div>
        <div className="relative mt-8 perspective-1000">
          <div className="absolute inset-0 bg-[#e8e4db] transform translate-y-4 -rotate-1 rounded-sm shadow-md"></div>
          <div className="absolute inset-0 bg-[#f4f2ec] transform translate-y-2 rotate-1 rounded-sm shadow-md"></div>
          
          <div className={`relative bg-[#fcfbf9] p-8 md:p-14 rounded-sm shadow-2xl border border-[#e8e4db] z-10 flex flex-col min-h-[400px] ${isAnimasiFlip ? (arahFlip === 'next' ? 'flip-next' : 'flip-prev') : 'transform rotateY-0 opacity-100 transition-all duration-500'}`}>
            <div className="flex justify-between items-center mb-8 border-b border-[#e8e4db] pb-4">
              <span className="text-amber-600 font-bold italic font-serif text-lg">Bagian {halAktif + 1}</span>
              <h2 className="text-3xl md:text-4xl font-bold text-stone-900 font-playfair">Catatan Sejarah</h2>
            </div>
            <div className="flex-grow flex items-center overflow-hidden">
              <p className="text-stone-700 leading-relaxed text-lg md:text-xl text-justify whitespace-pre-line font-lora">{loading ? "Memuat catatan lembar sejarah..." : halamanSejarah[halAktif]}</p>
            </div>
            <div className="mt-12 flex justify-between items-center text-sm font-bold tracking-widest font-sans uppercase">
              <button onClick={() => changePage(halAktif - 1, 'prev')} disabled={halAktif === 0 || isAnimasiFlip} className={`flex items-center gap-2 transition-colors ${halAktif === 0 ? 'text-stone-300 cursor-not-allowed' : 'text-stone-500 hover:text-red-800'}`}>← Balik Lembar</button>
              <span className="text-stone-400 font-serif italic text-base lowercase">{halAktif + 1} / {halamanSejarah.length || 1}</span>
              <button onClick={() => changePage(halAktif + 1, 'next')} disabled={halAktif === halamanSejarah.length - 1 || isAnimasiFlip} className={`flex items-center gap-2 transition-colors ${halAktif === halamanSejarah.length - 1 ? 'text-stone-300 cursor-not-allowed' : 'text-stone-900 hover:text-amber-600'}`}>Lanjut Baca →</button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DOKUMENTASI (FOTO PROFIL BERTUMPUK DENGAN INDIKATOR GESER) */}
      {dataFotoProfil.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 mb-32 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
          <div className="text-center mb-12">
            <h4 className="text-amber-600 font-bold tracking-widest text-xs uppercase font-sans mb-3">Kilas Balik Suasana</h4>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 font-playfair mb-4">Dokumentasi Profil Asrama</h2>
            <div className="w-12 h-1 bg-red-800 mx-auto rounded-full"></div>
          </div>
          
          {/* Komponen Tumpukan Foto */}
          <StackedGallery data={dataFotoProfil} />
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
            <div className="text-left mb-8"><h2 className="text-3xl font-bold text-stone-900 font-playfair mb-3">Garis Waktu</h2><div className="w-12 h-1 bg-amber-500 rounded-full"></div></div>
            {loading ? <p className="text-stone-500">Memuat timeline...</p> : dataTimeline.length === 0 ? <p className="text-stone-500">Belum ada catatan waktu.</p> : (
              <div className="relative border-l-2 border-amber-200 ml-3 md:ml-4 space-y-10 py-2">
                {dataTimeline.map((item, idx) => (
                  <div key={item.id} className="relative pl-8 md:pl-10 group" style={{ transitionDelay: `${idx * 150}ms` }}>
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-amber-500 rounded-full border-4 border-[#f9f8f6] group-hover:scale-150 group-hover:bg-red-800 transition-all duration-300"></div>
                    <div className="bg-white p-5 rounded-sm border border-stone-100 shadow-sm group-hover:shadow-md group-hover:border-amber-200 transition-all duration-300 transform group-hover:translate-x-2">
                      <div className="mb-2"><span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold tracking-widest rounded-sm">{item.tahun}</span></div>
                      <h3 className="text-lg font-bold text-stone-900 font-playfair mb-2 group-hover:text-amber-600 transition-colors">{item.judul}</h3>
                      <p className="text-stone-600 text-sm leading-relaxed">{item.deskripsi}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. STRUKTUR KEPENGURUSAN (KOTAK BESAR & KLIK UNTUK FLIP) */}
      <div id="kepengurusan" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 mb-20 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="text-center mb-16">
          <h4 className="text-amber-600 font-bold tracking-widest text-xs uppercase font-sans mb-3">Struktur Organisasi</h4>
          <h2 className="text-4xl font-bold text-stone-900 font-playfair mb-4">Kepengurusan Asrama</h2>
          <div className="w-16 h-1 bg-red-800 mx-auto rounded-full"></div>
          <p className="text-stone-500 text-sm mt-4 italic">Ketuk foto untuk melihat pose lainnya</p>
        </div>

        {pengurusInti && (
          <div className="mb-20">
            <h3 className="text-center text-xl font-bold text-stone-400 uppercase tracking-widest font-sans mb-10">Pengurus Inti</h3>
            
            <div className="flex justify-center mb-12">
              <MemberCard member={{ nama: pengurusInti.ketuaNama, foto1: pengurusInti.ketuaFoto, foto2: pengurusInti.ketuaFoto2 }} role="Ketua Asrama" isMain={true} />
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-12 sm:gap-24">
              <MemberCard member={{ nama: pengurusInti.sekreNama, foto1: pengurusInti.sekreFoto, foto2: pengurusInti.sekreFoto2 }} role="Sekretaris" isMain={true} />
              <MemberCard member={{ nama: pengurusInti.bendaharaNama, foto1: pengurusInti.bendaharaFoto, foto2: pengurusInti.bendaharaFoto2 }} role="Bendahara" isMain={true} />
            </div>
          </div>
        )}

        {dataDivisi.length > 0 && (
          <div>
            <h3 className="text-center text-xl font-bold text-stone-400 uppercase tracking-widest font-sans mb-10">Divisi & Anggota</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {dataDivisi.map(div => {
                const anggotaList = dataAnggota.filter(a => a.divisiId === div.id);
                return (
                  <div key={div.id} className="bg-white rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] border border-[#e8e4db] overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300">
                    <div className="bg-[#171412] py-4 px-6 text-center border-b-2 border-red-800">
                      <h4 className="text-white font-bold tracking-wider font-sans uppercase">{div.namaDivisi}</h4>
                    </div>
                    <div className="p-8 flex-grow">
                      {anggotaList.length === 0 ? <p className="text-sm text-stone-400 text-center italic">Belum ada anggota</p> : (
                        <div className="grid grid-cols-2 gap-8 justify-items-center">
                          {anggotaList.map(anggota => (
                            <MemberCard key={anggota.id} member={{ nama: anggota.nama, foto1: anggota.foto, foto2: anggota.foto2 }} isMain={false} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 6. TITIK TEMU */}
      <div id="lokasi" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 mb-10 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8 bg-white p-10 md:p-16 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e8e4db]">
          <div className="w-full lg:w-1/2 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100 shadow-sm"><div className="w-2 h-2 bg-red-800 rounded-full"></div></div>
            <h2 className="text-4xl md:text-5xl font-bold text-stone-900 font-playfair mb-6 leading-tight">Titik <br className="hidden md:block"/> Temu</h2>
            <p className="text-stone-600 text-lg leading-relaxed mb-8 max-w-sm">Jantung pergerakan dan ruang tumbuh bersama perantau Minang di sudut nyaman Kota Pelajar. Kami selalu terbuka untuk silaturahmi.</p>
            <div className="bg-stone-50 border-l-4 border-amber-500 p-5 rounded-r-lg shadow-sm w-full md:w-auto"><p className="text-sm text-stone-700 font-medium leading-relaxed font-sans">Jl. Marga Agung, Karangwaru, Kec. Tegalrejo,<br/>Kota Yogyakarta, Daerah Istimewa Yogyakarta 55241</p></div>
          </div>
          <div className="w-full lg:w-1/2 relative flex justify-center lg:justify-end animate-float">
            <div className="w-full max-w-md h-[400px] rounded-3xl overflow-hidden shadow-2xl relative z-10 border-4 border-white bg-stone-200">
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.111956550505!2d110.36388911477484!3d-7.778007694394982!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a584a5a543593%3A0xc3baab4d7b7dbd76!2sAsrama%20Mahasiswa%20Merapi%20Singgalang!5e0!3m2!1sen!2sid!4v1689264560000!5m2!1sen!2sid" width="100%" height="100%" style={{ border: 0, pointerEvents: 'none' }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Lokasi Asrama Merapi Singgalang"></iframe>
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[80%] h-8 bg-black/20 blur-xl rounded-[100%]"></div>
          </div>
        </div>
      </div>

    </div>
  );
}

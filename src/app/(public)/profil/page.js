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

export default function ProfilAsrama() {
  const [bgProfil, setBgProfil] = useState([]);
  const [profilText, setProfilText] = useState({ sejarah: "", visi: "", misi: "" });
  const [dataTimeline, setDataTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // STATE KEPENGURUSAN
  const [pengurusInti, setPengurusInti] = useState(null);
  const [dataDivisi, setDataDivisi] = useState([]);
  const [dataAnggota, setDataAnggota] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapFoto = await getDoc(doc(db, "pengaturan", "tampilan"));
        if (snapFoto.exists() && snapFoto.data().profil) setBgProfil(snapFoto.data().profil);
        
        const snapText = await getDoc(doc(db, "pengaturan", "profilText"));
        if (snapText.exists()) setProfilText(snapText.data());

        const timeSnap = await getDocs(query(collection(db, "timeline_sejarah"), orderBy("tahun", "asc")));
        setDataTimeline(timeSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // FETCH DATA PENGURUS
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

  return (
    <div className="bg-[#f9f8f6] pb-24 font-lora overflow-x-hidden">
      <HeroSlider images={bgProfil} title="Profil Asrama" />

      {/* 1. SEJARAH */}
      <div id="sejarah" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-stone-900 font-playfair mb-4">Catatan Sejarah</h2>
          <div className="w-12 h-1 bg-red-800 mx-auto rounded-full"></div>
        </div>
        <div className="bg-white p-8 md:p-12 rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] border border-[#e8e4db]">
          <p className="text-stone-600 leading-relaxed text-lg text-justify whitespace-pre-line">
            {loading ? "Memuat data sejarah..." : profilText.sejarah}
          </p>
        </div>
      </div>

      {/* 2. VISI & MISI */}
      <div id="visimisi" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#171412] text-white p-10 md:p-14 rounded-sm shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <h2 className="text-3xl font-bold font-playfair mb-6 text-amber-500">Visi Kami</h2>
            <p className="text-stone-300 leading-relaxed text-lg">{loading ? "Memuat..." : profilText.visi}</p>
          </div>
          <div className="bg-white p-10 md:p-14 rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] border border-[#e8e4db]">
            <h2 className="text-3xl font-bold font-playfair mb-6 text-red-800">Misi Kami</h2>
            <p className="text-stone-600 leading-relaxed text-lg whitespace-pre-line">{loading ? "Memuat..." : profilText.misi}</p>
          </div>
        </div>
      </div>

      {/* 3. TIMELINE SEJARAH */}
      <div id="timeline" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-28 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-stone-900 font-playfair mb-4">Garis Waktu Asrama</h2>
          <div className="w-12 h-1 bg-amber-500 mx-auto rounded-full"></div>
        </div>
        
        {loading ? <p className="text-center text-stone-500">Memuat timeline...</p> : dataTimeline.length === 0 ? <p className="text-center text-stone-500">Belum ada catatan waktu.</p> : (
          <div className="relative border-l-2 border-amber-200 ml-3 md:ml-6 space-y-12">
            {dataTimeline.map((item, idx) => (
              <div key={item.id} className="relative pl-8 md:pl-12 reveal opacity-0 translate-y-8 transition-all duration-700" style={{ transitionDelay: `${idx * 150}ms` }}>
                <div className="absolute -left-[9px] top-1 w-4 h-4 bg-amber-500 rounded-full border-4 border-[#f9f8f6]"></div>
                <div className="mb-2"><span className="px-3 py-1 bg-[#171412] text-amber-500 text-xs font-bold tracking-widest rounded-sm">{item.tahun}</span></div>
                <h3 className="text-xl font-bold text-stone-900 font-playfair mb-2">{item.judul}</h3>
                <p className="text-stone-600 leading-relaxed">{item.deskripsi}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. STRUKTUR KEPENGURUSAN (BARU) */}
      <div id="kepengurusan" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 mb-20 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="text-center mb-16">
          <h4 className="text-amber-600 font-bold tracking-widest text-xs uppercase font-sans mb-3">Struktur Organisasi</h4>
          <h2 className="text-4xl font-bold text-stone-900 font-playfair mb-4">Kepengurusan Asrama</h2>
          <div className="w-16 h-1 bg-red-800 mx-auto rounded-full"></div>
        </div>

        {/* PENGURUS INTI */}
        {pengurusInti && (
          <div className="mb-20">
            <h3 className="text-center text-xl font-bold text-stone-400 uppercase tracking-widest font-sans mb-10">Pengurus Inti</h3>
            
            {/* KETUA (Di Tengah Atas) */}
            <div className="flex justify-center mb-8">
              <div className="bg-white p-6 rounded-sm shadow-xl border-t-4 border-red-800 flex flex-col items-center w-64 transform hover:-translate-y-2 transition-transform duration-300">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-amber-100 mb-4 shadow-inner">
                  <img src={pengurusInti.ketuaFoto || `https://ui-avatars.com/api/?name=${pengurusInti.ketuaNama}&background=991b1b&color=fff`} className="w-full h-full object-cover" alt="Ketua" />
                </div>
                <h4 className="font-bold text-stone-900 text-lg text-center leading-tight mb-1">{pengurusInti.ketuaNama || "Nama Ketua"}</h4>
                <p className="text-xs font-bold text-red-800 uppercase tracking-widest font-sans">Ketua Asrama</p>
              </div>
            </div>

            {/* SEKRE & BENDAHARA (Berdampingan di Bawah Ketua) */}
            <div className="flex flex-col sm:flex-row justify-center gap-8">
              <div className="bg-white p-6 rounded-sm shadow-lg border-t-4 border-amber-500 flex flex-col items-center w-full sm:w-64 transform hover:-translate-y-2 transition-transform duration-300">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-stone-100 mb-4 shadow-inner">
                  <img src={pengurusInti.sekreFoto || `https://ui-avatars.com/api/?name=${pengurusInti.sekreNama}&background=f59e0b&color=fff`} className="w-full h-full object-cover" alt="Sekretaris" />
                </div>
                <h4 className="font-bold text-stone-900 text-base text-center leading-tight mb-1">{pengurusInti.sekreNama || "Nama Sekretaris"}</h4>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest font-sans">Sekretaris</p>
              </div>

              <div className="bg-white p-6 rounded-sm shadow-lg border-t-4 border-amber-500 flex flex-col items-center w-full sm:w-64 transform hover:-translate-y-2 transition-transform duration-300">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-stone-100 mb-4 shadow-inner">
                  <img src={pengurusInti.bendaharaFoto || `https://ui-avatars.com/api/?name=${pengurusInti.bendaharaNama}&background=f59e0b&color=fff`} className="w-full h-full object-cover" alt="Bendahara" />
                </div>
                <h4 className="font-bold text-stone-900 text-base text-center leading-tight mb-1">{pengurusInti.bendaharaNama || "Nama Bendahara"}</h4>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest font-sans">Bendahara</p>
              </div>
            </div>
          </div>
        )}

        {/* DIVISI-DIVISI */}
        {dataDivisi.length > 0 && (
          <div>
            <h3 className="text-center text-xl font-bold text-stone-400 uppercase tracking-widest font-sans mb-10">Divisi & Anggota</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dataDivisi.map(div => {
                const anggotaList = dataAnggota.filter(a => a.divisiId === div.id);
                return (
                  <div key={div.id} className="bg-white rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] border border-[#e8e4db] overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300">
                    <div className="bg-[#171412] py-4 px-6 text-center border-b-2 border-red-800">
                      <h4 className="text-white font-bold tracking-wider font-sans uppercase">{div.namaDivisi}</h4>
                    </div>
                    <div className="p-6 flex-grow">
                      {anggotaList.length === 0 ? <p className="text-sm text-stone-400 text-center italic">Belum ada anggota</p> : (
                        <div className="grid grid-cols-2 gap-4">
                          {anggotaList.map(anggota => (
                            <div key={anggota.id} className="flex flex-col items-center text-center group">
                              <img src={anggota.foto} className="w-14 h-14 rounded-full object-cover mb-2 border-2 border-stone-200 group-hover:border-amber-500 transition-colors" alt={anggota.nama} />
                              <span className="text-xs font-semibold text-stone-800 leading-tight">{anggota.nama}</span>
                            </div>
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

    </div>
  );
}

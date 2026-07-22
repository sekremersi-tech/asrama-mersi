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

      {/* 1. SEJARAH (DESAIN KERTAS BERTUMPUK) */}
      <div id="sejarah" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-24 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-stone-900 font-playfair mb-4">Catatan Sejarah</h2>
          <div className="w-12 h-1 bg-red-800 mx-auto rounded-full"></div>
        </div>
        
        {/* Kontainer Kertas Bertumpuk */}
        <div className="relative">
          {/* Kertas Latar 1 */}
          <div className="absolute inset-0 bg-[#e8e4db] transform rotate-2 rounded-sm shadow-md"></div>
          {/* Kertas Latar 2 */}
          <div className="absolute inset-0 bg-[#f4f2ec] transform -rotate-1 rounded-sm shadow-md"></div>
          
          {/* Kertas Utama */}
          <div className="relative bg-white p-8 md:p-14 rounded-sm shadow-xl border border-[#e8e4db] z-10 hover:-translate-y-1 transition-transform duration-500">
            <p className="text-stone-600 leading-relaxed text-lg text-justify whitespace-pre-line font-lora">
              {loading ? "Memuat data sejarah..." : profilText.sejarah}
            </p>
          </div>
        </div>
      </div>

      {/* 2 & 3. VISI MISI & TIMELINE (KOLOM BERSEBELAHAN PADA DESKTOP) */}
      <div id="visimisi" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 scroll-mt-28">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* KOLOM KIRI: Visi & Misi (Vertikal) */}
          <div className="lg:col-span-5 flex flex-col gap-6 reveal opacity-0 translate-x-[-20px] transition-all duration-1000 ease-out">
            <div className="text-left mb-2">
              <h2 className="text-3xl font-bold text-stone-900 font-playfair mb-3">Tujuan Asrama</h2>
              <div className="w-12 h-1 bg-amber-500 rounded-full"></div>
            </div>

            {/* Kotak Visi (Lebih Kecil) */}
            <div className="bg-[#171412] text-white p-6 md:p-8 rounded-sm shadow-lg relative overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <h3 className="text-2xl font-bold font-playfair mb-4 text-amber-500">Visi Kami</h3>
              <p className="text-stone-300 leading-relaxed text-base">{loading ? "Memuat..." : profilText.visi}</p>
            </div>

            {/* Kotak Misi (Lebih Kecil) */}
            <div className="bg-white p-6 md:p-8 rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] border border-[#e8e4db] hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-2xl font-bold font-playfair mb-4 text-red-800">Misi Kami</h3>
              <p className="text-stone-600 leading-relaxed text-base whitespace-pre-line">{loading ? "Memuat..." : profilText.misi}</p>
            </div>
          </div>

          {/* KOLOM KANAN: Garis Waktu (Timeline) */}
          <div id="timeline" className="lg:col-span-7 reveal opacity-0 translate-x-[20px] transition-all duration-1000 ease-out delay-200">
            <div className="text-left mb-8">
              <h2 className="text-3xl font-bold text-stone-900 font-playfair mb-3">Garis Waktu</h2>
              <div className="w-12 h-1 bg-amber-500 rounded-full"></div>
            </div>
            
            {loading ? <p className="text-stone-500">Memuat timeline...</p> : dataTimeline.length === 0 ? <p className="text-stone-500">Belum ada catatan waktu.</p> : (
              <div className="relative border-l-2 border-amber-200 ml-3 md:ml-4 space-y-10 py-2">
                {dataTimeline.map((item, idx) => (
                  <div key={item.id} className="relative pl-8 md:pl-10 group" style={{ transitionDelay: `${idx * 150}ms` }}>
                    {/* Bulatan Kuning */}
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-amber-500 rounded-full border-4 border-[#f9f8f6] group-hover:scale-150 group-hover:bg-red-800 transition-all duration-300"></div>
                    
                    {/* Konten Timeline (Lebih Menarik) */}
                    <div className="bg-white p-5 rounded-sm border border-stone-100 shadow-sm group-hover:shadow-md group-hover:border-amber-200 transition-all duration-300 transform group-hover:translate-x-2">
                      <div className="mb-2">
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold tracking-widest rounded-sm">{item.tahun}</span>
                      </div>
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

      {/* 4. STRUKTUR KEPENGURUSAN */}
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

      {/* 5. TITIK TEMU (MAPS DIKEMBALIKAN KE PALING BAWAH) */}
      <div id="lokasi" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 mb-10 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-stone-900 font-playfair mb-4">Titik Temu</h2>
          <div className="w-12 h-1 bg-red-800 mx-auto rounded-full"></div>
          <p className="text-stone-600 mt-4 max-w-xl mx-auto">
            Temukan lokasi Asrama Mahasiswa Merapi Singgalang Yogyakarta melalui peta di bawah ini.
          </p>
        </div>
        <div className="w-full h-[400px] md:h-[500px] bg-stone-200 rounded-sm overflow-hidden shadow-lg border border-[#e8e4db] relative">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.111956550505!2d110.36388911477484!3d-7.778007694394982!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a584a5a543593%3A0xc3baab4d7b7dbd76!2sAsrama%20Mahasiswa%20Merapi%20Singgalang!5e0!3m2!1sen!2sid!4v1689264560000!5m2!1sen!2sid" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="Lokasi Asrama Merapi Singgalang"
          ></iframe>
        </div>
      </div>

    </div>
  );
}

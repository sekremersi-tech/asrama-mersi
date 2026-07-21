"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";

export default function Profil() {
  const [fotoProfil, setFotoProfil] = useState("");
  const [profilText, setProfilText] = useState({ sejarah: "Memuat...", visi: "Memuat...", misi: "Memuat...", nilai1: "Memuat...", nilai2: "Memuat...", nilai3: "Memuat..." });
  const [dataFotoKonteks, setDataFotoKonteks] = useState([]); 
  const [dataTimeline, setDataTimeline] = useState([]);
  
  // State untuk Kertas Tua (Paginasi Sejarah)
  const [currentPage, setCurrentPage] = useState(0);
  const [sejarahPages, setSejarahPages] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapFoto = await getDoc(doc(db, "pengaturan", "tampilan"));
        if (snapFoto.exists() && snapFoto.data().profil) setFotoProfil(snapFoto.data().profil);

        const snapText = await getDoc(doc(db, "pengaturan", "profilText"));
        if (snapText.exists()) {
          const data = snapText.data();
          setProfilText({
            sejarah: data.sejarah || "Sejarah belum diatur.", visi: data.visi || "Visi belum diatur.", misi: data.misi || "Misi belum diatur.",
            nilai1: data.nilai1 || "Belum diatur.", nilai2: data.nilai2 || "Belum diatur.", nilai3: data.nilai3 || "Belum diatur."
          });
          // Memecah teks sejarah per paragraf untuk efek kertas tua
          setSejarahPages(data.sejarah.split(/\n+/).filter(text => text.trim().length > 0));
        }

        const fotoSnap = await getDocs(query(collection(db, "profil_galeri"), orderBy("createdAt", "desc")));
        setDataFotoKonteks(fotoSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const timeSnap = await getDocs(query(collection(db, "timeline_sejarah"), orderBy("tahun", "asc")));
        setDataTimeline(timeSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) { console.error(error); }
    };
    fetchData();
  }, []);

  const nextPage = () => { if (currentPage < sejarahPages.length - 1) setCurrentPage(prev => prev + 1); };
  const prevPage = () => { if (currentPage > 0) setCurrentPage(prev => prev - 1); };

  return (
    <div className="bg-[#f9f8f6] pb-24 w-full text-left font-lora">
      {/* HERO */}
      <div className="relative py-28 md:py-36 w-full bg-[#171412] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: fotoProfil ? `url('${fotoProfil}')` : 'none', opacity: fotoProfil ? 0.8 : 0 }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#171412] via-[#171412]/80 to-[#171412]/40 backdrop-blur-[1px]"></div>
        </div>
        <div className="relative z-10 text-center px-4 w-full flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white font-playfair tracking-wide mb-6 drop-shadow-lg">Profil Asrama</h1>
          <div className="w-16 h-1.5 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
        </div>
      </div>

      {/* CONTAINER DIPERSEMPIT AGAR TIDAK KOSONG */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 w-full flex flex-col gap-14">
        
        {/* ANIMASI KERTAS TUA (SEJARAH) */}
        <div className="relative w-full min-h-[400px] md:min-h-[350px] mb-8">
          {sejarahPages.map((teks, index) => {
            let zIndex = sejarahPages.length - index;
            let isCurrent = index === currentPage;
            let isPast = index < currentPage;
            return (
              <div 
                key={index} 
                className={`absolute top-0 left-0 w-full bg-[#fdfbf7] p-8 md:p-12 rounded-sm border border-[#e8e4db] shadow-[4px_4px_10px_rgba(0,0,0,0.05)] transition-all duration-700 ease-in-out flex flex-col justify-between h-full
                  ${isCurrent ? 'opacity-100 translate-x-0 rotate-0' : isPast ? 'opacity-0 -translate-x-full -rotate-12' : `opacity-100 translate-x-2 translate-y-2 ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}`}
                style={{ zIndex: isCurrent ? 50 : isPast ? 0 : zIndex }}
              >
                <div>
                  <div className="flex items-center gap-3 mb-6 border-b border-stone-200 pb-4">
                    <span className="text-amber-600 font-playfair italic text-xl">Bagian {index + 1}</span>
                    <h2 className="text-3xl font-bold text-stone-900 font-playfair ml-auto">Catatan Sejarah</h2>
                  </div>
                  <p className="text-stone-700 leading-loose text-lg font-lora text-justify">{teks}</p>
                </div>
                
                {/* Navigasi Kertas */}
                <div className="flex justify-between items-center mt-8 pt-4 border-t border-stone-100">
                  <button onClick={prevPage} disabled={currentPage === 0} className={`font-playfair font-bold text-sm tracking-widest uppercase transition-colors ${currentPage === 0 ? 'text-stone-300' : 'text-stone-800 hover:text-amber-600'}`}>&larr; Balik Lembar</button>
                  <span className="text-xs text-stone-400 font-serif">{index + 1} / {sejarahPages.length}</span>
                  <button onClick={nextPage} disabled={currentPage === sejarahPages.length - 1} className={`font-playfair font-bold text-sm tracking-widest uppercase transition-colors ${currentPage === sejarahPages.length - 1 ? 'text-stone-300' : 'text-stone-800 hover:text-amber-600'}`}>Lanjut Baca &rarr;</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* TIMELINE SEJARAH (BARU) */}
        {dataTimeline.length > 0 && (
          <div className="w-full pl-4 md:pl-8">
            <h3 className="text-2xl font-bold text-stone-900 font-playfair mb-8 flex items-center gap-3">
              <div className="w-8 h-0.5 bg-red-800"></div> Garis Waktu
            </h3>
            <div className="relative border-l-2 border-[#e8e4db] pl-8 space-y-10 ml-3">
              {dataTimeline.map((item, idx) => (
                <div key={item.id} className="relative group">
                  {/* Titik Timeline */}
                  <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-[#f9f8f6] border-4 border-amber-500 group-hover:border-red-800 transition-colors mt-1.5"></div>
                  <span className="inline-block py-1 px-3 bg-stone-800 text-amber-500 text-xs font-bold tracking-widest uppercase rounded mb-3">{item.tahun}</span>
                  <h4 className="text-xl font-bold text-stone-900 font-playfair mb-2 group-hover:text-red-800 transition-colors">{item.judul}</h4>
                  <p className="text-stone-600 leading-relaxed text-sm">{item.deskripsi}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISI, MISI & NILAI - KARTU BERGAYA KLASIK */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-10">
          <div className="flex flex-col gap-8 w-full">
            <div className="bg-[#fcfbf9] rounded-sm p-8 border border-[#e8e4db] shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] w-full text-left">
              <h3 className="text-2xl font-bold text-stone-900 font-playfair mb-5 flex items-center gap-3"><span className="w-2 h-2 bg-amber-500 rotate-45"></span> Visi</h3>
              <p className="text-stone-700 italic leading-relaxed text-left whitespace-pre-line border-l-4 border-amber-500 pl-4 py-2">"{profilText.visi}"</p>
            </div>
            <div className="bg-[#fcfbf9] rounded-sm p-8 border border-[#e8e4db] shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] w-full text-left">
              <h3 className="text-2xl font-bold text-stone-900 font-playfair mb-5 flex items-center gap-3"><span className="w-2 h-2 bg-red-800 rotate-45"></span> Misi</h3>
              <p className="text-stone-700 leading-relaxed text-left whitespace-pre-line border-l-4 border-red-800 pl-4 py-2">{profilText.misi}</p>
            </div>
          </div>
          <div className="bg-[#fcfbf9] rounded-sm p-8 md:p-10 border border-[#e8e4db] shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] w-full h-full text-left">
            <h3 className="text-2xl font-bold text-stone-900 font-playfair mb-8 border-b border-[#e8e4db] pb-4">Nilai Kepengasuhan</h3>
            <ul className="flex flex-col gap-8 w-full">
              <li className="flex gap-4">
                <span className="font-playfair text-3xl text-amber-500 font-bold opacity-80">01</span>
                <div>
                  <h4 className="font-bold text-stone-900 mb-1 text-lg font-playfair">Sistem Silang</h4>
                  <p className="text-stone-600 text-sm leading-relaxed">{profilText.nilai1}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="font-playfair text-3xl text-red-800 font-bold opacity-80">02</span>
                <div>
                  <h4 className="font-bold text-stone-900 mb-1 text-lg font-playfair">Intelektualitas</h4>
                  <p className="text-stone-600 text-sm leading-relaxed">{profilText.nilai2}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="font-playfair text-3xl text-stone-400 font-bold opacity-80">03</span>
                <div>
                  <h4 className="font-bold text-stone-900 mb-1 text-lg font-playfair">Kemandirian</h4>
                  <p className="text-stone-600 text-sm leading-relaxed">{profilText.nilai3}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* FOTO SISIPAN (Museum Style) */}
        {dataFotoKonteks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-10">
            {dataFotoKonteks.map(item => (
              <div key={item.id} className="bg-white p-4 border border-[#e8e4db] shadow-md transform hover:-rotate-1 transition-transform">
                <img src={item.linkGambar} className="w-full h-64 object-cover mb-4 grayscale-[20%] hover:grayscale-0 transition-all duration-500" />
                <p className="text-stone-600 text-sm font-playfair italic text-center px-4 pb-2">"{item.konteks}"</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

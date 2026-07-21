"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";

export default function Profil() {
  const [fotoProfil, setFotoProfil] = useState("");
  const [profilText, setProfilText] = useState({ sejarah: "Memuat...", visi: "Memuat...", misi: "Memuat..." });
  const [dataFotoKonteks, setDataFotoKonteks] = useState([]); 
  const [dataTimeline, setDataTimeline] = useState([]);
  
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
          setProfilText({ sejarah: data.sejarah || "Sejarah belum diatur.", visi: data.visi || "Visi belum diatur.", misi: data.misi || "Misi belum diatur." });
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
      <div className="relative py-28 md:py-36 w-full bg-[#171412] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: fotoProfil ? `url('${fotoProfil}')` : 'none', opacity: fotoProfil ? 0.8 : 0 }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#171412] via-[#171412]/80 to-[#171412]/40 backdrop-blur-[1px]"></div>
        </div>
        <div className="relative z-10 text-center px-4 w-full flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white font-playfair tracking-wide mb-6 drop-shadow-lg">Profil Asrama</h1>
          <div className="w-16 h-1.5 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 w-full flex flex-col gap-14">
        
        {/* TITIK JANGKAR 1: SEJARAH */}
        <div id="sejarah" className="relative w-full h-[580px] md:h-[450px] mb-8 scroll-mt-28">
          {sejarahPages.map((teks, index) => {
            let zIndex = sejarahPages.length - index;
            let isCurrent = index === currentPage;
            let isPast = index < currentPage;
            return (
              <div key={index} className={`absolute inset-0 bg-[#fdfbf7] p-8 md:p-12 rounded-sm border border-[#e8e4db] shadow-[4px_4px_15px_rgba(0,0,0,0.08)] transition-all duration-700 ease-in-out flex flex-col ${isCurrent ? 'opacity-100 translate-x-0 rotate-0' : isPast ? 'opacity-0 -translate-x-full -rotate-12' : `opacity-100 translate-x-2 translate-y-2 ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}`} style={{ zIndex: isCurrent ? 50 : isPast ? 0 : zIndex }}>
                <div className="flex items-center gap-3 mb-6 border-b border-stone-200 pb-4 shrink-0">
                  <span className="text-amber-600 font-playfair italic text-xl">Bagian {index + 1}</span>
                  <h2 className="text-3xl font-bold text-stone-900 font-playfair ml-auto">Catatan Sejarah</h2>
                </div>
                <div className="flex-grow overflow-y-auto pr-4 mb-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d6d3d1 transparent' }}>
                  <p className="text-stone-700 leading-loose text-lg font-lora text-justify">{teks}</p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-stone-200 shrink-0">
                  <button onClick={prevPage} disabled={currentPage === 0} className={`font-playfair font-bold text-sm tracking-widest uppercase transition-colors ${currentPage === 0 ? 'text-stone-300' : 'text-stone-800 hover:text-amber-600'}`}>&larr; Balik Lembar</button>
                  <span className="text-xs text-stone-400 font-serif">{index + 1} / {sejarahPages.length}</span>
                  <button onClick={nextPage} disabled={currentPage === sejarahPages.length - 1} className={`font-playfair font-bold text-sm tracking-widest uppercase transition-colors ${currentPage === sejarahPages.length - 1 ? 'text-stone-300' : 'text-stone-800 hover:text-amber-600'}`}>Lanjut Baca &rarr;</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-2">
          {/* TITIK JANGKAR 2: VISI MISI */}
          <div id="visimisi" className="flex flex-col gap-8 w-full scroll-mt-28">
            <div className="bg-[#fcfbf9] rounded-sm p-8 border border-[#e8e4db] shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] w-full text-left">
              <h3 className="text-2xl font-bold text-stone-900 font-playfair mb-5 flex items-center gap-3"><span className="w-2 h-2 bg-amber-500 rotate-45"></span> Visi</h3>
              <p className="text-stone-700 italic leading-relaxed text-left whitespace-pre-line border-l-4 border-amber-500 pl-4 py-2">"{profilText.visi}"</p>
            </div>
            <div className="bg-[#fcfbf9] rounded-sm p-8 border border-[#e8e4db] shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] w-full text-left">
              <h3 className="text-2xl font-bold text-stone-900 font-playfair mb-5 flex items-center gap-3"><span className="w-2 h-2 bg-red-800 rotate-45"></span> Misi</h3>
              <p className="text-stone-700 leading-relaxed text-left whitespace-pre-line border-l-4 border-red-800 pl-4 py-2">{profilText.misi}</p>
            </div>
          </div>

          {/* TITIK JANGKAR 3: GARIS WAKTU / TIMELINE */}
          <div id="timeline" className="bg-[#fcfbf9] rounded-sm p-8 md:p-10 border border-[#e8e4db] shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] w-full h-full text-left flex flex-col scroll-mt-28">
            <h3 className="text-2xl font-bold text-stone-900 font-playfair mb-8 border-b border-[#e8e4db] pb-4 flex items-center gap-3 shrink-0">
              <div className="w-8 h-0.5 bg-red-800"></div> Garis Waktu
            </h3>
            <div className="flex-grow overflow-y-auto pr-4 max-h-[500px]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d6d3d1 transparent' }}>
              {dataTimeline.length > 0 ? (
                <div className="relative border-l-2 border-[#e8e4db] pl-8 space-y-10 ml-3">
                  {dataTimeline.map((item) => (
                    <div key={item.id} className="relative group">
                      <div className="absolute -left-[41px] w-5 h-5 rounded-full bg-[#f9f8f6] border-4 border-amber-500 group-hover:border-red-800 transition-colors mt-1.5"></div>
                      <span className="inline-block py-1 px-3 bg-stone-800 text-amber-500 text-xs font-bold tracking-widest uppercase rounded mb-3">{item.tahun}</span>
                      <h4 className="text-xl font-bold text-stone-900 font-playfair mb-2 group-hover:text-red-800 transition-colors">{item.judul}</h4>
                      <p className="text-stone-600 leading-relaxed text-sm">{item.deskripsi}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-stone-500 italic text-sm">Belum ada catatan garis waktu sejarah.</p>
              )}
            </div>
          </div>
        </div>

        {dataFotoKonteks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-6">
            {dataFotoKonteks.map(item => (
              <div key={item.id} className="bg-white p-4 border border-[#e8e4db] shadow-md transform hover:-rotate-1 transition-transform">
                <img src={item.linkGambar} className="w-full h-64 object-cover mb-4 grayscale-[20%] hover:grayscale-0 transition-all duration-500" />
                <p className="text-stone-600 text-sm font-playfair italic text-center px-4 pb-2">"{item.konteks}"</p>
              </div>
            ))}
          </div>
        )}

        {/* TITIK JANGKAR 4: TITIK TEMU / MAPS */}
        <div id="lokasi" className="bg-white rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] border border-[#e8e4db] p-8 md:p-12 relative overflow-hidden w-full text-left mt-6 scroll-mt-28">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center w-full">
            <div className="md:col-span-5 flex flex-col items-start justify-start w-full relative z-10 text-left">
              <div className="flex flex-row items-center justify-start gap-4 mb-6 w-full">
                <div className="relative flex shrink-0 items-center justify-center w-14 h-14">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-30 animate-ping"></span>
                  <div className="relative w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-800 border border-red-100 shadow-sm">
                    <svg className="w-6 h-6 animate-bounce mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-stone-900 font-playfair m-0 text-left">Titik Temu</h2>
              </div>
              <p className="text-stone-600 leading-relaxed mb-8 text-lg w-full text-left m-0">
                Jantung pergerakan dan ruang tumbuh bersama perantau Minang di sudut nyaman Kota Pelajar. Kami selalu terbuka untuk silaturahmi.
              </p>
              <div className="p-5 bg-stone-50 rounded-sm border border-[#e8e4db] w-full shadow-inner relative overflow-hidden group text-left flex flex-col justify-center">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 group-hover:bg-red-800 transition-colors duration-500"></div>
                <p className="text-sm text-stone-700 font-medium leading-relaxed w-full text-left m-0 font-sans">
                  Jl. Marga Agung, Karangwaru, Kec. Tegalrejo, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55241
                </p>
              </div>
            </div>
            <div className="md:col-span-7 w-full h-[300px] md:h-[400px] rounded-sm overflow-hidden relative group shadow-sm border border-[#e8e4db] bg-stone-100 cursor-crosshair">
              <div className="absolute inset-0 bg-stone-900/10 mix-blend-overlay group-hover:opacity-0 transition-opacity duration-700 z-10 pointer-events-none"></div>
              <iframe src="https://maps.google.com/maps?q=Asrama%20Mahasiswa%20Merapi%20Singgalang,%20Yogyakarta&t=&z=17&ie=UTF8&iwloc=&output=embed" className="w-full h-full border-0 grayscale-[30%] opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-105" allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
              <div className="absolute bottom-4 right-4 bg-[#171412] text-amber-500 text-xs font-bold tracking-widest px-4 py-2 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20 pointer-events-none shadow-lg border border-stone-700 font-sans">LOKASI AKTIF</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

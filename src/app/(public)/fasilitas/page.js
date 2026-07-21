"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";

export default function FasilitasAsrama() {
  const [bgFasilitas, setBgFasilitas] = useState("");
  const [dataFasilitas, setDataFasilitas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Data Baru
  const [statusAsrama, setStatusAsrama] = useState({ kamar: "0", penghuni: "0", ketersediaan: "Penuh" });
  const [panduanUrls, setPanduanUrls] = useState({ prosedur: "#", aturan: "#" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapFoto = await getDoc(doc(db, "pengaturan", "tampilan"));
        if (snapFoto.exists() && snapFoto.data().fasilitas) setBgFasilitas(snapFoto.data().fasilitas);

        // Fetch Status & Panduan
        const docStatus = await getDoc(doc(db, "pengaturan", "statusAsrama"));
        if (docStatus.exists()) setStatusAsrama(docStatus.data());
        
        const docPanduan = await getDoc(doc(db, "pengaturan", "panduan"));
        if (docPanduan.exists()) setPanduanUrls(docPanduan.data());

        const fasSnap = await getDocs(query(collection(db, "daftar_fasilitas"), orderBy("createdAt", "asc")));
        setDataFasilitas(fasSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-[#f9f8f6] pb-24 min-h-screen text-left font-lora">
      
      {/* HEADER HERO */}
      <div className="relative py-28 md:py-36 w-full bg-[#171412] flex flex-col items-center justify-center overflow-hidden text-center">
        <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: bgFasilitas ? `url('${bgFasilitas}')` : 'none', opacity: bgFasilitas ? 0.7 : 0 }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#171412] via-[#171412]/70 to-[#171412]/30 backdrop-blur-[1px]"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full flex flex-col items-center pb-8">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-playfair drop-shadow-lg">Fasilitas Asrama</h1>
          <p className="text-stone-300 text-lg max-w-2xl mx-auto m-0">Ruang nyaman dan sarana memadai untuk menunjang kehidupan serta produktivitas warga perantau.</p>
        </div>
      </div>

      {/* STATISTIK ASRAMA (OVERLAP / MENGAMBANG) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="bg-[#fcfbf9] rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-[#e8e4db] p-8 grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-[#e8e4db]">
          <div className="text-center px-4 pt-4 md:pt-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-playfair font-bold text-stone-900 mb-2">{statusAsrama.kamar}</div>
            <div className="text-xs font-bold tracking-widest uppercase text-stone-500 font-sans">Total Kamar</div>
          </div>
          <div className="text-center px-4 pt-8 md:pt-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-playfair font-bold text-stone-900 mb-2">{statusAsrama.penghuni}</div>
            <div className="text-xs font-bold tracking-widest uppercase text-stone-500 font-sans">Penghuni Aktif</div>
          </div>
          <div className="text-center px-4 pt-8 md:pt-0 flex flex-col items-center justify-center">
            <div className={`text-3xl md:text-4xl font-playfair font-bold mb-3 ${statusAsrama.ketersediaan === 'Tersedia' ? 'text-green-700' : 'text-red-800'}`}>
              {statusAsrama.ketersediaan === 'Tersedia' ? 'Tersedia' : 'Penuh'}
            </div>
            <div className="text-xs font-bold tracking-widest uppercase text-stone-500 font-sans">Status Kuota</div>
          </div>
        </div>
      </div>

      {/* PROSEDUR & ATURAN (PANDUAN) */}
      <div className="max-w-5xl mx-auto px-4 mt-28 mb-20 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="text-center mb-12">
          <h4 className="text-amber-600 font-bold tracking-widest text-xs uppercase font-sans mb-3">Prosedur & Aturan</h4>
          <h2 className="text-4xl font-bold text-stone-900 font-playfair mb-4">Panduan Penghunian Asrama</h2>
          <p className="text-stone-600 max-w-2xl mx-auto">Semua dokumen resmi tersedia untuk diunduh. Calon penghuni diwajibkan untuk membaca dan memahami aturan yang berlaku secara saksama.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card Prosedur */}
          <div className="bg-white border border-[#e8e4db] p-8 rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 border border-amber-100 mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <h3 className="font-playfair text-2xl font-bold text-stone-900 mb-3">Prosedur Pendaftaran</h3>
            <p className="text-stone-600 text-sm leading-relaxed flex-grow mb-8">Panduan lengkap langkah demi langkah pendaftaran kamar untuk calon penghuni asrama. Berisi syarat, alur, dan administrasi.</p>
            {panduanUrls.prosedur && panduanUrls.prosedur !== "#" ? (
              <a href={panduanUrls.prosedur} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-[#171412] hover:bg-amber-600 text-white px-5 py-3 rounded-sm text-xs font-bold uppercase tracking-wide transition-all font-sans">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg> Unduh Prosedur
              </a>
            ) : (
              <span className="inline-block px-5 py-3 bg-stone-100 text-stone-400 text-xs font-bold uppercase tracking-wide text-center rounded-sm cursor-not-allowed font-sans">File Belum Tersedia</span>
            )}
          </div>

          {/* Card Aturan */}
          <div className="bg-white border border-[#e8e4db] p-8 rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-800 border border-red-100 mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <h3 className="font-playfair text-2xl font-bold text-stone-900 mb-3">Tata Tertib Asrama</h3>
            <p className="text-stone-600 text-sm leading-relaxed flex-grow mb-8">Peraturan dan tata tertib lengkap yang wajib diketahui, dipahami, dan dipatuhi oleh seluruh warga penghuni asrama.</p>
            {panduanUrls.aturan && panduanUrls.aturan !== "#" ? (
              <a href={panduanUrls.aturan} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-red-800 hover:bg-amber-600 text-white px-5 py-3 rounded-sm text-xs font-bold uppercase tracking-wide transition-all font-sans">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg> Unduh Aturan
              </a>
            ) : (
              <span className="inline-block px-5 py-3 bg-stone-100 text-stone-400 text-xs font-bold uppercase tracking-wide text-center rounded-sm cursor-not-allowed font-sans">File Belum Tersedia</span>
            )}
          </div>

        </div>
      </div>

      {/* DAFTAR FASILITAS ASRAMA */}
      <div className="max-w-7xl mx-auto px-4 mt-20 w-full text-left reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="flex items-center gap-4 mb-10 border-t border-[#e8e4db] pt-16">
          <div className="w-14 h-14 bg-[#171412] rounded-sm flex items-center justify-center text-white"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>
          <div>
            <h2 className="text-3xl font-bold text-stone-900 font-playfair">Daftar Fasilitas</h2>
            <p className="text-stone-500 text-sm mt-1">Area fungsional untuk menunjang aktivitas warga.</p>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-20 text-stone-500 w-full">Memuat data fasilitas...</p>
        ) : dataFasilitas.length === 0 ? (
          <div className="bg-white p-12 rounded-sm border border-[#e8e4db] text-stone-500 text-center shadow-sm w-full max-w-3xl mx-auto flex flex-col items-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 text-stone-300"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Belum ada fasilitas yang ditambahkan. Silakan kelola melalui Dashboard Admin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {dataFasilitas.map(item => (
              <div key={item.id} className="bg-white rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] border border-[#e8e4db] overflow-hidden group flex flex-col transition-all duration-300 w-full text-left">
                <div className="h-64 overflow-hidden relative bg-stone-100 w-full">
                  <img src={item.linkGambar} alt={item.nama} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-8 flex flex-col flex-grow relative w-full text-left items-start justify-start">
                  <div className="w-10 h-1 bg-amber-500 rounded-full mb-4"></div>
                  <h3 className="font-bold text-stone-900 text-2xl mb-3 font-playfair m-0">{item.nama}</h3>
                  <p className="text-stone-600 text-base leading-relaxed flex-grow m-0 text-left">{item.deskripsi}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

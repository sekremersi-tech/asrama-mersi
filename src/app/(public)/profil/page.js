"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";

export default function Profil() {
  const [fotoProfil, setFotoProfil] = useState("");
  const [profilText, setProfilText] = useState({ sejarah: "Memuat...", visi: "Memuat...", misi: "Memuat...", nilai1: "Memuat...", nilai2: "Memuat...", nilai3: "Memuat..." });
  const [dataFotoKonteks, setDataFotoKonteks] = useState([]); // Menyimpan foto sisipan
  
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
        }

        // Ambil Foto Profil (Sisipan Cerita)
        const fotoSnap = await getDocs(query(collection(db, "profil_galeri"), orderBy("createdAt", "desc")));
        setDataFotoKonteks(fotoSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) { console.error(error); }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-stone-50 pb-24 w-full text-left">
      
      {/* HEADER HERO */}
      <div className="relative py-24 md:py-32 w-full bg-[#171412] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: fotoProfil ? `url('${fotoProfil}')` : 'none', opacity: fotoProfil ? 1 : 0 }}>
          <div className="absolute inset-0 bg-[#171412]/70 backdrop-blur-[2px]"></div>
        </div>
        <div className="relative z-10 text-center px-4 w-full flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white font-serif tracking-wide mb-4">Profil Asrama</h1>
          <div className="w-12 h-1 bg-amber-500 rounded-full"></div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 w-full flex flex-col gap-10">
        
        {/* SEJARAH */}
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 border border-stone-100 relative overflow-hidden w-full text-left flex flex-col justify-start">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-800 to-amber-500"></div>
          <div className="flex flex-row items-center justify-start gap-4 mb-6 w-full">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex shrink-0 items-center justify-center text-red-800">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
            </div>
            <h2 className="text-3xl font-bold text-stone-900 font-serif m-0">Sejarah Asrama</h2>
          </div>
          <p className="text-stone-600 leading-relaxed text-lg whitespace-pre-line text-justify w-full m-0">{profilText.sejarah}</p>
        </div>

        {/* FOTO SISIPAN (Visual Breaker) */}
        {dataFotoKonteks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-2 mt-2">
            {dataFotoKonteks.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-stone-200 p-3 pb-5 flex flex-col items-center text-center transform hover:-rotate-1 transition-transform">
                <img src={item.linkGambar} className="w-full h-48 object-cover rounded-lg mb-4 bg-stone-100" />
                <p className="text-stone-600 text-sm font-serif italic px-2">"{item.konteks}"</p>
              </div>
            ))}
          </div>
        )}

        {/* VISI, MISI & NILAI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 w-full mt-4">
          <div className="flex flex-col gap-8 w-full">
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-stone-100 hover:border-amber-200 transition-colors w-full text-left flex flex-col">
              <h3 className="text-2xl font-bold text-stone-900 font-serif mb-5 flex flex-row items-center justify-start gap-3 w-full m-0"><span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span> Visi</h3>
              <div className="p-5 bg-[#fdfcf8] rounded-xl border-l-4 border-amber-500 w-full">
                <p className="text-stone-700 italic leading-relaxed text-left whitespace-pre-line m-0">"{profilText.visi}"</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-stone-100 hover:border-red-200 transition-colors w-full text-left flex flex-col">
              <h3 className="text-2xl font-bold text-stone-900 font-serif mb-5 flex flex-row items-center justify-start gap-3 w-full m-0"><span className="w-2 h-2 rounded-full bg-red-800 shrink-0"></span> Misi</h3>
              <div className="p-5 bg-red-50/50 rounded-xl border-l-4 border-red-800 w-full">
                <p className="text-stone-700 leading-relaxed text-left whitespace-pre-line m-0">{profilText.misi}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-8 md:p-10 border border-stone-100 w-full h-full text-left flex flex-col">
            <h3 className="text-2xl font-bold text-stone-900 font-serif mb-8 border-b border-stone-100 pb-4 w-full m-0 text-left">Nilai Kepengasuhan</h3>
            <ul className="flex flex-col gap-8 w-full m-0 p-0">
              <li className="flex flex-row items-start justify-start gap-5 w-full">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex shrink-0 items-center justify-center text-amber-600 font-bold border border-amber-100">1</div>
                <div className="flex flex-col w-full text-left">
                  <h4 className="font-bold text-stone-900 mb-2 text-lg m-0">Sistem Silang</h4>
                  <p className="text-stone-600 text-sm leading-relaxed m-0 text-left">{profilText.nilai1}</p>
                </div>
              </li>
              <li className="flex flex-row items-start justify-start gap-5 w-full">
                <div className="w-10 h-10 rounded-full bg-red-50 flex shrink-0 items-center justify-center text-red-800 font-bold border border-red-100">2</div>
                <div className="flex flex-col w-full text-left">
                  <h4 className="font-bold text-stone-900 mb-2 text-lg m-0">Intelektualitas</h4>
                  <p className="text-stone-600 text-sm leading-relaxed m-0 text-left">{profilText.nilai2}</p>
                </div>
              </li>
              <li className="flex flex-row items-start justify-start gap-5 w-full">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex shrink-0 items-center justify-center text-stone-600 font-bold border border-stone-200">3</div>
                <div className="flex flex-col w-full text-left">
                  <h4 className="font-bold text-stone-900 mb-2 text-lg m-0">Kemandirian</h4>
                  <p className="text-stone-600 text-sm leading-relaxed m-0 text-left">{profilText.nilai3}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* LOKASI & MAPS */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 md:p-12 relative overflow-hidden w-full text-left mt-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center w-full">
            <div className="md:col-span-5 flex flex-col items-start justify-start w-full relative z-10 text-left">
              <div className="flex flex-row items-center justify-start gap-4 mb-6 w-full">
                <div className="relative flex shrink-0 items-center justify-center w-14 h-14">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-30 animate-ping"></span>
                  <div className="relative w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-800 border border-red-100 shadow-sm">
                    <svg className="w-6 h-6 animate-bounce mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-stone-900 font-serif m-0 text-left">Titik Temu</h2>
              </div>
              <p className="text-stone-600 leading-relaxed mb-8 text-lg w-full text-left m-0">Jantung pergerakan dan ruang tumbuh bersama perantau Minang di sudut nyaman Kota Pelajar. Kami selalu terbuka untuk silaturahmi.</p>
              <div className="p-5 bg-stone-50 rounded-xl border border-stone-200 w-full shadow-inner relative overflow-hidden group text-left flex flex-col justify-center">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 group-hover:bg-red-800 transition-colors duration-500"></div>
                <p className="text-sm text-stone-700 font-medium leading-relaxed w-full text-left m-0">Jl. Marga Agung, Karangwaru, Kec. Tegalrejo, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55241</p>
              </div>
            </div>
            <div className="md:col-span-7 w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden relative group shadow-sm border border-stone-200 bg-stone-100 cursor-crosshair">
              <div className="absolute inset-0 bg-stone-900/10 mix-blend-overlay group-hover:opacity-0 transition-opacity duration-700 z-10 pointer-events-none"></div>
              <iframe src="https://maps.google.com/maps?q=Asrama%20Mahasiswa%20Merapi%20Singgalang,%20Yogyakarta&t=&z=17&ie=UTF8&iwloc=&output=embed" className="w-full h-full border-0 grayscale-[30%] opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-105" allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
              <div className="absolute bottom-4 right-4 bg-[#171412] text-amber-500 text-xs font-bold tracking-widest px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20 pointer-events-none shadow-lg border border-stone-700">LOKASI AKTIF</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

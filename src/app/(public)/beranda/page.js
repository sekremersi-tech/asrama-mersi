"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from "firebase/firestore";

export default function Beranda() {
  const [kabarTerbaru, setKabarTerbaru] = useState([]);
  const [bgHero, setBgHero] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const docSnap = await getDoc(doc(db, "pengaturan", "tampilan"));
      if (docSnap.exists() && docSnap.data().hero) setBgHero(docSnap.data().hero);

      const q = query(collection(db, "kehidupan"), orderBy("createdAt", "desc"), limit(3));
      const snapshot = await getDocs(q);
      setKabarTerbaru(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchData();
  }, []);

  return (
    <div className="bg-stone-50">
      
      {/* HERO SECTION KONSISTEN */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-[#171412]">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" 
          style={{ backgroundImage: bgHero ? `url('${bgHero}')` : 'none', opacity: bgHero ? 1 : 0 }}
        >
          <div className="absolute inset-0 bg-[#171412]/70"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">
          <span className="inline-block py-1.5 px-4 rounded-full bg-red-800/90 text-amber-400 text-xs font-bold tracking-widest mb-6 border border-red-700/50 backdrop-blur-sm">ASRAMA MAHASISWA MERAPI SINGGALANG</span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-serif leading-tight">Ranah Minang di <br/><span className="text-amber-500">Serambi Kota Pelajar</span></h1>
          <p className="text-lg md:text-xl text-stone-300 mb-10 font-light max-w-2xl mx-auto">Etalase prestasi, repositori intelektual, dan ruang tumbuh bersama merawat tradisi.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/profil" className="bg-red-800 hover:bg-red-900 text-white px-8 py-3.5 rounded-lg font-semibold shadow-lg shadow-red-900/30 transition-all border border-red-700">Mengenal Asrama</Link>
            <Link href="/kehidupan" className="bg-[#171412]/50 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50 px-8 py-3.5 rounded-lg font-semibold transition-all backdrop-blur-sm">Lihat Media Publikasi</Link>
          </div>
        </div>
      </section>

      {/* KABAR TERBARU */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 font-serif mb-4">Kabar Terbaru</h2>
          <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full"></div>
        </div>
        
        {kabarTerbaru.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 text-stone-500 shadow-sm">Belum ada kabar terbaru.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {kabarTerbaru.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-stone-200 group flex flex-col">
                <div className="h-56 overflow-hidden relative">
                  <span className="absolute top-4 left-4 z-10 bg-red-800 text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider shadow-md">{item.kategori}</span>
                  <img src={item.linkGambar} alt={item.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-stone-900 mb-3 line-clamp-2 group-hover:text-red-800 transition-colors">{item.judul}</h3>
                  <p className="text-stone-600 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">{item.deskripsi}</p>
                  <div className="text-xs text-amber-600 font-bold uppercase tracking-wider">{item.tanggal}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, getDoc, doc } from "firebase/firestore";

export default function Beranda() {
  const [kabarTerbaru, setKabarTerbaru] = useState([]);
  const [bgHero, setBgHero] = useState(""); // Fallback

  useEffect(() => {
    const fetchData = async () => {
      // Ambil Background Hero
      const docSnap = await getDoc(doc(db, "pengaturan", "tampilan"));
      if (docSnap.exists() && docSnap.data().hero) {
        setBgHero(docSnap.data().hero);
      }

      // Ambil 3 Kabar Terbaru
      const q = query(collection(db, "kehidupan"), orderBy("createdAt", "desc"), limit(3));
      const snapshot = await getDocs(q);
      setKabarTerbaru(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO SECTION DENGAN GAMBAR DARI ADMIN */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: bgHero ? `url('${bgHero}')` : 'none', opacity: bgHero ? 1 : 0 }}>
          <div className="absolute inset-0 bg-slate-900/75 mix-blend-multiply"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">
          <span className="inline-block py-1 px-3 rounded-full bg-red-800/80 text-white text-sm font-semibold tracking-wider mb-4">ASRAMA MAHASISWA MERAPI SINGGALANG</span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-serif">Ranah Minang di <br/><span className="text-red-500">Serambi Kota Pelajar</span></h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 font-light">Etalase prestasi, repositori intelektual, dan ruang tumbuh bersama.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/profil" className="bg-red-800 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium shadow-lg">Mengenal Asrama</Link>
            <Link href="/kehidupan" className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-8 py-3 rounded-lg font-medium backdrop-blur-sm">Lihat Kehidupan</Link>
          </div>
        </div>
      </section>

      {/* KABAR TERBARU */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-gray-900 font-serif mb-10 text-center">Kabar Terbaru</h2>
        {kabarTerbaru.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-gray-100 text-gray-500">
            Belum ada kabar terbaru. Silakan tambahkan melalui Dashboard Admin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {kabarTerbaru.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col">
                <div className="h-48 overflow-hidden bg-slate-100 relative">
                  <span className="absolute top-2 left-2 z-10 bg-red-800 text-white text-[10px] font-bold px-2 py-1 rounded">{item.kategori}</span>
                  <img src={item.linkGambar} alt={item.judul} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{item.judul}</h3>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">{item.deskripsi}</p>
                  <div className="text-xs text-gray-400 font-medium">{item.tanggal}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

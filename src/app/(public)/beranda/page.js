"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

export default function Beranda() {
  const [kabarTerbaru, setKabarTerbaru] = useState([]);
  const [jumlahSkripsi, setJumlahSkripsi] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ambil 3 kabar/kegiatan terbaru dari Firebase
        const q = query(collection(db, "kehidupan"), orderBy("createdAt", "desc"), limit(3));
        const snapshot = await getDocs(q);
        setKabarTerbaru(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Ambil jumlah total skripsi untuk statistik
        const skripsiSnap = await getDocs(collection(db, "skripsi"));
        setJumlahSkripsi(skripsiSnap.size);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 1. HERO SECTION */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1920&q=80')" }}>
          <div className="absolute inset-0 bg-slate-900/75 mix-blend-multiply"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">
          <span className="inline-block py-1 px-3 rounded-full bg-red-800/80 text-white text-sm font-semibold tracking-wider mb-4 backdrop-blur-sm">ASRAMA MAHASISWA MERAPI SINGGALANG</span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight font-serif">Ranah Minang di <br/><span className="text-red-500">Serambi Kota Pelajar</span></h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 font-light">Etalase prestasi, repositori intelektual, dan ruang tumbuh bersama yang merawat kehangatan tradisi bagi Uda, Uni, dan Sanak perantau Minangkabau di Yogyakarta.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/profil" className="bg-red-800 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg">Mengenal Asrama</Link>
            <Link href="/alumni" className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-8 py-3 rounded-lg font-medium transition-all backdrop-blur-sm">Lihat Repositori Skripsi</Link>
          </div>
        </div>
      </section>

      {/* 2. STATISTIK DINAMIS (Otomatis dari Firebase) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="bg-white rounded-xl shadow-xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8 border border-gray-100">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-800"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">45+</h3>
            <p className="text-gray-500 font-medium">Warga Aktif</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 border-t md:border-t-0 md:border-l md:border-r border-gray-100">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-800"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">100+</h3>
            <p className="text-gray-500 font-medium">Alumni Berprestasi</p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-800"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{jumlahSkripsi}</h3>
            <p className="text-gray-500 font-medium">Skripsi Terekam</p>
          </div>
        </div>
      </section>

      {/* 3. KABAR TERBARU (Dinamis dari Firebase) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 font-serif mb-2">Kabar Terbaru</h2>
            <p className="text-gray-600">Dinamika dan pencapaian sanak di perantauan.</p>
          </div>
          <Link href="/kehidupan" className="hidden sm:flex items-center gap-2 text-red-800 font-medium hover:text-red-900 transition-colors">
            Lihat Semua 
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
             <svg className="animate-spin h-8 w-8 text-red-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          </div>
        ) : kabarTerbaru.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-gray-100 text-gray-500">
            Belum ada kabar terbaru. Silakan tambahkan melalui Dashboard Admin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {kabarTerbaru.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow border border-gray-100 flex flex-col group">
                <div className="h-48 overflow-hidden relative bg-slate-100">
                  <img src={item.linkGambar} alt={item.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <span className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2 block">{item.kategori}</span>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{item.judul}</h3>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">{item.deskripsi}</p>
                  <div className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    {item.tanggal}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. CALL TO ACTION */}
      <section className="bg-slate-900 py-16 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Mari Berkarya Bersama Kami</h2>
          <p className="text-gray-300 mb-8 leading-relaxed">
            Asrama Mahasiswa Merapi Singgalang bukan sekadar tempat singgah, melainkan kawah candradimuka bagi para intelektual muda Minangkabau untuk saling asah, asih, dan asuh.
          </p>
          <Link href="/profil" className="inline-block bg-red-800 hover:bg-red-700 text-white px-8 py-3 rounded-md font-semibold transition-colors">
            Pelajari Nilai Asrama
          </Link>
        </div>
      </section>
    </div>
  );
}

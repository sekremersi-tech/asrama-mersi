"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function KehidupanAsrama() {
  const [dataKehidupan, setDataKehidupan] = useState([]);
  const [dataFasilitas, setDataFasilitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ambil Fasilitas Tak Terbatas dari Admin
        const fasSnap = await getDocs(query(collection(db, "fasilitas"), orderBy("createdAt", "asc")));
        setDataFasilitas(fasSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Ambil Berita
        const q = query(collection(db, "kehidupan"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        setDataKehidupan(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 font-serif">Kehidupan & Prestasi</h1>
          <p className="text-gray-400 text-lg">Rekam jejak, inovasi, dan fasilitas Asrama Merapi Singgalang.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-12">
        
        {/* BAGIAN FASILITAS DINAMIS */}
        <h2 className="text-2xl font-bold text-slate-900 mb-6 font-serif border-l-4 border-red-800 pl-4">Fasilitas Asrama</h2>
        {dataFasilitas.length === 0 && !loading ? (
           <p className="text-slate-500 mb-16 italic">Belum ada foto fasilitas yang ditambahkan melalui Admin.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {dataFasilitas.map((fasilitas) => (
              <div key={fasilitas.id} className="relative h-64 rounded-xl overflow-hidden group shadow-md border border-gray-100">
                <img src={fasilitas.linkGambar} alt={fasilitas.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent pointer-events-none"></div>
                {/* TEKS DENGAN WARNA KUSTOM DARI ADMIN */}
                <h3 
                  className="absolute bottom-6 left-6 font-bold text-xl drop-shadow-md" 
                  style={{ color: fasilitas.warna || '#ffffff' }}
                >
                  {fasilitas.judul}
                </h3>
              </div>
            ))}
          </div>
        )}

        {/* BAGIAN BERITA */}
        <h2 className="text-2xl font-bold text-slate-900 mb-6 font-serif border-l-4 border-red-800 pl-4">Kabar Terbaru Warga</h2>
        {loading ? (
          <p className="text-center py-10 text-slate-500">Memuat data dari database...</p>
        ) : dataKehidupan.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Belum Ada Publikasi</h3>
            <p className="text-slate-500">Kabar kehidupan dan prestasi asrama akan muncul di sini setelah ditambahkan melalui mode Admin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {dataKehidupan.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="relative h-48 bg-slate-100">
                  <span className="absolute top-4 left-4 z-10 bg-red-800 text-white text-xs font-bold px-3 py-1 rounded-md">{item.kategori}</span>
                  <img src={item.linkGambar} alt={item.judul} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.judul}</h3>
                  <p className="text-slate-600 text-sm mb-4 flex-grow line-clamp-3">{item.deskripsi}</p>
                  <div className="text-xs text-slate-400 font-medium pt-4 border-t">{item.tanggal}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

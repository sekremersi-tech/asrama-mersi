"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";

export default function KehidupanAsrama() {
  const [dataKehidupan, setDataKehidupan] = useState([]);
  const [dataGaleri, setDataGaleri] = useState([]);
  const [bgKehidupan, setBgKehidupan] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapFoto = await getDoc(doc(db, "pengaturan", "tampilan"));
        if (snapFoto.exists() && snapFoto.data().kehidupan) setBgKehidupan(snapFoto.data().kehidupan);

        const galSnap = await getDocs(query(collection(db, "fasilitas"), orderBy("createdAt", "asc")));
        setDataGaleri(galSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const q = query(collection(db, "kehidupan"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        setDataKehidupan(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-stone-50 pb-24">
      
      {/* HEADER HERO KONSISTEN */}
      <div className="relative py-24 md:py-32 w-full bg-[#171412] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" 
          style={{ backgroundImage: bgKehidupan ? `url('${bgKehidupan}')` : 'none', opacity: bgKehidupan ? 1 : 0 }}
        >
          <div className="absolute inset-0 bg-[#171412]/70 backdrop-blur-[2px]"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif">Media dan Publikasi</h1>
          <p className="text-stone-300 text-lg max-w-2xl mx-auto">Rekam jejak, inovasi, dan potret keseharian warga Asrama Merapi Singgalang.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-8 bg-amber-500 rounded-full"></div>
          <h2 className="text-2xl md:text-3xl font-bold text-stone-900 font-serif">Galeri Kegiatan Asrama</h2>
        </div>

        {dataGaleri.length === 0 && !loading ? (
           <div className="bg-white p-8 rounded-2xl border border-stone-200 text-stone-500 text-center shadow-sm mb-20">Belum ada foto galeri kegiatan yang diunggah.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {dataGaleri.map((item) => (
              <div key={item.id} className="relative h-72 rounded-2xl overflow-hidden group shadow-md border border-stone-200">
                <img src={item.linkGambar} alt={item.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#171412] via-[#171412]/20 to-transparent pointer-events-none"></div>
                <h3 className="absolute bottom-6 left-6 right-6 font-bold text-xl drop-shadow-lg" style={{ color: item.warna || '#ffffff' }}>{item.judul}</h3>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-8 bg-red-800 rounded-full"></div>
          <h2 className="text-2xl md:text-3xl font-bold text-stone-900 font-serif">Kabar Terbaru Warga</h2>
        </div>

        {loading ? (
          <p className="text-center py-10 text-stone-500">Memuat data dari database...</p>
        ) : dataKehidupan.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-stone-200 text-stone-500 text-center shadow-sm">Belum ada kabar publikasi.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {dataKehidupan.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col hover:shadow-xl hover:border-amber-200 transition-all duration-300">
                <div className="relative h-56 bg-stone-100">
                  <span className="absolute top-4 left-4 z-10 bg-red-800 text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider shadow-md">{item.kategori}</span>
                  <img src={item.linkGambar} alt={item.judul} className="w-full h-full object-cover" />
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-stone-900 mb-3">{item.judul}</h3>
                  <p className="text-stone-600 text-sm mb-6 flex-grow line-clamp-3 leading-relaxed">{item.deskripsi}</p>
                  <div className="text-xs text-amber-600 font-bold uppercase tracking-wider">{item.tanggal}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

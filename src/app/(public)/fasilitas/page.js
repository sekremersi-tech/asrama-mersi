"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";

export default function FasilitasAsrama() {
  const [bgFasilitas, setBgFasilitas] = useState("");
  const [dataFasilitas, setDataFasilitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapFoto = await getDoc(doc(db, "pengaturan", "tampilan"));
        if (snapFoto.exists() && snapFoto.data().fasilitas) setBgFasilitas(snapFoto.data().fasilitas);

        const fasSnap = await getDocs(query(collection(db, "daftar_fasilitas"), orderBy("createdAt", "asc")));
        setDataFasilitas(fasSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-stone-50 pb-24 min-h-screen">
      
      {/* HEADER HERO */}
      <div className="relative py-24 md:py-32 w-full bg-[#171412] flex flex-col items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" 
          style={{ backgroundImage: bgFasilitas ? `url('${bgFasilitas}')` : 'none', opacity: bgFasilitas ? 1 : 0 }}
        >
          <div className="absolute inset-0 bg-[#171412]/70 backdrop-blur-[2px]"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif">Fasilitas Asrama</h1>
          <p className="text-stone-300 text-lg max-w-2xl mx-auto">Ruang nyaman dan sarana memadai untuk menunjang kehidupan serta produktivitas warga perantau.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-16">
        {loading ? (
          <p className="text-center py-20 text-stone-500">Memuat data fasilitas...</p>
        ) : dataFasilitas.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-stone-200 text-stone-500 text-center shadow-sm w-full max-w-3xl mx-auto">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-stone-300"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Belum ada fasilitas yang ditambahkan. Silakan kelola melalui Dashboard Admin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {dataFasilitas.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-stone-200 overflow-hidden group flex flex-col transition-all duration-300">
                <div className="h-64 overflow-hidden relative bg-stone-100">
                  <img src={item.linkGambar} alt={item.nama} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-8 flex flex-col flex-grow relative">
                  <div className="w-10 h-1 bg-amber-500 rounded-full mb-4"></div>
                  <h3 className="font-bold text-stone-900 text-2xl mb-3 font-serif">{item.nama}</h3>
                  <p className="text-stone-600 text-base leading-relaxed flex-grow">{item.deskripsi}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

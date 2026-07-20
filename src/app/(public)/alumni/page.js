"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";

export default function JaringanAlumni() {
  const [daftarSkripsi, setDaftarSkripsi] = useState([]);
  const [bgAlumni, setBgAlumni] = useState("");
  const [jejakText, setJejakText] = useState("Memuat jejak alumni...");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapFoto = await getDoc(doc(db, "pengaturan", "tampilan"));
        if (snapFoto.exists() && snapFoto.data().alumni) setBgAlumni(snapFoto.data().alumni);

        const snapText = await getDoc(doc(db, "pengaturan", "profilText"));
        if (snapText.exists() && snapText.data().jejakAlumni) setJejakText(snapText.data().jejakAlumni);

        const q = query(collection(db, "skripsi"), orderBy("tahun", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setDaftarSkripsi(data);
      } catch (error) { console.error("Gagal mengambil data:", error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filteredSkripsi = daftarSkripsi.filter((skripsi) => {
    const term = searchTerm.toLowerCase();
    return (
      (skripsi.judul && skripsi.judul.toLowerCase().includes(term)) ||
      (skripsi.nama && skripsi.nama.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* Header Dinamis dengan Fade-in Penuh */}
      <div className="relative py-16 md:py-24 w-full bg-slate-900 flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" 
          style={{ 
            backgroundImage: bgAlumni ? `url('${bgAlumni}')` : 'none',
            opacity: bgAlumni ? 1 : 0 
          }}
        >
          {/* Lapisan tipis agar teks terbaca */}
          <div className="absolute inset-0 bg-slate-900/50"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 font-serif">Jaringan Alumni</h1>
          <p className="text-gray-300 text-lg">Jejak profesional dan repositori karya ilmiah warga asrama.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 font-serif border-l-4 border-red-800 pl-4">Jejak Alumni</h2>
          <p className="text-gray-600 leading-relaxed text-lg text-justify whitespace-pre-line">
            {jejakText}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-800">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 font-serif">Repositori Skripsi Warga</h2>
            </div>
            <div className="relative w-full md:w-72">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Cari judul atau nama..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800 text-sm bg-white text-gray-900" 
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-sm uppercase tracking-wider text-gray-500">
                  <th className="p-6 font-semibold">Tahun</th>
                  <th className="p-6 font-semibold">Nama & Jurusan</th>
                  <th className="p-6 font-semibold">Judul Skripsi / Tugas Akhir</th>
                  <th className="p-6 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-red-800 animate-spin mx-auto mb-4">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                      </svg>
                      <p className="text-gray-500">Memuat data repositori...</p>
                    </td>
                  </tr>
                ) : filteredSkripsi.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-gray-500">
                      Belum ada data skripsi yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredSkripsi.map((skripsi) => (
                    <tr key={skripsi.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-6 text-gray-900 font-medium whitespace-nowrap">{skripsi.tahun}</td>
                      <td className="p-6">
                        <div className="font-bold text-gray-900">{skripsi.nama}</div>
                        <div className="text-sm text-gray-500">{skripsi.jurusan}</div>
                      </td>
                      <td className="p-6 text-gray-700 leading-relaxed min-w-[300px]">
                        {skripsi.judul}
                      </td>
                      <td className="p-6 text-center align-middle">
                        {skripsi.linkPDF && skripsi.linkPDF !== "#" ? (
                          <a href={skripsi.linkPDF} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-red-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" x2="12" y1="15" y2="3"></line>
                            </svg>
                            PDF
                          </a>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-500 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap cursor-not-allowed">
                            Tidak Tersedia
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 text-center text-sm text-gray-500 border-t border-gray-100">
            Menampilkan {filteredSkripsi.length} dokumen tersimpan.
          </div>
        </div>
      </div>
    </div>
  );
}

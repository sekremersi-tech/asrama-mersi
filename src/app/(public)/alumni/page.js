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
        const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setDaftarSkripsi(data);
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filteredSkripsi = daftarSkripsi.filter((skripsi) => {
    const term = searchTerm.toLowerCase();
    return ((skripsi.judul && skripsi.judul.toLowerCase().includes(term)) || (skripsi.nama && skripsi.nama.toLowerCase().includes(term)));
  });

  return (
    <div className="bg-stone-50 pb-24">
      
      {/* HEADER HERO KONSISTEN */}
      <div className="relative py-24 md:py-32 w-full bg-[#171412] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" 
          style={{ backgroundImage: bgAlumni ? `url('${bgAlumni}')` : 'none', opacity: bgAlumni ? 1 : 0 }}
        >
          <div className="absolute inset-0 bg-[#171412]/70 backdrop-blur-[2px]"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif">Jaringan Alumni</h1>
          <p className="text-stone-300 text-lg max-w-2xl mx-auto">Jejak profesional dan repositori karya ilmiah warga asrama.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        
        <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100 p-8 md:p-12 mb-16 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-800"></div>
          <h2 className="text-2xl font-bold text-stone-900 mb-5 font-serif">Jejak Alumni</h2>
          <p className="text-stone-600 leading-relaxed text-lg text-justify whitespace-pre-line">{jejakText}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-stone-200 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-stone-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#fcfbf8]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              </div>
              <h2 className="text-2xl font-bold text-stone-900 font-serif">Repositori Skripsi Warga</h2>
            </div>
            <div className="relative w-full md:w-80">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" x2="16.65" y1="21" y2="16.65"></line></svg>
              <input type="text" placeholder="Cari judul atau nama penulis..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white text-stone-900 shadow-sm" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-widest text-stone-500">
                  <th className="p-6 font-bold">Tahun</th>
                  <th className="p-6 font-bold">Penulis & Jurusan</th>
                  <th className="p-6 font-bold">Judul Karya Ilmiah</th>
                  <th className="p-6 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr><td colSpan="4" className="p-16 text-center text-stone-500">Memuat data repositori...</td></tr>
                ) : filteredSkripsi.length === 0 ? (
                  <tr><td colSpan="4" className="p-16 text-center text-stone-500">Belum ada skripsi yang ditemukan.</td></tr>
                ) : (
                  filteredSkripsi.map((skripsi) => (
                    <tr key={skripsi.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="p-6 text-stone-900 font-bold text-lg">{skripsi.tahun}</td>
                      <td className="p-6">
                        <div className="font-bold text-stone-900 mb-1">{skripsi.nama}</div>
                        <div className="text-sm text-stone-500">{skripsi.jurusan}</div>
                      </td>
                      <td className="p-6 text-stone-700 leading-relaxed min-w-[300px] text-sm">{skripsi.judul}</td>
                      <td className="p-6 text-center align-middle">
                        {skripsi.linkPDF && skripsi.linkPDF !== "#" ? (
                          <a href={skripsi.linkPDF} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-[#171412] hover:bg-red-800 text-amber-500 hover:text-white border border-stone-800 hover:border-red-800 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-md">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>
                            Buka PDF
                          </a>
                        ) : (
                          <span className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-wide text-stone-400 bg-stone-100 rounded-lg cursor-not-allowed">Tidak Ada File</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-5 bg-[#fcfbf8] text-center text-xs font-bold uppercase tracking-widest text-stone-400 border-t border-stone-200">
            Total Arsip: {filteredSkripsi.length} Dokumen
          </div>
        </div>
      </div>
    </div>
  );
}

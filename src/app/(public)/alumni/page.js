"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";

export default function JaringanAlumni() {
  const [daftarSkripsi, setDaftarSkripsi] = useState([]);
  const [bgAlumni, setBgAlumni] = useState("");
  const [jejakText, setJejakText] = useState("Memuat jejak alumni...");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedSkripsi, setSelectedSkripsi] = useState(null);
  const [formData, setFormData] = useState({ nama: "", noHp: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapFoto = await getDoc(doc(db, "pengaturan", "tampilan"));
        if (snapFoto.exists() && snapFoto.data().alumni) setBgAlumni(snapFoto.data().alumni);
        const snapText = await getDoc(doc(db, "pengaturan", "profilText"));
        if (snapText.exists() && snapText.data().jejakAlumni) setJejakText(snapText.data().jejakAlumni);
        const q = query(collection(db, "skripsi"), orderBy("tahun", "desc"));
        const querySnapshot = await getDocs(q);
        setDaftarSkripsi(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filteredSkripsi = daftarSkripsi.filter((skripsi) => {
    const term = searchTerm.toLowerCase();
    return ((skripsi.judul && skripsi.judul.toLowerCase().includes(term)) || (skripsi.nama && skripsi.nama.toLowerCase().includes(term)));
  });

  const handleBukaPDF = (skripsi) => {
    setSelectedSkripsi(skripsi);
    setShowModal(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "log_unduh_skripsi"), {
        namaPengunduh: formData.nama, noHpPengunduh: formData.noHp, emailPengunduh: formData.email,
        judulSkripsi: selectedSkripsi.judul, penulisSkripsi: selectedSkripsi.nama, waktuAkses: serverTimestamp()
      });
      window.open(selectedSkripsi.linkPDF, "_blank");
      setShowModal(false); setFormData({ nama: "", noHp: "", email: "" });
    } catch (error) { alert("Terjadi kesalahan sistem. Silakan coba lagi."); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="bg-[#f9f8f6] pb-24 font-lora">
      
      {/* POPUP MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 transition-opacity">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-stone-200 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-4">
              <h3 className="font-playfair font-bold text-2xl text-stone-900">Verifikasi Akses</h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-red-600 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <p className="text-sm text-stone-600 mb-6 leading-relaxed">Untuk menjaga keamanan karya intelektual, mohon isi identitas Anda sebelum membaca dokumen ini.</p>
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div><label className="text-xs font-bold text-stone-800 uppercase tracking-widest block mb-1 font-sans">Nama Lengkap</label><input type="text" required value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-sans text-sm" placeholder="Masukkan nama..." /></div>
              <div><label className="text-xs font-bold text-stone-800 uppercase tracking-widest block mb-1 font-sans">Nomor HP/WhatsApp</label><input type="tel" required value={formData.noHp} onChange={(e) => setFormData({...formData, noHp: e.target.value})} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-sans text-sm" placeholder="0812xxxxxx" /></div>
              <div><label className="text-xs font-bold text-stone-800 uppercase tracking-widest block mb-1 font-sans">Email Aktif</label><input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-sans text-sm" placeholder="email@contoh.com" /></div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-[#171412] hover:bg-amber-600 text-white font-playfair font-bold text-lg py-3 rounded-lg transition-colors mt-2">{isSubmitting ? "Memproses..." : "Lanjutkan & Baca Skripsi"}</button>
            </form>
          </div>
        </div>
      )}

      {/* HEADER HERO */}
      <div className="relative py-28 md:py-36 w-full bg-[#171412] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: bgAlumni ? `url('${bgAlumni}')` : 'none', opacity: bgAlumni ? 0.8 : 0 }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#171412] via-[#171412]/80 to-[#171412]/40 backdrop-blur-[1px]"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-playfair drop-shadow-lg">Jaringan Alumni</h1>
          <div className="w-16 h-1.5 bg-amber-500 mx-auto rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        
        {/* TITIK JANGKAR 1: JEJAK ALUMNI (DENGAN KELAS REVEAL ANIMASI) */}
        <div id="jejak" className="bg-[#fcfbf9] rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] border border-[#e8e4db] p-8 md:p-12 mb-16 relative overflow-hidden scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-800"></div>
          <h2 className="text-3xl font-bold text-stone-900 mb-5 font-playfair">Jejak Alumni</h2>
          <p className="text-stone-600 leading-relaxed text-lg text-justify whitespace-pre-line">{jejakText}</p>
        </div>

        {/* TITIK JANGKAR 2: REPOSITORI SKRIPSI (DENGAN KELAS REVEAL ANIMASI) */}
        <div id="repositori" className="bg-[#fcfbf9] rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] border border-[#e8e4db] overflow-hidden scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out delay-200">
          <div className="p-6 md:p-8 border-b border-[#e8e4db] flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 border border-amber-100"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg></div>
              <h2 className="text-2xl font-bold text-stone-900 font-playfair">Repositori Skripsi</h2>
            </div>
            <div className="relative w-full md:w-80 font-sans">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" x2="16.65" y1="21" y2="16.65"></line></svg>
              <input type="text" placeholder="Cari judul atau nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-stone-50 text-stone-900" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-stone-50 border-b border-[#e8e4db] text-xs uppercase tracking-widest text-stone-500">
                  <th className="p-6 font-bold">Tahun</th>
                  <th className="p-6 font-bold">Penulis & Jurusan</th>
                  <th className="p-6 font-bold w-1/2">Judul Karya Ilmiah</th>
                  <th className="p-6 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e4db]">
                {loading ? (
                  <tr><td colSpan="4" className="p-16 text-center text-stone-500 font-lora">Memuat data repositori...</td></tr>
                ) : filteredSkripsi.length === 0 ? (
                  <tr><td colSpan="4" className="p-16 text-center text-stone-500 font-lora">Belum ada skripsi yang ditemukan.</td></tr>
                ) : (
                  filteredSkripsi.map((skripsi) => (
                    <tr key={skripsi.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="p-6 text-stone-900 font-bold text-lg font-playfair">{skripsi.tahun}</td>
                      <td className="p-6">
                        <div className="font-bold text-stone-900 mb-1">{skripsi.nama}</div>
                        <div className="text-sm text-stone-500">{skripsi.jurusan}</div>
                      </td>
                      <td className="p-6 text-stone-700 leading-relaxed text-sm font-lora">{skripsi.judul}</td>
                      <td className="p-6 text-center align-middle">
                        {skripsi.linkPDF && skripsi.linkPDF !== "#" ? (
                          <button onClick={() => handleBukaPDF(skripsi)} className="inline-flex items-center justify-center gap-2 bg-[#171412] hover:bg-amber-600 text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wide transition-all shadow-md w-max">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg> Buka PDF
                          </button>
                        ) : (
                          <span className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-wide text-stone-400 bg-stone-100 rounded cursor-not-allowed">Tidak Ada File</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

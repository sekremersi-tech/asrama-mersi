"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp, where, doc, getDoc } from "firebase/firestore";

const HeroSlider = ({ images, title }) => {
  const imgArray = Array.isArray(images) ? images : (images ? [images] : []);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (imgArray.length <= 1) return;
    const timer = setInterval(() => setIdx(p => (p + 1) % imgArray.length), 4000);
    return () => clearInterval(timer);
  }, [imgArray.length]);

  return (
    <div className="relative py-28 md:py-36 w-full bg-[#171412] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 w-full h-full bg-[#171412]">
        {imgArray.map((bg, i) => (
          <div key={i} className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${i === idx ? 'opacity-70' : 'opacity-0'}`} style={{ backgroundImage: `url('${bg}')` }}></div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#171412] via-[#171412]/80 to-[#171412]/40 backdrop-blur-[1px]"></div>
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-playfair drop-shadow-lg">{title}</h1>
        <div className="w-16 h-1.5 bg-amber-500 mx-auto rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
      </div>
    </div>
  );
};

export default function JejakPrestasi() {
  const [bgAlumni, setBgAlumni] = useState([]);
  const [profilText, setProfilText] = useState({ jejakAlumni: "" });
  const [dataPrestasi, setDataPrestasi] = useState([]);
  const [dataSkripsi, setDataSkripsi] = useState([]);
  const [loading, setLoading] = useState(true);

  // STATE MODAL PRESTASI
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalImageIdx, setModalImageIdx] = useState(0);
  const [komentarList, setKomentarList] = useState([]);
  const [formKomen, setFormKomen] = useState({ nama: "", isi: "" });
  const [isSubmittingKomen, setIsSubmittingKomen] = useState(false);

  // STATE PAGINASI LIST PRESTASI
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animDirection, setAnimDirection] = useState("");
  const itemsPerPage = 10;

  // STATE MODAL UNDUH SKRIPSI
  const [showSkripsiModal, setShowSkripsiModal] = useState(false);
  const [selectedSkripsi, setSelectedSkripsi] = useState(null);
  const [formUnduh, setFormUnduh] = useState({ namaPengunduh: "", emailPengunduh: "", noHpPengunduh: "" });
  const [isSubmittingUnduh, setIsSubmittingUnduh] = useState(false);

  // STATE PENCARIAN & PAGINASI SKRIPSI
  const [searchSkripsi, setSearchSkripsi] = useState("");
  const [skripsiPage, setSkripsiPage] = useState(0);
  const [isSkripsiAnimating, setIsSkripsiAnimating] = useState(false);
  const [skripsiAnimDirection, setSkripsiAnimDirection] = useState("");
  const skripsiPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapFoto = await getDoc(doc(db, "pengaturan", "tampilan"));
        if (snapFoto.exists() && snapFoto.data().alumni) setBgAlumni(snapFoto.data().alumni);
        
        const snapText = await getDoc(doc(db, "pengaturan", "profilText"));
        if (snapText.exists()) setProfilText(snapText.data());

        const berSnap = await getDocs(query(collection(db, "kehidupan"), orderBy("createdAt", "desc")));
        const allBerita = berSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const prestasiData = allBerita.filter(item => item.kategori === "PRESTASI");
        setDataPrestasi(prestasiData);

        const skrSnap = await getDocs(query(collection(db, "skripsi"), orderBy("tahun", "desc")));
        setDataSkripsi(skrSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // RESET HALAMAN SKRIPSI KE AWAL SAAT PENCARIAN BERUBAH
  useEffect(() => {
    setSkripsiPage(0);
  }, [searchSkripsi]);

  // FUNGSI PAGINASI LIST PRESTASI
  const changePage = (newIndex, direction) => {
    if (newIndex >= 0 && newIndex < Math.ceil(dataPrestasi.length / itemsPerPage)) {
      setAnimDirection(direction);
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPage(newIndex);
        setIsAnimating(false);
      }, 400); 
    }
  };

  // FUNGSI PAGINASI LIST SKRIPSI
  const changeSkripsiPage = (newIndex, direction) => {
    // Kita filter data dulu agar max halamannya akurat
    const filteredLength = dataSkripsi.filter(item => {
      const q = searchSkripsi.toLowerCase();
      return item.judul?.toLowerCase().includes(q) || item.nama?.toLowerCase().includes(q) || item.tahun?.toString().includes(q) || item.jurusan?.toLowerCase().includes(q);
    }).length;

    if (newIndex >= 0 && newIndex < Math.ceil(filteredLength / skripsiPerPage)) {
      setSkripsiAnimDirection(direction);
      setIsSkripsiAnimating(true);
      setTimeout(() => {
        setSkripsiPage(newIndex);
        setIsSkripsiAnimating(false);
      }, 400); 
    }
  };

  const openModal = async (item) => { 
    setSelectedItem(item); setModalImageIdx(0); document.body.style.overflow = "hidden"; 
    setKomentarList([]); setFormKomen({ nama: "", isi: "" }); 
    try {
      const targetId = String(item.id);
      const q = query(collection(db, "komentar_publikasi"), where("postId", "==", targetId));
      const snap = await getDocs(q);
      let comments = snap.docs.map(d => ({id: d.id, ...d.data()}));
      comments.sort((a, b) => (a.waktu?.toMillis() || 0) - (b.waktu?.toMillis() || 0));
      setKomentarList(comments);
    } catch(e) { console.error(e); }
  };

  const closeModal = () => { setSelectedItem(null); setKomentarList([]); setFormKomen({ nama: "", isi: "" }); document.body.style.overflow = "auto"; };
  
  const submitKomentar = async (e) => {
    e.preventDefault();
    if (!formKomen.isi.trim()) return;
    setIsSubmittingKomen(true);
    try {
      const targetId = String(selectedItem.id);
      const newKomen = { postId: targetId, nama: formKomen.nama.trim() || "Anonim", isi: formKomen.isi.trim(), waktu: serverTimestamp() };
      const docRef = await addDoc(collection(db, "komentar_publikasi"), newKomen);
      setKomentarList([...komentarList, {id: docRef.id, ...newKomen, waktu: { toDate: () => new Date() } }]);
      setFormKomen({nama: "", isi: ""});
    } catch (err) { alert("Gagal mengirim komentar!"); } finally { setIsSubmittingKomen(false); }
  };

  const handleUnduhSkripsi = async (e) => {
    e.preventDefault();
    setIsSubmittingUnduh(true);
    try {
      await addDoc(collection(db, "log_unduh_skripsi"), {
        ...formUnduh,
        skripsiId: selectedSkripsi.id,
        judulSkripsi: selectedSkripsi.judul,
        penulisSkripsi: selectedSkripsi.nama,
        waktuAkses: serverTimestamp()
      });
      window.open(selectedSkripsi.linkPDF, "_blank");
      setShowSkripsiModal(false);
      setFormUnduh({ namaPengunduh: "", emailPengunduh: "", noHpPengunduh: "" });
      document.body.style.overflow = "auto";
    } catch (error) { alert("Gagal memproses unduhan."); } finally { setIsSubmittingUnduh(false); }
  };

  const modalImages = selectedItem ? (Array.isArray(selectedItem.linkGambar) ? selectedItem.linkGambar : [selectedItem.linkGambar]) : [];
  const nextModalImage = (e) => { e.stopPropagation(); setModalImageIdx((prev) => (prev + 1) % modalImages.length); };
  const prevModalImage = (e) => { e.stopPropagation(); setModalImageIdx((prev) => (prev - 1 + modalImages.length) % modalImages.length); };

  const totalPages = Math.ceil(dataPrestasi.length / itemsPerPage);
  const currentDataPrestasi = dataPrestasi.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  // LOGIKA PENCARIAN SKRIPSI
  const filteredSkripsi = dataSkripsi.filter(item => {
    const q = searchSkripsi.toLowerCase();
    return (
      item.judul?.toLowerCase().includes(q) ||
      item.nama?.toLowerCase().includes(q) ||
      item.tahun?.toString().includes(q) ||
      item.jurusan?.toLowerCase().includes(q)
    );
  });

  const totalSkripsiPages = Math.ceil(filteredSkripsi.length / skripsiPerPage);
  const currentDataSkripsi = filteredSkripsi.slice(skripsiPage * skripsiPerPage, (skripsiPage + 1) * skripsiPerPage);

  return (
    <div className="bg-[#f9f8f6] pb-24 font-lora relative overflow-x-hidden">
      <style jsx global>{`
        .slide-next-out { animation: slideNextOut 0.4s forwards ease-in-out; }
        .slide-next-in { animation: slideNextIn 0.4s forwards ease-in-out; }
        .slide-prev-out { animation: slidePrevOut 0.4s forwards ease-in-out; }
        .slide-prev-in { animation: slidePrevIn 0.4s forwards ease-in-out; }
        @keyframes slideNextOut { to { transform: translateX(-50px); opacity: 0; } }
        @keyframes slideNextIn { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slidePrevOut { to { transform: translateX(50px); opacity: 0; } }
        @keyframes slidePrevIn { from { transform: translateX(-50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>

      {/* MODAL POP-UP PRESTASI */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease-out]" onClick={closeModal}>
          <button onClick={closeModal} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-black/50 p-2 rounded-full z-50"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-sm overflow-hidden flex flex-col md:flex-row shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className={`relative w-full md:w-3/5 bg-stone-900 h-64 md:h-[80vh] flex items-center justify-center shrink-0 group`}>
              <img src={modalImages[modalImageIdx]} className="max-w-full max-h-full object-contain drop-shadow-2xl" alt="Preview" />
              {modalImages.length > 1 && (
                <>
                  <button onClick={prevModalImage} className="absolute left-4 bg-black/50 hover:bg-amber-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
                  <button onClick={nextModalImage} className="absolute right-4 bg-black/50 hover:bg-amber-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
                  <div className="absolute bottom-4 bg-black/60 px-4 py-1.5 rounded-full text-white text-xs tracking-widest font-bold font-sans">{modalImageIdx + 1} / {modalImages.length}</div>
                </>
              )}
            </div>

            <div className={`w-full md:w-2/5 p-8 md:p-10 flex flex-col bg-[#fcfbf9] overflow-y-auto max-h-[50vh] md:max-h-[80vh]`}>
              <div className="flex items-center gap-3 mb-4"><span className="text-xs font-bold tracking-widest uppercase text-red-800 bg-red-50 px-3 py-1 rounded-sm font-sans">{selectedItem.kategori}</span><span className="text-xs text-stone-500 font-sans">{selectedItem.tanggal}</span></div>
              <h2 className="text-3xl font-bold font-playfair text-stone-900 mb-6 leading-snug">{selectedItem.judul}</h2>
              <div className="w-10 h-1 bg-amber-500 mb-6 rounded-full"></div>
              <p className="text-stone-700 leading-relaxed text-base whitespace-pre-line">{selectedItem.deskripsi}</p>
              
              <div className="mt-8 pt-8 border-t border-stone-200 font-sans">
                <h3 className="font-playfair font-bold text-xl text-stone-900 mb-4">Komentar ({komentarList.length})</h3>
                <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                  {komentarList.length === 0 ? <p className="text-sm text-stone-500 italic">Belum ada diskusi. Ada pertanyaan?</p> : (
                    komentarList.map(k => (
                      <div key={k.id} className="bg-white p-4 rounded border border-stone-100 shadow-sm">
                        <div className="flex justify-between items-center mb-1"><span className="font-bold text-sm text-stone-900">{k.nama}</span><span className="text-[10px] text-stone-400">{k.waktu?.toDate ? k.waktu.toDate().toLocaleDateString('id-ID') : 'Baru saja'}</span></div>
                        <p className="text-sm text-stone-600">{k.isi}</p>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={submitKomentar} className="space-y-3 bg-stone-50 p-4 rounded border border-stone-200">
                  <input type="text" value={formKomen.nama} onChange={e => setFormKomen({...formKomen, nama: e.target.value})} placeholder="Nama (Opsional / Anonim)" className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900" />
                  <textarea required value={formKomen.isi} onChange={e => setFormKomen({...formKomen, isi: e.target.value})} placeholder="Tulis ucapan selamat/komentar..." rows="2" className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"></textarea>
                  <button type="submit" disabled={isSubmittingKomen} className="bg-stone-900 text-white text-xs font-bold px-4 py-2 rounded hover:bg-amber-600 transition-colors w-full">{isSubmittingKomen ? 'Mengirim...' : 'Kirim Komentar'}</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UNDUH SKRIPSI */}
      {showSkripsiModal && selectedSkripsi && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease-out]" onClick={() => {setShowSkripsiModal(false); document.body.style.overflow = "auto";}}>
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full border-t-4 border-red-800" onClick={e => e.stopPropagation()}>
            <h3 className="font-playfair text-2xl font-bold text-stone-900 mb-2">Akses Skripsi</h3>
            <p className="text-sm text-stone-500 mb-6 pb-4 border-b border-stone-100">Silakan isi data diri Anda untuk mengunduh karya tulis ini. Data digunakan untuk keperluan pendataan perpustakaan asrama.</p>
            <form onSubmit={handleUnduhSkripsi} className="space-y-4 font-sans">
              <div><label className="text-xs font-bold text-stone-600 uppercase tracking-widest block mb-1">Nama Lengkap</label><input type="text" required value={formUnduh.namaPengunduh} onChange={(e) => setFormUnduh({...formUnduh, namaPengunduh: e.target.value})} className="w-full px-4 py-2 border border-stone-200 rounded focus:ring-2 focus:ring-red-800 focus:outline-none text-sm" placeholder="Nama..." /></div>
              <div><label className="text-xs font-bold text-stone-600 uppercase tracking-widest block mb-1">Email Aktif</label><input type="email" required value={formUnduh.emailPengunduh} onChange={(e) => setFormUnduh({...formUnduh, emailPengunduh: e.target.value})} className="w-full px-4 py-2 border border-stone-200 rounded focus:ring-2 focus:ring-red-800 focus:outline-none text-sm" placeholder="Email..." /></div>
              <div><label className="text-xs font-bold text-stone-600 uppercase tracking-widest block mb-1">Nomor WA / HP</label><input type="tel" required value={formUnduh.noHpPengunduh} onChange={(e) => setFormUnduh({...formUnduh, noHpPengunduh: e.target.value})} className="w-full px-4 py-2 border border-stone-200 rounded focus:ring-2 focus:ring-red-800 focus:outline-none text-sm" placeholder="Nomor HP..." /></div>
              <button type="submit" disabled={isSubmittingUnduh} className="w-full bg-[#171412] hover:bg-red-800 text-white font-bold py-3 rounded transition-colors mt-2">{isSubmittingUnduh ? "Memproses..." : "Unduh Dokumen"}</button>
            </form>
          </div>
        </div>
      )}

      <HeroSlider images={bgAlumni} title="Jejak & Prestasi" />

      {/* 1. JEJAK ALUMNI (TEKS) */}
      <div id="jejak" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-stone-900 font-playfair mb-4">Jejak Alumni</h2>
          <div className="w-12 h-1 bg-red-800 mx-auto rounded-full"></div>
        </div>
        <div className="bg-white p-8 md:p-12 rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] border border-[#e8e4db]">
          <p className="text-stone-600 leading-relaxed text-lg text-center whitespace-pre-line font-lora italic">
            {loading ? "Memuat catatan jejak alumni..." : `"${profilText.jejakAlumni}"`}
          </p>
        </div>
      </div>

      {/* 2. LIST PRESTASI (KERTAS BERTUMPUK DENGAN ANIMASI GESER) */}
      <div id="prestasi" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 mb-24 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="text-center mb-10">
          <h4 className="text-amber-600 font-bold tracking-widest text-xs uppercase font-sans mb-3">Tinta Emas</h4>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 font-playfair mb-4">Daftar Prestasi Warga</h2>
          <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full"></div>
        </div>
        
        {loading ? <p className="text-center text-stone-500">Memuat data prestasi...</p> : dataPrestasi.length === 0 ? <p className="text-center text-stone-500 bg-white p-12 border border-[#e8e4db] rounded-sm shadow-sm">Belum ada catatan prestasi.</p> : (
          <div className="relative mt-12 perspective-1000">
            <div className="absolute inset-0 bg-[#e8e4db] transform translate-y-4 -rotate-1 rounded-sm shadow-md"></div>
            <div className="absolute inset-0 bg-[#f4f2ec] transform translate-y-2 rotate-1 rounded-sm shadow-md"></div>
            
            <div className={`relative bg-[#fcfbf9] p-8 md:p-14 rounded-sm shadow-2xl border border-[#e8e4db] z-10 flex flex-col min-h-[500px] ${isAnimating ? (animDirection === 'next' ? 'slide-next-out' : 'slide-prev-out') : (animDirection === 'next' ? 'slide-next-in' : (animDirection === 'prev' ? 'slide-prev-in' : ''))}`}>
              <div className="flex justify-between items-center mb-8 border-b border-[#e8e4db] pb-4">
                <span className="text-amber-600 font-bold font-sans tracking-widest uppercase text-xs">Halaman {currentPage + 1}</span>
                <h3 className="text-2xl font-bold text-stone-900 font-playfair">Catatan Prestasi</h3>
              </div>
              
              <div className="flex-grow">
                <ul className="divide-y divide-stone-200 border-b border-stone-200">
                  {currentDataPrestasi.map((item, idx) => {
                    const noUrut = (currentPage * itemsPerPage) + idx + 1;
                    return (
                      <li key={item.id} onClick={() => openModal(item)} className="py-5 px-4 md:px-6 hover:bg-white group cursor-pointer transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex gap-4 md:gap-6 items-start md:items-center w-full">
                          <span className="font-playfair text-xl md:text-2xl text-stone-300 font-bold min-w-[30px]">{noUrut}.</span>
                          <div className="flex-grow">
                            <h4 className="font-bold text-stone-900 text-lg md:text-xl group-hover:text-red-800 transition-colors leading-tight mb-1">{item.judul}</h4>
                            <p className="text-sm text-stone-500 font-sans">{item.tanggal}</p>
                          </div>
                        </div>
                        <span className="hidden md:flex text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs font-bold uppercase tracking-widest font-sans items-center gap-1">
                          Lihat Detail <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="mt-12 flex justify-between items-center text-sm font-bold tracking-widest font-sans uppercase">
                <button onClick={() => changePage(currentPage - 1, 'prev')} disabled={currentPage === 0 || isAnimating} className={`flex items-center gap-2 transition-colors ${currentPage === 0 ? 'text-stone-300 cursor-not-allowed' : 'text-stone-500 hover:text-red-800'}`}>← Lembar Sebelumnya</button>
                <span className="text-stone-400 font-serif italic text-base lowercase">{currentPage + 1} / {totalPages || 1}</span>
                <button onClick={() => changePage(currentPage + 1, 'next')} disabled={currentPage === totalPages - 1 || isAnimating} className={`flex items-center gap-2 transition-colors ${currentPage === totalPages - 1 ? 'text-stone-300 cursor-not-allowed' : 'text-stone-900 hover:text-amber-600'}`}>Lembar Selanjutnya →</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. REPOSITORI SKRIPSI (TABEL DENGAN EFEK KERTAS & PENCARIAN) */}
      <div id="repositori" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 mb-32 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        
        {/* Header Desain Kotak Merah (Dipertahankan Persis) */}
        <div className="flex items-center gap-5 mb-12">
          <div className="w-16 h-16 bg-red-800 rounded-md flex items-center justify-center text-white shrink-0 shadow-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 font-playfair mb-1">Repositori Skripsi</h2>
            <p className="text-stone-500 text-sm md:text-base">Karya tulis ilmiah warga dan alumni asrama.</p>
          </div>
        </div>
        
        {loading ? <p className="text-center py-20 text-stone-500 w-full">Memuat repositori...</p> : dataSkripsi.length === 0 ? <div className="bg-white p-12 rounded-sm border border-stone-200 text-stone-500 text-center shadow-sm w-full">Belum ada data skripsi.</div> : (
          <div className="relative mt-8 perspective-1000">
            {/* Kertas Latar (Tumpukan Kertas Klasik) */}
            <div className="absolute inset-0 bg-[#e8e4db] transform translate-y-4 rotate-1 rounded-sm shadow-md"></div>
            <div className="absolute inset-0 bg-[#f4f2ec] transform translate-y-2 -rotate-1 rounded-sm shadow-md"></div>
            
            {/* Kertas Utama & Animasi Paginasi Skripsi */}
            <div className={`relative bg-[#fcfbf9] p-6 md:p-12 rounded-sm shadow-2xl border border-[#e8e4db] z-10 flex flex-col min-h-[500px] ${isSkripsiAnimating ? (skripsiAnimDirection === 'next' ? 'slide-next-out' : 'slide-prev-out') : (skripsiAnimDirection === 'next' ? 'slide-next-in' : (skripsiAnimDirection === 'prev' ? 'slide-prev-in' : ''))}`}>
              
              {/* Kolom Pencarian */}
              <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 border-b border-[#e8e4db] pb-6 gap-4">
                <h3 className="text-2xl font-bold text-stone-900 font-playfair w-full md:w-auto">Katalog Arsip</h3>
                <div className="relative w-full md:w-80">
                  <input 
                    type="text" 
                    placeholder="Cari judul, penulis, tahun..." 
                    value={searchSkripsi}
                    onChange={(e) => setSearchSkripsi(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-b-2 border-stone-300 bg-transparent focus:outline-none focus:border-red-800 transition-colors font-sans text-sm text-stone-800 placeholder-stone-400"
                  />
                  <svg className="absolute left-2 top-2.5 text-stone-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
              </div>

              {/* Tabel Skripsi */}
              <div className="flex-grow overflow-x-auto pb-4">
                {currentDataSkripsi.length === 0 ? (
                  <div className="text-center py-16 italic text-stone-500">Skripsi tidak ditemukan...</div>
                ) : (
                  <table className="w-full text-left font-serif text-stone-800 min-w-[700px]">
                    <thead className="border-b-2 border-stone-300 font-sans text-xs tracking-widest text-stone-500 uppercase">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">No</th>
                        <th className="py-3 px-4 w-64">Penulis & Jurusan</th>
                        <th className="py-3 px-4">Judul Skripsi</th>
                        <th className="py-3 px-4 w-20 text-center">Tahun</th>
                        <th className="py-3 px-4 w-40 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {currentDataSkripsi.map((item, index) => {
                        const skripsiNo = (skripsiPage * skripsiPerPage) + index + 1;
                        return (
                          <tr key={item.id} className="hover:bg-white transition-colors group">
                            <td className="py-5 px-4 text-center font-bold text-stone-400">{skripsiNo}.</td>
                            <td className="py-5 px-4 font-sans uppercase">
                              <div className="font-bold text-stone-900 leading-tight mb-1">{item.nama}</div>
                              <div className="text-[10px] text-stone-500 tracking-wider leading-tight">{item.jurusan}</div>
                            </td>
                            <td className="py-5 px-4 italic leading-relaxed text-[15px] pr-8 group-hover:text-red-900 transition-colors">"{item.judul}"</td>
                            <td className="py-5 px-4 text-center font-sans font-bold text-stone-600 bg-stone-50/50">{item.tahun}</td>
                            <td className="py-5 px-4 text-center">
                              <button 
                                onClick={() => { setSelectedSkripsi(item); setShowSkripsiModal(true); document.body.style.overflow = "hidden"; }} 
                                className="w-full bg-[#171412] hover:bg-stone-800 text-white py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors flex justify-center items-center gap-2 font-sans shadow-sm"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                AKSES PDF
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Navigasi Paginasi Skripsi */}
              <div className="mt-8 flex justify-between items-center text-sm font-bold tracking-widest font-sans uppercase pt-6 border-t border-[#e8e4db]">
                <button onClick={() => changeSkripsiPage(skripsiPage - 1, 'prev')} disabled={skripsiPage === 0 || isSkripsiAnimating} className={`flex items-center gap-2 transition-colors ${skripsiPage === 0 ? 'text-stone-300 cursor-not-allowed' : 'text-stone-500 hover:text-red-800'}`}>← Lembar Sebelumnya</button>
                <span className="text-stone-400 font-serif italic text-base lowercase">{skripsiPage + 1} / {totalSkripsiPages || 1}</span>
                <button onClick={() => changeSkripsiPage(skripsiPage + 1, 'next')} disabled={skripsiPage >= totalSkripsiPages - 1 || isSkripsiAnimating} className={`flex items-center gap-2 transition-colors ${skripsiPage >= totalSkripsiPages - 1 ? 'text-stone-300 cursor-not-allowed' : 'text-stone-900 hover:text-amber-600'}`}>Lembar Selanjutnya →</button>
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  );
}

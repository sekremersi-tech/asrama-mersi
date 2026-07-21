"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";

const HeroSlider = ({ images, title, subtitle }) => { /* ... kode sama ... */ 
  const imgArray = Array.isArray(images) ? images : (images ? [images] : []);
  const [idx, setIdx] = useState(0);
  useEffect(() => { if (imgArray.length <= 1) return; const timer = setInterval(() => setIdx(p => (p + 1) % imgArray.length), 4000); return () => clearInterval(timer); }, [imgArray.length]);
  return (
    <div className="relative py-28 md:py-36 w-full bg-[#171412] flex flex-col items-center justify-center overflow-hidden text-center">
      <div className="absolute inset-0 w-full h-full bg-[#171412]">
        {imgArray.map((bg, i) => (<div key={i} className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${i === idx ? 'opacity-70' : 'opacity-0'}`} style={{ backgroundImage: `url('${bg}')` }}></div>))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#171412] via-[#171412]/70 to-[#171412]/30 backdrop-blur-[1px]"></div>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full flex flex-col items-center pb-8 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-playfair drop-shadow-lg">{title}</h1>
        {subtitle && <p className="text-stone-300 text-lg max-w-2xl mx-auto m-0 mb-6">{subtitle}</p>}
        <div className="w-16 h-1.5 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
      </div>
    </div>
  );
};

const AutoSliderCard = ({ images, className, children, onClick }) => { /* ... kode sama ... */ 
  const imgArray = Array.isArray(images) ? images : [images];
  const [idx, setIdx] = useState(0);
  useEffect(() => { if (imgArray.length <= 1) return; const timer = setInterval(() => setIdx((prev) => (prev + 1) % imgArray.length), 3500); return () => clearInterval(timer); }, [imgArray.length]);
  return (
    <div className={`relative cursor-pointer group ${className}`} onClick={onClick}>
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {imgArray.map((src, i) => (<img key={i} src={src} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 group-hover:scale-105 ease-in-out ${i === idx ? "opacity-100" : "opacity-0"}`} alt="Galeri" />))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300"></div>
      </div>
      {imgArray.length > 1 && <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg border border-white/10 z-10">+{imgArray.length} Foto</div>}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

export default function Kehidupan() {
  const [bgMedia, setBgMedia] = useState([]);
  const [dataGaleri, setDataGaleri] = useState([]);
  const [dataBerita, setDataBerita] = useState([]);
  const [loading, setLoading] = useState(true);

  // STATE MODAL
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(""); 
  const [modalImageIdx, setModalImageIdx] = useState(0);

  // STATE FORMULIR LOMBA
  const [showLombaModal, setShowLombaModal] = useState(false);
  const [formLomba, setFormLomba] = useState({ nama: "", alamat: "", noHp: "" });
  const [isSubmittingLomba, setIsSubmittingLomba] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapFoto = await getDoc(doc(db, "pengaturan", "tampilan"));
        if (snapFoto.exists() && snapFoto.data().kehidupan) setBgMedia(snapFoto.data().kehidupan);
        const galSnap = await getDocs(query(collection(db, "fasilitas"), orderBy("createdAt", "desc")));
        setDataGaleri(galSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        const berSnap = await getDocs(query(collection(db, "kehidupan"), orderBy("createdAt", "desc")));
        setDataBerita(berSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const openModal = (item, type) => { 
    setSelectedItem(item); 
    setModalImageIdx(0); 
    document.body.style.overflow = "hidden"; 

    // Jika yang diklik adalah Lomba Terbuka, munculkan form pendaftaran
    if (type === "berita" && item.kategori === "LOMBA TERBUKA") {
      setShowLombaModal(true);
      setModalType("lomba");
    } else {
      setShowLombaModal(false);
      setModalType(type);
    }
  };

  const closeModal = () => { setSelectedItem(null); setShowLombaModal(false); document.body.style.overflow = "auto"; };

  const modalImages = selectedItem ? (Array.isArray(selectedItem.linkGambar) ? selectedItem.linkGambar : [selectedItem.linkGambar]) : [];
  const nextModalImage = (e) => { e.stopPropagation(); setModalImageIdx((prev) => (prev + 1) % modalImages.length); };
  const prevModalImage = (e) => { e.stopPropagation(); setModalImageIdx((prev) => (prev - 1 + modalImages.length) % modalImages.length); };

  // FUNGSI SUBMIT PENDAFTARAN LOMBA (DENGAN VALIDASI KETAT)
  const handleSubmitLomba = async (e) => {
    e.preventDefault();
    if (!formLomba.noHp.startsWith("08")) return alert("Nomor HP harus diawali dengan angka 08");
    if (formLomba.noHp.length < 11) return alert("Nomor HP tidak valid. Minimal harus 11 angka.");

    setIsSubmittingLomba(true);
    try {
      await addDoc(collection(db, "pendaftaran_lomba"), {
        lombaId: selectedItem.id, judulLomba: selectedItem.judul,
        namaPeserta: formLomba.nama, alamatPeserta: formLomba.alamat, noHpPeserta: formLomba.noHp,
        waktuDaftar: serverTimestamp()
      });
      alert("Pendaftaran Berhasil! Data Anda telah masuk ke database panitia.");
      closeModal(); setFormLomba({ nama: "", alamat: "", noHp: "" });
    } catch (error) { alert("Pendaftaran Gagal. Silakan coba lagi."); } finally { setIsSubmittingLomba(false); }
  };

  return (
    <div className="bg-[#f9f8f6] pb-24 font-lora relative">
      
      {/* MODAL POP-UP (GABUNGAN GALERI/BERITA & LOMBA) */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease-out]" onClick={closeModal}>
          <button onClick={closeModal} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-black/50 p-2 rounded-full z-50"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-sm overflow-hidden flex flex-col md:flex-row shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Sisi Kiri: Gambar (Sama untuk semua Modal) */}
            <div className={`relative w-full ${showLombaModal ? 'md:w-1/2' : 'md:w-3/5'} bg-stone-900 h-64 md:h-[80vh] flex items-center justify-center shrink-0 group`}>
              <img src={modalImages[modalImageIdx]} className="max-w-full max-h-full object-contain drop-shadow-2xl" alt="Preview" />
              {modalImages.length > 1 && (
                <>
                  <button onClick={prevModalImage} className="absolute left-4 bg-black/50 hover:bg-amber-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
                  <button onClick={nextModalImage} className="absolute right-4 bg-black/50 hover:bg-amber-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
                  <div className="absolute bottom-4 bg-black/60 px-4 py-1.5 rounded-full text-white text-xs tracking-widest font-bold font-sans">{modalImageIdx + 1} / {modalImages.length}</div>
                </>
              )}
            </div>

            {/* Sisi Kanan: Form Pendaftaran (Jika Lomba) ATAU Teks Detail (Jika Berita/Galeri) */}
            <div className={`w-full ${showLombaModal ? 'md:w-1/2' : 'md:w-2/5'} p-8 md:p-10 flex flex-col bg-[#fcfbf9] overflow-y-auto max-h-[50vh] md:max-h-[80vh]`}>
              
              {showLombaModal ? (
                /* ---- FORMULIR PENDAFTARAN LOMBA ---- */
                <div className="flex flex-col h-full">
                  <h2 className="text-3xl font-bold font-playfair text-stone-900 mb-2 leading-snug">Formulir Pendaftaran</h2>
                  <p className="text-stone-500 text-sm mb-6 pb-4 border-b border-[#e8e4db]">{selectedItem.judul}</p>
                  <form onSubmit={handleSubmitLomba} className="space-y-4 font-sans">
                    <div>
                      <label className="text-xs font-bold text-stone-800 uppercase tracking-widest block mb-1">Nama Lengkap</label>
                      <input type="text" required value={formLomba.nama} onChange={(e) => setFormLomba({...formLomba, nama: e.target.value.replace(/[^a-zA-Z\s]/g, '')})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm text-stone-900" placeholder="Hanya huruf..." />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-800 uppercase tracking-widest block mb-1">Nomor HP / WA</label>
                      <input type="tel" required value={formLomba.noHp} onChange={(e) => setFormLomba({...formLomba, noHp: e.target.value.replace(/\D/g, '')})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm text-stone-900" placeholder="Awali dengan 08..." maxLength={14} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-800 uppercase tracking-widest block mb-1">Alamat Asal / Instansi</label>
                      <textarea required rows="3" value={formLomba.alamat} onChange={(e) => setFormLomba({...formLomba, alamat: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm text-stone-900" placeholder="Tuliskan alamat lengkap..."></textarea>
                    </div>
                    <button type="submit" disabled={isSubmittingLomba} className="w-full bg-[#171412] hover:bg-amber-600 text-white font-playfair font-bold text-lg py-3 rounded transition-colors mt-2">{isSubmittingLomba ? "Memproses..." : "Daftar Sekarang"}</button>
                  </form>
                </div>
              ) : (
                /* ---- DETAIL BERITA ATAU GALERI BIASA ---- */
                <>
                  {modalType === "berita" && (
                    <div className="flex items-center gap-3 mb-4"><span className="text-xs font-bold tracking-widest uppercase text-red-800 bg-red-50 px-3 py-1 rounded-sm font-sans">{selectedItem.kategori}</span><span className="text-xs text-stone-500 font-sans">{selectedItem.tanggal}</span></div>
                  )}
                  <h2 className="text-3xl font-bold font-playfair text-stone-900 mb-6 leading-snug" style={{ color: modalType === "galeri" && selectedItem.warna ? selectedItem.warna : 'inherit' }}>{selectedItem.judul}</h2>
                  {modalType === "berita" && <div className="w-10 h-1 bg-amber-500 mb-6 rounded-full"></div>}
                  {modalType === "berita" ? (
                    <p className="text-stone-700 leading-relaxed text-base whitespace-pre-line">{selectedItem.deskripsi}</p> 
                  ) : (
                    <p className="text-stone-600 leading-relaxed text-base whitespace-pre-line">{selectedItem.deskripsi || "Dokumentasi momen kebersamaan warga Asrama Mahasiswa Merapi Singgalang."}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HERO & KONTEN BAWAH (Tetap Sama) */}
      <HeroSlider images={bgMedia} title="Media & Publikasi" subtitle="Merekam setiap langkah, kegiatan, dan dinamika kehidupan warga perantau di Asrama Merapi Singgalang." />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        {/* Galeri Kegiatan */}
        <div id="galeri" className="mb-24 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-[#171412] rounded-sm flex items-center justify-center text-white"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>
            <div>
              <h2 className="text-3xl font-bold text-stone-900 font-playfair">Galeri Kegiatan Asrama</h2>
              <p className="text-stone-500 text-sm mt-1">Dokumentasi momen-momen kebersamaan.</p>
            </div>
          </div>
          {loading ? <p className="text-center py-10 text-stone-500">Memuat galeri...</p> : dataGaleri.length === 0 ? <div className="bg-white p-8 border text-center text-stone-500">Belum ada foto kegiatan.</div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {dataGaleri.map((item, idx) => (
                <AutoSliderCard key={item.id} images={item.linkGambar} onClick={() => openModal(item, "galeri")} className={`h-64 md:h-80 bg-stone-200 border border-[#e8e4db] shadow-sm hover:shadow-2xl rounded-sm reveal opacity-0 translate-y-12`} style={{ transitionDelay: `${(idx % 3) * 150}ms` }}>
                  <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-xl font-bold font-playfair drop-shadow-md" style={{ color: item.warna || '#ffffff' }}>{item.judul}</h3>
                  </div>
                </AutoSliderCard>
              ))}
            </div>
          )}
        </div>

        {/* Kabar Terbaru */}
        <div id="kabar" className="scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out delay-200">
          <div className="flex items-center gap-4 mb-10 border-t border-[#e8e4db] pt-16">
            <div className="w-14 h-14 bg-red-800 rounded-sm flex items-center justify-center text-white"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
            <div>
              <h2 className="text-3xl font-bold text-stone-900 font-playfair">Kabar Terbaru Warga</h2>
              <p className="text-stone-500 text-sm mt-1">Berita, prestasi, dan publikasi penghuni asrama.</p>
            </div>
          </div>
          {loading ? <p className="text-center py-10 text-stone-500">Memuat kabar...</p> : dataBerita.length === 0 ? <div className="bg-white p-8 border text-center text-stone-500">Belum ada publikasi berita.</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {dataBerita.map((item, idx) => (
                <div key={item.id} onClick={() => openModal(item, "berita")} className={`bg-[#fcfbf9] border border-[#e8e4db] shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] flex flex-col md:flex-row overflow-hidden group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 reveal opacity-0 translate-y-12`} style={{ transitionDelay: `${(idx % 2) * 200}ms` }}>
                  <AutoSliderCard images={item.linkGambar} className="w-full md:w-2/5 h-48 md:h-auto shrink-0 bg-stone-100" />
                  <div className="p-6 md:p-8 flex flex-col justify-center w-full">
                    <div className="flex items-center gap-3 mb-3"><span className="text-xs font-bold tracking-widest uppercase text-red-800 font-sans">{item.kategori}</span><span className="text-stone-300">•</span><span className="text-xs text-stone-500 font-sans">{item.tanggal}</span></div>
                    <h3 className="text-2xl font-bold text-stone-900 font-playfair mb-3 group-hover:text-amber-600 transition-colors leading-snug">{item.judul}</h3>
                    <p className="text-stone-600 text-sm leading-relaxed line-clamp-3">{item.deskripsi}</p>
                    <span className="text-amber-600 text-xs font-bold uppercase tracking-widest mt-4 font-sans flex items-center gap-1 group-hover:gap-2 transition-all">Baca Selengkapnya <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

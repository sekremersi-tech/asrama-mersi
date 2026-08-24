"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc, addDoc, serverTimestamp, where, updateDoc, increment } from "firebase/firestore";
import DomeGallery from "@/components/DomeGallery";

const HeroSlider = ({ images, title, subtitle }) => { 
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

const NewsAutoSliderCard = ({ images, className }) => {
  const imgArray = Array.isArray(images) ? images : (images ? [images] : []);
  const [idx, setIdx] = useState(0);
  useEffect(() => { if (imgArray.length <= 1) return; const timer = setInterval(() => setIdx(p => (p + 1) % imgArray.length), 3500); return () => clearInterval(timer); }, [imgArray.length]);
  if (imgArray.length === 0) return <div className={`bg-stone-200 ${className}`}></div>;
  return (
    <div className={`relative overflow-hidden w-full h-full ${className}`}>
      {imgArray.map((src, i) => (<img key={i} src={src} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 group-hover:scale-105 ease-in-out ${i === idx ? "opacity-100" : "opacity-0"}`} alt="Visual" />))}
      {imgArray.length > 1 && <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg border border-white/10 z-10 font-sans">+{imgArray.length} Foto</div>}
    </div>
  );
};

export default function Kehidupan() {
  const [bgMedia, setBgMedia] = useState([]);
  const [dataGaleri, setDataGaleri] = useState([]);
  const [dataBerita, setDataBerita] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState(null);
  const [modalImageIdx, setModalImageIdx] = useState(0);

  const [showLombaModal, setShowLombaModal] = useState(false);
  const [formLomba, setFormLomba] = useState({ nama: "", alamat: "", noHp: "" });
  const [isSubmittingLomba, setIsSubmittingLomba] = useState(false);

  const [komentarList, setKomentarList] = useState([]);
  const [formKomen, setFormKomen] = useState({ nama: "", isi: "" });
  const [isSubmittingKomen, setIsSubmittingKomen] = useState(false);

  // State bantuan untuk melacak like secara lokal
  const [localLikes, setLocalLikes] = useState({});

  // STATE SLIDER BERITA
  const [newsPage, setNewsPage] = useState(0);
  const newsPerPage = 2;

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

  const domeImages = dataGaleri.reduce((acc, item) => {
    const links = Array.isArray(item.linkGambar) ? item.linkGambar : (item.linkGambar ? [item.linkGambar] : []);
    const mapped = links.map(src => ({ src, alt: item.judul || "Galeri Asrama", color: item.warna || '#ffffff' }));
    return [...acc, ...mapped];
  }, []);

  const openModal = async (item) => { 
    setSelectedItem(item); setModalImageIdx(0); document.body.style.overflow = "hidden"; 
    setFormKomen({ nama: "", isi: "" });
    
    if (item.kategori === "LOMBA TERBUKA") {
      setShowLombaModal(true);
    } else {
      setShowLombaModal(false);
      setKomentarList([]);
      setLocalLikes({});
      
      try {
        const targetId = String(item.id);
        const q = query(collection(db, "komentar_publikasi"), where("postId", "==", targetId));
        const snap = await getDocs(q);
        let comments = snap.docs.map(d => ({id: d.id, ...d.data()}));
        comments.sort((a, b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0));
        
        let likesMap = {};
        comments.forEach(c => { likesMap[c.id] = c.likes || 0; });
        setLocalLikes(likesMap);
        setKomentarList(comments);
      } catch(e) { console.error(e); }
    }
  };

  const closeModal = () => { 
    setSelectedItem(null); setShowLombaModal(false); setKomentarList([]); setLocalLikes({});
    setFormKomen({ nama: "", isi: "" }); 
    document.body.style.overflow = "auto"; 
  };

  const modalImages = selectedItem ? (Array.isArray(selectedItem.linkGambar) ? selectedItem.linkGambar : [selectedItem.linkGambar]) : [];
  const nextModalImage = (e) => { e.stopPropagation(); setModalImageIdx((prev) => (prev + 1) % modalImages.length); };
  const prevModalImage = (e) => { e.stopPropagation(); setModalImageIdx((prev) => (prev - 1 + modalImages.length) % modalImages.length); };

  const handleSubmitLomba = async (e) => {
    e.preventDefault();
    if (!formLomba.noHp.startsWith("08")) return alert("Nomor HP harus diawali dengan angka 08");
    if (formLomba.noHp.length < 11) return alert("Nomor HP tidak valid.");
    setIsSubmittingLomba(true);
    try {
      await addDoc(collection(db, "pendaftaran_lomba"), { lombaId: selectedItem.id, judulLomba: selectedItem.judul, namaPeserta: formLomba.nama, alamatPeserta: formLomba.alamat, noHpPeserta: formLomba.noHp, waktuDaftar: serverTimestamp() });
      alert("Pendaftaran Berhasil! Data Anda telah masuk ke database panitia.");
      closeModal(); setFormLomba({ nama: "", alamat: "", noHp: "" });
    } catch (error) { alert("Pendaftaran Gagal. Silakan coba lagi."); } finally { setIsSubmittingLomba(false); }
  };

  const submitKomentar = async (e) => {
    e.preventDefault();
    if (!formKomen.isi.trim()) return;
    setIsSubmittingKomen(true);
    try {
      const targetId = String(selectedItem.id);
      const judulPostingan = selectedItem.judul || selectedItem.nama || "Postingan Publikasi";
      const newKomen = { postId: targetId, postJudul: judulPostingan, nama: formKomen.nama.trim() || "Anonim", isi: formKomen.isi.trim(), likes: 0, waktu: serverTimestamp() };
      const docRef = await addDoc(collection(db, "komentar_publikasi"), newKomen);
      
      const addedKomen = {id: docRef.id, ...newKomen, waktu: { toDate: () => new Date() } };
      setKomentarList([addedKomen, ...komentarList]);
      setLocalLikes(prev => ({ ...prev, [docRef.id]: 0 }));
      setFormKomen({nama: "", isi: ""});
    } catch (err) { alert("Gagal mengirim! Error: " + err.message); } finally { setIsSubmittingKomen(false); }
  };

  // LOGIKA LIKE / UNLIKE
  const handleLikeKomentar = async (komenId) => {
    if (typeof window === 'undefined') return;
    const isCurrentlyLiked = localStorage.getItem(`liked_${komenId}`);

    if (isCurrentlyLiked) {
      try {
        localStorage.removeItem(`liked_${komenId}`);
        setLocalLikes(prev => ({ ...prev, [komenId]: Math.max(0, (prev[komenId] || 0) - 1) }));
        await updateDoc(doc(db, "komentar_publikasi", komenId), { likes: increment(-1) });
      } catch (e) {
        console.error("Gagal membatalkan like:", e);
        localStorage.setItem(`liked_${komenId}`, 'true');
        setLocalLikes(prev => ({ ...prev, [komenId]: (prev[komenId] || 0) + 1 }));
      }
    } else {
      try {
        localStorage.setItem(`liked_${komenId}`, 'true');
        setLocalLikes(prev => ({ ...prev, [komenId]: (prev[komenId] || 0) + 1 }));
        await updateDoc(doc(db, "komentar_publikasi", komenId), { likes: increment(1) });
      } catch (e) { 
        console.error("Gagal menyukai komentar:", e); 
        localStorage.removeItem(`liked_${komenId}`);
        setLocalLikes(prev => ({ ...prev, [komenId]: Math.max(0, (prev[komenId] || 0) - 1) }));
      }
    }
  };

  // FUNGSI SHARE KE MEDIA SOSIAL
  const handleShare = (platform) => {
    if (typeof window === 'undefined') return;
    const shareUrl = window.location.href; // URL Halaman Saat Ini
    const title = selectedItem?.judul || "Kabar Asrama";
    const text = `Kabar terbaru dari Asrama: ${title}. Baca selengkapnya di: `;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + shareUrl)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(`${text} ${shareUrl}`).then(() => {
          alert('Tautan dan informasi berhasil disalin!');
        });
        break;
      case 'native':
        if (navigator.share) {
          navigator.share({
            title: title,
            text: text,
            url: shareUrl
          }).catch((err) => console.log('Batal berbagi:', err));
        } else {
          alert('Browser ini belum mendukung berbagi langsung. Silakan gunakan ikon lain.');
        }
        break;
      default:
        break;
    }
  };

  const totalNewsPages = Math.ceil(dataBerita.length / newsPerPage);
  const displayedNews = dataBerita.slice(newsPage * newsPerPage, (newsPage + 1) * newsPerPage);

  return (
    <div className="bg-[#f9f8f6] pb-24 font-lora relative">
      
      {/* MODAL BERITA & LOMBA */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease-out]" onClick={closeModal}>
          <button onClick={closeModal} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-black/50 p-2 rounded-full z-50"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          
          <div className={`w-full max-w-6xl md:w-fit bg-white shadow-2xl rounded-sm overflow-hidden flex flex-col md:flex-row relative max-h-[95vh]`} onClick={e => e.stopPropagation()}>
            <div className="relative w-full md:w-auto bg-stone-900 flex shrink-0 md:pr-[400px] lg:pr-[450px] md:min-h-[450px]">
              <div className="relative w-full flex items-center justify-center group">
                <img src={modalImages[modalImageIdx]} className="w-full md:w-auto md:max-w-[55vw] max-h-[50vh] md:max-h-[95vh] object-contain block" alt="Preview" />
                {modalImages.length > 1 && (
                  <>
                    <button onClick={prevModalImage} className="absolute left-4 bg-black/50 hover:bg-amber-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
                    <button onClick={nextModalImage} className="absolute right-4 bg-black/50 hover:bg-amber-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
                    <div className="absolute bottom-4 bg-black/60 px-4 py-1.5 rounded-full text-white text-xs tracking-widest font-bold font-sans">{modalImageIdx + 1} / {modalImages.length}</div>
                  </>
                )}
              </div>
            </div>

            <div className="w-full md:w-[400px] lg:w-[450px] md:absolute md:right-0 md:top-0 md:bottom-0 bg-[#fcfbf9] overflow-y-auto border-l border-stone-200">
              <div className="p-8 md:p-10 flex flex-col h-max min-h-full">
                {showLombaModal ? (
                  <div className="flex flex-col h-full">
                    <h2 className="text-3xl font-bold font-playfair text-[#1c1917] mb-2 leading-snug">Formulir Pendaftaran</h2>
                    <p className="text-[#44403c] text-sm mb-6 pb-4 border-b border-[#e8e4db]">{selectedItem.judul}</p>
                    <form onSubmit={handleSubmitLomba} className="space-y-4 font-sans">
                      <div><label className="text-xs font-bold text-stone-800 uppercase tracking-widest block mb-1">Nama Lengkap</label><input type="text" required value={formLomba.nama} onChange={(e) => setFormLomba({...formLomba, nama: e.target.value.replace(/[^a-zA-Z\s]/g, '')})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm text-[#1c1917]" placeholder="Hanya huruf..." /></div>
                      <div><label className="text-xs font-bold text-stone-800 uppercase tracking-widest block mb-1">Nomor HP / WA</label><input type="tel" required value={formLomba.noHp} onChange={(e) => setFormLomba({...formLomba, noHp: e.target.value.replace(/\D/g, '')})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm text-[#1c1917]" placeholder="Awali dengan 08..." maxLength={14} /></div>
                      <div><label className="text-xs font-bold text-stone-800 uppercase tracking-widest block mb-1">Alamat Asal / Instansi</label><textarea required rows="3" value={formLomba.alamat} onChange={(e) => setFormLomba({...formLomba, alamat: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm text-[#1c1917]" placeholder="Tuliskan alamat lengkap..."></textarea></div>
                      <button type="submit" disabled={isSubmittingLomba} className="w-full bg-[#171412] hover:bg-amber-600 text-white font-playfair font-bold text-lg py-3 rounded transition-colors mt-2">{isSubmittingLomba ? "Memproses..." : "Daftar Sekarang"}</button>
                    </form>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-4"><span className="text-xs font-bold tracking-widest uppercase text-red-800 bg-red-50 px-3 py-1 rounded-sm font-sans">{selectedItem.kategori}</span><span className="text-xs text-[#78716c] font-sans">{selectedItem.tanggal}</span></div>
                    <h2 className="text-3xl font-bold font-playfair text-[#1c1917] mb-6 leading-snug">{selectedItem.judul}</h2>
                    <div className="w-10 h-1 bg-amber-500 mb-6 rounded-full"></div>
                    <p className="text-[#44403c] leading-relaxed text-base whitespace-pre-line">{selectedItem.deskripsi}</p>
                    
                    {/* ===== FITUR BAGIKAN (SHARE) ===== */}
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-widest font-sans">Bagikan:</span>
                      <div className="flex items-center gap-2">
                         {/* Native Share (IG/Lainnya via HP) */}
                         <button onClick={() => handleShare('native')} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-600 flex items-center justify-center transition-colors shadow-sm" title="Bagikan Langsung">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                         </button>
                         {/* WhatsApp */}
                         <button onClick={() => handleShare('whatsapp')} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-green-100 text-stone-600 hover:text-green-600 flex items-center justify-center transition-colors shadow-sm" title="Bagikan ke WhatsApp">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                         </button>
                         {/* Facebook */}
                         <button onClick={() => handleShare('facebook')} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-blue-100 text-stone-600 hover:text-blue-700 flex items-center justify-center transition-colors shadow-sm" title="Bagikan ke Facebook">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                         </button>
                         {/* X / Twitter */}
                         <button onClick={() => handleShare('twitter')} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-300 text-stone-600 hover:text-stone-900 flex items-center justify-center transition-colors shadow-sm" title="Bagikan ke X / Twitter">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                         </button>
                         {/* Copy Link */}
                         <button onClick={() => handleShare('copy')} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-red-100 text-stone-600 hover:text-red-700 flex items-center justify-center transition-colors shadow-sm" title="Salin Tautan">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                         </button>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-8 border-t border-stone-200 font-sans">
                      <h3 className="font-playfair font-bold text-xl text-[#1c1917] mb-4">Komentar ({komentarList.length})</h3>
                      <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                        {komentarList.length === 0 ? (
                          <p className="text-sm text-[#78716c] italic">Belum ada komentar. Jadilah yang pertama!</p>
                        ) : (
                          komentarList.map(k => {
                            const isLiked = typeof window !== 'undefined' && localStorage.getItem(`liked_${k.id}`);
                            return (
                              <div key={k.id} className="bg-white p-4 rounded border border-stone-100 shadow-sm">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-sm text-[#1c1917]">{k.nama}</span>
                                  <span className="text-[10px] text-[#a8a29e]">{k.waktu?.toDate ? k.waktu.toDate().toLocaleDateString('id-ID') : 'Baru saja'}</span>
                                </div>
                                <p className="text-sm text-[#44403c] mb-3">{k.isi}</p>

                                <div className="flex items-center gap-4 mb-1">
                                  <button onClick={() => handleLikeKomentar(k.id)} className={`text-xs flex items-center gap-1.5 font-bold transition-colors ${isLiked ? 'text-red-600' : 'text-[#a8a29e] hover:text-red-600'}`}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                    {localLikes[k.id] || 0} Suka
                                  </button>
                                </div>

                                {k.balasanAdmin && (
                                  <div className="mt-3 bg-amber-50 p-3 rounded-r-lg border-l-2 border-amber-500 ml-4 relative">
                                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block mb-1 flex items-center gap-1">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Admin Mersi
                                    </span>
                                    <p className="text-sm text-[#44403c]">{k.balasanAdmin}</p>
                                  </div>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                      <form onSubmit={submitKomentar} className="space-y-3 bg-stone-50 p-4 rounded border border-stone-200">
                        <input type="text" value={formKomen.nama} onChange={e => setFormKomen({...formKomen, nama: e.target.value})} placeholder="Nama (Opsional / Anonim)" className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-[#1c1917]" />
                        <textarea required value={formKomen.isi} onChange={e => setFormKomen({...formKomen, isi: e.target.value})} placeholder="Tulis komentar..." rows="2" className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-[#1c1917]"></textarea>
                        <button type="submit" disabled={isSubmittingKomen} className="bg-[#171412] text-white text-xs font-bold px-4 py-2.5 rounded hover:bg-amber-600 transition-colors w-full">{isSubmittingKomen ? 'Mengirim...' : 'Kirim Komentar'}</button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <HeroSlider images={bgMedia} title="Media & Publikasi" subtitle="Merekam setiap langkah, kegiatan, dan dinamika kehidupan warga perantau di Asrama Merapi Singgalang." />

      {/* GALERI KEGIATAN ASRAMA MENGGUNAKAN DOME GALLERY */}
      <div id="galeri" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-24 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="flex flex-col justify-between items-start mb-10 border-b border-[#e8e4db] pb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#171412] rounded-sm flex items-center justify-center text-white shrink-0"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>
            <div><h2 className="text-3xl font-bold text-stone-900 font-playfair">Galeri Kegiatan Asrama</h2><p className="text-stone-500 text-sm mt-1">Dokumentasi momen-momen kebersamaan dalam tampilan 3D interaktif.</p></div>
          </div>
        </div>

        {loading ? <p className="text-center py-10 text-stone-500">Memuat galeri...</p> : domeImages.length === 0 ? <div className="bg-white p-8 border border-[#e8e4db] text-center text-stone-500">Belum ada foto kegiatan.</div> : (
          <div className="w-full h-[60vh] md:h-[80vh] bg-[#fcfbf9] rounded-xl overflow-hidden shadow-2xl relative border border-[#e8e4db] animate-[fadeIn_0.5s_ease-out]">
            <DomeGallery 
              images={domeImages} 
              grayscale={false} 
              overlayBlurColor="#fcfbf9"
              minRadius={1400} 
              openedImageWidth="85vw" 
              openedImageHeight="85vh"
            />
          </div>
        )}
      </div>

      {/* KABAR TERBARU WARGA */}
      <div id="kabar" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out delay-200">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-[#e8e4db] pb-4 pt-16">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-800 rounded-sm flex items-center justify-center text-white"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
            <div><h2 className="text-3xl font-bold text-stone-900 font-playfair">Kabar Terbaru Warga</h2><p className="text-stone-500 text-sm mt-1">Berita, prestasi, dan publikasi penghuni asrama.</p></div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => setNewsPage(p => Math.max(0, p - 1))} disabled={newsPage === 0} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-stone-200 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed text-stone-600 transition-all shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button onClick={() => setNewsPage(p => Math.min(totalNewsPages - 1, p + 1))} disabled={newsPage >= totalNewsPages - 1} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-stone-200 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed text-stone-600 transition-all shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
        
        {loading ? <p className="text-center py-10 text-stone-500">Memuat kabar...</p> : dataBerita.length === 0 ? <div className="bg-white p-8 border border-[#e8e4db] text-center text-stone-500">Belum ada publikasi berita.</div> : (
          <div key={newsPage} className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-[fadeIn_0.5s_ease-out]">
            {displayedNews.map((item, idx) => (
              <div key={item.id} onClick={() => openModal(item, "berita")} className={`bg-[#fcfbf9] border border-[#e8e4db] shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] flex flex-col md:flex-row overflow-hidden group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                <div className="w-full md:w-2/5 h-48 md:h-auto shrink-0 relative overflow-hidden bg-stone-100"><NewsAutoSliderCard images={item.linkGambar} /></div>
                <div className="p-6 md:p-8 flex flex-col justify-center w-full">
                  <div className="flex items-center gap-3 mb-3"><span className="text-xs font-bold tracking-widest uppercase text-red-800 font-sans">{item.kategori}</span><span className="text-stone-300">•</span><span className="text-xs text-stone-500 font-sans">{item.tanggal}</span></div>
                  <h3 className="text-xl md:text-2xl font-bold text-stone-900 font-playfair mb-3 group-hover:text-amber-600 transition-colors leading-snug line-clamp-2">{item.judul}</h3>
                  <p className="text-stone-600 text-sm leading-relaxed line-clamp-2">{item.deskripsi}</p>
                  <span className="text-amber-600 text-xs font-bold uppercase tracking-widest mt-4 font-sans flex items-center gap-1 group-hover:gap-2 transition-all">Baca Selengkapnya <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {dataBerita.length > 0 && (
          <div className="mt-8 flex md:hidden justify-center gap-6">
            <button onClick={() => setNewsPage(p => Math.max(0, p - 1))} disabled={newsPage === 0} className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-stone-200 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed text-stone-600 transition-all shadow-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button onClick={() => setNewsPage(p => Math.min(totalNewsPages - 1, p + 1))} disabled={newsPage >= totalNewsPages - 1} className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-stone-200 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed text-stone-600 transition-all shadow-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

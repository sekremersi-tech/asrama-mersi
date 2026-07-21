"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, doc, getDoc, addDoc, serverTimestamp, where } from "firebase/firestore";

const HeroSlider = ({ images, titleLine1, titleLine2, subtitle }) => {
  const imgArray = Array.isArray(images) ? images : (images ? [images] : []);
  const [idx, setIdx] = useState(0);
  useEffect(() => { if (imgArray.length <= 1) return; const timer = setInterval(() => setIdx(p => (p + 1) % imgArray.length), 4000); return () => clearInterval(timer); }, [imgArray.length]);
  return (
    <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-[#171412]">
      <div className="absolute inset-0 w-full h-full bg-[#171412]">
        {imgArray.map((bg, i) => (<div key={i} className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${i === idx ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url('${bg}')` }}></div>))}
        <div className="absolute inset-0 bg-[#171412]/70"></div>
      </div>
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <span className="inline-block py-1.5 px-4 rounded-full bg-red-800/90 text-amber-400 text-xs font-bold tracking-widest mb-6 border border-red-700/50 backdrop-blur-sm">ASRAMA MAHASISWA MERAPI SINGGALANG</span>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-playfair leading-tight">{titleLine1} <br/><span className="text-amber-500">{titleLine2}</span></h1>
        <p className="text-lg md:text-xl text-stone-300 mb-10 font-lora max-w-2xl mx-auto">{subtitle}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center font-sans">
          <Link href="/profil" className="bg-red-800 hover:bg-red-900 text-white px-8 py-3.5 rounded-lg font-semibold shadow-lg shadow-red-900/30 transition-all border border-red-700">Mengenal Asrama</Link>
          <Link href="/kehidupan" className="bg-[#171412]/50 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50 px-8 py-3.5 rounded-lg font-semibold transition-all backdrop-blur-sm">Lihat Media Publikasi</Link>
        </div>
      </div>
    </section>
  );
};

const AutoSliderCard = ({ images, className }) => {
  const imgArray = Array.isArray(images) ? images : (images ? [images] : []);
  const [idx, setIdx] = useState(0);
  useEffect(() => { if (imgArray.length <= 1) return; const timer = setInterval(() => setIdx(p => (p + 1) % imgArray.length), 3500); return () => clearInterval(timer); }, [imgArray.length]);
  if (imgArray.length === 0) return <div className={`bg-stone-200 ${className}`}></div>;
  return (
    <div className={`relative overflow-hidden group w-full h-full ${className}`}>
      {imgArray.map((src, i) => (<img key={i} src={src} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 group-hover:scale-105 ease-in-out ${i === idx ? "opacity-100" : "opacity-0"}`} alt="Visual" />))}
      {imgArray.length > 1 && <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg border border-white/10 z-10 font-sans">+{imgArray.length} Foto</div>}
    </div>
  );
};

export default function Beranda() {
  const [kabarTerbaru, setKabarTerbaru] = useState([]);
  const [layananSewa, setLayananSewa] = useState([]); // DITAMBAHKAN: Data Sewa
  const [bgHero, setBgHero] = useState([]);
  const [kontak, setKontak] = useState({ noTelpon: "-" });

  // STATE MODAL (Multi-Fungsi untuk Berita & Penyewaan)
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(""); // "berita", "lomba", "sewa"
  const [modalImageIdx, setModalImageIdx] = useState(0);
  
  const [showLombaModal, setShowLombaModal] = useState(false);
  const [formLomba, setFormLomba] = useState({ nama: "", alamat: "", noHp: "" });
  const [isSubmittingLomba, setIsSubmittingLomba] = useState(false);

  const [komentarList, setKomentarList] = useState([]);
  const [formKomen, setFormKomen] = useState({ nama: "", isi: "" });
  const [isSubmittingKomen, setIsSubmittingKomen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const docSnap = await getDoc(doc(db, "pengaturan", "tampilan"));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.gateway && data.gateway.length > 0) setBgHero(data.gateway); else if (data.hero) setBgHero(data.hero);
      }
      const docKontak = await getDoc(doc(db, "pengaturan", "kontak"));
      if (docKontak.exists()) setKontak(docKontak.data());

      // Fetch 4 Kabar Terbaru
      const qKabar = query(collection(db, "kehidupan"), orderBy("createdAt", "desc"), limit(4)); 
      const snapKabar = await getDocs(qKabar);
      setKabarTerbaru(snapKabar.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch 3 Layanan Sewa Terbaru
      const qSewa = query(collection(db, "daftar_penyewaan"), orderBy("createdAt", "desc"), limit(3)); 
      const snapSewa = await getDocs(qSewa);
      setLayananSewa(snapSewa.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchData();
  }, []);

  const openModal = async (item, type) => { 
    setSelectedItem(item); setModalImageIdx(0); document.body.style.overflow = "hidden"; 
    setModalType(type);
    
    if (type === "berita" && item.kategori === "LOMBA TERBUKA") {
      setShowLombaModal(true);
      setModalType("lomba");
    } else {
      setShowLombaModal(false);
      // Fetch Komentar untuk Berita maupun Penyewaan
      setKomentarList([]);
      try {
        const q = query(collection(db, "komentar_publikasi"), where("postId", "==", item.id));
        const snap = await getDocs(q);
        let comments = snap.docs.map(d => ({id: d.id, ...d.data()}));
        comments.sort((a, b) => (a.waktu?.toMillis() || 0) - (b.waktu?.toMillis() || 0));
        setKomentarList(comments);
      } catch(e) { console.error(e); }
    }
  };
  
  const closeModal = () => { setSelectedItem(null); setShowLombaModal(false); setKomentarList([]); document.body.style.overflow = "auto"; };
  
  const modalImages = selectedItem ? (Array.isArray(selectedItem.linkGambar) ? selectedItem.linkGambar : [selectedItem.linkGambar]) : [];
  const nextModalImage = (e) => { e.stopPropagation(); setModalImageIdx((prev) => (prev + 1) % modalImages.length); };
  const prevModalImage = (e) => { e.stopPropagation(); setModalImageIdx((prev) => (prev - 1 + modalImages.length) % modalImages.length); };

  const handleSubmitLomba = async (e) => {
    e.preventDefault();
    if (!formLomba.noHp.startsWith("08")) return alert("Nomor HP harus diawali dengan angka 08");
    if (formLomba.noHp.length < 11) return alert("Nomor HP tidak valid. Minimal harus 11 angka.");
    setIsSubmittingLomba(true);
    try {
      await addDoc(collection(db, "pendaftaran_lomba"), { lombaId: selectedItem.id, judulLomba: selectedItem.judul, namaPeserta: formLomba.nama, alamatPeserta: formLomba.alamat, noHpPeserta: formLomba.noHp, waktuDaftar: serverTimestamp() });
      alert("Pendaftaran Berhasil! Data Anda telah masuk ke database panitia.");
      closeModal(); setFormLomba({ nama: "", alamat: "", noHp: "" });
    } catch (error) { alert("Pendaftaran Gagal."); } finally { setIsSubmittingLomba(false); }
  };

  const submitKomentar = async (e) => {
    e.preventDefault();
    if (!formKomen.isi.trim()) return;
    setIsSubmittingKomen(true);
    try {
      const newKomen = { postId: selectedItem.id, nama: formKomen.nama.trim() || "Anonim", isi: formKomen.isi.trim(), waktu: serverTimestamp() };
      const docRef = await addDoc(collection(db, "komentar_publikasi"), newKomen);
      setKomentarList([...komentarList, {id: docRef.id, ...newKomen, waktu: { toDate: () => new Date() } }]);
      setFormKomen({nama: "", isi: ""});
    } catch (err) { alert("Gagal mengirim komentar"); }
    setIsSubmittingKomen(false);
  };

  const formatWhatsAppLink = (nomor, namaSewa) => {
    if (!nomor || nomor === "-") return "#";
    let bersihkanNomor = nomor.replace(/\D/g, '');
    if (bersihkanNomor.startsWith('0')) bersihkanNomor = '62' + bersihkanNomor.substring(1);
    const pesan = `Halo Uda/Uni, saya pengunjung website Asrama Merapi Singgalang. Saya ingin bertanya tentang penyewaan *${namaSewa}*.`;
    return `https://wa.me/${bersihkanNomor}?text=${encodeURIComponent(pesan)}`;
  };

  return (
    <div className="bg-[#f9f8f6] font-lora overflow-x-hidden relative">
      
      {/* MODAL POP-UP MULTIFUNGSI (Bisa untuk Berita & Penyewaan) */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease-out]" onClick={closeModal}>
          <button onClick={closeModal} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-black/50 p-2 rounded-full z-50"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-sm overflow-hidden flex flex-col md:flex-row shadow-2xl" onClick={e => e.stopPropagation()}>
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

            <div className={`w-full ${showLombaModal ? 'md:w-1/2' : 'md:w-2/5'} p-8 md:p-10 flex flex-col bg-[#fcfbf9] overflow-y-auto max-h-[50vh] md:max-h-[80vh]`}>
              
              {showLombaModal ? (
                // TAMPILAN FORM LOMBA TERBUKA
                <div className="flex flex-col h-full">
                  <h2 className="text-3xl font-bold font-playfair text-stone-900 mb-2 leading-snug">Formulir Pendaftaran</h2>
                  <p className="text-stone-500 text-sm mb-6 pb-4 border-b border-[#e8e4db]">{selectedItem.judul}</p>
                  <form onSubmit={handleSubmitLomba} className="space-y-4 font-sans">
                    <div><label className="text-xs font-bold text-stone-800 uppercase tracking-widest block mb-1">Nama Lengkap</label><input type="text" required value={formLomba.nama} onChange={(e) => setFormLomba({...formLomba, nama: e.target.value.replace(/[^a-zA-Z\s]/g, '')})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm text-stone-900" placeholder="Hanya huruf..." /></div>
                    <div><label className="text-xs font-bold text-stone-800 uppercase tracking-widest block mb-1">Nomor HP / WA</label><input type="tel" required value={formLomba.noHp} onChange={(e) => setFormLomba({...formLomba, noHp: e.target.value.replace(/\D/g, '')})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm text-stone-900" placeholder="Awali dengan 08..." maxLength={14} /></div>
                    <div><label className="text-xs font-bold text-stone-800 uppercase tracking-widest block mb-1">Alamat Asal / Instansi</label><textarea required rows="3" value={formLomba.alamat} onChange={(e) => setFormLomba({...formLomba, alamat: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm text-stone-900" placeholder="Tuliskan alamat lengkap..."></textarea></div>
                    <button type="submit" disabled={isSubmittingLomba} className="w-full bg-[#171412] hover:bg-amber-600 text-white font-playfair font-bold text-lg py-3 rounded transition-colors mt-2">{isSubmittingLomba ? "Memproses..." : "Daftar Sekarang"}</button>
                  </form>
                </div>
              ) : modalType === "sewa" ? (
                // TAMPILAN DETAIL PENYEWAAN
                <>
                  <div className="flex items-center gap-3 mb-4"><span className="text-xs font-bold tracking-widest uppercase text-amber-800 bg-amber-100 px-3 py-1 rounded-sm font-sans">{selectedItem.kategori}</span></div>
                  <h2 className="text-3xl font-bold font-playfair text-stone-900 mb-2 leading-snug">{selectedItem.nama}</h2>
                  <p className="text-amber-600 font-bold font-sans tracking-wide mb-6 text-xl">{selectedItem.harga}</p>
                  <div className="w-10 h-1 bg-amber-500 mb-6 rounded-full"></div>
                  <p className="text-stone-700 leading-relaxed text-base whitespace-pre-line">{selectedItem.deskripsi}</p>
                  <a href={formatWhatsAppLink(kontak.noTelpon, selectedItem.nama)} target="_blank" rel="noopener noreferrer" className="w-full mt-6 bg-[#171412] hover:bg-amber-500 text-white text-center py-3.5 rounded-sm text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 font-sans shadow-md">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> Reservasi via WhatsApp
                  </a>
                </>
              ) : (
                // TAMPILAN DETAIL BERITA BIASA
                <>
                  <div className="flex items-center gap-3 mb-4"><span className="text-xs font-bold tracking-widest uppercase text-red-800 bg-red-50 px-3 py-1 rounded-sm font-sans">{selectedItem.kategori}</span><span className="text-xs text-stone-500 font-sans">{selectedItem.tanggal}</span></div>
                  <h2 className="text-3xl font-bold font-playfair text-stone-900 mb-6 leading-snug">{selectedItem.judul}</h2>
                  <div className="w-10 h-1 bg-amber-500 mb-6 rounded-full"></div>
                  <p className="text-stone-700 leading-relaxed text-base whitespace-pre-line">{selectedItem.deskripsi}</p>
                </>
              )}
              
              {/* BAGIAN KOMENTAR (Berlaku untuk Berita & Sewa) */}
              {!showLombaModal && (
                <div className="mt-8 pt-8 border-t border-stone-200 font-sans">
                  <h3 className="font-playfair font-bold text-xl text-stone-900 mb-4">{modalType === "sewa" ? "Tanya / Komentar" : "Komentar"} ({komentarList.length})</h3>
                  <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                    {komentarList.length === 0 ? <p className="text-sm text-stone-500 italic">Belum ada diskusi. Ada pertanyaan?</p> : (
                      komentarList.map(k => (
                        <div key={k.id} className="bg-white p-4 rounded border border-stone-100 shadow-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-stone-900">{k.nama}</span>
                            <span className="text-[10px] text-stone-400">{k.waktu?.toDate ? k.waktu.toDate().toLocaleDateString('id-ID') : 'Baru saja'}</span>
                          </div>
                          <p className="text-sm text-stone-600">{k.isi}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={submitKomentar} className="space-y-3 bg-stone-50 p-4 rounded border border-stone-200">
                    <input type="text" value={formKomen.nama} onChange={e => setFormKomen({...formKomen, nama: e.target.value})} placeholder="Nama (Opsional / Anonim)" className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900" />
                    <textarea required value={formKomen.isi} onChange={e => setFormKomen({...formKomen, isi: e.target.value})} placeholder="Tulis pesan..." rows="2" className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"></textarea>
                    <button type="submit" disabled={isSubmittingKomen} className="bg-stone-900 text-white text-xs font-bold px-4 py-2 rounded hover:bg-amber-600 transition-colors w-full">{isSubmittingKomen ? 'Mengirim...' : 'Kirim Pesan'}</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <HeroSlider images={bgHero} titleLine1="Ranah Minang di" titleLine2="Serambi Kota Pelajar" subtitle="Etalase prestasi, repositori intelektual, dan ruang tumbuh bersama merawat tradisi." />

      {/* SUNTIKAN: LAYANAN & PENYEWAAN DI BERANDA */}
      {layananSewa.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pt-24 pb-12 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-amber-200 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-50 rounded-sm border border-amber-200 flex items-center justify-center text-amber-600 shrink-0"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg></div>
              <div><h2 className="text-3xl font-bold text-stone-900 font-playfair">Layanan Publik</h2><p className="text-stone-500 text-sm mt-1">Keahlian seni budaya dan sarana yang dapat disewa.</p></div>
            </div>
            <Link href="/fasilitas" className="hidden md:flex text-amber-600 text-xs font-bold uppercase tracking-widest font-sans items-center gap-1 hover:gap-2 transition-all hover:text-stone-900">Lihat Semua <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {layananSewa.map(item => (
              <div key={item.id} onClick={() => openModal(item, "sewa")} className="bg-white rounded-sm shadow-[4px_4px_0px_0px_rgba(245,158,11,0.1)] border border-amber-200 overflow-hidden group flex flex-col transition-all duration-300 w-full text-left relative cursor-pointer hover:-translate-y-1">
                <div className="absolute top-4 left-4 z-10 bg-amber-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-wider shadow-md font-sans">{item.kategori}</div>
                <AutoSliderCard images={item.linkGambar} className="w-full h-48 bg-stone-100 shrink-0" />
                <div className="p-6 flex flex-col flex-grow relative w-full items-start justify-start">
                  <h3 className="font-bold text-stone-900 text-xl mb-2 font-playfair m-0 group-hover:text-amber-600 transition-colors line-clamp-1">{item.nama}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed flex-grow m-0 mb-4 line-clamp-2">{item.deskripsi}</p>
                  <div className="w-full pt-4 border-t border-amber-100 flex justify-between items-center font-sans mt-auto">
                    <span className="font-bold text-base text-amber-600">{item.harga}</span>
                    <span className="text-xs font-bold text-stone-400 group-hover:text-stone-900 transition-colors uppercase tracking-widest flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Tanya</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link href="/fasilitas" className="mt-8 flex md:hidden text-amber-600 text-xs font-bold uppercase tracking-widest font-sans items-center justify-center gap-1 bg-amber-50 py-3 rounded border border-amber-100">Lihat Semua Layanan <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></Link>
        </section>
      )}

      {/* KABAR TERBARU (SAMA SEPERTI SEBELUMNYA) */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-24 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-[#e8e4db] pb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-800 rounded-sm flex items-center justify-center text-white shrink-0"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
            <div><h2 className="text-3xl font-bold text-stone-900 font-playfair">Kabar Terbaru Warga</h2><p className="text-stone-500 text-sm mt-1">Berita, prestasi, dan publikasi penghuni asrama.</p></div>
          </div>
          <Link href="/kehidupan" className="hidden md:flex text-red-800 text-xs font-bold uppercase tracking-widest font-sans items-center gap-1 hover:gap-2 transition-all hover:text-stone-900">Lihat Publikasi Lain <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></Link>
        </div>
        
        {kabarTerbaru.length === 0 ? <div className="text-center py-12 bg-white rounded-sm border border-[#e8e4db] text-stone-500 shadow-sm">Belum ada kabar terbaru.</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {kabarTerbaru.map((item, idx) => (
              <div key={item.id} onClick={() => openModal(item, "berita")} className={`bg-[#fcfbf9] border border-[#e8e4db] shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] flex flex-col md:flex-row overflow-hidden group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 reveal opacity-0 translate-y-12`} style={{ transitionDelay: `${(idx % 2) * 200}ms` }}>
                <div className="w-full md:w-2/5 h-48 md:h-auto shrink-0 relative overflow-hidden bg-stone-100"><AutoSliderCard images={item.linkGambar} /></div>
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
        <Link href="/kehidupan" className="mt-8 flex md:hidden text-red-800 text-xs font-bold uppercase tracking-widest font-sans items-center justify-center gap-1 bg-red-50 py-3 rounded border border-red-100">Lihat Publikasi Lain <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></Link>
      </section>
    </div>
  );
}

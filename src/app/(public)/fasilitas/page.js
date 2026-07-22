"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc, addDoc, serverTimestamp, where } from "firebase/firestore";

const HeroSlider = ({ images, title, subtitle }) => {
  const imgArray = Array.isArray(images) ? images : (images ? [images] : []);
  const [idx, setIdx] = useState(0);
  useEffect(() => { if (imgArray.length <= 1) return; const timer = setInterval(() => setIdx(p => (p + 1) % imgArray.length), 4000); return () => clearInterval(timer); }, [imgArray.length]);
  return (
    <div className="relative py-28 md:py-36 w-full bg-[#171412] flex flex-col items-center justify-center overflow-hidden text-center">
      <div className="absolute inset-0 w-full h-full bg-[#171412]">{imgArray.map((bg, i) => (<div key={i} className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${i === idx ? 'opacity-70' : 'opacity-0'}`} style={{ backgroundImage: `url('${bg}')` }}></div>))}<div className="absolute inset-0 bg-gradient-to-t from-[#171412] via-[#171412]/70 to-[#171412]/30 backdrop-blur-[1px]"></div></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full flex flex-col items-center pb-8 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-playfair drop-shadow-lg">{title}</h1>
        {subtitle && <p className="text-stone-300 text-lg max-w-2xl mx-auto m-0 mb-6">{subtitle}</p>}
        <div className="w-16 h-1.5 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
      </div>
    </div>
  );
};

const AutoSliderCard = ({ images, className, onClick }) => {
  const imgArray = Array.isArray(images) ? images : (images ? [images] : []);
  const [idx, setIdx] = useState(0);
  useEffect(() => { if (imgArray.length <= 1) return; const timer = setInterval(() => setIdx(p => (p + 1) % imgArray.length), 3500); return () => clearInterval(timer); }, [imgArray.length]);
  if (imgArray.length === 0) return <div className={`bg-stone-200 ${className}`} onClick={onClick}></div>;
  return (
    <div className={`relative overflow-hidden group cursor-pointer ${className}`} onClick={onClick}>
      {imgArray.map((src, i) => (<img key={i} src={src} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 group-hover:scale-105 ease-in-out ${i === idx ? "opacity-100" : "opacity-0"}`} alt="Visual" />))}
      {imgArray.length > 1 && <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-lg border border-white/10 z-10 font-sans">+{imgArray.length} Foto</div>}
      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-300"></div>
    </div>
  );
};

export default function FasilitasAsrama() {
  const [bgFasilitas, setBgFasilitas] = useState([]);
  const [dataFasilitas, setDataFasilitas] = useState([]);
  const [dataPenyewaan, setDataPenyewaan] = useState([]); 
  const [kontak, setKontak] = useState({ noTelpon: "-" });
  const [loading, setLoading] = useState(true);
  const [statusAsrama, setStatusAsrama] = useState({ kamar: "0", penghuni: "0", ketersediaan: "Penuh" });
  const [brosurUrl, setBrosurUrl] = useState("");

  const [showDaftarModal, setShowDaftarModal] = useState(false);
  const [formDaftar, setFormDaftar] = useState({ nama: "", asal: "", kuliah: "", jurusan: "", email: "", noHp: "", suku: "" });
  const [isSubmittingDaftar, setIsSubmittingDaftar] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(""); 
  const [modalImageIdx, setModalImageIdx] = useState(0);
  const [komentarList, setKomentarList] = useState([]);
  const [formKomen, setFormKomen] = useState({ nama: "", isi: "" });
  const [isSubmittingKomen, setIsSubmittingKomen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapFoto = await getDoc(doc(db, "pengaturan", "tampilan"));
        if (snapFoto.exists() && snapFoto.data().fasilitas) setBgFasilitas(snapFoto.data().fasilitas);
        const docKontak = await getDoc(doc(db, "pengaturan", "kontak"));
        if (docKontak.exists()) setKontak(docKontak.data());
        const docStatus = await getDoc(doc(db, "pengaturan", "statusAsrama"));
        if (docStatus.exists()) setStatusAsrama(docStatus.data());
        const docBrosur = await getDoc(doc(db, "pengaturan", "brosur"));
        if (docBrosur.exists()) setBrosurUrl(docBrosur.data().link);

        const fasSnap = await getDocs(query(collection(db, "daftar_fasilitas"), orderBy("createdAt", "asc")));
        setDataFasilitas(fasSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const sewaSnap = await getDocs(query(collection(db, "daftar_penyewaan"), orderBy("createdAt", "desc")));
        setDataPenyewaan(sewaSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const openDaftarModal = () => { setShowDaftarModal(true); document.body.style.overflow = "hidden"; };
  const closeDaftarModal = () => { setShowDaftarModal(false); document.body.style.overflow = "auto"; };

  const openModal = async (item, type) => { 
    setSelectedItem(item); setModalImageIdx(0); setModalType(type); document.body.style.overflow = "hidden"; 
    setKomentarList([]); setFormKomen({ nama: "", isi: "" }); 
    if (type === "sewa") {
      try {
        const targetId = String(item.id);
        const q = query(collection(db, "komentar_publikasi"), where("postId", "==", targetId));
        const snap = await getDocs(q);
        let comments = snap.docs.map(d => ({id: d.id, ...d.data()}));
        comments.sort((a, b) => (a.waktu?.toMillis() || 0) - (b.waktu?.toMillis() || 0));
        setKomentarList(comments);
      } catch(e) { console.error(e); }
    }
  };

  const closeModal = () => { setSelectedItem(null); setKomentarList([]); setFormKomen({ nama: "", isi: "" }); document.body.style.overflow = "auto"; };
  const modalImages = selectedItem ? (Array.isArray(selectedItem.linkGambar) ? selectedItem.linkGambar : [selectedItem.linkGambar]) : [];
  const nextModalImage = (e) => { e.stopPropagation(); setModalImageIdx((prev) => (prev + 1) % modalImages.length); };
  const prevModalImage = (e) => { e.stopPropagation(); setModalImageIdx((prev) => (prev - 1 + modalImages.length) % modalImages.length); };

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
    } catch (err) { alert("Gagal mengirim! Error: " + err.message); } finally { setIsSubmittingKomen(false); }
  };

  const handleSubmitDaftar = async (e) => {
    e.preventDefault();
    if (!formDaftar.noHp.startsWith("08")) return alert("Nomor HP harus diawali dengan angka 08");
    if (formDaftar.noHp.length < 11) return alert("Nomor HP tidak valid.");
    setIsSubmittingDaftar(true);
    try {
      await addDoc(collection(db, "pendaftaran_asrama"), { ...formDaftar, waktuDaftar: serverTimestamp() });
      alert("Pendaftaran Berhasil! Data Anda telah masuk. Silakan tunggu informasi dari pengurus asrama.");
      closeDaftarModal();
      setFormDaftar({ nama: "", asal: "", kuliah: "", jurusan: "", email: "", noHp: "", suku: "" });
    } catch (error) { alert("Pendaftaran Gagal."); } finally { setIsSubmittingDaftar(false); }
  };

  const formatWhatsAppLink = (nomor, namaSewa) => {
    if (!nomor || nomor === "-") return "#";
    let bersihkanNomor = nomor.replace(/\D/g, '');
    if (bersihkanNomor.startsWith('0')) bersihkanNomor = '62' + bersihkanNomor.substring(1);
    const pesan = `Halo Uda/Uni, saya pengunjung website Asrama Merapi Singgalang. Saya ingin bertanya tentang penyewaan *${namaSewa}*.`;
    return `https://wa.me/${bersihkanNomor}?text=${encodeURIComponent(pesan)}`;
  };

  return (
    <div className="bg-[#f9f8f6] pb-24 min-h-screen text-left font-lora overflow-x-hidden relative">
      
      {showDaftarModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease-out]" onClick={closeDaftarModal}>
          <button onClick={closeDaftarModal} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-black/50 p-2 rounded-full z-50"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-sm overflow-hidden flex flex-col md:flex-row shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="relative w-full md:w-1/2 bg-stone-900 h-64 md:h-[80vh] flex flex-col items-center justify-center shrink-0">
              {brosurUrl ? <img src={brosurUrl} className="max-w-full max-h-full object-contain drop-shadow-2xl" alt="Brosur Asrama" /> : <div className="text-white text-center p-8"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-4 text-stone-600"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg><p className="text-stone-400">Brosur belum diunggah admin.</p></div>}
            </div>
            <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col bg-[#fcfbf9] overflow-y-auto max-h-[50vh] md:max-h-[80vh]">
              <div className="flex flex-col h-full">
                <h2 className="text-2xl md:text-3xl font-bold font-playfair text-stone-900 mb-2 leading-snug">Pendaftaran Warga</h2>
                <div className="mb-6 pb-4 border-b border-[#e8e4db]"><p className="text-stone-600 text-sm mb-2">Pastikan Anda membaca syarat dan ketentuan pendaftaran warga baru yang tertera pada brosur sebelum mengisi formulir di bawah ini.</p></div>
                <form onSubmit={handleSubmitDaftar} className="space-y-4 font-sans">
                  <div><label className="text-xs font-bold text-stone-800 uppercase tracking-widest block mb-1">Nama Lengkap</label><input type="text" required value={formDaftar.nama} onChange={(e) => setFormDaftar({...formDaftar, nama: e.target.value.replace(/[^a-zA-Z\s]/g, '')})} className="w-full px-4 py-2 bg-white border border-stone-200 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm text-stone-900" placeholder="Hanya huruf..." /></div>
                  <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-stone-800 uppercase tracking-widest block mb-1">Daerah Asal</label><input type="text" required value={formDaftar.asal} onChange={(e) => setFormDaftar({...formDaftar, asal: e.target.value})} className="w-full px-4 py-2 bg-white border border-stone-200 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm text-stone-900" placeholder="Cth: Padang..." /></div><div><label className="text-xs font-bold text-stone-800 uppercase tracking-widest block mb-1">Suku</label><input type="text" required value={formDaftar.suku} onChange={(e) => setFormDaftar({...formDaftar, suku: e.target.value})} className="w-full px-4 py-2 bg-white border border-stone-200 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm text-stone-900" placeholder="Cth: Minang..." /></div></div>
                  <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-stone-800 uppercase tracking-widest block mb-1">Kampus / Univ</label><input type="text" required value={formDaftar.kuliah} onChange={(e) => setFormDaftar({...formDaftar, kuliah: e.target.value})} className="w-full px-4 py-2 bg-white border border-stone-200 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm text-stone-900" placeholder="Singkatan..." /></div><div><label className="text-xs font-bold text-stone-800 uppercase tracking-widest block mb-1">Jurusan / Prodi</label><input type="text" required value={formDaftar.jurusan} onChange={(e) => setFormDaftar({...formDaftar, jurusan: e.target.value})} className="w-full px-4 py-2 bg-white border border-stone-200 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm text-stone-900" placeholder="Jurusan..." /></div></div>
                  <div><label className="text-xs font-bold text-stone-800 uppercase tracking-widest block mb-1">Email Aktif</label><input type="email" required value={formDaftar.email} onChange={(e) => setFormDaftar({...formDaftar, email: e.target.value})} className="w-full px-4 py-2 bg-white border border-stone-200 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm text-stone-900" placeholder="email@contoh.com" /></div>
                  <div><label className="text-xs font-bold text-stone-800 uppercase tracking-widest block mb-1">Nomor HP / WhatsApp</label><input type="tel" required value={formDaftar.noHp} onChange={(e) => setFormDaftar({...formDaftar, noHp: e.target.value.replace(/\D/g, '')})} className="w-full px-4 py-2 bg-white border border-stone-200 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm text-stone-900" placeholder="Awali dengan 08..." maxLength={14} /></div>
                  <button type="submit" disabled={isSubmittingDaftar} className="w-full bg-[#171412] hover:bg-amber-600 text-white font-playfair font-bold text-lg py-3 rounded transition-colors mt-2">{isSubmittingDaftar ? "Mengirim Data..." : "Kirim Pendaftaran"}</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease-out]" onClick={closeModal}>
          <button onClick={closeModal} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-black/50 p-2 rounded-full z-50"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-sm overflow-hidden flex flex-col md:flex-row shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="relative w-full md:w-3/5 bg-stone-900 h-64 md:h-[80vh] flex items-center justify-center shrink-0 group">
              <img src={modalImages[modalImageIdx]} className="max-w-full max-h-full object-contain drop-shadow-2xl" alt="Preview" />
              {modalImages.length > 1 && (
                <>
                  <button onClick={prevModalImage} className="absolute left-4 bg-black/50 hover:bg-amber-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
                  <button onClick={nextModalImage} className="absolute right-4 bg-black/50 hover:bg-amber-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
                  <div className="absolute bottom-4 bg-black/60 px-4 py-1.5 rounded-full text-white text-xs tracking-widest font-bold font-sans">{modalImageIdx + 1} / {modalImages.length}</div>
                </>
              )}
            </div>

            <div className="w-full md:w-2/5 p-8 md:p-10 flex flex-col bg-[#fcfbf9] overflow-y-auto max-h-[50vh] md:max-h-[80vh]">
              {modalType === "sewa" ? (
                <>
                  <div className="flex items-center gap-3 mb-4"><span className="text-xs font-bold tracking-widest uppercase text-amber-800 bg-amber-100 px-3 py-1 rounded-sm font-sans">{selectedItem.kategori}</span></div>
                  <h2 className="text-3xl font-bold font-playfair text-stone-900 mb-2 leading-snug">{selectedItem.nama}</h2>
                  <p className="text-amber-600 font-bold font-sans tracking-wide mb-6 text-xl">{selectedItem.harga}</p>
                  <div className="w-10 h-1 bg-amber-500 mb-6 rounded-full"></div>
                  <p className="text-stone-700 leading-relaxed text-base whitespace-pre-line">{selectedItem.deskripsi}</p>
                  
                  <a href={formatWhatsAppLink(selectedItem.noHpSewa, selectedItem.nama)} target="_blank" rel="noopener noreferrer" className="w-full mt-6 bg-[#171412] hover:bg-amber-500 text-white text-center py-3.5 rounded-sm text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 font-sans shadow-md">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> Reservasi via WhatsApp
                  </a>

                  <div className="mt-8 pt-8 border-t border-stone-200 font-sans">
                    <h3 className="font-playfair font-bold text-xl text-stone-900 mb-4">Tanya / Komentar ({komentarList.length})</h3>
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
                      <textarea required value={formKomen.isi} onChange={e => setFormKomen({...formKomen, isi: e.target.value})} placeholder="Ketik pertanyaan atau komentar..." rows="2" className="w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"></textarea>
                      <button type="submit" disabled={isSubmittingKomen} className="bg-stone-900 text-white text-xs font-bold px-4 py-2 rounded hover:bg-amber-600 transition-colors w-full">{isSubmittingKomen ? 'Mengirim...' : 'Kirim Komentar'}</button>
                    </form>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4"><span className="text-xs font-bold tracking-widest uppercase text-red-800 bg-red-50 px-3 py-1 rounded-sm font-sans">FASILITAS ASRAMA</span></div>
                  <h2 className="text-3xl font-bold font-playfair text-stone-900 mb-6 leading-snug">{selectedItem.nama}</h2>
                  <div className="w-10 h-1 bg-red-800 mb-6 rounded-full"></div>
                  <p className="text-stone-700 leading-relaxed text-base whitespace-pre-line">{selectedItem.deskripsi}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <HeroSlider images={bgFasilitas} title="Fasilitas & Penyewaan" subtitle="Ruang fungsional yang mendukung produktivitas warga, serta layanan bakat yang disewakan untuk publik." />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="bg-[#fcfbf9] rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-[#e8e4db] p-8 grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-[#e8e4db]">
          <div className="text-center px-4 pt-4 md:pt-0 flex flex-col items-center justify-center"><div className="text-5xl font-playfair font-bold text-stone-900 mb-2">{statusAsrama.kamar}</div><div className="text-xs font-bold tracking-widest uppercase text-stone-500 font-sans">Total Kamar</div></div>
          <div className="text-center px-4 pt-8 md:pt-0 flex flex-col items-center justify-center"><div className="text-5xl font-playfair font-bold text-stone-900 mb-2">{statusAsrama.penghuni}</div><div className="text-xs font-bold tracking-widest uppercase text-stone-500 font-sans">Penghuni Aktif</div></div>
          <div className="text-center px-4 pt-8 md:pt-0 flex flex-col items-center justify-center"><div className={`text-3xl md:text-4xl font-playfair font-bold mb-3 ${statusAsrama.ketersediaan === 'Tersedia' ? 'text-green-700' : 'text-red-800'}`}>{statusAsrama.ketersediaan === 'Tersedia' ? 'Tersedia' : 'Penuh'}</div><div className="text-xs font-bold tracking-widest uppercase text-stone-500 font-sans">Status Kuota</div></div>
        </div>
      </div>

      <div id="pendaftaran" className="max-w-3xl mx-auto px-4 mt-28 mb-20 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="text-center mb-12"><h4 className="text-amber-600 font-bold tracking-widest text-xs uppercase font-sans mb-3">Informasi Pendaftaran</h4><h2 className="text-4xl font-bold text-stone-900 font-playfair mb-4">Penerimaan Warga Baru</h2><p className="text-stone-600 max-w-2xl mx-auto">Kami membuka kesempatan bagi mahasiswa perantau untuk bergabung dan menjadi bagian dari keluarga besar Asrama Mahasiswa Merapi Singgalang.</p></div>
        <div className="bg-white border border-[#e8e4db] p-8 md:p-12 rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-800 border border-red-100 mb-6"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5c-1.3 0-2 .7-2 2v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg></div>
          <h3 className="font-playfair text-2xl md:text-3xl font-bold text-stone-900 mb-4">Mari Bergabung Bersama Kami!</h3>
          <p className="text-stone-600 text-sm md:text-base leading-relaxed mb-8 max-w-lg">Klik tombol di bawah ini untuk melihat persyaratan pendaftaran melalui brosur resmi dan mengisi formulir data diri Anda secara daring.</p>
          <button onClick={openDaftarModal} className="inline-flex items-center justify-center gap-3 bg-red-800 hover:bg-amber-600 text-white px-8 py-4 rounded-sm text-sm font-bold uppercase tracking-widest transition-all font-sans shadow-md hover:-translate-y-1"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Buka Form Pendaftaran</button>
        </div>
      </div>

      <div id="fasilitas" className="max-w-7xl mx-auto px-4 mt-20 w-full text-left scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="flex items-center gap-4 mb-10 border-t border-[#e8e4db] pt-16">
          <div className="w-14 h-14 bg-[#171412] rounded-sm flex items-center justify-center text-white"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>
          <div><h2 className="text-3xl font-bold text-stone-900 font-playfair">Fasilitas Asrama</h2><p className="text-stone-500 text-sm mt-1">Area penunjang keseharian warga asrama.</p></div>
        </div>
        
        {loading ? <p className="text-center py-20 text-stone-500 w-full">Memuat data...</p> : dataFasilitas.length === 0 ? <div className="bg-white p-12 rounded-sm border border-[#e8e4db] text-stone-500 text-center shadow-sm w-full">Belum ada fasilitas yang ditambahkan.</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {dataFasilitas.map(item => (
              <div key={item.id} className="bg-white rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] border border-[#e8e4db] overflow-hidden flex flex-col transition-all duration-300 w-full text-left cursor-pointer group hover:-translate-y-1" onClick={() => openModal(item, "fasilitas")}>
                <AutoSliderCard images={item.linkGambar} className="w-full h-64 bg-stone-100 shrink-0" />
                <div className="p-8 flex flex-col flex-grow relative w-full text-left items-start justify-start">
                  <div className="w-10 h-1 bg-red-800 rounded-full mb-4 group-hover:w-16 transition-all duration-300"></div>
                  <h3 className="font-bold text-stone-900 text-2xl mb-3 font-playfair m-0 group-hover:text-red-800 transition-colors">{item.nama}</h3>
                  <p className="text-stone-600 text-base leading-relaxed flex-grow m-0 text-left line-clamp-3">{item.deskripsi}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div id="penyewaan" className="max-w-7xl mx-auto px-4 mt-28 mb-20 w-full text-left scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="flex items-center gap-4 mb-10 border-t border-amber-200 pt-16">
          <div className="w-14 h-14 bg-amber-50 rounded-sm border border-amber-200 flex items-center justify-center text-amber-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg></div>
          <div><h2 className="text-3xl font-bold text-stone-900 font-playfair">Layanan & Penyewaan</h2><p className="text-stone-500 text-sm mt-1">Talenta seni budaya dan sarana yang disewakan untuk publik.</p></div>
        </div>
        
        {loading ? <p className="text-center py-20 text-stone-500 w-full">Memuat data...</p> : dataPenyewaan.length === 0 ? <div className="bg-white p-12 rounded-sm border border-amber-200 text-stone-500 text-center shadow-sm w-full">Belum ada layanan yang ditambahkan.</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {dataPenyewaan.map(item => (
              <div key={item.id} onClick={() => openModal(item, "sewa")} className="bg-white rounded-sm shadow-[4px_4px_0px_0px_rgba(245,158,11,0.1)] border border-amber-200 overflow-hidden group flex flex-col transition-all duration-300 w-full text-left relative cursor-pointer hover:-translate-y-1">
                <div className="absolute top-4 left-4 z-10 bg-amber-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-wider shadow-md font-sans">{item.kategori}</div>
                <AutoSliderCard images={item.linkGambar} className="w-full h-64 bg-stone-100 shrink-0" />
                <div className="p-8 flex flex-col flex-grow relative w-full text-left items-start justify-start">
                  <h3 className="font-bold text-stone-900 text-2xl mb-3 font-playfair m-0 group-hover:text-amber-600 transition-colors">{item.nama}</h3>
                  <p className="text-stone-600 text-base leading-relaxed flex-grow m-0 text-left mb-6 line-clamp-3">{item.deskripsi}</p>
                  <div className="w-full pt-4 border-t border-amber-100 flex justify-between items-center font-sans mt-auto">
                    <span className="font-bold text-base text-amber-600">{item.harga}</span>
                    <span className="text-xs font-bold text-stone-400 group-hover:text-stone-900 transition-colors uppercase tracking-widest flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Detail</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

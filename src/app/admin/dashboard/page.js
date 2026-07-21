"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, setDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { signOut } from "firebase/auth";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("tampilan"); 
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const [tampilanUrls, setTampilanUrls] = useState({ hero: "", profil: "", fasilitas: "", kehidupan: "", alumni: "", gateway1: "", gateway2: "", gateway3: "" });
  const [tampilanFiles, setTampilanFiles] = useState({ hero: null, profil: null, fasilitas: null, kehidupan: null, alumni: null, gateway1: null, gateway2: null, gateway3: null });
  const [profilText, setProfilText] = useState({ sejarah: "", visi: "", misi: "", jejakAlumni: "", nilai1: "", nilai2: "", nilai3: "" });
  const [kontak, setKontak] = useState({ namaKetua: "", noTelpon: "" });

  const [dataFotoProfil, setDataFotoProfil] = useState([]);
  const [konteksFoto, setKonteksFoto] = useState("");
  const [fileFotoProfil, setFileFotoProfil] = useState(null);

  // State: Timeline Sejarah (BARU)
  const [dataTimeline, setDataTimeline] = useState([]);
  const [tahunTimeline, setTahunTimeline] = useState("");
  const [judulTimeline, setJudulTimeline] = useState("");
  const [deskripsiTimeline, setDeskripsiTimeline] = useState("");

  const [dataFasilitas, setDataFasilitas] = useState([]);
  const [namaFasilitas, setNamaFasilitas] = useState("");
  const [deskripsiFasilitas, setDeskripsiFasilitas] = useState("");
  const [fileFasilitas, setFileFasilitas] = useState(null);

  const [dataGaleri, setDataGaleri] = useState([]);
  const [judulGaleri, setJudulGaleri] = useState("");
  const [warnaGaleri, setWarnaGaleri] = useState("#ffffff");
  const [fileGaleri, setFileGaleri] = useState(null);

  const [dataKehidupan, setDataKehidupan] = useState([]);
  const [judulKonten, setJudulKonten] = useState("");
  const [kategori, setKategori] = useState("PRESTASI");
  const [deskripsi, setDeskripsi] = useState("");
  const [fileGambar, setFileGambar] = useState(null);

  const [dataSkripsi, setDataSkripsi] = useState([]);
  const [nama, setNama] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [judulSkripsi, setJudulSkripsi] = useState("");
  const [tahun, setTahun] = useState("");
  const [filePDF, setFilePDF] = useState(null);

  // State: Log Pengunduh Skripsi (BARU)
  const [dataLogUnduh, setDataLogUnduh] = useState([]);

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    const docSnap = await getDoc(doc(db, "pengaturan", "tampilan"));
    if (docSnap.exists()) setTampilanUrls(docSnap.data());
    const docProfil = await getDoc(doc(db, "pengaturan", "profilText"));
    if (docProfil.exists()) setProfilText(docProfil.data());
    const docKontak = await getDoc(doc(db, "pengaturan", "kontak"));
    if (docKontak.exists()) setKontak(docKontak.data());

    const fotoProfSnap = await getDocs(query(collection(db, "profil_galeri"), orderBy("createdAt", "desc")));
    setDataFotoProfil(fotoProfSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    // Fetch Timeline Sejarah
    const timeSnap = await getDocs(query(collection(db, "timeline_sejarah"), orderBy("tahun", "asc")));
    setDataTimeline(timeSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    const fasSnap = await getDocs(query(collection(db, "daftar_fasilitas"), orderBy("createdAt", "desc")));
    setDataFasilitas(fasSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    const galSnap = await getDocs(query(collection(db, "fasilitas"), orderBy("createdAt", "desc"))); 
    setDataGaleri(galSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    const kehSnap = await getDocs(query(collection(db, "kehidupan"), orderBy("createdAt", "desc")));
    setDataKehidupan(kehSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    const skrSnap = await getDocs(query(collection(db, "skripsi"), orderBy("tahun", "desc")));
    setDataSkripsi(skrSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    // Fetch Log Unduhan
    const logSnap = await getDocs(query(collection(db, "log_unduh_skripsi"), orderBy("waktuAkses", "desc")));
    setDataLogUnduh(logSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const uploadToCloudinary = async (file, resourceType = "image") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, { method: "POST", body: formData });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.secure_url;
  };

  const handleSaveTampilan = async (e) => {
    e.preventDefault(); setLoading(true); setStatus({ type: "", message: "" });
    try {
      let newUrls = { ...tampilanUrls };
      const keys = ["hero", "profil", "fasilitas", "kehidupan", "alumni", "gateway1", "gateway2", "gateway3"];
      for (let key of keys) {
        if (tampilanFiles[key]) newUrls[key] = await uploadToCloudinary(tampilanFiles[key], "image");
      }
      await setDoc(doc(db, "pengaturan", "tampilan"), newUrls, { merge: true });
      setTampilanUrls(newUrls); setTampilanFiles({ hero: null, profil: null, fasilitas: null, kehidupan: null, alumni: null, gateway1: null, gateway2: null, gateway3: null });
      setStatus({ type: "success", message: "Semua foto latar berhasil diperbarui!" });
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); }
  };

  const handleSaveProfilText = async (e) => {
    e.preventDefault(); setLoading(true); setStatus({ type: "", message: "" });
    try {
      await setDoc(doc(db, "pengaturan", "profilText"), profilText);
      await setDoc(doc(db, "pengaturan", "kontak"), kontak);
      setStatus({ type: "success", message: "Teks profil & Kontak berhasil diperbarui!" });
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); }
  };

  const handleSubmitFotoProfil = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const linkGambar = await uploadToCloudinary(fileFotoProfil, "image");
      await addDoc(collection(db, "profil_galeri"), { konteks: konteksFoto, linkGambar, createdAt: serverTimestamp() });
      setStatus({ type: "success", message: "Foto Profil Kontekstual ditambahkan!" });
      setKonteksFoto(""); setFileFotoProfil(null); e.target.reset(); fetchAllData();
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); }
  };

  // Submit Timeline Sejarah (BARU)
  const handleSubmitTimeline = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await addDoc(collection(db, "timeline_sejarah"), { tahun: tahunTimeline, judul: judulTimeline, deskripsi: deskripsiTimeline, createdAt: serverTimestamp() });
      setStatus({ type: "success", message: "Timeline berhasil ditambahkan!" });
      setTahunTimeline(""); setJudulTimeline(""); setDeskripsiTimeline(""); e.target.reset(); fetchAllData();
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); }
  };

  const handleSubmitFasilitas = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const linkGambar = await uploadToCloudinary(fileFasilitas, "image");
      await addDoc(collection(db, "daftar_fasilitas"), { nama: namaFasilitas, deskripsi: deskripsiFasilitas, linkGambar, createdAt: serverTimestamp() });
      setStatus({ type: "success", message: "Fasilitas berhasil ditambahkan!" });
      setNamaFasilitas(""); setDeskripsiFasilitas(""); setFileFasilitas(null); e.target.reset(); fetchAllData();
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); }
  };

  const handleSubmitGaleri = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const linkGambar = await uploadToCloudinary(fileGaleri, "image");
      await addDoc(collection(db, "fasilitas"), { judul: judulGaleri, warna: warnaGaleri, linkGambar, createdAt: serverTimestamp() });
      setStatus({ type: "success", message: "Foto galeri kegiatan ditambahkan!" });
      setJudulGaleri(""); setWarnaGaleri("#ffffff"); setFileGaleri(null); e.target.reset(); fetchAllData();
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); }
  };

  const handleSubmitKehidupan = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const linkGambar = await uploadToCloudinary(fileGambar, "image");
      await addDoc(collection(db, "kehidupan"), { judul: judulKonten, kategori, deskripsi, linkGambar, tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), createdAt: serverTimestamp() });
      setStatus({ type: "success", message: "Publikasi ditambahkan!" });
      setJudulKonten(""); setDeskripsi(""); setFileGambar(null); e.target.reset(); fetchAllData();
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); }
  };

  const handleSubmitSkripsi = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      let linkPDF = "#";
      if (filePDF) {
        let rawUrl = await uploadToCloudinary(filePDF, "image");
        linkPDF = rawUrl.replace("/upload/", "/upload/fl_attachment/");
      }
      await addDoc(collection(db, "skripsi"), { nama, jurusan, judul: judulSkripsi, tahun, linkPDF, createdAt: serverTimestamp() });
      setStatus({ type: "success", message: "Skripsi ditambahkan!" });
      setNama(""); setJurusan(""); setJudulSkripsi(""); setTahun(""); setFilePDF(null); e.target.reset(); fetchAllData();
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); }
  };

  const handleDelete = async (koleksi, id) => {
    if (confirm("Yakin ingin menghapus data ini secara permanen?")) { await deleteDoc(doc(db, koleksi, id)); fetchAllData(); }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-50 p-4 px-8 flex justify-between items-center">
        <div className="font-serif font-bold text-xl flex items-center gap-2">
          <img src="/mersi.png" alt="Logo" className="w-6 h-6 object-contain" /> Admin Mersi
        </div>
        <button onClick={() => {signOut(auth); router.push("/admin/login")}} className="bg-red-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">Logout</button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex space-x-2 mb-8 bg-white p-2 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <button onClick={() => { setActiveTab("tampilan"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "tampilan" ? "bg-red-50 text-red-800" : "text-slate-700 hover:bg-slate-50"}`}>Pengaturan Teks & Foto</button>
          <button onClick={() => { setActiveTab("timeline"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "timeline" ? "bg-red-50 text-red-800" : "text-slate-700 hover:bg-slate-50"}`}>Timeline Sejarah</button>
          <button onClick={() => { setActiveTab("fotoprofil"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "fotoprofil" ? "bg-red-50 text-red-800" : "text-slate-700 hover:bg-slate-50"}`}>Foto Profil</button>
          <button onClick={() => { setActiveTab("fasilitas"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "fasilitas" ? "bg-red-50 text-red-800" : "text-slate-700 hover:bg-slate-50"}`}>Fasilitas Asrama</button>
          <button onClick={() => { setActiveTab("galeri"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "galeri" ? "bg-red-50 text-red-800" : "text-slate-700 hover:bg-slate-50"}`}>Galeri Kegiatan</button>
          <button onClick={() => { setActiveTab("kehidupan"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "kehidupan" ? "bg-red-50 text-red-800" : "text-slate-700 hover:bg-slate-50"}`}>Media & Publikasi</button>
          <button onClick={() => { setActiveTab("skripsi"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "skripsi" ? "bg-red-50 text-red-800" : "text-slate-700 hover:bg-slate-50"}`}>Repositori Skripsi</button>
          <button onClick={() => { setActiveTab("log"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "log" ? "bg-red-800 text-white" : "bg-stone-800 text-white hover:bg-stone-700"}`}>Log Pengunduh</button>
        </div>

        {status.message && <div className={`p-4 rounded-lg mb-6 text-sm font-medium border ${status.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>{status.message}</div>}

        {/* TAB 1: PENGATURAN TEKS & FOTO */}
        {activeTab === "tampilan" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Edit Teks Website Asrama</h2>
              <form onSubmit={handleSaveProfilText} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-red-800 border-l-2 border-red-800 pl-2">Kontak Asrama (Footer)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-slate-800 text-sm block mb-1">Nama Ketua Asrama</label>
                      <input required type="text" value={kontak.namaKetua} onChange={(e) => setKontak({...kontak, namaKetua: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-md" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-800 text-sm block mb-1">Nomor WhatsApp / Telp</label>
                      <input required type="text" value={kontak.noTelpon} onChange={(e) => setKontak({...kontak, noTelpon: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-md" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-red-800 border-l-2 border-red-800 pl-2">Halaman Profil</h3>
                  <div>
                    <label className="font-semibold text-slate-800 text-sm block mb-1">Sejarah Asrama (Gunakan Enter/Baris Baru untuk memisah Kertas)</label>
                    <textarea required rows="4" value={profilText.sejarah} onChange={(e) => setProfilText({...profilText, sejarah: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-md"></textarea>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-slate-800 text-sm block mb-1">Visi</label>
                      <textarea required rows="3" value={profilText.visi} onChange={(e) => setProfilText({...profilText, visi: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-md"></textarea>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-800 text-sm block mb-1">Misi</label>
                      <textarea required rows="3" value={profilText.misi} onChange={(e) => setProfilText({...profilText, misi: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-md"></textarea>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="text-xs block mb-1">Sistem Silang</label><textarea required rows="2" value={profilText.nilai1} onChange={(e) => setProfilText({...profilText, nilai1: e.target.value})} className="w-full px-3 py-2 border rounded-md"></textarea></div>
                    <div><label className="text-xs block mb-1">Intelektualitas</label><textarea required rows="2" value={profilText.nilai2} onChange={(e) => setProfilText({...profilText, nilai2: e.target.value})} className="w-full px-3 py-2 border rounded-md"></textarea></div>
                    <div><label className="text-xs block mb-1">Kemandirian</label><textarea required rows="2" value={profilText.nilai3} onChange={(e) => setProfilText({...profilText, nilai3: e.target.value})} className="w-full px-3 py-2 border rounded-md"></textarea></div>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-red-800 border-l-2 border-red-800 pl-2">Halaman Jaringan Alumni</h3>
                  <div><label className="text-sm block mb-1">Teks Jejak Alumni</label><textarea required rows="2" value={profilText.jejakAlumni} onChange={(e) => setProfilText({...profilText, jejakAlumni: e.target.value})} className="w-full px-4 py-2 border rounded-md"></textarea></div>
                </div>
                <button type="submit" disabled={loading} className="bg-slate-900 text-white px-6 py-2 rounded-md font-semibold">{loading ? "Menyimpan..." : "Simpan Teks"}</button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Ubah Foto Latar Belakang</h2>
              <form onSubmit={handleSaveTampilan} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-red-800 border-l-2 border-red-800 pl-2">Slideshow Gateway</h3>
                  {[1, 2, 3].map((num) => (
                    <div key={`gw${num}`} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-50 p-4 border rounded-lg">
                      <div><label className="font-semibold text-slate-800">Foto Gateway {num}</label></div>
                      <input type="file" accept="image/*" onChange={(e) => setTampilanFiles({...tampilanFiles, [`gateway${num}`]: e.target.files[0]})} className="text-sm cursor-pointer" />
                    </div>
                  ))}
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-red-800 border-l-2 border-red-800 pl-2">Halaman Utama Website</h3>
                  {[
                    { id: 'hero', title: 'Beranda (Hero)' }, { id: 'profil', title: 'Halaman Profil' }, { id: 'fasilitas', title: 'Halaman Fasilitas (Baru)' },
                    { id: 'kehidupan', title: 'Media & Publikasi' }, { id: 'alumni', title: 'Jaringan Alumni' }
                  ].map((item) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-50 p-4 border rounded-lg">
                      <div><label className="font-semibold text-slate-800">Foto Latar {item.title}</label></div>
                      <input type="file" accept="image/*" onChange={(e) => setTampilanFiles({...tampilanFiles, [item.id]: e.target.files[0]})} className="text-sm cursor-pointer" />
                    </div>
                  ))}
                </div>
                <button type="submit" disabled={loading} className="bg-slate-900 text-white px-6 py-2 rounded-md font-semibold">{loading ? "Menyimpan..." : "Simpan Foto Latar"}</button>
              </form>
            </div>
          </div>
        )}

        {/* TAB TIMELINE SEJARAH (BARU) */}
        {activeTab === "timeline" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Tambah Titik Waktu (Timeline) Sejarah</h2>
              <form onSubmit={handleSubmitTimeline} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4">
                  <input type="text" required value={tahunTimeline} onChange={(e) => setTahunTimeline(e.target.value)} placeholder="Tahun (Cth: 1962)" className="w-full px-4 py-2 border border-slate-300 rounded-md" />
                  <input type="text" required value={judulTimeline} onChange={(e) => setJudulTimeline(e.target.value)} placeholder="Peristiwa (Cth: Pendirian Asrama)" className="w-full px-4 py-2 border border-slate-300 rounded-md" />
                </div>
                <textarea required rows="2" value={deskripsiTimeline} onChange={(e) => setDeskripsiTimeline(e.target.value)} placeholder="Deskripsi singkat peristiwa..." className="w-full px-4 py-2 border border-slate-300 rounded-md"></textarea>
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold">{loading ? "Menyimpan..." : "Tambahkan ke Timeline"}</button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Garis Waktu Terdaftar</h3>
              <div className="space-y-4">
                {dataTimeline.map(item => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex justify-between items-start gap-4">
                    <div>
                      <span className="inline-block px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded mb-2">{item.tahun}</span>
                      <h4 className="font-bold text-slate-900 mb-1">{item.judul}</h4>
                      <p className="text-sm text-slate-600">{item.deskripsi}</p>
                    </div>
                    <button onClick={() => handleDelete("timeline_sejarah", item.id)} className="bg-red-600 text-white text-xs px-3 py-1.5 rounded shrink-0 hover:bg-red-700">Hapus</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB FOTO PROFIL */}
        {activeTab === "fotoprofil" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Tambah Foto Profil (Pelengkap Teks)</h2>
              <p className="text-sm text-slate-600 mb-4">Gambar ini akan disisipkan di halaman Profil beserta caption/konteks agar halaman tidak hanya berisi teks.</p>
              <form onSubmit={handleSubmitFotoProfil} className="space-y-4">
                <textarea required rows="2" value={konteksFoto} onChange={(e) => setKonteksFoto(e.target.value)} placeholder="Tuliskan keterangan (konteks) dari foto ini..." className="w-full px-4 py-2 border border-slate-300 rounded-md"></textarea>
                <input type="file" required accept="image/*" onChange={(e) => setFileFotoProfil(e.target.files[0])} className="w-full text-sm cursor-pointer" />
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold">{loading ? "Menyimpan..." : "Tambahkan Foto Profil"}</button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Daftar Foto Profil</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataFotoProfil.map(item => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-start gap-4 p-3">
                    <img src={item.linkGambar} className="w-24 h-24 object-cover rounded-md shrink-0" />
                    <div className="flex flex-col justify-between h-full w-full">
                      <p className="text-xs text-slate-600 line-clamp-3 mb-2">{item.konteks}</p>
                      <button onClick={() => handleDelete("profil_galeri", item.id)} className="text-red-600 text-xs font-semibold self-start hover:underline">Hapus Foto</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB FASILITAS ASRAMA */}
        {activeTab === "fasilitas" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Tambah Fasilitas Asrama</h2>
              <form onSubmit={handleSubmitFasilitas} className="space-y-4">
                <input type="text" required value={namaFasilitas} onChange={(e) => setNamaFasilitas(e.target.value)} placeholder="Nama Fasilitas..." className="w-full px-4 py-2 border border-slate-300 rounded-md" />
                <textarea required rows="2" value={deskripsiFasilitas} onChange={(e) => setDeskripsiFasilitas(e.target.value)} placeholder="Deskripsi..." className="w-full px-4 py-2 border border-slate-300 rounded-md"></textarea>
                <input type="file" required accept="image/*" onChange={(e) => setFileFasilitas(e.target.files[0])} className="w-full text-sm cursor-pointer" />
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold">{loading ? "Menyimpan..." : "Tambahkan Fasilitas"}</button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Daftar Fasilitas Asrama</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dataFasilitas.map(item => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                    <img src={item.linkGambar} className="w-full h-32 object-cover" />
                    <div className="p-4 flex flex-col flex-grow">
                      <h4 className="font-bold text-slate-900 mb-1">{item.nama}</h4>
                      <p className="text-xs text-slate-600 mb-4 flex-grow line-clamp-2">{item.deskripsi}</p>
                      <button onClick={() => handleDelete("daftar_fasilitas", item.id)} className="bg-red-600 text-white text-xs px-3 py-1.5 rounded">Hapus</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB GALERI */}
        {activeTab === "galeri" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Tambah Galeri Kegiatan</h2>
              <form onSubmit={handleSubmitGaleri} className="space-y-4">
                <input type="text" required value={judulGaleri} onChange={(e) => setJudulGaleri(e.target.value)} placeholder="Nama/Judul Kegiatan..." className="w-full px-4 py-2 border border-slate-300 rounded-md" />
                <input type="color" value={warnaGaleri} onChange={(e) => setWarnaGaleri(e.target.value)} className="h-10 cursor-pointer border rounded-md" />
                <input type="file" required accept="image/*" onChange={(e) => setFileGaleri(e.target.files[0])} className="w-full text-sm cursor-pointer" />
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold">Tambah</button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Daftar Foto Galeri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataGaleri.map(item => (
                  <div key={item.id} className="relative h-40 rounded-lg overflow-hidden">
                    <img src={item.linkGambar} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-end justify-between p-3">
                      <span className="font-bold" style={{ color: item.warna }}>{item.judul}</span>
                      <button onClick={() => handleDelete("fasilitas", item.id)} className="bg-red-600 text-white text-xs px-3 py-1 rounded">Hapus</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB PUBLIKASI */}
        {activeTab === "kehidupan" && (
           <div className="space-y-6">
             <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
               <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Tambah Publikasi Baru</h2>
               <form onSubmit={handleSubmitKehidupan} className="space-y-4">
                 <input type="text" required value={judulKonten} onChange={(e) => setJudulKonten(e.target.value)} placeholder="Judul..." className="w-full px-4 py-2 border rounded-md" />
                 <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full px-4 py-2 border rounded-md"><option value="PRESTASI">Prestasi</option><option value="KEWIRAUSAHAAN">Kewirausahaan</option><option value="MEDIA">Media</option></select>
                 <textarea required rows="3" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Deskripsi..." className="w-full px-4 py-2 border rounded-md"></textarea>
                 <input type="file" required accept="image/*" onChange={(e) => setFileGambar(e.target.files[0])} className="w-full text-sm cursor-pointer" />
                 <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold">Publikasikan</button>
               </form>
             </div>
             <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
               <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Daftar Publikasi</h3>
               <div className="space-y-3">
                 {dataKehidupan.map(item => (
                   <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg">
                     <div><div className="font-semibold text-sm">{item.judul} <span className="text-red-600 text-xs">({item.kategori})</span></div></div>
                     <button onClick={() => handleDelete("kehidupan", item.id)} className="text-red-500 text-xs font-semibold">Hapus</button>
                   </div>
                 ))}
               </div>
             </div>
           </div>
        )}

        {/* TAB SKRIPSI */}
        {activeTab === "skripsi" && (
           <div className="space-y-6">
             <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
               <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Tambah Skripsi</h2>
               <form onSubmit={handleSubmitSkripsi} className="space-y-4">
                 <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama Penulis..." className="w-full px-4 py-2 border rounded-md" />
                 <input type="text" required value={jurusan} onChange={(e) => setJurusan(e.target.value)} placeholder="Jurusan..." className="w-full px-4 py-2 border rounded-md" />
                 <textarea required rows="1" value={judulSkripsi} onChange={(e) => setJudulSkripsi(e.target.value)} placeholder="Judul Skripsi..." className="w-full px-4 py-2 border rounded-md"></textarea>
                 <input type="number" required value={tahun} onChange={(e) => setTahun(e.target.value)} placeholder="Tahun..." className="w-full px-4 py-2 border rounded-md" />
                 <input type="file" accept=".pdf" onChange={(e) => setFilePDF(e.target.files[0])} className="w-full text-sm cursor-pointer" />
                 <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold">Simpan Skripsi</button>
               </form>
             </div>
             <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
               <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Kelola Skripsi</h3>
               <div className="space-y-3">
                 {dataSkripsi.map(item => (
                   <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg">
                     <div><div className="font-semibold text-sm">{item.nama} - {item.tahun}</div><div className="text-xs line-clamp-1">{item.judul}</div></div>
                     <button onClick={() => handleDelete("skripsi", item.id)} className="text-red-500 text-xs font-semibold">Hapus</button>
                   </div>
                 ))}
               </div>
             </div>
           </div>
        )}

        {/* TAB LOG PENGUNDUH SKRIPSI (BONUS TAB) */}
        {activeTab === "log" && (
           <div className="space-y-6">
             <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
               <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                 <h2 className="text-lg font-bold text-slate-900">Log Pengunjung (Pengunduh Skripsi)</h2>
                 <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Total: {dataLogUnduh.length} Data</span>
               </div>
               <p className="text-sm text-slate-600 mb-6">Data ini adalah identitas pengunjung web yang mengisi formulir keamanan sebelum mengunduh dan membaca skripsi alumni.</p>
               
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse text-sm">
                   <thead>
                     <tr className="bg-slate-50 border-y border-slate-200 text-slate-600">
                       <th className="p-3 font-semibold">Waktu Akses</th>
                       <th className="p-3 font-semibold">Identitas Pengunduh</th>
                       <th className="p-3 font-semibold">Skripsi yang Dibaca</th>
                       <th className="p-3 font-semibold text-center">Aksi</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {dataLogUnduh.length === 0 ? (
                       <tr><td colSpan="4" className="p-8 text-center text-slate-500">Belum ada riwayat pengunduh.</td></tr>
                     ) : (
                       dataLogUnduh.map(item => (
                         <tr key={item.id} className="hover:bg-slate-50">
                           <td className="p-3 text-xs text-slate-500">{item.waktuAkses ? new Date(item.waktuAkses.toDate()).toLocaleString('id-ID') : 'Baru saja'}</td>
                           <td className="p-3">
                             <div className="font-bold text-slate-900">{item.namaPengunduh}</div>
                             <div className="text-xs text-slate-600">📱 {item.noHpPengunduh} | ✉️ {item.emailPengunduh}</div>
                           </td>
                           <td className="p-3">
                             <div className="font-semibold text-slate-800 text-xs">Penulis: {item.penulisSkripsi}</div>
                             <div className="text-xs text-slate-500 line-clamp-1">{item.judulSkripsi}</div>
                           </td>
                           <td className="p-3 text-center">
                             <button onClick={() => handleDelete("log_unduh_skripsi", item.id)} className="text-red-500 hover:text-red-700 font-semibold text-xs">Hapus</button>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
           </div>
        )}
      </main>
    </div>
  );
}

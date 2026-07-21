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

  const [tampilanUrls, setTampilanUrls] = useState({ hero: [], profil: [], fasilitas: [], kehidupan: [], alumni: [], gateway: [] });
  const [tampilanFiles, setTampilanFiles] = useState({ hero: [], profil: [], fasilitas: [], kehidupan: [], alumni: [], gateway: [] });
  const [profilText, setProfilText] = useState({ sejarah: "", visi: "", misi: "", jejakAlumni: "", nilai1: "", nilai2: "", nilai3: "" });
  const [kontak, setKontak] = useState({ namaKetua: "", noTelpon: "" });

  const [statusAsrama, setStatusAsrama] = useState({ kamar: "", penghuni: "", ketersediaan: "Tersedia" });
  const [panduanUrls, setPanduanUrls] = useState({ prosedur: "", aturan: "" });
  const [filePanduan, setFilePanduan] = useState({ prosedur: null, aturan: null });

  const [dataFotoProfil, setDataFotoProfil] = useState([]);
  const [konteksFoto, setKonteksFoto] = useState("");
  const [filesFotoProfil, setFilesFotoProfil] = useState([]);

  const [dataTimeline, setDataTimeline] = useState([]);
  const [tahunTimeline, setTahunTimeline] = useState("");
  const [judulTimeline, setJudulTimeline] = useState("");
  const [deskripsiTimeline, setDeskripsiTimeline] = useState("");

  const [dataFasilitas, setDataFasilitas] = useState([]);
  const [namaFasilitas, setNamaFasilitas] = useState("");
  const [deskripsiFasilitas, setDeskripsiFasilitas] = useState("");
  const [filesFasilitas, setFilesFasilitas] = useState([]);

  const [dataGaleri, setDataGaleri] = useState([]);
  const [judulGaleri, setJudulGaleri] = useState("");
  const [warnaGaleri, setWarnaGaleri] = useState("#ffffff");
  const [filesGaleri, setFilesGaleri] = useState([]); 

  const [dataKehidupan, setDataKehidupan] = useState([]);
  const [judulKonten, setJudulKonten] = useState("");
  const [kategori, setKategori] = useState("PRESTASI");
  const [deskripsi, setDeskripsi] = useState("");
  const [filesGambar, setFilesGambar] = useState([]); 

  const [dataSkripsi, setDataSkripsi] = useState([]);
  const [nama, setNama] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [judulSkripsi, setJudulSkripsi] = useState("");
  const [tahun, setTahun] = useState("");
  const [filePDF, setFilePDF] = useState(null);

  const [dataLogUnduh, setDataLogUnduh] = useState([]);

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    const docSnap = await getDoc(doc(db, "pengaturan", "tampilan"));
    if (docSnap.exists()) setTampilanUrls(docSnap.data());
    const docProfil = await getDoc(doc(db, "pengaturan", "profilText"));
    if (docProfil.exists()) setProfilText(docProfil.data());
    const docKontak = await getDoc(doc(db, "pengaturan", "kontak"));
    if (docKontak.exists()) setKontak(docKontak.data());

    const docStatus = await getDoc(doc(db, "pengaturan", "statusAsrama"));
    if (docStatus.exists()) setStatusAsrama(docStatus.data());
    const docPanduan = await getDoc(doc(db, "pengaturan", "panduan"));
    if (docPanduan.exists()) setPanduanUrls(docPanduan.data());

    const fotoProfSnap = await getDocs(query(collection(db, "profil_galeri"), orderBy("createdAt", "desc")));
    setDataFotoProfil(fotoProfSnap.docs.map(d => ({ id: d.id, ...d.data() })));
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
      const keys = ["hero", "profil", "fasilitas", "kehidupan", "alumni", "gateway"];
      for (let key of keys) {
        if (tampilanFiles[key] && tampilanFiles[key].length > 0) {
          let urls = [];
          for (const file of tampilanFiles[key]) { urls.push(await uploadToCloudinary(file, "image")); }
          newUrls[key] = urls;
        }
      }
      // Membersihkan data lama gateway jika admin upload baru
      if (tampilanFiles.gateway && tampilanFiles.gateway.length > 0) {
        delete newUrls.gateway1; delete newUrls.gateway2; delete newUrls.gateway3;
      }
      await setDoc(doc(db, "pengaturan", "tampilan"), newUrls, { merge: true });
      setTampilanUrls(newUrls); setTampilanFiles({ hero: [], profil: [], fasilitas: [], kehidupan: [], alumni: [], gateway: [] });
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

  const handleSaveStatusAsrama = async (e) => {
    e.preventDefault(); setLoading(true); setStatus({ type: "", message: "" });
    try {
      await setDoc(doc(db, "pengaturan", "statusAsrama"), statusAsrama);
      setStatus({ type: "success", message: "Status Asrama berhasil diperbarui!" });
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); }
  };

  const handleSavePanduan = async (e) => {
    e.preventDefault(); setLoading(true); setStatus({ type: "", message: "" });
    try {
      let newUrls = { ...panduanUrls };
      if (filePanduan.prosedur) {
        let rawUrl = await uploadToCloudinary(filePanduan.prosedur, "image");
        newUrls.prosedur = rawUrl.replace("/upload/", "/upload/fl_attachment/");
      }
      if (filePanduan.aturan) {
        let rawUrl = await uploadToCloudinary(filePanduan.aturan, "image");
        newUrls.aturan = rawUrl.replace("/upload/", "/upload/fl_attachment/");
      }
      await setDoc(doc(db, "pengaturan", "panduan"), newUrls, { merge: true });
      setPanduanUrls(newUrls); setFilePanduan({ prosedur: null, aturan: null });
      setStatus({ type: "success", message: "Dokumen Prosedur & Aturan diperbarui!" });
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); }
  };

  const handleSubmitFotoProfil = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      let urls = [];
      for (const file of filesFotoProfil) { urls.push(await uploadToCloudinary(file, "image")); }
      await addDoc(collection(db, "profil_galeri"), { konteks: konteksFoto, linkGambar: urls, createdAt: serverTimestamp() });
      setStatus({ type: "success", message: "Foto Profil Kontekstual ditambahkan!" });
      setKonteksFoto(""); setFilesFotoProfil([]); e.target.reset(); fetchAllData();
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); }
  };

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
      let urls = [];
      for (const file of filesFasilitas) { urls.push(await uploadToCloudinary(file, "image")); }
      await addDoc(collection(db, "daftar_fasilitas"), { nama: namaFasilitas, deskripsi: deskripsiFasilitas, linkGambar: urls, createdAt: serverTimestamp() });
      setStatus({ type: "success", message: "Fasilitas berhasil ditambahkan!" });
      setNamaFasilitas(""); setDeskripsiFasilitas(""); setFilesFasilitas([]); e.target.reset(); fetchAllData();
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); }
  };

  const handleSubmitGaleri = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      let urls = [];
      for (const file of filesGaleri) { urls.push(await uploadToCloudinary(file, "image")); }
      await addDoc(collection(db, "fasilitas"), { judul: judulGaleri, warna: warnaGaleri, linkGambar: urls, createdAt: serverTimestamp() });
      setStatus({ type: "success", message: "Foto galeri kegiatan ditambahkan!" });
      setJudulGaleri(""); setWarnaGaleri("#ffffff"); setFilesGaleri([]); e.target.reset(); fetchAllData();
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); }
  };

  const handleSubmitKehidupan = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      let urls = [];
      for (const file of filesGambar) { urls.push(await uploadToCloudinary(file, "image")); }
      await addDoc(collection(db, "kehidupan"), { judul: judulKonten, kategori, deskripsi, linkGambar: urls, tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), createdAt: serverTimestamp() });
      setStatus({ type: "success", message: "Publikasi ditambahkan!" });
      setJudulKonten(""); setDeskripsi(""); setFilesGambar([]); e.target.reset(); fetchAllData();
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
        <div className="font-serif font-bold text-xl flex items-center gap-2"><img src="/mersi.png" alt="Logo" className="w-6 h-6 object-contain" /> Admin Mersi</div>
        <button onClick={() => {signOut(auth); router.push("/admin/login")}} className="bg-red-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">Logout</button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex space-x-2 mb-8 bg-white p-2 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <button onClick={() => { setActiveTab("tampilan"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "tampilan" ? "bg-red-50 text-red-800" : "text-slate-700 hover:bg-slate-50"}`}>Pengaturan Teks & Foto</button>
          <button onClick={() => { setActiveTab("status"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "status" ? "bg-red-50 text-red-800" : "text-slate-700 hover:bg-slate-50"}`}>Status & Panduan</button>
          <button onClick={() => { setActiveTab("timeline"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "timeline" ? "bg-red-50 text-red-800" : "text-slate-700 hover:bg-slate-50"}`}>Timeline Sejarah</button>
          <button onClick={() => { setActiveTab("fotoprofil"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "fotoprofil" ? "bg-red-50 text-red-800" : "text-slate-700 hover:bg-slate-50"}`}>Foto Profil</button>
          <button onClick={() => { setActiveTab("fasilitas"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "fasilitas" ? "bg-red-50 text-red-800" : "text-slate-700 hover:bg-slate-50"}`}>Fasilitas Asrama</button>
          <button onClick={() => { setActiveTab("galeri"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "galeri" ? "bg-red-50 text-red-800" : "text-slate-700 hover:bg-slate-50"}`}>Galeri Kegiatan</button>
          <button onClick={() => { setActiveTab("kehidupan"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "kehidupan" ? "bg-red-50 text-red-800" : "text-slate-700 hover:bg-slate-50"}`}>Media & Publikasi</button>
          <button onClick={() => { setActiveTab("skripsi"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "skripsi" ? "bg-red-50 text-red-800" : "text-slate-700 hover:bg-slate-50"}`}>Repositori Skripsi</button>
          <button onClick={() => { setActiveTab("log"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "log" ? "bg-red-800 text-white" : "bg-stone-800 text-white hover:bg-stone-700"}`}>Log Pengunduh</button>
        </div>

        {status.message && <div className={`p-4 rounded-lg mb-6 text-sm font-medium border ${status.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>{status.message}</div>}

        {/* TAB PENGATURAN TEKS & FOTO */}
        {activeTab === "tampilan" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"><h2 className="text-lg font-bold mb-4 border-b pb-2">Edit Teks Website Asrama</h2> <form onSubmit={handleSaveProfilText} className="space-y-6"> <div className="space-y-4"> <h3 className="font-semibold text-red-800 border-l-2 pl-2">Kontak Asrama (Footer)</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div><label className="text-sm block mb-1">Nama Ketua</label><input required type="text" value={kontak.namaKetua} onChange={(e) => setKontak({...kontak, namaKetua: e.target.value})} className="w-full px-4 py-2 border rounded-md" /></div> <div><label className="text-sm block mb-1">Nomor WA</label><input required type="text" value={kontak.noTelpon} onChange={(e) => setKontak({...kontak, noTelpon: e.target.value})} className="w-full px-4 py-2 border rounded-md" /></div> </div> </div> <div className="space-y-4 pt-4 border-t"> <h3 className="font-semibold text-red-800 border-l-2 pl-2">Halaman Profil</h3> <div><label className="text-sm block mb-1">Sejarah Asrama</label><textarea required rows="4" value={profilText.sejarah} onChange={(e) => setProfilText({...profilText, sejarah: e.target.value})} className="w-full px-4 py-2 border rounded-md"></textarea></div> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div><label className="text-sm block mb-1">Visi</label><textarea required rows="3" value={profilText.visi} onChange={(e) => setProfilText({...profilText, visi: e.target.value})} className="w-full px-4 py-2 border rounded-md"></textarea></div> <div><label className="text-sm block mb-1">Misi</label><textarea required rows="3" value={profilText.misi} onChange={(e) => setProfilText({...profilText, misi: e.target.value})} className="w-full px-4 py-2 border rounded-md"></textarea></div> </div> </div> <div className="space-y-4 pt-4 border-t"> <h3 className="font-semibold text-red-800 border-l-2 pl-2">Halaman Jaringan Alumni</h3> <div><label className="text-sm block mb-1">Teks Jejak Alumni</label><textarea required rows="2" value={profilText.jejakAlumni} onChange={(e) => setProfilText({...profilText, jejakAlumni: e.target.value})} className="w-full px-4 py-2 border rounded-md"></textarea></div> </div> <button type="submit" disabled={loading} className="bg-slate-900 text-white px-6 py-2 rounded-md font-semibold">Simpan Teks</button> </form> </div>
            
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h2 className="text-lg font-bold mb-4 border-b pb-2">Ubah Foto Latar Belakang (Multi-Upload)</h2>
              <form onSubmit={handleSaveTampilan} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-red-800 border-l-2 pl-2">Slideshow Gateway (Halaman Beranda Utama)</h3>
                  <div className="bg-slate-50 p-4 border rounded-lg">
                    <label className="font-semibold block mb-2">Pilih Beberapa Foto Gateway Sekaligus</label>
                    <input type="file" multiple accept="image/*" onChange={(e) => setTampilanFiles({...tampilanFiles, gateway: Array.from(e.target.files)})} className="w-full text-sm cursor-pointer bg-white p-2 border rounded" />
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-red-800 border-l-2 pl-2">Latar Belakang Tiap Halaman (Slideshow)</h3>
                  {[{ id: 'hero', title: 'Beranda (Hero)' }, { id: 'profil', title: 'Profil' }, { id: 'fasilitas', title: 'Fasilitas' }, { id: 'kehidupan', title: 'Media' }, { id: 'alumni', title: 'Alumni' }].map((item) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center bg-slate-50 p-4 border rounded-lg">
                      <label className="font-semibold text-sm">Latar {item.title}</label>
                      <input type="file" multiple accept="image/*" onChange={(e) => setTampilanFiles({...tampilanFiles, [item.id]: Array.from(e.target.files)})} className="w-full text-sm cursor-pointer bg-white p-2 border rounded" />
                    </div>
                  ))}
                </div>
                <button type="submit" disabled={loading} className="bg-slate-900 text-white px-6 py-2 rounded-md font-semibold">Simpan Slideshow Latar</button>
              </form>
            </div>
          </div>
        )}

        {/* TAB STATUS, PANDUAN, TIMELINE TETAP SAMA */}
        {activeTab === "status" && ( <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">Status Asrama</h2> <form onSubmit={handleSaveStatusAsrama} className="space-y-4"> <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> <div> <label className="text-sm font-semibold mb-1 block">Jumlah Kamar</label> <input type="number" required value={statusAsrama.kamar} onChange={(e) => setStatusAsrama({...statusAsrama, kamar: e.target.value})} className="w-full px-4 py-2 border rounded-md" /> </div> <div> <label className="text-sm font-semibold mb-1 block">Jumlah Penghuni</label> <input type="number" required value={statusAsrama.penghuni} onChange={(e) => setStatusAsrama({...statusAsrama, penghuni: e.target.value})} className="w-full px-4 py-2 border rounded-md" /> </div> <div> <label className="text-sm font-semibold mb-1 block">Ketersediaan</label> <select value={statusAsrama.ketersediaan} onChange={(e) => setStatusAsrama({...statusAsrama, ketersediaan: e.target.value})} className="w-full px-4 py-2 border rounded-md"> <option value="Tersedia">🟢 Tersedia</option> <option value="Penuh">🔴 Penuh</option> </select> </div> </div> <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">Perbarui Status</button> </form> </div> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">Dokumen Panduan (PDF)</h2> <form onSubmit={handleSavePanduan} className="space-y-6"> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div className="bg-slate-50 p-4 border rounded-lg"> <label className="font-bold block mb-2">Panduan Prosedur</label> <input type="file" accept=".pdf" onChange={(e) => setFilePanduan({...filePanduan, prosedur: e.target.files[0]})} className="w-full text-sm mb-2" /> {panduanUrls.prosedur && <p className="text-xs text-green-600">✓ Aktif</p>} </div> <div className="bg-slate-50 p-4 border rounded-lg"> <label className="font-bold block mb-2">Aturan Asrama</label> <input type="file" accept=".pdf" onChange={(e) => setFilePanduan({...filePanduan, aturan: e.target.files[0]})} className="w-full text-sm mb-2" /> {panduanUrls.aturan && <p className="text-xs text-green-600">✓ Aktif</p>} </div> </div> <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">Simpan Dokumen</button> </form> </div> </div> )}
        {activeTab === "timeline" && ( <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">Tambah Timeline</h2> <form onSubmit={handleSubmitTimeline} className="space-y-4"> <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4"> <input type="text" required value={tahunTimeline} onChange={(e) => setTahunTimeline(e.target.value)} placeholder="Tahun" className="w-full px-4 py-2 border rounded-md" /> <input type="text" required value={judulTimeline} onChange={(e) => setJudulTimeline(e.target.value)} placeholder="Peristiwa" className="w-full px-4 py-2 border rounded-md" /> </div> <textarea required rows="2" value={deskripsiTimeline} onChange={(e) => setDeskripsiTimeline(e.target.value)} placeholder="Deskripsi..." className="w-full px-4 py-2 border rounded-md"></textarea> <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">Tambahkan</button> </form> </div> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h3 className="font-bold mb-4 border-b pb-2">Daftar Timeline</h3> <div className="space-y-4"> {dataTimeline.map(item => ( <div key={item.id} className="bg-slate-50 border rounded-lg p-4 flex justify-between"> <div> <span className="px-2 py-1 bg-amber-500 text-white text-xs rounded mb-2">{item.tahun}</span> <h4 className="font-bold">{item.judul}</h4> <p className="text-sm text-slate-600">{item.deskripsi}</p> </div> <button onClick={() => handleDelete("timeline_sejarah", item.id)} className="bg-red-600 text-white text-xs px-3 py-1.5 rounded">Hapus</button> </div> ))} </div> </div> </div> )}

        {/* TAB FOTO PROFIL DIPERBARUI (MULTI-UPLOAD) */}
        {activeTab === "fotoprofil" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Tambah Foto Profil (Bisa Pilih Banyak)</h2>
              <form onSubmit={handleSubmitFotoProfil} className="space-y-4">
                <textarea required rows="2" value={konteksFoto} onChange={(e) => setKonteksFoto(e.target.value)} placeholder="Konteks/Deskripsi foto..." className="w-full px-4 py-2 border rounded-md"></textarea>
                <input type="file" multiple required accept="image/*" onChange={(e) => setFilesFotoProfil(Array.from(e.target.files))} className="w-full text-sm cursor-pointer border p-2 rounded bg-slate-50" />
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold">Tambahkan Foto Profil</button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Daftar Foto Profil</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataFotoProfil.map(item => {
                  const imgUtama = Array.isArray(item.linkGambar) ? item.linkGambar[0] : item.linkGambar;
                  const count = Array.isArray(item.linkGambar) ? item.linkGambar.length : 1;
                  return (
                    <div key={item.id} className="bg-slate-50 border rounded-lg flex gap-4 p-3 relative">
                      <img src={imgUtama} className="w-24 h-24 object-cover rounded-md shrink-0" />
                      {count > 1 && <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">+{count}</div>}
                      <div className="flex flex-col justify-between w-full">
                        <p className="text-xs text-slate-600 line-clamp-3 mb-2">{item.konteks}</p>
                        <button onClick={() => handleDelete("profil_galeri", item.id)} className="text-red-600 text-xs font-semibold self-start hover:underline">Hapus Foto</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB FASILITAS DIPERBARUI (MULTI-UPLOAD) */}
        {activeTab === "fasilitas" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Tambah Fasilitas Asrama (Bisa Pilih Banyak)</h2>
              <form onSubmit={handleSubmitFasilitas} className="space-y-4">
                <input type="text" required value={namaFasilitas} onChange={(e) => setNamaFasilitas(e.target.value)} placeholder="Nama Fasilitas..." className="w-full px-4 py-2 border rounded-md" />
                <textarea required rows="2" value={deskripsiFasilitas} onChange={(e) => setDeskripsiFasilitas(e.target.value)} placeholder="Deskripsi..." className="w-full px-4 py-2 border rounded-md"></textarea>
                <input type="file" multiple required accept="image/*" onChange={(e) => setFilesFasilitas(Array.from(e.target.files))} className="w-full text-sm cursor-pointer border p-2 rounded bg-slate-50" />
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold">Tambahkan Fasilitas</button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Daftar Fasilitas Asrama</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dataFasilitas.map(item => {
                  const imgUtama = Array.isArray(item.linkGambar) ? item.linkGambar[0] : item.linkGambar;
                  const count = Array.isArray(item.linkGambar) ? item.linkGambar.length : 1;
                  return (
                    <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex flex-col relative">
                      <img src={imgUtama} className="w-full h-32 object-cover" />
                      {count > 1 && <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">+{count} Foto</div>}
                      <div className="p-4 flex flex-col flex-grow">
                        <h4 className="font-bold text-slate-900 mb-1">{item.nama}</h4>
                        <p className="text-xs text-slate-600 mb-4 flex-grow line-clamp-2">{item.deskripsi}</p>
                        <button onClick={() => handleDelete("daftar_fasilitas", item.id)} className="bg-red-600 text-white text-xs px-3 py-1.5 rounded">Hapus</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB GALERI & KEHIDUPAN (SUDAH MULTI-UPLOAD DARI SEBELUMNYA) */}
        {activeTab === "galeri" && ( <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">Tambah Galeri Kegiatan</h2> <p className="text-xs text-slate-500 mb-4">Pilih banyak foto sekaligus.</p> <form onSubmit={handleSubmitGaleri} className="space-y-4"> <input type="text" required value={judulGaleri} onChange={(e) => setJudulGaleri(e.target.value)} placeholder="Nama/Judul..." className="w-full px-4 py-2 border rounded-md" /> <input type="color" value={warnaGaleri} onChange={(e) => setWarnaGaleri(e.target.value)} className="h-10 cursor-pointer border rounded-md" /> <input type="file" multiple required accept="image/*" onChange={(e) => setFilesGaleri(Array.from(e.target.files))} className="w-full text-sm cursor-pointer border p-2 rounded bg-slate-50" /> <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">Tambah ke Galeri</button> </form> </div> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h3 className="font-bold mb-4 border-b pb-2">Daftar Foto Galeri</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {dataGaleri.map(item => { const imgUtama = Array.isArray(item.linkGambar) ? item.linkGambar[0] : item.linkGambar; const count = Array.isArray(item.linkGambar) ? item.linkGambar.length : 1; return ( <div key={item.id} className="relative h-40 rounded-lg overflow-hidden border"> <img src={imgUtama} className="w-full h-full object-cover" /> {count > 1 && <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">+{count} Foto</div>} <div className="absolute inset-0 bg-black/50 flex items-end justify-between p-3"> <span className="font-bold" style={{ color: item.warna }}>{item.judul}</span> <button onClick={() => handleDelete("fasilitas", item.id)} className="bg-red-600 text-white text-xs px-3 py-1 rounded">Hapus</button> </div> </div> ); })} </div> </div> </div> )}
        {activeTab === "kehidupan" && ( <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">Tambah Publikasi Baru</h2> <form onSubmit={handleSubmitKehidupan} className="space-y-4"> <input type="text" required value={judulKonten} onChange={(e) => setJudulKonten(e.target.value)} placeholder="Judul Berita..." className="w-full px-4 py-2 border rounded-md" /> <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full px-4 py-2 border rounded-md"><option value="PRESTASI">Prestasi</option><option value="KEWIRAUSAHAAN">Kewirausahaan</option><option value="MEDIA">Media</option></select> <textarea required rows="4" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Isi Berita..." className="w-full px-4 py-2 border rounded-md"></textarea> <input type="file" multiple required accept="image/*" onChange={(e) => setFilesGambar(Array.from(e.target.files))} className="w-full text-sm cursor-pointer border p-2 rounded bg-slate-50" /> <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold">Publikasikan Berita</button> </form> </div> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h3 className="font-bold mb-4 border-b pb-2">Daftar Publikasi</h3> <div className="space-y-3"> {dataKehidupan.map(item => ( <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg"> <div> <div className="font-semibold text-sm">{item.judul} <span className="text-red-600 text-xs">({item.kategori})</span></div> <div className="text-xs text-slate-500">{Array.isArray(item.linkGambar) ? `${item.linkGambar.length} Foto` : '1 Foto'}</div> </div> <button onClick={() => handleDelete("kehidupan", item.id)} className="text-red-500 text-xs font-semibold">Hapus</button> </div> ))} </div> </div> </div> )}

        {/* TAB SKRIPSI & LOG TETAP SAMA */}
        {activeTab === "skripsi" && ( <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">Tambah Skripsi</h2> <form onSubmit={handleSubmitSkripsi} className="space-y-4"> <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama Penulis..." className="w-full px-4 py-2 border rounded-md" /> <input type="text" required value={jurusan} onChange={(e) => setJurusan(e.target.value)} placeholder="Jurusan..." className="w-full px-4 py-2 border rounded-md" /> <textarea required rows="1" value={judulSkripsi} onChange={(e) => setJudulSkripsi(e.target.value)} placeholder="Judul Skripsi..." className="w-full px-4 py-2 border rounded-md"></textarea> <input type="number" required value={tahun} onChange={(e) => setTahun(e.target.value)} placeholder="Tahun..." className="w-full px-4 py-2 border rounded-md" /> <input type="file" accept=".pdf" onChange={(e) => setFilePDF(e.target.files[0])} className="w-full text-sm" /> <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">Simpan Skripsi</button> </form> </div> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h3 className="font-bold mb-4 border-b pb-2">Kelola Skripsi</h3> <div className="space-y-3"> {dataSkripsi.map(item => ( <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg"> <div><div className="font-semibold text-sm">{item.nama} - {item.tahun}</div><div className="text-xs line-clamp-1">{item.judul}</div></div> <button onClick={() => handleDelete("skripsi", item.id)} className="text-red-500 text-xs font-semibold">Hapus</button> </div> ))} </div> </div> </div> )}
        {activeTab === "log" && ( <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">Log Pengunjung</h2> <div className="overflow-x-auto"> <table className="w-full text-left text-sm"> <thead> <tr className="bg-slate-50 border-y text-slate-600"> <th className="p-3">Waktu</th> <th className="p-3">Identitas</th> <th className="p-3">Skripsi</th> <th className="p-3">Aksi</th> </tr> </thead> <tbody className="divide-y"> {dataLogUnduh.map(item => ( <tr key={item.id}> <td className="p-3 text-xs">{item.waktuAkses ? new Date(item.waktuAkses.toDate()).toLocaleString('id-ID') : '-'}</td> <td className="p-3"><b>{item.namaPengunduh}</b><br/><span className="text-xs">{item.noHpPengunduh} | {item.emailPengunduh}</span></td> <td className="p-3 text-xs"><b>{item.penulisSkripsi}</b><br/>{item.judulSkripsi}</td> <td className="p-3"><button onClick={() => handleDelete("log_unduh_skripsi", item.id)} className="text-red-500 text-xs">Hapus</button></td> </tr> ))} </tbody> </table> </div> </div> </div> )}
      </main>
    </div>
  );
}

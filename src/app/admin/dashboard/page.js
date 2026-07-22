"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, setDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { signOut } from "firebase/auth";

// Konfigurasi Hak Akses Tab Berdasarkan Peran
const TAB_ROLES = {
  sekre: ["tampilan", "status", "kepengurusan", "timeline", "fotoprofil", "fasilitas", "penyewaan", "galeri", "kehidupan", "skripsi", "log"],
  humas: ["status", "fotoprofil", "galeri", "kehidupan"],
  puki: ["tampilan", "fotoprofil", "galeri", "kehidupan"], // Puki hanya bisa upload foto di 'tampilan'
  perkap: ["fasilitas", "fotoprofil", "galeri", "kehidupan"],
  tendor: ["fotoprofil", "galeri", "kehidupan"],
  klh: ["fotoprofil", "galeri", "kehidupan"]
};

// Penamaan Tab Untuk Menu Navigasi
const TAB_NAMES = {
  tampilan: "Pengaturan Web & Foto", status: "Pendaftaran & Status", kepengurusan: "Kepengurusan",
  timeline: "Timeline", fotoprofil: "Foto Profil", fasilitas: "Fasilitas Asrama",
  penyewaan: "Penyewaan", galeri: "Galeri", kehidupan: "Media Publikasi", skripsi: "Skripsi", log: "Log Data"
};

export default function AdminDashboard() {
  const router = useRouter();
  
  // STATE OTENTIKASI & PERAN
  const [role, setRole] = useState("");
  const [allowedTabs, setAllowedTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(""); 
  const [authReady, setAuthReady] = useState(false);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const [tampilanUrls, setTampilanUrls] = useState({ hero: [], profil: [], fasilitas: [], kehidupan: [], alumni: [], gateway: [] });
  const [tampilanFiles, setTampilanFiles] = useState({ hero: [], profil: [], fasilitas: [], kehidupan: [], alumni: [], gateway: [] });
  const [profilText, setProfilText] = useState({ sejarah: "", visi: "", misi: "", jejakAlumni: "", nilai1: "", nilai2: "", nilai3: "" });
  const [kontak, setKontak] = useState({ namaKetua: "", noTelpon: "" });

  const [statusAsrama, setStatusAsrama] = useState({ kamar: "", penghuni: "", ketersediaan: "Tersedia" });
  const [brosurUrl, setBrosurUrl] = useState("");
  const [fileBrosur, setFileBrosur] = useState(null);

  const [pengurusInti, setPengurusInti] = useState({ ketuaNama: "", ketuaFoto: "", sekreNama: "", sekreFoto: "", bendaharaNama: "", bendaharaFoto: "" });
  const [fileInti, setFileInti] = useState({ ketua: null, sekretaris: null, bendahara: null });
  const [dataDivisi, setDataDivisi] = useState([]);
  const [namaDivisiBaru, setNamaDivisiBaru] = useState("");
  const [dataAnggota, setDataAnggota] = useState([]);
  const [formAnggota, setFormAnggota] = useState({ divisiId: "", nama: "" });
  const [fileAnggota, setFileAnggota] = useState(null);

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

  const [dataPenyewaan, setDataPenyewaan] = useState([]);
  const [namaSewa, setNamaSewa] = useState("");
  const [kategoriSewa, setKategoriSewa] = useState("Tempat / Barang");
  const [hargaSewa, setHargaSewa] = useState("");
  const [noHpSewa, setNoHpSewa] = useState(""); 
  const [deskripsiSewa, setDeskripsiSewa] = useState("");
  const [filesSewa, setFilesSewa] = useState([]);

  const [dataGaleri, setDataGaleri] = useState([]);
  const [judulGaleri, setJudulGaleri] = useState("");
  const [deskripsiGaleri, setDeskripsiGaleri] = useState("");
  const [warnaGaleri, setWarnaGaleri] = useState("#ffffff");
  const [filesGaleri, setFilesGaleri] = useState([]); 

  const [dataKehidupan, setDataKehidupan] = useState([]);
  const [judulKonten, setJudulKonten] = useState("");
  const [kategori, setKategori] = useState("PRESTASI");
  const [customKategori, setCustomKategori] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [filesGambar, setFilesGambar] = useState([]); 

  const [dataSkripsi, setDataSkripsi] = useState([]);
  const [nama, setNama] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [judulSkripsi, setJudulSkripsi] = useState("");
  const [tahun, setTahun] = useState("");
  const [filePDF, setFilePDF] = useState(null);

  const [dataLogUnduh, setDataLogUnduh] = useState([]);
  const [dataPendaftarLomba, setDataPendaftarLomba] = useState([]);
  const [dataPendaftarAsrama, setDataPendaftarAsrama] = useState([]);
  const [dataKomentar, setDataKomentar] = useState([]);

  useEffect(() => {
    import("firebase/auth").then(({ onAuthStateChanged }) => {
      onAuthStateChanged(auth, (user) => {
        if (!user) { router.push("/admin/login"); return; }
        
        // Deteksi Peran berdasarkan Email/Username
        const email = user.email || "";
        let currRole = "sekre"; // Default jika pakai Gmail Google
        
        if (email.startsWith("humas")) currRole = "humas";
        else if (email.startsWith("puki")) currRole = "puki";
        else if (email.startsWith("perkap")) currRole = "perkap";
        else if (email.startsWith("tendor")) currRole = "tendor";
        else if (email.startsWith("klh")) currRole = "klh";

        const tabsForRole = TAB_ROLES[currRole] || [];
        setRole(currRole);
        setAllowedTabs(tabsForRole);
        setActiveTab(tabsForRole[0]); // Langsung arahkan ke tab pertama yang diizinkan
        setAuthReady(true);
        fetchAllData();
      });
    });
  }, []);

  const fetchAllData = async () => {
    const docSnap = await getDoc(doc(db, "pengaturan", "tampilan"));
    if (docSnap.exists()) setTampilanUrls(docSnap.data());
    const docProfil = await getDoc(doc(db, "pengaturan", "profilText"));
    if (docProfil.exists()) setProfilText(docProfil.data());
    const docKontak = await getDoc(doc(db, "pengaturan", "kontak"));
    if (docKontak.exists()) setKontak(docKontak.data());
    const docStatus = await getDoc(doc(db, "pengaturan", "statusAsrama"));
    if (docStatus.exists()) setStatusAsrama(docStatus.data());
    const docBrosur = await getDoc(doc(db, "pengaturan", "brosur"));
    if (docBrosur.exists()) setBrosurUrl(docBrosur.data().link);

    const docInti = await getDoc(doc(db, "pengaturan", "pengurus_inti"));
    if (docInti.exists()) setPengurusInti(docInti.data());
    const divSnap = await getDocs(query(collection(db, "divisi_asrama"), orderBy("createdAt", "asc")));
    setDataDivisi(divSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const angSnap = await getDocs(query(collection(db, "anggota_divisi"), orderBy("createdAt", "asc")));
    setDataAnggota(angSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    const fotoProfSnap = await getDocs(query(collection(db, "profil_galeri"), orderBy("createdAt", "desc")));
    setDataFotoProfil(fotoProfSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const timeSnap = await getDocs(query(collection(db, "timeline_sejarah"), orderBy("tahun", "asc")));
    setDataTimeline(timeSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    const fasSnap = await getDocs(query(collection(db, "daftar_fasilitas"), orderBy("createdAt", "desc")));
    setDataFasilitas(fasSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const sewaSnap = await getDocs(query(collection(db, "daftar_penyewaan"), orderBy("createdAt", "desc")));
    setDataPenyewaan(sewaSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const galSnap = await getDocs(query(collection(db, "fasilitas"), orderBy("createdAt", "desc"))); 
    setDataGaleri(galSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const kehSnap = await getDocs(query(collection(db, "kehidupan"), orderBy("createdAt", "desc")));
    setDataKehidupan(kehSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const skrSnap = await getDocs(query(collection(db, "skripsi"), orderBy("tahun", "desc")));
    setDataSkripsi(skrSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    const logSnap = await getDocs(query(collection(db, "log_unduh_skripsi"), orderBy("waktuAkses", "desc")));
    setDataLogUnduh(logSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const lombaSnap = await getDocs(query(collection(db, "pendaftaran_lomba"), orderBy("waktuDaftar", "desc")));
    setDataPendaftarLomba(lombaSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const asramaSnap = await getDocs(query(collection(db, "pendaftaran_asrama"), orderBy("waktuDaftar", "desc")));
    setDataPendaftarAsrama(asramaSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const komenSnap = await getDocs(query(collection(db, "komentar_publikasi"), orderBy("waktu", "desc")));
    setDataKomentar(komenSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const uploadToCloudinary = async (file, resourceType = "image") => { const formData = new FormData(); formData.append("file", file); formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET); const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, { method: "POST", body: formData }); const data = await res.json(); if (data.error) throw new Error(data.error.message); return data.secure_url; };
  
  const handleSaveTampilan = async (e) => { e.preventDefault(); setLoading(true); setStatus({ type: "", message: "" }); try { let newUrls = { ...tampilanUrls }; const keys = ["hero", "profil", "fasilitas", "kehidupan", "alumni", "gateway"]; for (let key of keys) { if (tampilanFiles[key] && tampilanFiles[key].length > 0) { let urls = []; for (const file of tampilanFiles[key]) { urls.push(await uploadToCloudinary(file, "image")); } newUrls[key] = urls; } } if (tampilanFiles.gateway && tampilanFiles.gateway.length > 0) { delete newUrls.gateway1; delete newUrls.gateway2; delete newUrls.gateway3; } await setDoc(doc(db, "pengaturan", "tampilan"), newUrls, { merge: true }); setTampilanUrls(newUrls); setTampilanFiles({ hero: [], profil: [], fasilitas: [], kehidupan: [], alumni: [], gateway: [] }); setStatus({ type: "success", message: "Semua foto latar berhasil diperbarui!" }); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleSaveProfilText = async (e) => { e.preventDefault(); setLoading(true); setStatus({ type: "", message: "" }); try { await setDoc(doc(db, "pengaturan", "profilText"), profilText); await setDoc(doc(db, "pengaturan", "kontak"), kontak); setStatus({ type: "success", message: "Teks profil & Kontak berhasil diperbarui!" }); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleSaveStatusAsrama = async (e) => { e.preventDefault(); setLoading(true); setStatus({ type: "", message: "" }); try { await setDoc(doc(db, "pengaturan", "statusAsrama"), statusAsrama); setStatus({ type: "success", message: "Status Asrama berhasil diperbarui!" }); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleSaveBrosur = async (e) => { e.preventDefault(); setLoading(true); setStatus({ type: "", message: "" }); try { if (fileBrosur) { const url = await uploadToCloudinary(fileBrosur, "image"); await setDoc(doc(db, "pengaturan", "brosur"), { link: url }); setBrosurUrl(url); setFileBrosur(null); setStatus({ type: "success", message: "Brosur Pendaftaran berhasil diperbarui!" }); } } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  
  const handleSavePengurusInti = async (e) => { e.preventDefault(); setLoading(true); setStatus({ type: "", message: "" }); try { let newData = { ...pengurusInti }; if (fileInti.ketua) newData.ketuaFoto = await uploadToCloudinary(fileInti.ketua, "image"); if (fileInti.sekretaris) newData.sekreFoto = await uploadToCloudinary(fileInti.sekretaris, "image"); if (fileInti.bendahara) newData.bendaharaFoto = await uploadToCloudinary(fileInti.bendahara, "image"); await setDoc(doc(db, "pengaturan", "pengurus_inti"), newData); setPengurusInti(newData); setFileInti({ ketua: null, sekretaris: null, bendahara: null }); setStatus({ type: "success", message: "Pengurus Inti berhasil diperbarui!" }); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleTambahDivisi = async (e) => { e.preventDefault(); setLoading(true); try { await addDoc(collection(db, "divisi_asrama"), { namaDivisi: namaDivisiBaru, createdAt: serverTimestamp() }); setStatus({ type: "success", message: "Divisi berhasil ditambahkan!" }); setNamaDivisiBaru(""); fetchAllData(); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleTambahAnggota = async (e) => { e.preventDefault(); setLoading(true); try { let fotoUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(formAnggota.nama) + "&background=random"; if (fileAnggota) { fotoUrl = await uploadToCloudinary(fileAnggota, "image"); } await addDoc(collection(db, "anggota_divisi"), { divisiId: formAnggota.divisiId, nama: formAnggota.nama, foto: fotoUrl, createdAt: serverTimestamp() }); setStatus({ type: "success", message: "Anggota Divisi berhasil ditambahkan!" }); setFormAnggota({ ...formAnggota, nama: "" }); setFileAnggota(null); fetchAllData(); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };

  const handleSubmitTimeline = async (e) => { e.preventDefault(); setLoading(true); try { await addDoc(collection(db, "timeline_sejarah"), { tahun: tahunTimeline, judul: judulTimeline, deskripsi: deskripsiTimeline, createdAt: serverTimestamp() }); setStatus({ type: "success", message: "Timeline berhasil ditambahkan!" }); setTahunTimeline(""); setJudulTimeline(""); setDeskripsiTimeline(""); e.target.reset(); fetchAllData(); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleSubmitFasilitas = async (e) => { e.preventDefault(); setLoading(true); try { let urls = []; for (const file of filesFasilitas) { urls.push(await uploadToCloudinary(file, "image")); } await addDoc(collection(db, "daftar_fasilitas"), { nama: namaFasilitas, deskripsi: deskripsiFasilitas, linkGambar: urls, createdAt: serverTimestamp() }); setStatus({ type: "success", message: "Fasilitas berhasil ditambahkan!" }); setNamaFasilitas(""); setDeskripsiFasilitas(""); setFilesFasilitas([]); e.target.reset(); fetchAllData(); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleSubmitPenyewaan = async (e) => { e.preventDefault(); setLoading(true); try { let urls = []; for (const file of filesSewa) { urls.push(await uploadToCloudinary(file, "image")); } await addDoc(collection(db, "daftar_penyewaan"), { nama: namaSewa, kategori: kategoriSewa, harga: hargaSewa, noHpSewa: noHpSewa, deskripsi: deskripsiSewa, linkGambar: urls, createdAt: serverTimestamp() }); setStatus({ type: "success", message: "Item penyewaan berhasil ditambahkan!" }); setNamaSewa(""); setDeskripsiSewa(""); setKategoriSewa("Tempat / Barang"); setHargaSewa(""); setNoHpSewa(""); setFilesSewa([]); e.target.reset(); fetchAllData(); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleSubmitFotoProfil = async (e) => { e.preventDefault(); setLoading(true); try { let urls = []; for (const file of filesFotoProfil) { urls.push(await uploadToCloudinary(file, "image")); } await addDoc(collection(db, "profil_galeri"), { konteks: konteksFoto, linkGambar: urls, createdAt: serverTimestamp() }); setStatus({ type: "success", message: "Foto Profil ditambahkan!" }); setKonteksFoto(""); setFilesFotoProfil([]); e.target.reset(); fetchAllData(); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleSubmitGaleri = async (e) => { e.preventDefault(); setLoading(true); try { let urls = []; for (const file of filesGaleri) { urls.push(await uploadToCloudinary(file, "image")); } await addDoc(collection(db, "fasilitas"), { judul: judulGaleri, deskripsi: deskripsiGaleri, warna: warnaGaleri, linkGambar: urls, createdAt: serverTimestamp() }); setStatus({ type: "success", message: "Galeri ditambahkan!" }); setJudulGaleri(""); setDeskripsiGaleri(""); setWarnaGaleri("#ffffff"); setFilesGaleri([]); e.target.reset(); fetchAllData(); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleSubmitKehidupan = async (e) => { e.preventDefault(); setLoading(true); try { let urls = []; for (const file of filesGambar) { urls.push(await uploadToCloudinary(file, "image")); } const finalKategori = kategori === "LAINNYA" ? customKategori.toUpperCase() : kategori; await addDoc(collection(db, "kehidupan"), { judul: judulKonten, kategori: finalKategori, deskripsi, linkGambar: urls, tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), createdAt: serverTimestamp() }); setStatus({ type: "success", message: "Publikasi ditambahkan!" }); setJudulKonten(""); setDeskripsi(""); setCustomKategori(""); setKategori("PRESTASI"); setFilesGambar([]); e.target.reset(); fetchAllData(); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleSubmitSkripsi = async (e) => { e.preventDefault(); setLoading(true); try { let linkPDF = "#"; if (filePDF) { let rawUrl = await uploadToCloudinary(filePDF, "image"); linkPDF = rawUrl.replace("/upload/", "/upload/fl_attachment/"); } await addDoc(collection(db, "skripsi"), { nama, jurusan, judul: judulSkripsi, tahun, linkPDF, createdAt: serverTimestamp() }); setStatus({ type: "success", message: "Skripsi ditambahkan!" }); setNama(""); setJurusan(""); setJudulSkripsi(""); setTahun(""); setFilePDF(null); e.target.reset(); fetchAllData(); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleDelete = async (koleksi, id) => { if (confirm("Yakin ingin menghapus data ini secara permanen?")) { await deleteDoc(doc(db, koleksi, id)); fetchAllData(); } };

  if (!authReady) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Memeriksa Akses...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-50 p-4 px-8 flex justify-between items-center">
        <div className="font-serif font-bold text-xl flex items-center gap-2">
          <img src="/mersi.png" alt="Logo" className="w-6 h-6 object-contain" /> 
          Admin Mersi <span className="text-xs bg-red-800 px-2 py-0.5 rounded-full ml-2 font-sans font-normal uppercase tracking-wider">{role}</span>
        </div>
        <button onClick={() => {signOut(auth); router.push("/admin/login")}} className="bg-red-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">Logout</button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* DYNAMIC TAB NAVIGATION BERDASARKAN ROLE */}
        <div className="flex space-x-2 mb-8 bg-white p-2 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          {allowedTabs.map(tab => (
            <button 
              key={tab} 
              onClick={() => { setActiveTab(tab); setStatus({}); }} 
              className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === tab ? "bg-red-50 text-red-800 border border-red-200" : "text-slate-700 hover:bg-slate-50"}`}
            >
              {TAB_NAMES[tab]}
            </button>
          ))}
        </div>

        {status.message && <div className={`p-4 rounded-lg mb-6 text-sm font-medium border ${status.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>{status.message}</div>}

        {/* 1. KEPENGURUSAN ASRAMA */}
        {activeTab === "kepengurusan" && allowedTabs.includes("kepengurusan") && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">1. Pengurus Inti Asrama</h2>
              <form onSubmit={handleSavePengurusInti} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-4 border rounded-lg">
                    <label className="text-sm font-bold block mb-2 text-red-800">Ketua Asrama</label>
                    <input type="text" required value={pengurusInti.ketuaNama} onChange={(e) => setPengurusInti({...pengurusInti, ketuaNama: e.target.value})} placeholder="Nama Ketua..." className="w-full px-3 py-2 border rounded-md mb-2 text-sm" />
                    <label className="text-xs text-slate-500 mb-1 block">Foto (Opsional jika tak ingin diubah)</label>
                    <input type="file" accept="image/*" onChange={(e) => setFileInti({...fileInti, ketua: e.target.files[0]})} className="w-full text-xs" />
                  </div>
                  <div className="bg-slate-50 p-4 border rounded-lg">
                    <label className="text-sm font-bold block mb-2 text-red-800">Sekretaris</label>
                    <input type="text" required value={pengurusInti.sekreNama} onChange={(e) => setPengurusInti({...pengurusInti, sekreNama: e.target.value})} placeholder="Nama Sekretaris..." className="w-full px-3 py-2 border rounded-md mb-2 text-sm" />
                    <label className="text-xs text-slate-500 mb-1 block">Foto (Opsional jika tak ingin diubah)</label>
                    <input type="file" accept="image/*" onChange={(e) => setFileInti({...fileInti, sekretaris: e.target.files[0]})} className="w-full text-xs" />
                  </div>
                  <div className="bg-slate-50 p-4 border rounded-lg">
                    <label className="text-sm font-bold block mb-2 text-red-800">Bendahara</label>
                    <input type="text" required value={pengurusInti.bendaharaNama} onChange={(e) => setPengurusInti({...pengurusInti, bendaharaNama: e.target.value})} placeholder="Nama Bendahara..." className="w-full px-3 py-2 border rounded-md mb-2 text-sm" />
                    <label className="text-xs text-slate-500 mb-1 block">Foto (Opsional jika tak ingin diubah)</label>
                    <input type="file" accept="image/*" onChange={(e) => setFileInti({...fileInti, bendahara: e.target.files[0]})} className="w-full text-xs" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="bg-slate-900 text-white px-6 py-2 rounded-md font-semibold">Simpan Pengurus Inti</button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">2. Tambah Divisi Baru</h2>
                <form onSubmit={handleTambahDivisi} className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Nama Divisi</label>
                    <input type="text" required value={namaDivisiBaru} onChange={(e) => setNamaDivisiBaru(e.target.value)} placeholder="Cth: Divisi Bakat & Minat..." className="w-full px-4 py-2 border rounded-md" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold">Buat Divisi</button>
                </form>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">3. Tambah Anggota Divisi</h2>
                <form onSubmit={handleTambahAnggota} className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Pilih Divisi</label>
                    <select required value={formAnggota.divisiId} onChange={(e) => setFormAnggota({...formAnggota, divisiId: e.target.value})} className="w-full px-4 py-2 border rounded-md bg-white">
                      <option value="">-- Pilih Divisi --</option>
                      {dataDivisi.map(div => <option key={div.id} value={div.id}>{div.namaDivisi}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Nama Anggota</label>
                    <input type="text" required value={formAnggota.nama} onChange={(e) => setFormAnggota({...formAnggota, nama: e.target.value})} placeholder="Nama Anggota..." className="w-full px-4 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Foto Anggota (Opsional)</label>
                    <input type="file" accept="image/*" onChange={(e) => setFileAnggota(e.target.files[0])} className="w-full text-sm border p-1 rounded bg-slate-50" />
                  </div>
                  <button type="submit" disabled={loading || !formAnggota.divisiId} className="w-full bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-md font-semibold">Tambah Anggota</button>
                </form>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Daftar Divisi & Anggota</h2>
              {dataDivisi.length === 0 ? <p className="text-sm text-stone-500">Belum ada divisi.</p> : (
                <div className="space-y-6">
                  {dataDivisi.map(div => (
                    <div key={div.id} className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                        <h3 className="font-bold text-lg text-red-800">{div.namaDivisi}</h3>
                        <button onClick={() => handleDelete("divisi_asrama", div.id)} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200">Hapus Divisi</button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                        {dataAnggota.filter(a => a.divisiId === div.id).map(anggota => (
                          <div key={anggota.id} className="bg-white p-2 border rounded flex flex-col items-center text-center relative group">
                            <img src={anggota.foto} className="w-12 h-12 rounded-full object-cover mb-2 border border-slate-200" />
                            <span className="text-xs font-semibold leading-tight">{anggota.nama}</span>
                            <button onClick={() => handleDelete("anggota_divisi", anggota.id)} className="absolute -top-2 -right-2 bg-red-600 text-white w-5 h-5 rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                          </div>
                        ))}
                        {dataAnggota.filter(a => a.divisiId === div.id).length === 0 && <p className="text-xs text-stone-500 col-span-full">Belum ada anggota.</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. PENGATURAN TEKS (Hanya Sekre & Puki) */}
        {activeTab === "tampilan" && allowedTabs.includes("tampilan") && ( 
          <div className="space-y-6"> 
            
            {/* Hanya Sekre yang bisa edit Teks */}
            {role === "sekre" && (
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <h2 className="text-lg font-bold mb-4 border-b pb-2">Edit Teks Website Asrama</h2> 
                <form onSubmit={handleSaveProfilText} className="space-y-6"> 
                  <div className="space-y-4"> <h3 className="font-semibold text-red-800 border-l-2 pl-2">Kontak Asrama (Footer)</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div><label className="text-sm block mb-1">Nama Ketua</label><input required type="text" value={kontak.namaKetua} onChange={(e) => setKontak({...kontak, namaKetua: e.target.value})} className="w-full px-4 py-2 border rounded-md" /></div> <div><label className="text-sm block mb-1">Nomor WA</label><input required type="text" value={kontak.noTelpon} onChange={(e) => setKontak({...kontak, noTelpon: e.target.value})} className="w-full px-4 py-2 border rounded-md" /></div> </div> </div> 
                  <div className="space-y-4 pt-4 border-t"> <h3 className="font-semibold text-red-800 border-l-2 pl-2">Halaman Profil</h3> <div><label className="text-sm block mb-1">Sejarah Asrama</label><textarea required rows="4" value={profilText.sejarah} onChange={(e) => setProfilText({...profilText, sejarah: e.target.value})} className="w-full px-4 py-2 border rounded-md"></textarea></div> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div><label className="text-sm block mb-1">Visi</label><textarea required rows="3" value={profilText.visi} onChange={(e) => setProfilText({...profilText, visi: e.target.value})} className="w-full px-4 py-2 border rounded-md"></textarea></div> <div><label className="text-sm block mb-1">Misi</label><textarea required rows="3" value={profilText.misi} onChange={(e) => setProfilText({...profilText, misi: e.target.value})} className="w-full px-4 py-2 border rounded-md"></textarea></div> </div> </div> 
                  <div className="space-y-4 pt-4 border-t"> <h3 className="font-semibold text-red-800 border-l-2 pl-2">Halaman Jaringan Alumni</h3> <div><label className="text-sm block mb-1">Teks Jejak Alumni</label><textarea required rows="2" value={profilText.jejakAlumni} onChange={(e) => setProfilText({...profilText, jejakAlumni: e.target.value})} className="w-full px-4 py-2 border rounded-md"></textarea></div> </div> 
                  <button type="submit" disabled={loading} className="bg-slate-900 text-white px-6 py-2 rounded-md font-semibold">Simpan Teks</button> 
                </form> 
              </div>
            )}

            {/* Puki dan Sekre bisa upload Foto Latar */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> 
              <h2 className="text-lg font-bold mb-4 border-b pb-2">Ubah Foto Latar Belakang (Multi-Upload)</h2> 
              <form onSubmit={handleSaveTampilan} className="space-y-6"> 
                <div className="space-y-4"> <h3 className="font-semibold text-red-800 border-l-2 pl-2">Slideshow Gateway (Halaman Beranda Utama)</h3> <div className="bg-slate-50 p-4 border rounded-lg"> <label className="font-semibold block mb-2">Pilih Beberapa Foto Gateway Sekaligus</label> <input type="file" multiple accept="image/*" onChange={(e) => setTampilanFiles({...tampilanFiles, gateway: Array.from(e.target.files)})} className="w-full text-sm cursor-pointer bg-white p-2 border rounded" /> </div> </div> 
                <div className="space-y-4 pt-4 border-t"> <h3 className="font-semibold text-red-800 border-l-2 pl-2">Latar Belakang Tiap Halaman (Slideshow)</h3> {[{ id: 'hero', title: 'Beranda (Hero)' }, { id: 'profil', title: 'Profil' }, { id: 'fasilitas', title: 'Fasilitas' }, { id: 'kehidupan', title: 'Media' }, { id: 'alumni', title: 'Alumni' }].map((item) => ( <div key={item.id} className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center bg-slate-50 p-4 border rounded-lg"> <label className="font-semibold text-sm">Latar {item.title}</label> <input type="file" multiple accept="image/*" onChange={(e) => setTampilanFiles({...tampilanFiles, [item.id]: Array.from(e.target.files)})} className="w-full text-sm cursor-pointer bg-white p-2 border rounded" /> </div> ))} </div> 
                <button type="submit" disabled={loading} className="bg-slate-900 text-white px-6 py-2 rounded-md font-semibold">Simpan Slideshow Latar</button> 
              </form> 
            </div> 
          </div> 
        )}
        
        {/* 3. PENDAFTARAN & STATUS */}
        {activeTab === "status" && allowedTabs.includes("status") && ( 
          <div className="space-y-6"> 
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">Status Asrama</h2> <form onSubmit={handleSaveStatusAsrama} className="space-y-4"> <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> <div><label className="text-sm font-semibold mb-1 block">Jumlah Kamar</label><input type="number" required value={statusAsrama.kamar} onChange={(e) => setStatusAsrama({...statusAsrama, kamar: e.target.value})} className="w-full px-4 py-2 border rounded-md" /></div> <div><label className="text-sm font-semibold mb-1 block">Jumlah Penghuni</label><input type="number" required value={statusAsrama.penghuni} onChange={(e) => setStatusAsrama({...statusAsrama, penghuni: e.target.value})} className="w-full px-4 py-2 border rounded-md" /></div> <div> <label className="text-sm font-semibold mb-1 block">Ketersediaan</label> <select value={statusAsrama.ketersediaan} onChange={(e) => setStatusAsrama({...statusAsrama, ketersediaan: e.target.value})} className="w-full px-4 py-2 border rounded-md"> <option value="Tersedia">🟢 Tersedia</option> <option value="Penuh">🔴 Penuh</option> </select> </div> </div> <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">Perbarui Status</button> </form> </div> 
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">Foto Brosur Penerimaan Warga Asrama</h2> <form onSubmit={handleSaveBrosur} className="space-y-4"> <div className="bg-slate-50 p-4 border rounded-lg flex items-center justify-between"> <input type="file" accept="image/*" onChange={(e) => setFileBrosur(e.target.files[0])} className="w-full text-sm cursor-pointer" /> {brosurUrl && <a href={brosurUrl} target="_blank" className="text-xs text-amber-600 font-bold ml-4 whitespace-nowrap">Lihat Brosur Saat Ini</a>} </div> <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">Unggah Brosur Baru</button> </form> </div> 
          </div> 
        )}
        
        {/* 4. TIMELINE SEJARAH */}
        {activeTab === "timeline" && allowedTabs.includes("timeline") && ( 
          <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">Tambah Timeline</h2> <form onSubmit={handleSubmitTimeline} className="space-y-4"> <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4"> <input type="text" required value={tahunTimeline} onChange={(e) => setTahunTimeline(e.target.value)} placeholder="Tahun" className="w-full px-4 py-2 border rounded-md" /> <input type="text" required value={judulTimeline} onChange={(e) => setJudulTimeline(e.target.value)} placeholder="Peristiwa" className="w-full px-4 py-2 border rounded-md" /> </div> <textarea required rows="2" value={deskripsiTimeline} onChange={(e) => setDeskripsiTimeline(e.target.value)} placeholder="Deskripsi..." className="w-full px-4 py-2 border rounded-md"></textarea> <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">Tambahkan</button> </form> </div> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h3 className="font-bold mb-4 border-b pb-2">Daftar Timeline</h3> <div className="space-y-4"> {dataTimeline.map(item => ( <div key={item.id} className="bg-slate-50 border rounded-lg p-4 flex justify-between"> <div> <span className="px-2 py-1 bg-amber-500 text-white text-xs rounded mb-2">{item.tahun}</span> <h4 className="font-bold">{item.judul}</h4> <p className="text-sm text-slate-600">{item.deskripsi}</p> </div> <button onClick={() => handleDelete("timeline_sejarah", item.id)} className="bg-red-600 text-white text-xs px-3 py-1.5 rounded">Hapus</button> </div> ))} </div> </div> </div> 
        )}
        
        {/* 5. FOTO PROFIL */}
        {activeTab === "fotoprofil" && allowedTabs.includes("fotoprofil") && ( 
          <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">Tambah Foto Profil</h2> <form onSubmit={handleSubmitFotoProfil} className="space-y-4"> <textarea required rows="2" value={konteksFoto} onChange={(e) => setKonteksFoto(e.target.value)} placeholder="Konteks..." className="w-full px-4 py-2 border rounded-md"></textarea> <input type="file" multiple required accept="image/*" onChange={(e) => setFilesFotoProfil(Array.from(e.target.files))} className="w-full text-sm border p-2 rounded bg-slate-50" /> <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">Tambahkan</button> </form> </div> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h3 className="font-bold mb-4 border-b pb-2">Daftar Foto Profil</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {dataFotoProfil.map(item => { const imgUtama = Array.isArray(item.linkGambar) ? item.linkGambar[0] : item.linkGambar; return ( <div key={item.id} className="bg-slate-50 border rounded-lg flex gap-4 p-3"> <img src={imgUtama} className="w-24 h-24 object-cover rounded-md shrink-0" /> <div className="flex flex-col justify-between w-full"> <p className="text-xs text-slate-600">{item.konteks}</p> <button onClick={() => handleDelete("profil_galeri", item.id)} className="text-red-600 text-xs">Hapus</button> </div> </div> ); })} </div> </div> </div> 
        )}
        
        {/* 6. FASILITAS ASRAMA */}
        {activeTab === "fasilitas" && allowedTabs.includes("fasilitas") && ( 
          <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">Tambah Fasilitas Asrama Umum</h2> <form onSubmit={handleSubmitFasilitas} className="space-y-4"> <input type="text" required value={namaFasilitas} onChange={(e) => setNamaFasilitas(e.target.value)} placeholder="Cth: Dapur Bersama..." className="w-full px-4 py-2 border rounded-md" /> <textarea required rows="2" value={deskripsiFasilitas} onChange={(e) => setDeskripsiFasilitas(e.target.value)} placeholder="Deskripsi fasilitas..." className="w-full px-4 py-2 border rounded-md"></textarea> <input type="file" multiple required accept="image/*" onChange={(e) => setFilesFasilitas(Array.from(e.target.files))} className="w-full text-sm border p-2 rounded bg-slate-50 cursor-pointer" /> <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">Tambahkan Fasilitas</button> </form> </div> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h3 className="font-bold mb-4 border-b pb-2">Daftar Fasilitas Asrama</h3> <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {dataFasilitas.map(item => { const imgUtama = Array.isArray(item.linkGambar) ? item.linkGambar[0] : item.linkGambar; return ( <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-lg flex flex-col overflow-hidden"> <img src={imgUtama} className="w-full h-32 object-cover" /> <div className="p-4 flex flex-col flex-grow"> <h4 className="font-bold mb-1 text-slate-900">{item.nama}</h4> <p className="text-xs text-slate-600 flex-grow">{item.deskripsi}</p> <button onClick={() => handleDelete("daftar_fasilitas", item.id)} className="bg-red-600 text-white text-xs px-3 py-1.5 mt-3 rounded">Hapus Fasilitas</button> </div> </div> ); })} </div> </div> </div> 
        )}
        
        {/* 7. LAYANAN PENYEWAAN */}
        {activeTab === "penyewaan" && allowedTabs.includes("penyewaan") && ( 
          <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md border border-amber-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b flex items-center gap-2"> <span className="w-3 h-3 rounded-full bg-amber-500"></span> Manajemen Layanan & Penyewaan </h2> <form onSubmit={handleSubmitPenyewaan} className="space-y-4"> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <label className="text-sm font-semibold mb-1 block">Nama Layanan / Keahlian / Barang</label> <input type="text" required value={namaSewa} onChange={(e) => setNamaSewa(e.target.value)} placeholder="Cth: Grup Randai / Tari Piring / Aula..." className="w-full px-4 py-2 border rounded-md" /> </div> <div> <label className="text-sm font-semibold mb-1 block">Kategori Penyewaan</label> <select value={kategoriSewa} onChange={(e) => setKategoriSewa(e.target.value)} className="w-full px-4 py-2 border rounded-md bg-white text-stone-900 font-medium"> <option value="Tempat / Barang">Tempat / Barang Fisik</option> <option value="Keahlian Seni Budaya">Layanan Jasa & Keahlian Seni Budaya</option> </select> </div> </div> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div> <label className="text-sm font-semibold mb-1 block text-amber-600">Info Harga Sewa</label> <input type="text" required value={hargaSewa} onChange={(e) => setHargaSewa(e.target.value)} placeholder="Cth: Rp 500.000 / Tampil" className="w-full px-4 py-2 border border-amber-300 bg-amber-50 rounded-md" /> </div> <div> <label className="text-sm font-semibold mb-1 block text-amber-600">No. WA Pengurus / Reservasi</label> <input type="tel" required value={noHpSewa} onChange={(e) => setNoHpSewa(e.target.value.replace(/\D/g, ''))} placeholder="Cth: 08123456789 (Pengurus Randai)" className="w-full px-4 py-2 border border-amber-300 bg-amber-50 rounded-md" /> </div> </div> <textarea required rows="2" value={deskripsiSewa} onChange={(e) => setDeskripsiSewa(e.target.value)} placeholder="Deskripsi lengkap mengenai layanan ini..." className="w-full px-4 py-2 border rounded-md"></textarea> <input type="file" multiple required accept="image/*" onChange={(e) => setFilesSewa(Array.from(e.target.files))} className="w-full text-sm border p-2 rounded bg-slate-50 cursor-pointer" /> <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md font-bold transition-colors">Tambahkan Layanan Penyewaan</button> </form> </div> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h3 className="font-bold mb-4 border-b pb-2">Daftar Layanan Tersedia</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {dataPenyewaan.map(item => { const imgUtama = Array.isArray(item.linkGambar) ? item.linkGambar[0] : item.linkGambar; return ( <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-lg flex overflow-hidden"> <img src={imgUtama} className="w-32 h-full object-cover shrink-0" /> <div className="p-4 flex flex-col w-full justify-center"> <span className="text-[10px] font-bold text-white bg-amber-600 px-2 py-0.5 rounded w-fit mb-1">{item.kategori}</span> <h4 className="font-bold text-stone-900 leading-tight">{item.nama}</h4> <p className="text-amber-600 text-xs font-bold my-1">{item.noHpSewa || "Nomor Belum Diatur"}</p> <p className="text-xs text-stone-500 line-clamp-2 mt-1 mb-2">{item.deskripsi}</p> <button onClick={() => handleDelete("daftar_penyewaan", item.id)} className="text-red-500 text-xs font-semibold self-start hover:underline">Hapus Layanan</button> </div> </div> ); })} </div> </div> </div> 
        )}
        
        {/* 8. GALERI */}
        {activeTab === "galeri" && allowedTabs.includes("galeri") && ( 
          <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">Tambah Galeri Kegiatan</h2> <form onSubmit={handleSubmitGaleri} className="space-y-4"> <input type="text" required value={judulGaleri} onChange={(e) => setJudulGaleri(e.target.value)} placeholder="Nama/Judul Kegiatan..." className="w-full px-4 py-2 border border-slate-300 rounded-md" /> <textarea required rows="2" value={deskripsiGaleri} onChange={(e) => setDeskripsiGaleri(e.target.value)} placeholder="Keterangan foto kegiatan ini..." className="w-full px-4 py-2 border border-slate-300 rounded-md"></textarea> <input type="color" value={warnaGaleri} onChange={(e) => setWarnaGaleri(e.target.value)} className="h-10 cursor-pointer border rounded-md" /> <input type="file" multiple required accept="image/*" onChange={(e) => setFilesGaleri(Array.from(e.target.files))} className="w-full text-sm cursor-pointer border p-2 rounded bg-slate-50" /> <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold">Tambah ke Galeri</button> </form> </div> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h3 className="font-bold mb-4 border-b pb-2">Daftar Foto Galeri</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {dataGaleri.map(item => { const imgUtama = Array.isArray(item.linkGambar) ? item.linkGambar[0] : item.linkGambar; const jumlahFoto = Array.isArray(item.linkGambar) ? item.linkGambar.length : 1; return ( <div key={item.id} className="relative h-40 rounded-lg overflow-hidden border border-slate-200"> <img src={imgUtama} className="w-full h-full object-cover" /> {jumlahFoto > 1 && <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">+{jumlahFoto} Foto</div>} <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-3"> <span className="font-bold" style={{ color: item.warna }}>{item.judul}</span> <span className="text-xs text-stone-200 line-clamp-1 mb-2">{item.deskripsi}</span> <button onClick={() => handleDelete("fasilitas", item.id)} className="bg-red-600 w-fit text-white text-xs px-3 py-1 rounded">Hapus</button> </div> </div> ); })} </div> </div> </div> 
        )}
        
        {/* 9. PUBLIKASI */}
        {activeTab === "kehidupan" && allowedTabs.includes("kehidupan") && ( 
          <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">Tambah Publikasi Baru</h2> <form onSubmit={handleSubmitKehidupan} className="space-y-4"> <input type="text" required value={judulKonten} onChange={(e) => setJudulKonten(e.target.value)} placeholder="Judul Berita/Lomba..." className="w-full px-4 py-2 border rounded-md" /> <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full px-4 py-2 border rounded-md font-bold text-stone-800"> <option value="PRESTASI">Prestasi</option> <option value="MERSI X BK">MERSI X BK</option> <option value="LOMBA TERBUKA">Lomba Terbuka</option> <option value="LAINNYA">Lainnya... (Isi Manual)</option> </select> {kategori === "LAINNYA" && ( <input type="text" required value={customKategori} onChange={(e) => setCustomKategori(e.target.value)} placeholder="Tuliskan nama kategori di sini..." className="w-full px-4 py-2 border border-amber-500 bg-amber-50 rounded-md focus:outline-none" /> )} <textarea required rows="4" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Isi Berita/Keterangan..." className="w-full px-4 py-2 border rounded-md"></textarea> <input type="file" multiple required accept="image/*" onChange={(e) => setFilesGambar(Array.from(e.target.files))} className="w-full text-sm cursor-pointer border p-2 rounded bg-slate-50" /> <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold">Publikasikan Berita</button> </form> </div> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h3 className="font-bold mb-4 border-b pb-2">Daftar Publikasi</h3> <div className="space-y-3"> {dataKehidupan.map(item => ( <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg"> <div> <div className="font-semibold text-sm">{item.judul} <span className="text-red-600 text-xs">({item.kategori})</span></div> <div className="text-xs text-slate-500">{Array.isArray(item.linkGambar) ? `${item.linkGambar.length} Foto` : '1 Foto'}</div> </div> <button onClick={() => handleDelete("kehidupan", item.id)} className="text-red-500 text-xs font-semibold">Hapus</button> </div> ))} </div> </div> </div> 
        )}
        
        {/* 10. SKRIPSI */}
        {activeTab === "skripsi" && allowedTabs.includes("skripsi") && ( 
          <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">Tambah Skripsi</h2> <form onSubmit={handleSubmitSkripsi} className="space-y-4"> <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama Penulis..." className="w-full px-4 py-2 border rounded-md" /> <input type="text" required value={jurusan} onChange={(e) => setJurusan(e.target.value)} placeholder="Jurusan..." className="w-full px-4 py-2 border rounded-md" /> <textarea required rows="1" value={judulSkripsi} onChange={(e) => setJudulSkripsi(e.target.value)} placeholder="Judul Skripsi..." className="w-full px-4 py-2 border rounded-md"></textarea> <input type="number" required value={tahun} onChange={(e) => setTahun(e.target.value)} placeholder="Tahun..." className="w-full px-4 py-2 border rounded-md" /> <input type="file" accept=".pdf" onChange={(e) => setFilePDF(e.target.files[0])} className="w-full text-sm" /> <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">Simpan Skripsi</button> </form> </div> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h3 className="font-bold mb-4 border-b pb-2">Kelola Skripsi</h3> <div className="space-y-3"> {dataSkripsi.map(item => ( <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg"> <div><div className="font-semibold text-sm">{item.nama} - {item.tahun}</div><div className="text-xs line-clamp-1">{item.judul}</div></div> <button onClick={() => handleDelete("skripsi", item.id)} className="text-red-500 text-xs font-semibold">Hapus</button> </div> ))} </div> </div> </div> 
        )}
        
        {/* 11. LOG DATA */}
        {activeTab === "log" && allowedTabs.includes("log") && ( 
          <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 border-l-4 border-l-green-600"> <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2"> <h2 className="text-lg font-bold text-slate-900">Data Pendaftar Warga Asrama Baru</h2> <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Total: {dataPendaftarAsrama.length} Orang</span> </div> <div className="overflow-x-auto"> <table className="w-full text-left text-sm"> <thead> <tr className="bg-slate-50 border-y text-slate-600"> <th className="p-3">Waktu Daftar</th> <th className="p-3">Identitas & Kontak</th> <th className="p-3">Asal & Suku</th> <th className="p-3">Kampus & Jurusan</th> <th className="p-3 text-center">Aksi</th> </tr> </thead> <tbody className="divide-y"> {dataPendaftarAsrama.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-slate-500">Belum ada calon warga yang mendaftar.</td></tr> : ( dataPendaftarAsrama.map(item => ( <tr key={item.id}> <td className="p-3 text-xs">{item.waktuDaftar ? new Date(item.waktuDaftar.toDate()).toLocaleString('id-ID') : '-'}</td> <td className="p-3"><b>{item.nama}</b><br/><span className="text-xs text-stone-500">{item.noHp} | {item.email}</span></td> <td className="p-3 text-xs">{item.asal}<br/><span className="font-semibold text-amber-700">{item.suku}</span></td> <td className="p-3 text-xs">{item.kuliah}<br/><span className="text-stone-500">{item.jurusan}</span></td> <td className="p-3 text-center"><button onClick={() => handleDelete("pendaftaran_asrama", item.id)} className="text-red-500 text-xs font-semibold">Hapus</button></td> </tr> )) )} </tbody> </table> </div> </div> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2"> <h2 className="text-lg font-bold text-slate-900">Data Pendaftar (Lomba Terbuka)</h2> <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Total: {dataPendaftarLomba.length} Orang</span> </div> <div className="overflow-x-auto"> <table className="w-full text-left text-sm"> <thead> <tr className="bg-slate-50 border-y text-slate-600"> <th className="p-3">Waktu Daftar</th> <th className="p-3">Identitas & No. HP</th> <th className="p-3">Alamat</th> <th className="p-3">Lomba yang Diikuti</th> <th className="p-3 text-center">Aksi</th> </tr> </thead> <tbody className="divide-y"> {dataPendaftarLomba.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-slate-500">Belum ada peserta yang mendaftar.</td></tr> : ( dataPendaftarLomba.map(item => ( <tr key={item.id}> <td className="p-3 text-xs">{item.waktuDaftar ? new Date(item.waktuDaftar.toDate()).toLocaleString('id-ID') : '-'}</td> <td className="p-3"><b>{item.namaPeserta}</b><br/><span className="text-xs text-stone-500">{item.noHpPeserta}</span></td> <td className="p-3 text-xs">{item.alamatPeserta}</td> <td className="p-3 text-xs font-semibold text-red-800">{item.judulLomba}</td> <td className="p-3 text-center"><button onClick={() => handleDelete("pendaftaran_lomba", item.id)} className="text-red-500 text-xs font-semibold">Hapus</button></td> </tr> )) )} </tbody> </table> </div> </div> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 border-l-4 border-l-amber-500"> <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2"> <h2 className="text-lg font-bold text-slate-900">Log Komentar Pengunjung</h2> <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Total: {dataKomentar.length} Komentar</span> </div> <div className="overflow-x-auto"> <table className="w-full text-left text-sm"> <thead> <tr className="bg-slate-50 border-y text-slate-600"> <th className="p-3">Waktu</th> <th className="p-3">Pengirim</th> <th className="p-3">Komentar</th> <th className="p-3 text-center">Aksi</th> </tr> </thead> <tbody className="divide-y"> {dataKomentar.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-500">Belum ada komentar.</td></tr> : ( dataKomentar.map(item => ( <tr key={item.id} className="hover:bg-slate-50"> <td className="p-3 text-xs">{item.waktu ? new Date(item.waktu.toDate()).toLocaleString('id-ID') : '-'}</td> <td className="p-3 font-bold">{item.nama}</td> <td className="p-3 text-xs text-stone-600 line-clamp-2">{item.isi}</td> <td className="p-3 text-center"><button onClick={() => handleDelete("komentar_publikasi", item.id)} className="text-red-500 text-xs font-semibold">Hapus</button></td> </tr> )) )} </tbody> </table> </div> </div> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2"> <h2 className="text-lg font-bold text-slate-900">Log Pengunjung (Pengunduh Skripsi)</h2> <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Total: {dataLogUnduh.length} Data</span> </div> <div className="overflow-x-auto"> <table className="w-full text-left text-sm"> <thead> <tr className="bg-slate-50 border-y text-slate-600"> <th className="p-3">Waktu Akses</th> <th className="p-3">Identitas Pengunduh</th> <th className="p-3">Skripsi yang Dibaca</th> <th className="p-3 text-center">Aksi</th> </tr> </thead> <tbody className="divide-y"> {dataLogUnduh.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-500">Belum ada riwayat pengunduh.</td></tr> : ( dataLogUnduh.map(item => ( <tr key={item.id} className="hover:bg-slate-50"> <td className="p-3 text-xs">{item.waktuAkses ? new Date(item.waktuAkses.toDate()).toLocaleString('id-ID') : '-'}</td> <td className="p-3"><b>{item.namaPengunduh}</b><br/><span className="text-xs text-stone-500">{item.noHpPengunduh} | {item.emailPengunduh}</span></td> <td className="p-3 text-xs"><b>{item.penulisSkripsi}</b><br/>{item.judulSkripsi}</td> <td className="p-3 text-center"><button onClick={() => handleDelete("log_unduh_skripsi", item.id)} className="text-red-500 text-xs font-semibold">Hapus</button></td> </tr> )) )} </tbody> </table> </div> </div> </div> 
        )}
      </main>
    </div>
  );
}

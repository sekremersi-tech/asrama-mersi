"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, setDoc, serverTimestamp, query, orderBy, where, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

// PENGATURAN HAK AKSES TAB UNTUK MASING-MASING DIVISI
const TAB_ROLES = {
  sekre: ["tampilan", "status", "kepengurusan", "timeline", "fotoprofil", "fasilitas", "penyewaan", "galeri", "kehidupan", "skripsi", "suara_alumni", "log"],
  humas: ["status", "fotoprofil", "galeri", "kehidupan", "suara_alumni", "log"],
  publikasi: ["tampilan", "fotoprofil", "galeri", "kehidupan", "suara_alumni", "log"], 
  perkap: ["fasilitas", "fotoprofil", "galeri", "kehidupan"],
  tendor: ["fotoprofil", "galeri", "kehidupan", "penyewaan", "log"], 
  klh: ["fotoprofil", "galeri", "kehidupan"],
  rohani: ["fotoprofil", "galeri", "kehidupan"],
  senbud: ["fotoprofil", "galeri", "kehidupan", "penyewaan"]  
};

const TAB_NAMES = {
  tampilan: "Pengaturan Web & Foto", status: "Pendaftaran & Status", kepengurusan: "Kepengurusan",
  timeline: "Timeline", fotoprofil: "Foto Profil", fasilitas: "Fasilitas Asrama",
  penyewaan: "Penyewaan", galeri: "Galeri", kehidupan: "Media Publikasi", skripsi: "Skripsi", suara_alumni: "Data Alumni", log: "Log Data"
};

// KOMPONEN PAGINATION BERSAMA
const Pagination = ({ totalItems, itemsPerPage, currentPage, setCurrentPage }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-slate-200">
      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-md disabled:bg-slate-300 disabled:text-slate-500 hover:bg-amber-600 transition-colors">Sebelumnya</button>
      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md">Halaman {currentPage} dari {totalPages}</span>
      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-md disabled:bg-slate-300 disabled:text-slate-500 hover:bg-amber-600 transition-colors">Selanjutnya</button>
    </div>
  );
};

export default function AdminDashboard() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [allowedTabs, setAllowedTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(""); 
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  // STATE PENGATURAN UMUM
  const [tampilanUrls, setTampilanUrls] = useState({ hero: [], profil: [], fasilitas: [], kehidupan: [], alumni: [], gateway: [] });
  const [tampilanFiles, setTampilanFiles] = useState({ hero: [], profil: [], fasilitas: [], kehidupan: [], alumni: [], gateway: [] });
  const [profilText, setProfilText] = useState({ visi: "", misi: "", jejakAlumni: "" });
  const [kontak, setKontak] = useState({ namaKetua: "", noTelpon: "", noHumas: "" });
  const [statusAsrama, setStatusAsrama] = useState({ kamar: "", penghuni: "", ketersediaan: "Tersedia" });
  const [brosurUrl, setBrosurUrl] = useState("");
  const [linkFormulir, setLinkFormulir] = useState("");
  const [fileBrosur, setFileBrosur] = useState(null);

  // STATE DATA
  const [dataSejarah, setDataSejarah] = useState([]);
  const [pengurusInti, setPengurusInti] = useState({ ketuaNama: "", ketuaFoto: "", sekreNama: "", sekreFoto: "", bendaharaNama: "", bendaharaFoto: "" });
  const [fileInti, setFileInti] = useState({ ketua: null, sekretaris: null, bendahara: null });
  const [dataDivisi, setDataDivisi] = useState([]);
  const [dataAnggota, setDataAnggota] = useState([]);
  const [dataFotoProfil, setDataFotoProfil] = useState([]);
  const [dataTimeline, setDataTimeline] = useState([]);
  const [dataFasilitas, setDataFasilitas] = useState([]);
  const [dataPenyewaan, setDataPenyewaan] = useState([]);
  const [dataGaleri, setDataGaleri] = useState([]);
  const [dataKehidupan, setDataKehidupan] = useState([]);
  const [dataSkripsi, setDataSkripsi] = useState([]);
  const [dataPesanAlumni, setDataPesanAlumni] = useState([]); 
  const [dataLogUnduh, setDataLogUnduh] = useState([]);
  const [dataPendaftarLomba, setDataPendaftarLomba] = useState([]);
  const [dataPendaftarAsrama, setDataPendaftarAsrama] = useState([]);
  const [dataKomentar, setDataKomentar] = useState([]);
  const [dataPengunjung, setDataPengunjung] = useState([]); 
  const [dataPermohonanSkripsi, setDataPermohonanSkripsi] = useState([]); 

  // STATE FORM INPUT & EDIT ID
  const [judulSejarah, setJudulSejarah] = useState(""); const [isiSejarah, setIsiSejarah] = useState(""); const [editSejarahId, setEditSejarahId] = useState(null); 
  const [namaDivisiBaru, setNamaDivisiBaru] = useState("");
  const [formAnggota, setFormAnggota] = useState({ divisiId: "", nama: "", peran: "Anggota" }); const [fileAnggota, setFileAnggota] = useState(null); const [editAnggotaId, setEditAnggotaId] = useState(null);
  const [konteksFoto, setKonteksFoto] = useState(""); const [filesFotoProfil, setFilesFotoProfil] = useState([]); const [editFotoProfId, setEditFotoProfId] = useState(null);
  const [tahunTimeline, setTahunTimeline] = useState(""); const [judulTimeline, setJudulTimeline] = useState(""); const [deskripsiTimeline, setDeskripsiTimeline] = useState(""); const [editTimelineId, setEditTimelineId] = useState(null);
  const [namaFasilitas, setNamaFasilitas] = useState(""); const [deskripsiFasilitas, setDeskripsiFasilitas] = useState(""); const [filesFasilitas, setFilesFasilitas] = useState([]); const [editFasilitId, setEditFasilitId] = useState(null);
  const [namaSewa, setNamaSewa] = useState(""); const [kategoriSewa, setKategoriSewa] = useState("Tempat / Barang"); const [hargaSewa, setHargaSewa] = useState(""); const [noHpSewa, setNoHpSewa] = useState(""); const [deskripsiSewa, setDeskripsiSewa] = useState(""); const [filesSewa, setFilesSewa] = useState([]); const [editSewaId, setEditSewaId] = useState(null);
  const [judulGaleri, setJudulGaleri] = useState(""); const [warnaGaleri, setWarnaGaleri] = useState("#ffffff"); const [filesGaleri, setFilesGaleri] = useState([]); const [editGaleriId, setEditGaleriId] = useState(null);
  const [judulKonten, setJudulKonten] = useState(""); const [kategori, setKategori] = useState("PRESTASI"); const [customKategori, setCustomKategori] = useState(""); const [deskripsi, setDeskripsi] = useState(""); const [filesGambar, setFilesGambar] = useState([]); const [editKehidupanId, setEditKehidupanId] = useState(null);
  const [nama, setNama] = useState(""); const [jurusan, setJurusan] = useState(""); const [judulSkripsi, setJudulSkripsi] = useState(""); const [tahun, setTahun] = useState(""); const [filePDF, setFilePDF] = useState(null); const [editSkripsiId, setEditSkripsiId] = useState(null);
  const [replyKomenId, setReplyKomenId] = useState(null); const [replyText, setReplyText] = useState("");

  // STATE FORM ALUMNI LENGKAP (BARU)
  const [formAlumni, setFormAlumni] = useState({ nama: "", asal: "", kuliah: "", jurusan: "", angkatanAsrama: "", pekerjaan: "", skripsi: "", pesan: "" });
  const [fileFotoAlumni, setFileFotoAlumni] = useState(null);
  const [editPesanId, setEditPesanId] = useState(null);

  // PAGINATION STATES 
  const [pageSejarah, setPageSejarah] = useState(1);
  const [pageFotoProf, setPageFotoProf] = useState(1);
  const [pageTimeline, setPageTimeline] = useState(1);
  const [pageFasilitas, setPageFasilitas] = useState(1);
  const [pageSewa, setPageSewa] = useState(1);
  const [pageGaleri, setPageGaleri] = useState(1);
  const [pageKehidupan, setPageKehidupan] = useState(1);
  const [pageSkripsi, setPageSkripsi] = useState(1);
  const [pagePermohonan, setPagePermohonan] = useState(1);
  const [pagePesanAlumni, setPagePesanAlumni] = useState(1); 
  const [pageDaftarAsrama, setPageDaftarAsrama] = useState(1);
  const [pageDaftarLomba, setPageDaftarLomba] = useState(1);
  const [pageKomentar, setPageKomentar] = useState(1);
  const [pageUnduh, setPageUnduh] = useState(1);
  const [pagePengunjung, setPagePengunjung] = useState(1); 
  const itemsPerPage = 10;

  useEffect(() => {
    import("firebase/auth").then(({ onAuthStateChanged }) => {
      onAuthStateChanged(auth, (user) => {
        if (!user) { router.push("/admin/login"); return; }
        const email = user.email || "";
        let currRole = "sekre"; 
        
        if (email.startsWith("humas")) currRole = "humas";
        else if (email.startsWith("publikasi")) currRole = "publikasi";
        else if (email.startsWith("perkap")) currRole = "perkap";
        else if (email.startsWith("tendor")) currRole = "tendor";
        else if (email.startsWith("klh")) currRole = "klh";
        else if (email.startsWith("rohani")) currRole = "rohani";
        else if (email.startsWith("senibudaya") || email.startsWith("senbud")) currRole = "senbud";

        const tabsForRole = TAB_ROLES[currRole] || [];
        setRole(currRole); setAllowedTabs(tabsForRole); setActiveTab(tabsForRole[0]); setAuthReady(true);
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
    if (docBrosur.exists()) { setBrosurUrl(docBrosur.data().link || ""); setLinkFormulir(docBrosur.data().linkFormulir || ""); }

    const sejSnap = await getDocs(query(collection(db, "sejarah_asrama"), orderBy("createdAt", "asc"))); setDataSejarah(sejSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const docInti = await getDoc(doc(db, "pengaturan", "pengurus_inti")); if (docInti.exists()) setPengurusInti(docInti.data());
    const divSnap = await getDocs(query(collection(db, "divisi_asrama"), orderBy("createdAt", "asc"))); setDataDivisi(divSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const angSnap = await getDocs(query(collection(db, "anggota_divisi"), orderBy("createdAt", "asc"))); setDataAnggota(angSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const fotoProfSnap = await getDocs(query(collection(db, "profil_galeri"), orderBy("createdAt", "desc"))); setDataFotoProfil(fotoProfSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const timeSnap = await getDocs(query(collection(db, "timeline_sejarah"), orderBy("tahun", "asc"))); setDataTimeline(timeSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const fasSnap = await getDocs(query(collection(db, "daftar_fasilitas"), orderBy("createdAt", "desc"))); setDataFasilitas(fasSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const sewaSnap = await getDocs(query(collection(db, "daftar_penyewaan"), orderBy("createdAt", "desc"))); setDataPenyewaan(sewaSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const galSnap = await getDocs(query(collection(db, "fasilitas"), orderBy("createdAt", "desc")));  setDataGaleri(galSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const kehSnap = await getDocs(query(collection(db, "kehidupan"), orderBy("createdAt", "desc"))); setDataKehidupan(kehSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const skrSnap = await getDocs(query(collection(db, "skripsi"), orderBy("tahun", "desc"))); setDataSkripsi(skrSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const logSnap = await getDocs(query(collection(db, "log_unduh_skripsi"), orderBy("waktuAkses", "desc"))); setDataLogUnduh(logSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const lombaSnap = await getDocs(query(collection(db, "pendaftaran_lomba"), orderBy("waktuDaftar", "desc"))); setDataPendaftarLomba(lombaSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const asramaSnap = await getDocs(query(collection(db, "pendaftaran_asrama"), orderBy("waktuDaftar", "desc"))); setDataPendaftarAsrama(asramaSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const komenSnap = await getDocs(query(collection(db, "komentar_publikasi"), orderBy("waktu", "desc"))); setDataKomentar(komenSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const pengSnap = await getDocs(query(collection(db, "log_pengunjung"), orderBy("waktu", "desc"))); setDataPengunjung(pengSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const mohonSkripsiSnap = await getDocs(query(collection(db, "permohonan_skripsi"), orderBy("waktu", "desc"))); setDataPermohonanSkripsi(mohonSkripsiSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    // MENGAMBIL DATA ALUMNI (YANG BARU)
    const pesanSnap = await getDocs(query(collection(db, "pesan_alumni"), orderBy("createdAt", "desc"))); 
    setDataPesanAlumni(pesanSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const uploadToCloudinary = async (file, resourceType = "image") => { const formData = new FormData(); formData.append("file", file); formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET); const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, { method: "POST", body: formData }); const data = await res.json(); if (data.error) throw new Error(data.error.message); return data.secure_url; };
  const handleDelete = async (koleksi, id) => { if (confirm("Yakin ingin menghapus data ini secara permanen?")) { await deleteDoc(doc(db, koleksi, id)); fetchAllData(); } };
  
  // -- FUNGSI KONFIRMASI AKSES SKRIPSI --
  const handleKirimAksesSkripsi = async (item) => {
    try {
      await updateDoc(doc(db, "permohonan_skripsi", item.id), { status: "Disetujui" });
      const baseUrl = window.location.origin;
      const secretLink = `${baseUrl}/skripsi-viewer?id=${item.skripsiId}&nama=${encodeURIComponent(item.nama)}&hp=${item.noHp}`;
      let bersihkanNomor = item.noHp.replace(/\D/g, '');
      if (bersihkanNomor.startsWith('0')) bersihkanNomor = '62' + bersihkanNomor.substring(1);
      const pesanWa = `Halo ${item.nama},\n\nPermohonan akses skripsi Anda untuk judul *"${item.judulSkripsi}"* telah disetujui oleh Sekretariat Asrama Mersi.\n\nBerikut adalah link akses rahasia Anda (Hanya pratinjau halaman pertama):\n${secretLink}\n\nTerima kasih.`;
      window.open(`https://wa.me/${bersihkanNomor}?text=${encodeURIComponent(pesanWa)}`, "_blank");
      fetchAllData();
    } catch (error) {
      alert("Gagal memperbarui status.");
    }
  };

  const handleTolakSkripsi = async (item) => {
    try {
      await updateDoc(doc(db, "permohonan_skripsi", item.id), { status: "Ditolak" });
      fetchAllData();
    } catch (error) { alert("Gagal menolak."); }
  };

  const handleResetStatusSkripsi = async (id) => {
    try {
      await updateDoc(doc(db, "permohonan_skripsi", id), { status: "Menunggu" });
      fetchAllData();
    } catch (error) { alert("Gagal mengembalikan status."); }
  };

  const handleSaveTampilan = async (e) => { e.preventDefault(); setLoading(true); setStatus({ type: "", message: "" }); try { let newUrls = { ...tampilanUrls }; const keys = ["hero", "profil", "fasilitas", "kehidupan", "alumni", "gateway"]; for (let key of keys) { if (tampilanFiles[key] && tampilanFiles[key].length > 0) { let urls = []; for (const file of tampilanFiles[key]) { urls.push(await uploadToCloudinary(file, "image")); } newUrls[key] = urls; } } if (tampilanFiles.gateway && tampilanFiles.gateway.length > 0) { delete newUrls.gateway1; delete newUrls.gateway2; delete newUrls.gateway3; } await setDoc(doc(db, "pengaturan", "tampilan"), newUrls, { merge: true }); setTampilanUrls(newUrls); setTampilanFiles({ hero: [], profil: [], fasilitas: [], kehidupan: [], alumni: [], gateway: [] }); setStatus({ type: "success", message: "Semua foto latar berhasil diperbarui!" }); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleSaveProfilText = async (e) => { e.preventDefault(); setLoading(true); setStatus({ type: "", message: "" }); try { await setDoc(doc(db, "pengaturan", "profilText"), profilText); await setDoc(doc(db, "pengaturan", "kontak"), kontak); setStatus({ type: "success", message: "Teks profil & Kontak berhasil diperbarui!" }); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleSaveStatusAsrama = async (e) => { e.preventDefault(); setLoading(true); setStatus({ type: "", message: "" }); try { await setDoc(doc(db, "pengaturan", "statusAsrama"), statusAsrama); setStatus({ type: "success", message: "Status Asrama berhasil diperbarui!" }); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleSaveBrosur = async (e) => { e.preventDefault(); setLoading(true); setStatus({ type: "", message: "" }); try { let currentBrosurUrl = brosurUrl; if (fileBrosur) { currentBrosurUrl = await uploadToCloudinary(fileBrosur, "image"); setBrosurUrl(currentBrosurUrl); setFileBrosur(null); } await setDoc(doc(db, "pengaturan", "brosur"), { link: currentBrosurUrl, linkFormulir: linkFormulir }); setStatus({ type: "success", message: "Brosur & Link Formulir Pendaftaran berhasil diperbarui!" }); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleSavePengurusInti = async (e) => { e.preventDefault(); setLoading(true); setStatus({ type: "", message: "" }); try { let newData = { ...pengurusInti }; if (fileInti.ketua) newData.ketuaFoto = await uploadToCloudinary(fileInti.ketua, "image"); if (fileInti.sekretaris) newData.sekreFoto = await uploadToCloudinary(fileInti.sekretaris, "image"); if (fileInti.bendahara) newData.bendaharaFoto = await uploadToCloudinary(fileInti.bendahara, "image"); await setDoc(doc(db, "pengaturan", "pengurus_inti"), newData); setPengurusInti(newData); setFileInti({ ketua: null, sekretaris: null, bendahara: null }); setStatus({ type: "success", message: "Pengurus Inti berhasil diperbarui!" }); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };

  const handleSubmitSejarah = async (e) => { e.preventDefault(); setLoading(true); try { if (editSejarahId) { await updateDoc(doc(db, "sejarah_asrama", editSejarahId), { judul: judulSejarah, isi: isiSejarah }); setStatus({ type: "success", message: "Sejarah diperbarui!" }); } else { await addDoc(collection(db, "sejarah_asrama"), { judul: judulSejarah, isi: isiSejarah, createdAt: serverTimestamp() }); setStatus({ type: "success", message: "Sejarah ditambahkan!" }); } setJudulSejarah(""); setIsiSejarah(""); setEditSejarahId(null); fetchAllData(); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleEditSejarahClick = (item) => { setEditSejarahId(item.id); setJudulSejarah(item.judul); setIsiSejarah(item.isi); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleTambahDivisi = async (e) => { e.preventDefault(); setLoading(true); try { await addDoc(collection(db, "divisi_asrama"), { namaDivisi: namaDivisiBaru, createdAt: serverTimestamp() }); setStatus({ type: "success", message: "Divisi berhasil ditambahkan!" }); setNamaDivisiBaru(""); fetchAllData(); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleEditAnggotaClick = (anggota) => { setEditAnggotaId(anggota.id); setFormAnggota({ divisiId: anggota.divisiId, nama: anggota.nama, peran: anggota.peran || "Anggota" }); setFileAnggota(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleTambahAnggota = async (e) => { e.preventDefault(); setLoading(true); try { let fotoUrl = ""; if (editAnggotaId) { const existing = dataAnggota.find(a => a.id === editAnggotaId); fotoUrl = existing.foto; if (fileAnggota) fotoUrl = await uploadToCloudinary(fileAnggota, "image"); if (!fileAnggota && fotoUrl.includes("ui-avatars.com") && existing.nama !== formAnggota.nama) { fotoUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(formAnggota.nama) + "&background=random"; } await updateDoc(doc(db, "anggota_divisi", editAnggotaId), { divisiId: formAnggota.divisiId, nama: formAnggota.nama, peran: formAnggota.peran, foto: fotoUrl }); setStatus({ type: "success", message: "Data Anggota diperbarui!" }); } else { fotoUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(formAnggota.nama) + "&background=random"; if (fileAnggota) fotoUrl = await uploadToCloudinary(fileAnggota, "image"); await addDoc(collection(db, "anggota_divisi"), { divisiId: formAnggota.divisiId, nama: formAnggota.nama, peran: formAnggota.peran, foto: fotoUrl, createdAt: serverTimestamp() }); setStatus({ type: "success", message: "Anggota ditambahkan!" }); } setFormAnggota({ divisiId: "", nama: "", peran: "Anggota" }); setFileAnggota(null); setEditAnggotaId(null); fetchAllData(); if(document.getElementById('foto1Anggota')) document.getElementById('foto1Anggota').value = ""; } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleSubmitTimeline = async (e) => { e.preventDefault(); setLoading(true); try { if (editTimelineId) { await updateDoc(doc(db, "timeline_sejarah", editTimelineId), { tahun: tahunTimeline, judul: judulTimeline, deskripsi: deskripsiTimeline }); setStatus({ type: "success", message: "Timeline diperbarui!" }); } else { await addDoc(collection(db, "timeline_sejarah"), { tahun: tahunTimeline, judul: judulTimeline, deskripsi: deskripsiTimeline, createdAt: serverTimestamp() }); setStatus({ type: "success", message: "Timeline ditambahkan!" }); } setTahunTimeline(""); setJudulTimeline(""); setDeskripsiTimeline(""); setEditTimelineId(null); fetchAllData(); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleEditTimelineClick = (item) => { setEditTimelineId(item.id); setTahunTimeline(item.tahun); setJudulTimeline(item.judul); setDeskripsiTimeline(item.deskripsi); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleSubmitFotoProfil = async (e) => { e.preventDefault(); setLoading(true); try { let urls = editFotoProfId ? dataFotoProfil.find(d=>d.id===editFotoProfId).linkGambar : []; if (filesFotoProfil.length > 0) { urls = []; for (const file of filesFotoProfil) urls.push(await uploadToCloudinary(file, "image")); } if (editFotoProfId) { await updateDoc(doc(db, "profil_galeri", editFotoProfId), { konteks: konteksFoto, linkGambar: urls }); setStatus({ type: "success", message: "Foto Profil diperbarui!" }); } else { await addDoc(collection(db, "profil_galeri"), { konteks: konteksFoto, linkGambar: urls, createdAt: serverTimestamp() }); setStatus({ type: "success", message: "Foto Profil ditambahkan!" }); } setKonteksFoto(""); setFilesFotoProfil([]); setEditFotoProfId(null); fetchAllData(); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleEditFotoProfClick = (item) => { setEditFotoProfId(item.id); setKonteksFoto(item.konteks); setFilesFotoProfil([]); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleSubmitFasilitas = async (e) => { e.preventDefault(); setLoading(true); try { let urls = editFasilitId ? dataFasilitas.find(d=>d.id===editFasilitId).linkGambar : []; if (filesFasilitas.length > 0) { urls = []; for (const file of filesFasilitas) urls.push(await uploadToCloudinary(file, "image")); } if (editFasilitId) { await updateDoc(doc(db, "daftar_fasilitas", editFasilitId), { nama: namaFasilitas, deskripsi: deskripsiFasilitas, linkGambar: urls }); setStatus({ type: "success", message: "Fasilitas diperbarui!" }); } else { await addDoc(collection(db, "daftar_fasilitas"), { nama: namaFasilitas, deskripsi: deskripsiFasilitas, linkGambar: urls, createdAt: serverTimestamp() }); setStatus({ type: "success", message: "Fasilitas ditambahkan!" }); } setNamaFasilitas(""); setDeskripsiFasilitas(""); setFilesFasilitas([]); setEditFasilitId(null); fetchAllData(); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleEditFasilitasClick = (item) => { setEditFasilitId(item.id); setNamaFasilitas(item.nama); setDeskripsiFasilitas(item.deskripsi); setFilesFasilitas([]); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleSubmitPenyewaan = async (e) => { e.preventDefault(); setLoading(true); try { let urls = editSewaId ? dataPenyewaan.find(d=>d.id===editSewaId).linkGambar : []; if (filesSewa.length > 0) { urls = []; for (const file of filesSewa) urls.push(await uploadToCloudinary(file, "image")); } if (editSewaId) { await updateDoc(doc(db, "daftar_penyewaan", editSewaId), { nama: namaSewa, kategori: kategoriSewa, harga: hargaSewa, noHpSewa: noHpSewa, deskripsi: deskripsiSewa, linkGambar: urls }); setStatus({ type: "success", message: "Layanan diperbarui!" }); } else { await addDoc(collection(db, "daftar_penyewaan"), { nama: namaSewa, kategori: kategoriSewa, harga: hargaSewa, noHpSewa: noHpSewa, deskripsi: deskripsiSewa, linkGambar: urls, createdAt: serverTimestamp() }); setStatus({ type: "success", message: "Layanan ditambahkan!" }); } setNamaSewa(""); setDeskripsiSewa(""); setKategoriSewa("Tempat / Barang"); setHargaSewa(""); setNoHpSewa(""); setFilesSewa([]); setEditSewaId(null); fetchAllData(); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleEditSewaClick = (item) => { setEditSewaId(item.id); setNamaSewa(item.nama); setKategoriSewa(item.kategori); setHargaSewa(item.harga); setNoHpSewa(item.noHpSewa); setDeskripsiSewa(item.deskripsi); setFilesSewa([]); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleSubmitGaleri = async (e) => { e.preventDefault(); setLoading(true); try { let urls = editGaleriId ? (dataGaleri.find(d=>d.id===editGaleriId).linkGambar || []) : []; if (filesGaleri.length > 0) { urls = []; for (const file of filesGaleri) urls.push(await uploadToCloudinary(file, "image")); } if (editGaleriId) { await updateDoc(doc(db, "fasilitas", editGaleriId), { judul: judulGaleri, warna: warnaGaleri, linkGambar: urls }); setStatus({ type: "success", message: "Galeri diperbarui!" }); } else { await addDoc(collection(db, "fasilitas"), { judul: judulGaleri, warna: warnaGaleri, linkGambar: urls, createdAt: serverTimestamp() }); setStatus({ type: "success", message: "Galeri ditambahkan!" }); } setJudulGaleri(""); setWarnaGaleri("#ffffff"); setFilesGaleri([]); setEditGaleriId(null); fetchAllData(); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleEditGaleriClick = (item) => { setEditGaleriId(item.id); setJudulGaleri(item.judul); setWarnaGaleri(item.warna || "#ffffff"); setFilesGaleri([]); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleSubmitKehidupan = async (e) => { e.preventDefault(); setLoading(true); try { let urls = editKehidupanId ? dataKehidupan.find(d=>d.id===editKehidupanId).linkGambar : []; if (filesGambar.length > 0) { urls = []; for (const file of filesGambar) urls.push(await uploadToCloudinary(file, "image")); } const finalKategori = kategori === "LAINNYA" ? customKategori.toUpperCase() : kategori; if (editKehidupanId) { await updateDoc(doc(db, "kehidupan", editKehidupanId), { judul: judulKonten, kategori: finalKategori, deskripsi, linkGambar: urls }); setStatus({ type: "success", message: "Publikasi diperbarui!" }); } else { await addDoc(collection(db, "kehidupan"), { judul: judulKonten, kategori: finalKategori, deskripsi, linkGambar: urls, tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), createdAt: serverTimestamp() }); setStatus({ type: "success", message: "Publikasi ditambahkan!" }); } setJudulKonten(""); setDeskripsi(""); setCustomKategori(""); setKategori("PRESTASI"); setFilesGambar([]); setEditKehidupanId(null); fetchAllData(); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleEditKehidupanClick = (item) => { setEditKehidupanId(item.id); setJudulKonten(item.judul); setDeskripsi(item.deskripsi); if (["PRESTASI", "MERSI X BK", "LOMBA TERBUKA"].includes(item.kategori)) { setKategori(item.kategori); setCustomKategori(""); } else { setKategori("LAINNYA"); setCustomKategori(item.kategori); } setFilesGambar([]); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleSubmitSkripsi = async (e) => { e.preventDefault(); setLoading(true); try { let linkPDF = editSkripsiId ? dataSkripsi.find(d=>d.id===editSkripsiId).linkPDF : ""; if (filePDF) { let rawUrl = await uploadToCloudinary(filePDF, "image"); linkPDF = rawUrl.replace("/upload/", "/upload/fl_attachment/"); } if (editSkripsiId) { await updateDoc(doc(db, "skripsi", editSkripsiId), { nama, jurusan, judul: judulSkripsi, tahun, linkPDF }); setStatus({ type: "success", message: "Skripsi diperbarui!" }); } else { await addDoc(collection(db, "skripsi"), { nama, jurusan, judul: judulSkripsi, tahun, linkPDF, createdAt: serverTimestamp() }); setStatus({ type: "success", message: "Skripsi ditambahkan!" }); } setNama(""); setJurusan(""); setJudulSkripsi(""); setTahun(""); setFilePDF(null); setEditSkripsiId(null); fetchAllData(); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleEditSkripsiClick = (item) => { setEditSkripsiId(item.id); setNama(item.nama); setJurusan(item.jurusan); setJudulSkripsi(item.judul); setTahun(item.tahun); setFilePDF(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleReplyKomentar = async (id) => { if (!replyText.trim()) return; setLoading(true); try { await updateDoc(doc(db, "komentar_publikasi", id), { balasanAdmin: replyText }); setStatus({ type: "success", message: "Balasan berhasil dikirim!" }); setReplyKomenId(null); setReplyText(""); fetchAllData(); } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } };
  const handleDeleteBalasan = async (id) => { if (confirm("Hapus balasan admin ini?")) { await updateDoc(doc(db, "komentar_publikasi", id), { balasanAdmin: "" }); fetchAllData(); } };

  // --- LOGIKA SUBMIT DATA ALUMNI LENGKAP ---
  const handleSubmitPesanAlumni = async (e) => { 
    e.preventDefault(); setLoading(true); 
    try { 
      let fotoUrl = editPesanId ? dataPesanAlumni.find(d=>d.id===editPesanId).foto : ""; 
      if (fileFotoAlumni) { fotoUrl = await uploadToCloudinary(fileFotoAlumni, "image"); } 
      
      const payload = { 
        nama: formAlumni.nama, 
        asal: formAlumni.asal,
        kuliah: formAlumni.kuliah,
        jurusan: formAlumni.jurusan,
        angkatanAsrama: formAlumni.angkatanAsrama,
        pekerjaan: formAlumni.pekerjaan,
        skripsi: formAlumni.skripsi,
        pesan: formAlumni.pesan, 
        foto: fotoUrl 
      };

      if (editPesanId) { 
        await updateDoc(doc(db, "pesan_alumni", editPesanId), payload); 
        setStatus({ type: "success", message: "Data alumni diperbarui!" }); 
      } else { 
        await addDoc(collection(db, "pesan_alumni"), { ...payload, createdAt: serverTimestamp() }); 
        setStatus({ type: "success", message: "Data alumni ditambahkan!" }); 
      } 
      
      setFormAlumni({ nama: "", asal: "", kuliah: "", jurusan: "", angkatanAsrama: "", pekerjaan: "", skripsi: "", pesan: "" }); 
      setFileFotoAlumni(null); setEditPesanId(null); fetchAllData(); 
      if(document.getElementById('fotoAlumni')) document.getElementById('fotoAlumni').value = "";
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); } 
  };
  
  const handleEditPesanClick = (item) => { 
    setEditPesanId(item.id); 
    setFormAlumni({
      nama: item.nama || "",
      asal: item.asal || "",
      kuliah: item.kuliah || "",
      jurusan: item.jurusan || "",
      angkatanAsrama: item.angkatanAsrama || "",
      pekerjaan: item.pekerjaan || "",
      skripsi: item.skripsi || "",
      pesan: item.pesan || ""
    });
    setFileFotoAlumni(null); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  if (!authReady) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Memeriksa Akses...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-50 p-4 px-8 flex justify-between items-center">
        <div className="font-serif font-bold text-xl flex items-center gap-2">
          <img src="/mersi.png" alt="Logo" className="w-6 h-6 object-contain" /> Admin Mersi 
          <span className="text-xs bg-red-800 px-2 py-0.5 rounded-full ml-2 font-sans font-normal uppercase tracking-wider">{role === "puki" ? "PUBLIKASI" : role}</span>
        </div>
        <button onClick={() => {signOut(auth); router.push("/admin/login")}} className="bg-red-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">Logout</button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex space-x-2 mb-8 bg-white p-2 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          {allowedTabs.map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === tab ? "bg-red-50 text-red-800 border border-red-200" : "text-slate-700 hover:bg-slate-50"}`}>
              {TAB_NAMES[tab]}
            </button>
          ))}
        </div>

        {status.message && <div className={`p-4 rounded-lg mb-6 text-sm font-medium border ${status.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>{status.message}</div>}

        {/* --- DI POTONG UNTUK MENGHEMAT RUANG CHAT --- 
            (BAGIAN TAMPILAN, KEPENGURUSAN, GALERI DLL TETAP ADA DI KODE ASLI) */}

        {/* --- KHUSUS TAB PENDAFTARAN ASRAMA (DI SINI YANG KITA UBAH) --- */}
        {activeTab === "log" && allowedTabs.includes("log") && ( 
          <div className="space-y-6"> 
            
            {(role === "sekre" || role === "humas") && (
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-l-green-600"> 
                <div className="flex justify-between items-center mb-4 border-b pb-2"><h2 className="text-lg font-bold text-slate-900">Data Pendaftar Warga Asrama Baru</h2><span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Total: {dataPendaftarAsrama.length}</span></div> 
                <div className="overflow-x-auto"> 
                  <table className="w-full text-left text-sm"> 
                    
                    {/* 1. Header Tabel Diubah */}
                    <thead>
                      <tr className="bg-slate-50 border-y text-slate-600">
                        <th className="p-3">Waktu Daftar</th>
                        <th className="p-3 w-2/3">Identitas & Kontak</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead> 
                    
                    <tbody className="divide-y"> 
                      {dataPendaftarAsrama.length === 0 ? <tr><td colSpan="3" className="p-8 text-center text-slate-500">Belum ada calon warga.</td></tr> : ( 
                        dataPendaftarAsrama.slice((pageDaftarAsrama-1)*itemsPerPage, pageDaftarAsrama*itemsPerPage).map(item => ( 
                          
                          // 2. Baris Tabel Diubah (Hanya Nama, Asal, Email, No HP)
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-3 text-xs">{item.waktuDaftar ? new Date(item.waktuDaftar.toDate()).toLocaleString('id-ID') : '-'}</td>
                            <td className="p-3">
                              <span className="font-bold text-stone-900">{item.nama}</span> <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded ml-2 uppercase tracking-widest">{item.asal || "TIDAK ADA DATA ASAL"}</span><br/>
                              <span className="text-xs text-stone-600 mt-1 block">{item.noHp} <span className="text-stone-300 mx-1">|</span> {item.email}</span>
                            </td>
                            <td className="p-3 text-center">
                              <button onClick={() => handleDelete("pendaftaran_asrama", item.id)} className="text-red-500 text-xs font-bold hover:underline">Hapus</button>
                            </td>
                          </tr> 

                        )) 
                      )} 
                    </tbody> 
                  </table> 
                </div> 
                <Pagination totalItems={dataPendaftarAsrama.length} itemsPerPage={itemsPerPage} currentPage={pageDaftarAsrama} setCurrentPage={setPageDaftarAsrama}/>
              </div> 
            )}

            {/* SISA KODE LOG LAINNYA TETAP SAMA */}
            {(role === "sekre" || role === "tendor") && (
              <div className="bg-white rounded-xl shadow-md p-6"> 
                <div className="flex justify-between items-center mb-4 border-b pb-2"><h2 className="text-lg font-bold text-slate-900">Data Pendaftar (Lomba Terbuka)</h2><span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Total: {dataPendaftarLomba.length}</span></div> 
                <div className="overflow-x-auto"> 
                  <table className="w-full text-left text-sm"> 
                    <thead><tr className="bg-slate-50 border-y text-slate-600"><th className="p-3">Waktu Daftar</th><th className="p-3">Identitas</th><th className="p-3">Alamat</th><th className="p-3">Lomba Diikuti</th><th className="p-3 text-center">Aksi</th></tr></thead> 
                    <tbody className="divide-y"> 
                      {dataPendaftarLomba.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-slate-500">Belum ada peserta.</td></tr> : ( 
                        dataPendaftarLomba.slice((pageDaftarLomba-1)*itemsPerPage, pageDaftarLomba*itemsPerPage).map(item => ( 
                          <tr key={item.id}><td className="p-3 text-xs">{item.waktuDaftar ? new Date(item.waktuDaftar.toDate()).toLocaleString('id-ID') : '-'}</td><td className="p-3"><b>{item.namaPeserta}</b><br/><span className="text-xs text-stone-500">{item.noHpPeserta}</span></td><td className="p-3 text-xs">{item.alamatPeserta}</td><td className="p-3 text-xs font-semibold text-red-800">{item.judulLomba}</td><td className="p-3 text-center"><button onClick={() => handleDelete("pendaftaran_lomba", item.id)} className="text-red-500 text-xs font-bold">Hapus</button></td></tr> 
                        )) 
                      )} 
                    </tbody> 
                  </table> 
                </div> 
                <Pagination totalItems={dataPendaftarLomba.length} itemsPerPage={itemsPerPage} currentPage={pageDaftarLomba} setCurrentPage={setPageDaftarLomba}/>
              </div> 
            )}

            {(role === "sekre" || role === "publikasi") && (
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-l-amber-500"> 
                <div className="flex justify-between items-center mb-4 border-b pb-2"><h2 className="text-lg font-bold text-slate-900">Log Komentar & Diskusi</h2><span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Total: {dataKomentar.length}</span></div> 
                <div className="overflow-x-auto"> 
                  <table className="w-full text-left text-sm"> 
                    <thead><tr className="bg-slate-50 border-y text-slate-600"><th className="p-3">Pengirim</th><th className="p-3 w-1/2">Isi Komentar & Topik</th><th className="p-3 w-1/4">Balasan Admin</th><th className="p-3 text-center">Aksi</th></tr></thead> 
                    <tbody className="divide-y"> 
                      {dataKomentar.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-500">Belum ada komentar.</td></tr> : ( 
                        dataKomentar.slice((pageKomentar-1)*itemsPerPage, pageKomentar*itemsPerPage).map(item => ( 
                          <tr key={item.id} className="hover:bg-slate-50"><td className="p-3"><div className="font-bold text-stone-900">{item.nama}</div><div className="text-[10px] text-stone-500">{item.waktu ? new Date(item.waktu.toDate()).toLocaleString('id-ID') : '-'}</div></td><td className="p-3"><div className="text-xs text-stone-700 mb-2">"{item.isi}"</div><div className="flex gap-2"><span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 rounded border">{item.postJudul || "Topik lama: Judul tidak terekam"}</span><span className="text-[10px] font-bold text-red-600">❤️ {item.likes || 0}</span></div></td><td className="p-3">{item.balasanAdmin ? (<div className="bg-green-50 border p-2 rounded relative group"><p className="text-xs text-green-800">{item.balasanAdmin}</p><button onClick={() => handleDeleteBalasan(item.id)} className="absolute top-1 right-1 text-[10px] text-red-500 font-bold opacity-0 group-hover:opacity-100">Hapus</button></div>) : (replyKomenId === item.id ? (<div className="flex flex-col gap-2"><textarea required value={replyText} onChange={(e)=>setReplyText(e.target.value)} placeholder="Tulis balasan..." className="text-xs p-2 border rounded w-full bg-white" rows="2"></textarea><div className="flex gap-2"><button onClick={() => handleReplyKomentar(item.id)} className="bg-amber-600 text-white text-[10px] px-3 py-1.5 rounded">Kirim</button><button onClick={() => {setReplyKomenId(null); setReplyText("");}} className="bg-stone-200 text-[10px] px-3 py-1.5 rounded">Batal</button></div></div>) : (<button onClick={() => {setReplyKomenId(item.id); setReplyText("");}} className="text-[11px] text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded border border-blue-100">Balas Komentar</button>))}</td><td className="p-3 text-center"><button onClick={() => handleDelete("komentar_publikasi", item.id)} className="text-red-500 text-xs font-bold">Hapus</button></td></tr> 
                        )) 
                      )} 
                    </tbody> 
                  </table> 
                </div> 
                <Pagination totalItems={dataKomentar.length} itemsPerPage={itemsPerPage} currentPage={pageKomentar} setCurrentPage={setPageKomentar}/>
              </div> 
            )}

            {role === "sekre" && (
              <div className="bg-white rounded-xl shadow-md p-6"> 
                <div className="flex justify-between items-center mb-4 border-b pb-2"><h2 className="text-lg font-bold text-slate-900">Log Pengunjung (Pengunduh Skripsi)</h2><span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Total: {dataLogUnduh.length}</span></div> 
                <div className="overflow-x-auto"> 
                  <table className="w-full text-left text-sm"> 
                    <thead><tr className="bg-slate-50 border-y text-slate-600"><th className="p-3">Waktu Akses</th><th className="p-3">Identitas Pengunduh</th><th className="p-3">Skripsi Dibaca</th><th className="p-3 text-center">Aksi</th></tr></thead> 
                    <tbody className="divide-y"> 
                      {dataLogUnduh.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-500">Belum ada riwayat.</td></tr> : ( 
                        dataLogUnduh.slice((pageUnduh-1)*itemsPerPage, pageUnduh*itemsPerPage).map(item => ( 
                          <tr key={item.id} className="hover:bg-slate-50"><td className="p-3 text-xs">{item.waktuAkses ? new Date(item.waktuAkses.toDate()).toLocaleString('id-ID') : '-'}</td><td className="p-3"><b>{item.namaPengunduh}</b><br/><span className="text-xs text-stone-500">{item.noHpPengunduh} | {item.emailPengunduh}</span></td><td className="p-3 text-xs"><b>{item.penulisSkripsi}</b><br/>{item.judulSkripsi}</td><td className="p-3 text-center"><button onClick={() => handleDelete("log_unduh_skripsi", item.id)} className="text-red-500 text-xs font-bold">Hapus</button></td></tr> 
                        )) 
                      )} 
                    </tbody> 
                  </table> 
                </div> 
                <Pagination totalItems={dataLogUnduh.length} itemsPerPage={itemsPerPage} currentPage={pageUnduh} setCurrentPage={setPageUnduh}/>
              </div> 
            )}

            {/* TAB KUNJUNGAN WEBSITE */}
            {(role === "sekre" || role === "humas" || role === "publikasi") && (
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-l-blue-600">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-lg font-bold text-slate-900">Log Kunjungan Website (Anonim)</h2>
                    <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Total: {dataPengunjung.length}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead><tr className="bg-slate-50 border-y text-slate-600"><th className="p-3">Waktu Akses</th><th className="p-3">Lokasi (IP)</th><th className="p-3">Perangkat</th><th className="p-3 text-center">Aksi</th></tr></thead>
                    <tbody className="divide-y">
                      {dataPengunjung.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-500">Belum ada data kunjungan.</td></tr> : (
                        dataPengunjung.slice((pagePengunjung-1)*itemsPerPage, pagePengunjung*itemsPerPage).map(item => {
                          const ua = item.userAgent || "";
                          const device = /Mobile|Android|iP(hone|od|ad)/i.test(ua) ? "📱 HP/Tablet" : "💻 PC/Laptop";
                          return (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-3 text-xs">{item.waktu ? new Date(item.waktu.toDate()).toLocaleString('id-ID') : '-'}</td>
                            <td className="p-3"><b>{item.kota || "Tidak diketahui"}, {item.provinsi}</b><br/><span className="text-[10px] text-stone-500">IP: {item.ip} • {item.isp}</span></td>
                            <td className="p-3 text-xs"><b>{device}</b><br/><span className="text-[10px] text-stone-500 line-clamp-1 max-w-xs" title={ua}>{ua}</span></td>
                            <td className="p-3 text-center"><button onClick={() => handleDelete("log_pengunjung", item.id)} className="text-red-500 text-xs font-bold">Hapus</button></td>
                          </tr>
                        )})
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination totalItems={dataPengunjung.length} itemsPerPage={itemsPerPage} currentPage={pagePengunjung} setCurrentPage={setPagePengunjung}/>
              </div>
            )}

          </div> 
        )}
      </main>
    </div>
  );
}

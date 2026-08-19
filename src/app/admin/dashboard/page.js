"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, setDoc, serverTimestamp, query, orderBy, updateDoc } from "firebase/firestore";
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

  // --- LOGIKA SUBMIT DATA ALUMNI YANG BARU & LENGKAP ---
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
      
      // Reset Form
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

        {/* TAB TAMPILAN PENGATURAN */}
        {activeTab === "tampilan" && allowedTabs.includes("tampilan") && ( 
          <div className="space-y-6"> 
            {role === "sekre" && ( 
              <>
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> 
                  <h2 className="text-lg font-bold mb-4 border-b pb-2">Edit Teks Website Asrama</h2> 
                  <form onSubmit={handleSaveProfilText} className="space-y-6"> 
                    <div className="space-y-4"> 
                      <h3 className="font-semibold text-red-800 border-l-2 pl-2">Kontak Asrama (Footer & Pendaftaran)</h3> 
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
                        <div><label className="text-sm block mb-1">Nama Ketua</label><input required type="text" value={kontak.namaKetua} onChange={(e) => setKontak({...kontak, namaKetua: e.target.value})} className="w-full px-4 py-2 border rounded-md" /></div> 
                        <div><label className="text-sm block mb-1">Nomor WA Ketua</label><input required type="text" value={kontak.noTelpon} onChange={(e) => setKontak({...kontak, noTelpon: e.target.value})} className="w-full px-4 py-2 border rounded-md" placeholder="Cth: 0812..." /></div> 
                        <div><label className="text-sm block mb-1">Nomor WA Humas</label><input required type="text" value={kontak.noHumas || ""} onChange={(e) => setKontak({...kontak, noHumas: e.target.value})} className="w-full px-4 py-2 border rounded-md" placeholder="Cth: 0852..." /></div> 
                      </div> 
                    </div> 
                    <div className="space-y-4 pt-4 border-t"> <h3 className="font-semibold text-red-800 border-l-2 pl-2">Halaman Profil - Visi Misi</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div><label className="text-sm block mb-1">Visi</label><textarea required rows="3" value={profilText.visi} onChange={(e) => setProfilText({...profilText, visi: e.target.value})} className="w-full px-4 py-2 border rounded-md"></textarea></div> <div><label className="text-sm block mb-1">Misi</label><textarea required rows="3" value={profilText.misi} onChange={(e) => setProfilText({...profilText, misi: e.target.value})} className="w-full px-4 py-2 border rounded-md"></textarea></div> </div> </div> 
                    <div className="space-y-4 pt-4 border-t"> <h3 className="font-semibold text-red-800 border-l-2 pl-2">Halaman Jejak & Prestasi</h3> <div><label className="text-sm block mb-1">Teks Jejak Alumni</label><textarea required rows="2" value={profilText.jejakAlumni} onChange={(e) => setProfilText({...profilText, jejakAlumni: e.target.value})} className="w-full px-4 py-2 border rounded-md"></textarea></div> </div> 
                    <button type="submit" disabled={loading} className="bg-slate-900 text-white px-6 py-2 rounded-md font-semibold">Simpan Teks Utama</button> 
                  </form> 
                </div> 

                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                  <h2 className="text-lg font-bold mb-4 border-b pb-2">{editSejarahId ? "Edit Cerita Sejarah" : "Manajemen Catatan Sejarah (Buku)"}</h2>
                  <form onSubmit={handleSubmitSejarah} className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
                      <div><label className="text-sm font-semibold mb-1 block">Judul Halaman / Bagian</label><input type="text" required value={judulSejarah} onChange={(e) => setJudulSejarah(e.target.value)} placeholder="Cth: Bagian 1 / Masa Pendirian" className="w-full px-4 py-2 border border-slate-300 rounded-md bg-slate-50 text-sm" /></div>
                      <div><label className="text-sm font-semibold mb-1 block">Isi Cerita Sejarah</label><textarea required rows="3" value={isiSejarah} onChange={(e) => setIsiSejarah(e.target.value)} placeholder="Tuliskan cerita sejarah untuk lembaran ini..." className="w-full px-4 py-2 border border-slate-300 rounded-md bg-slate-50 text-sm"></textarea></div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3">
                      <button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-md font-semibold w-full md:w-auto">{editSejarahId ? "Simpan Perubahan" : "Tambah Lembaran"}</button>
                      {editSejarahId && <button type="button" onClick={() => { setEditSejarahId(null); setJudulSejarah(""); setIsiSejarah(""); }} className="bg-stone-500 hover:bg-stone-600 text-white px-6 py-2 rounded-md font-semibold w-full md:w-auto">Batal Edit</button>}
                    </div>
                  </form>
                  
                  <h3 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-3">Daftar Lembaran</h3>
                  <div className="space-y-3">
                    {dataSejarah.slice((pageSejarah - 1) * itemsPerPage, pageSejarah * itemsPerPage).map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200 rounded-lg gap-4">
                        <div><div className="font-bold text-amber-700 text-sm mb-1">{item.judul}</div><div className="text-xs text-slate-500 line-clamp-1 pr-4">{item.isi}</div></div>
                        <div className="flex gap-2 shrink-0">
                          <button type="button" onClick={() => handleEditSejarahClick(item)} className="text-amber-600 text-xs font-bold border border-amber-200 bg-white px-3 py-1.5 rounded hover:bg-amber-50">Edit</button>
                          <button type="button" onClick={() => handleDelete("sejarah_asrama", item.id)} className="text-red-500 text-xs font-bold border border-red-200 bg-white px-3 py-1.5 rounded hover:bg-red-50">Hapus</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination totalItems={dataSejarah.length} itemsPerPage={itemsPerPage} currentPage={pageSejarah} setCurrentPage={setPageSejarah} />
                </div>
              </>
            )}

            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">Ubah Foto Latar Belakang</h2> <form onSubmit={handleSaveTampilan} className="space-y-6"> <div className="space-y-4"> <h3 className="font-semibold text-red-800 border-l-2 pl-2">Slideshow Gateway (Halaman Beranda Utama)</h3> <div className="bg-slate-50 p-4 border rounded-lg"> <label className="font-semibold block mb-2">Pilih Beberapa Foto Gateway Sekaligus</label> <input type="file" multiple accept="image/*" onChange={(e) => setTampilanFiles({...tampilanFiles, gateway: Array.from(e.target.files)})} className="w-full text-sm cursor-pointer bg-white p-2 border rounded" /> </div> </div> <div className="space-y-4 pt-4 border-t"> <h3 className="font-semibold text-red-800 border-l-2 pl-2">Latar Belakang Tiap Halaman</h3> {[{ id: 'hero', title: 'Beranda (Hero)' }, { id: 'profil', title: 'Profil' }, { id: 'fasilitas', title: 'Fasilitas' }, { id: 'kehidupan', title: 'Media' }, { id: 'alumni', title: 'Alumni' }].map((item) => ( <div key={item.id} className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center bg-slate-50 p-4 border rounded-lg"> <label className="font-semibold text-sm">Latar {item.title}</label> <input type="file" multiple accept="image/*" onChange={(e) => setTampilanFiles({...tampilanFiles, [item.id]: Array.from(e.target.files)})} className="w-full text-sm cursor-pointer bg-white p-2 border rounded" /> </div> ))} </div> <button type="submit" disabled={loading} className="bg-slate-900 text-white px-6 py-2 rounded-md font-semibold">Simpan Slideshow Latar</button> </form> </div> 
          </div> 
        )}
        
        {/* TAB KEPENGURUSAN */}
        {activeTab === "kepengurusan" && allowedTabs.includes("kepengurusan") && ( 
          <div className="space-y-6"> 
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> 
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">1. Pengurus Inti Asrama</h2> 
              <form onSubmit={handleSavePengurusInti} className="space-y-6"> 
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> 
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg shadow-sm"> <label className="text-sm font-bold block mb-2 text-red-800">Ketua Asrama</label> <input type="text" required value={pengurusInti.ketuaNama} onChange={(e) => setPengurusInti({...pengurusInti, ketuaNama: e.target.value})} placeholder="Nama Ketua..." className="w-full px-3 py-2 border border-slate-300 rounded-md mb-4 text-sm" /> <label className="text-[11px] font-bold text-slate-700 mb-1 block">Foto 1 (Tampilan Depan)</label> <input type="file" accept="image/*" onChange={(e) => setFileInti({...fileInti, ketua: e.target.files[0]})} className="w-full text-xs mb-3 bg-white p-1 border border-slate-200 rounded" /> </div> 
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg shadow-sm"> <label className="text-sm font-bold block mb-2 text-red-800">Sekretaris</label> <input type="text" required value={pengurusInti.sekreNama} onChange={(e) => setPengurusInti({...pengurusInti, sekreNama: e.target.value})} placeholder="Nama Sekretaris..." className="w-full px-3 py-2 border border-slate-300 rounded-md mb-4 text-sm" /> <label className="text-[11px] font-bold text-slate-700 mb-1 block">Foto 1 (Tampilan Depan)</label> <input type="file" accept="image/*" onChange={(e) => setFileInti({...fileInti, sekretaris: e.target.files[0]})} className="w-full text-xs mb-3 bg-white p-1 border border-slate-200 rounded" /> </div> 
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg shadow-sm"> <label className="text-sm font-bold block mb-2 text-red-800">Bendahara</label> <input type="text" required value={pengurusInti.bendaharaNama} onChange={(e) => setPengurusInti({...pengurusInti, bendaharaNama: e.target.value})} placeholder="Nama Bendahara..." className="w-full px-3 py-2 border border-slate-300 rounded-md mb-4 text-sm" /> <label className="text-[11px] font-bold text-slate-700 mb-1 block">Foto 1 (Tampilan Depan)</label> <input type="file" accept="image/*" onChange={(e) => setFileInti({...fileInti, bendahara: e.target.files[0]})} className="w-full text-xs mb-3 bg-white p-1 border border-slate-200 rounded" /> </div> 
                </div> 
                <button type="submit" disabled={loading} className="bg-slate-900 text-white px-6 py-2.5 rounded-md font-bold w-full md:w-auto">Simpan Pengurus Inti</button> 
              </form> 
            </div> 

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> 
                <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">2. Tambah Divisi Baru</h2> 
                <form onSubmit={handleTambahDivisi} className="space-y-4"> 
                  <div> <label className="text-sm font-semibold mb-1 block">Nama Divisi</label> <input type="text" required value={namaDivisiBaru} onChange={(e) => setNamaDivisiBaru(e.target.value)} placeholder="Cth: Divisi Bakat & Minat..." className="w-full px-4 py-2 border rounded-md" /> </div> 
                  <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold">Buat Divisi</button> 
                </form> 
              </div> 

              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> 
                <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">{editAnggotaId ? "Edit Data Anggota" : "3. Tambah Anggota Divisi"}</h2> 
                <form onSubmit={handleTambahAnggota} className="space-y-4"> 
                  <div> <label className="text-sm font-semibold mb-1 block">Pilih Divisi</label> <select required value={formAnggota.divisiId} onChange={(e) => setFormAnggota({...formAnggota, divisiId: e.target.value})} className="w-full px-4 py-2 border rounded-md bg-white"> <option value="">-- Pilih Divisi --</option> {dataDivisi.map(div => <option key={div.id} value={div.id}>{div.namaDivisi}</option>)} </select> </div> 
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> 
                    <div> <label className="text-sm font-semibold mb-1 block">Nama Anggota</label> <input type="text" required value={formAnggota.nama} onChange={(e) => setFormAnggota({...formAnggota, nama: e.target.value})} className="w-full px-4 py-2 border rounded-md" /> </div> 
                    <div> <label className="text-sm font-semibold mb-1 block">Peran / Jabatan</label> <select required value={formAnggota.peran} onChange={(e) => setFormAnggota({...formAnggota, peran: e.target.value})} className="w-full px-4 py-2 border rounded-md bg-white"> <option value="Anggota">Anggota</option> <option value="Koordinator">Koordinator</option> </select> </div> 
                  </div> 
                  <div> 
                    <label className="text-[11px] font-bold mb-1 block">Upload Foto Anggota {editAnggotaId && "(Abaikan jika tak diubah)"}</label> 
                    <input type="file" id="foto1Anggota" accept="image/*" onChange={(e) => setFileAnggota(e.target.files[0])} className="w-full text-xs border border-slate-200 p-1.5 rounded" /> 
                  </div> 
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <button type="submit" disabled={loading || !formAnggota.divisiId} className="w-full bg-red-800 hover:bg-red-900 text-white px-4 py-2.5 rounded-md font-bold">{editAnggotaId ? "Simpan Perubahan" : "Tambah Anggota"}</button>
                    {editAnggotaId && <button type="button" onClick={() => { setEditAnggotaId(null); setFormAnggota({ divisiId: "", nama: "", peran: "Anggota" }); setFileAnggota(null); }} className="w-full bg-stone-500 text-white px-4 py-2.5 rounded-md font-bold">Batal Edit</button>}
                  </div>
                </form> 
              </div> 
            </div> 

            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> 
              <h2 className="text-lg font-bold mb-4 border-b pb-2">Daftar Divisi & Anggota</h2> 
              {dataDivisi.map(div => ( 
                <div key={div.id} className="bg-slate-50 border border-slate-200 p-4 rounded-lg mb-4"> 
                  <div className="flex justify-between items-center mb-4 border-b pb-2"> 
                    <h3 className="font-bold text-lg text-red-800">{div.namaDivisi}</h3> 
                    <button onClick={() => handleDelete("divisi_asrama", div.id)} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Hapus Divisi</button> 
                  </div> 
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4"> 
                    {dataAnggota.filter(a => a.divisiId === div.id).map(anggota => ( 
                      <div key={anggota.id} className="bg-white p-3 border rounded flex flex-col items-center text-center relative group"> 
                        <img src={anggota.foto} className="w-12 h-12 rounded-lg object-cover mb-2" /> 
                        <span className="text-xs font-semibold">{anggota.nama}</span> 
                        <span className="text-[10px] text-amber-600 font-bold">{anggota.peran}</span> 
                        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditAnggotaClick(anggota)} className="bg-amber-500 text-white w-6 h-6 rounded-full text-xs shadow-md">✎</button>
                          <button onClick={() => handleDelete("anggota_divisi", anggota.id)} className="bg-red-600 text-white w-6 h-6 rounded-full text-[10px] shadow-md">✕</button>
                        </div>
                      </div> 
                    ))} 
                  </div> 
                </div> 
              ))} 
            </div> 
          </div> 
        )}

        {/* TAB STATUS */}
        {activeTab === "status" && allowedTabs.includes("status") && ( <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">Status Asrama</h2> <form onSubmit={handleSaveStatusAsrama} className="space-y-4"> <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> <div><label className="text-sm font-semibold mb-1 block">Jumlah Kamar</label><input type="number" required value={statusAsrama.kamar} onChange={(e) => setStatusAsrama({...statusAsrama, kamar: e.target.value})} className="w-full px-4 py-2 border rounded-md" /></div> <div><label className="text-sm font-semibold mb-1 block">Jumlah Penghuni</label><input type="number" required value={statusAsrama.penghuni} onChange={(e) => setStatusAsrama({...statusAsrama, penghuni: e.target.value})} className="w-full px-4 py-2 border rounded-md" /></div> <div> <label className="text-sm font-semibold mb-1 block">Ketersediaan</label> <select value={statusAsrama.ketersediaan} onChange={(e) => setStatusAsrama({...statusAsrama, ketersediaan: e.target.value})} className="w-full px-4 py-2 border rounded-md"> <option value="Tersedia">🟢 Tersedia</option> <option value="Penuh">🔴 Penuh</option> </select> </div> </div> <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">Perbarui Status</button> </form> </div> <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">Pengaturan Brosur & Formulir Pendaftaran</h2> <form onSubmit={handleSaveBrosur} className="space-y-6"> <div> <label className="text-sm font-semibold mb-1 block">Link Google Drive Formulir (Kosong)</label> <input type="url" value={linkFormulir} onChange={(e) => setLinkFormulir(e.target.value)} className="w-full px-4 py-2 border rounded-md" /> </div> <div> <label className="text-sm font-semibold mb-1 block">Upload Gambar Brosur Baru</label> <div className="bg-slate-50 p-4 border rounded-lg flex justify-between"> <input type="file" accept="image/*" onChange={(e) => setFileBrosur(e.target.files[0])} className="w-full text-sm" /> {brosurUrl && <a href={brosurUrl} target="_blank" className="text-xs text-amber-600 font-bold border px-3 py-1.5 rounded">Lihat Saat Ini</a>} </div> </div> <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2.5 rounded-md font-bold">Simpan Pengaturan</button> </form> </div> </div> )}
        
        {/* TAB TIMELINE */}
        {activeTab === "timeline" && allowedTabs.includes("timeline") && ( <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">{editTimelineId ? "Edit Timeline" : "Tambah Timeline"}</h2> <form onSubmit={handleSubmitTimeline} className="space-y-4"> <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4"> <input type="text" required value={tahunTimeline} onChange={(e) => setTahunTimeline(e.target.value)} placeholder="Tahun" className="w-full px-4 py-2 border rounded-md" /> <input type="text" required value={judulTimeline} onChange={(e) => setJudulTimeline(e.target.value)} placeholder="Peristiwa" className="w-full px-4 py-2 border rounded-md" /> </div> <textarea required rows="2" value={deskripsiTimeline} onChange={(e) => setDeskripsiTimeline(e.target.value)} placeholder="Deskripsi..." className="w-full px-4 py-2 border rounded-md"></textarea> <div className="flex gap-2"><button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">{editTimelineId ? "Simpan Perubahan" : "Tambahkan"}</button>{editTimelineId && <button type="button" onClick={()=>{setEditTimelineId(null); setTahunTimeline(""); setJudulTimeline(""); setDeskripsiTimeline("");}} className="w-full bg-stone-500 text-white px-4 py-2 rounded-md">Batal</button>}</div> </form> </div> <div className="bg-white rounded-xl shadow-md p-6"> <h3 className="font-bold mb-4 border-b pb-2">Daftar Timeline</h3> <div className="space-y-4"> {dataTimeline.slice((pageTimeline-1)*itemsPerPage, pageTimeline*itemsPerPage).map(item => ( <div key={item.id} className="bg-slate-50 border rounded-lg p-4 flex justify-between"> <div><span className="px-2 py-1 bg-amber-500 text-white text-xs rounded mb-2">{item.tahun}</span><h4 className="font-bold">{item.judul}</h4><p className="text-sm text-slate-600">{item.deskripsi}</p></div> <div className="flex flex-col gap-2 shrink-0"><button onClick={()=>handleEditTimelineClick(item)} className="text-amber-600 text-xs font-bold bg-white border px-3 py-1.5 rounded">Edit</button><button onClick={()=>handleDelete("timeline_sejarah", item.id)} className="bg-red-600 text-white text-xs px-3 py-1.5 rounded">Hapus</button></div> </div> ))} </div> <Pagination totalItems={dataTimeline.length} itemsPerPage={itemsPerPage} currentPage={pageTimeline} setCurrentPage={setPageTimeline}/> </div> </div> )}
        
        {/* TAB FOTO PROFIL */}
        {activeTab === "fotoprofil" && allowedTabs.includes("fotoprofil") && ( <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">{editFotoProfId ? "Edit Foto Profil" : "Tambah Foto Profil"}</h2> <form onSubmit={handleSubmitFotoProfil} className="space-y-4"> <textarea required rows="2" value={konteksFoto} onChange={(e) => setKonteksFoto(e.target.value)} placeholder="Konteks..." className="w-full px-4 py-2 border rounded-md"></textarea> <input type="file" multiple accept="image/*" required={!editFotoProfId} onChange={(e) => setFilesFotoProfil(Array.from(e.target.files))} className="w-full text-sm border p-2 rounded bg-slate-50" /> <div className="flex gap-2"><button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">{editFotoProfId ? "Simpan Perubahan" : "Tambahkan"}</button>{editFotoProfId && <button type="button" onClick={()=>{setEditFotoProfId(null); setKonteksFoto("");}} className="w-full bg-stone-500 text-white px-4 py-2 rounded-md">Batal</button>}</div> </form> </div> <div className="bg-white rounded-xl shadow-md p-6"> <h3 className="font-bold mb-4 border-b pb-2">Daftar Foto Profil</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {dataFotoProfil.slice((pageFotoProf-1)*itemsPerPage, pageFotoProf*itemsPerPage).map(item => ( <div key={item.id} className="bg-slate-50 border rounded-lg flex gap-4 p-3"><img src={(Array.isArray(item.linkGambar) ? item.linkGambar[0] : item.linkGambar) || "https://placehold.co/600x400/e2e8f0/64748b?text=Tanpa+Gambar"} className="w-24 h-24 object-cover rounded-md shrink-0" /> <div className="flex flex-col justify-between w-full"><p className="text-xs text-slate-600">{item.konteks}</p><div className="flex gap-2 self-end"><button onClick={()=>handleEditFotoProfClick(item)} className="text-amber-600 text-xs">Edit</button><button onClick={()=>handleDelete("profil_galeri", item.id)} className="text-red-600 text-xs">Hapus</button></div></div></div> ))} </div> <Pagination totalItems={dataFotoProfil.length} itemsPerPage={itemsPerPage} currentPage={pageFotoProf} setCurrentPage={setPageFotoProf}/> </div> </div> )}
        
        {/* TAB FASILITAS */}
        {activeTab === "fasilitas" && allowedTabs.includes("fasilitas") && ( <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">{editFasilitId ? "Edit Fasilitas" : "Tambah Fasilitas Asrama"}</h2> <form onSubmit={handleSubmitFasilitas} className="space-y-4"> <input type="text" required value={namaFasilitas} onChange={(e) => setNamaFasilitas(e.target.value)} placeholder="Nama Fasilitas..." className="w-full px-4 py-2 border rounded-md" /> <textarea required rows="2" value={deskripsiFasilitas} onChange={(e) => setDeskripsiFasilitas(e.target.value)} placeholder="Deskripsi fasilitas..." className="w-full px-4 py-2 border rounded-md"></textarea> <input type="file" multiple accept="image/*" required={!editFasilitId} onChange={(e) => setFilesFasilitas(Array.from(e.target.files))} className="w-full text-sm border p-2 rounded bg-slate-50" /> <div className="flex gap-2"><button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">{editFasilitId ? "Simpan Perubahan" : "Tambahkan"}</button>{editFasilitId && <button type="button" onClick={()=>{setEditFasilitId(null); setNamaFasilitas(""); setDeskripsiFasilitas("");}} className="w-full bg-stone-500 text-white px-4 py-2 rounded-md">Batal</button>}</div> </form> </div> <div className="bg-white rounded-xl shadow-md p-6"> <h3 className="font-bold mb-4 border-b pb-2">Daftar Fasilitas Asrama</h3> <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {dataFasilitas.slice((pageFasilitas-1)*itemsPerPage, pageFasilitas*itemsPerPage).map(item => ( <div key={item.id} className="bg-slate-50 border rounded-lg flex flex-col overflow-hidden"><img src={(Array.isArray(item.linkGambar) ? item.linkGambar[0] : item.linkGambar) || "https://placehold.co/600x400/e2e8f0/64748b?text=Tanpa+Gambar"} className="w-full h-32 object-cover" /> <div className="p-4 flex flex-col flex-grow"><h4 className="font-bold mb-1">{item.nama}</h4><p className="text-xs text-slate-600 flex-grow">{item.deskripsi}</p><div className="flex gap-2 mt-3"><button onClick={()=>handleEditFasilitasClick(item)} className="bg-amber-100 text-amber-700 text-xs px-3 py-1.5 rounded w-full">Edit</button><button onClick={()=>handleDelete("daftar_fasilitas", item.id)} className="bg-red-600 text-white text-xs px-3 py-1.5 rounded w-full">Hapus</button></div></div></div> ))} </div> <Pagination totalItems={dataFasilitas.length} itemsPerPage={itemsPerPage} currentPage={pageFasilitas} setCurrentPage={setPageFasilitas}/> </div> </div> )}
        
        {/* TAB PENYEWAAN */}
        {activeTab === "penyewaan" && allowedTabs.includes("penyewaan") && ( <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md border-amber-200 p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span>{editSewaId ? "Edit Layanan Penyewaan" : "Tambah Layanan Penyewaan"}</h2> <form onSubmit={handleSubmitPenyewaan} className="space-y-4"> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div><label className="text-sm font-semibold mb-1 block">Nama Layanan / Barang</label><input type="text" required value={namaSewa} onChange={(e) => setNamaSewa(e.target.value)} className="w-full px-4 py-2 border rounded-md" /></div> <div><label className="text-sm font-semibold mb-1 block">Kategori</label><select value={kategoriSewa} onChange={(e) => setKategoriSewa(e.target.value)} className="w-full px-4 py-2 border rounded-md"><option value="Tempat / Barang">Tempat / Barang Fisik</option><option value="Keahlian Seni Budaya">Layanan Jasa & Seni</option></select></div> </div> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <div><label className="text-sm font-semibold mb-1 block">Info Harga Sewa</label><input type="text" required value={hargaSewa} onChange={(e) => setHargaSewa(e.target.value)} className="w-full px-4 py-2 border rounded-md" /></div> <div><label className="text-sm font-semibold mb-1 block">No. WA Reservasi</label><input type="tel" required value={noHpSewa} onChange={(e) => setNoHpSewa(e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-2 border rounded-md" /></div> </div> <textarea required rows="2" value={deskripsiSewa} onChange={(e) => setDeskripsiSewa(e.target.value)} className="w-full px-4 py-2 border rounded-md" placeholder="Deskripsi..."></textarea> <input type="file" multiple accept="image/*" required={!editSewaId} onChange={(e) => setFilesSewa(Array.from(e.target.files))} className="w-full text-sm border p-2 rounded bg-slate-50" /> <div className="flex gap-2"><button type="submit" disabled={loading} className="w-full bg-amber-600 text-white px-4 py-2 rounded-md font-bold">{editSewaId ? "Simpan Perubahan" : "Tambahkan Layanan"}</button>{editSewaId && <button type="button" onClick={()=>{setEditSewaId(null); setNamaSewa(""); setDeskripsiSewa(""); setHargaSewa(""); setNoHpSewa("");}} className="w-full bg-stone-500 text-white px-4 py-2 rounded-md">Batal</button>}</div> </form> </div> <div className="bg-white rounded-xl shadow-md p-6"> <h3 className="font-bold mb-4 border-b pb-2">Daftar Layanan Tersedia</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {dataPenyewaan.slice((pageSewa-1)*itemsPerPage, pageSewa*itemsPerPage).map(item => ( <div key={item.id} className="bg-slate-50 border rounded-lg flex overflow-hidden"><img src={(Array.isArray(item.linkGambar) ? item.linkGambar[0] : item.linkGambar) || "https://placehold.co/600x400/e2e8f0/64748b?text=Tanpa+Gambar"} className="w-32 h-full object-cover shrink-0" /> <div className="p-4 flex flex-col w-full justify-center"><span className="text-[10px] font-bold text-white bg-amber-600 px-2 py-0.5 rounded w-fit mb-1">{item.kategori}</span><h4 className="font-bold text-stone-900">{item.nama}</h4><p className="text-amber-600 text-xs font-bold my-1">{item.noHpSewa}</p><p className="text-xs text-stone-500 line-clamp-2 mb-2">{item.deskripsi}</p><div className="flex gap-3 text-xs font-bold"><button onClick={()=>handleEditSewaClick(item)} className="text-amber-600">Edit</button><button onClick={()=>handleDelete("daftar_penyewaan", item.id)} className="text-red-500">Hapus</button></div></div></div> ))} </div> <Pagination totalItems={dataPenyewaan.length} itemsPerPage={itemsPerPage} currentPage={pageSewa} setCurrentPage={setPageSewa}/> </div> </div> )}
        
        {/* TAB GALERI */}
        {activeTab === "galeri" && allowedTabs.includes("galeri") && ( <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">{editGaleriId ? "Edit Galeri" : "Tambah Galeri Kegiatan"}</h2> <form onSubmit={handleSubmitGaleri} className="space-y-4"> <div> <label className="text-sm font-semibold mb-1 block">Judul Kegiatan</label> <input type="text" required value={judulGaleri} onChange={(e) => setJudulGaleri(e.target.value)} placeholder="Cth: Pagelaran Seni Minang..." className="w-full px-4 py-2 border rounded-md" /> </div> <div> <label className="text-sm font-semibold mb-1 block">Warna Teks Judul pada Foto</label> <input type="color" value={warnaGaleri} onChange={(e) => setWarnaGaleri(e.target.value)} className="h-10 w-24 cursor-pointer border rounded-md p-1" /> </div> <div> <label className="text-sm font-semibold mb-1 block">Pilih Foto (Bisa pilih banyak sekaligus)</label> <input type="file" multiple accept="image/*" required={!editGaleriId} onChange={(e) => setFilesGaleri(Array.from(e.target.files))} className="w-full text-sm border p-2 rounded bg-slate-50 cursor-pointer" /> </div> <div className="flex gap-2 pt-2"> <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2.5 rounded-md font-bold">{editGaleriId ? "Simpan Perubahan" : "Tambahkan ke Galeri"}</button> {editGaleriId && <button type="button" onClick={()=>{setEditGaleriId(null); setJudulGaleri(""); setWarnaGaleri("#ffffff");}} className="w-full bg-stone-500 text-white px-4 py-2.5 rounded-md font-bold">Batal</button>} </div> </form> </div> <div className="bg-white rounded-xl shadow-md p-6"> <h3 className="font-bold mb-4 border-b pb-2">Daftar Foto Galeri</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {dataGaleri.slice((pageGaleri-1)*itemsPerPage, pageGaleri*itemsPerPage).map(item => ( <div key={item.id} className="relative h-40 rounded-lg overflow-hidden border shadow-sm"> <img src={(Array.isArray(item.linkGambar) ? item.linkGambar[0] : item.linkGambar) || "https://placehold.co/600x400/e2e8f0/64748b?text=Tanpa+Gambar"} className="w-full h-full object-cover" alt="Galeri" /> <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-3"> <span className="font-bold text-base mb-2" style={{ color: item.warna }}>{item.judul}</span> <div className="flex gap-2"> <button onClick={()=>handleEditGaleriClick(item)} className="bg-white text-stone-900 text-xs px-3 py-1 rounded font-bold hover:bg-stone-100">Edit</button> <button onClick={()=>handleDelete("fasilitas", item.id)} className="bg-red-600 text-white text-xs px-3 py-1 rounded font-bold hover:bg-red-700">Hapus</button> </div> </div> </div> ))} </div> <Pagination totalItems={dataGaleri.length} itemsPerPage={itemsPerPage} currentPage={pageGaleri} setCurrentPage={setPageGaleri}/> </div> </div> )}
        
        {/* TAB KEHIDUPAN / PUBLIKASI */}
        {activeTab === "kehidupan" && allowedTabs.includes("kehidupan") && ( <div className="space-y-6"> <div className="bg-white rounded-xl shadow-md p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">{editKehidupanId ? "Edit Publikasi" : "Tambah Publikasi Baru"}</h2> <form onSubmit={handleSubmitKehidupan} className="space-y-4"> <input type="text" required value={judulKonten} onChange={(e) => setJudulKonten(e.target.value)} placeholder="Judul Berita..." className="w-full px-4 py-2 border rounded-md" /> <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full px-4 py-2 border rounded-md font-bold"> <option value="PRESTASI">Prestasi</option> <option value="MERSI X BK">MERSI X BK</option> <option value="LOMBA TERBUKA">Lomba Terbuka</option> <option value="LAINNYA">Lainnya... (Isi Manual)</option> </select> {kategori === "LAINNYA" && <input type="text" required value={customKategori} onChange={(e) => setCustomKategori(e.target.value)} placeholder="Tuliskan nama kategori..." className="w-full px-4 py-2 border border-amber-500 bg-amber-50 rounded-md" />} <textarea required rows="4" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Isi Berita..." className="w-full px-4 py-2 border rounded-md"></textarea> <input type="file" multiple accept="image/*" required={!editKehidupanId} onChange={(e) => setFilesGambar(Array.from(e.target.files))} className="w-full text-sm border p-2 rounded bg-slate-50" /> <div className="flex gap-2"><button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">{editKehidupanId ? "Simpan Perubahan" : "Publikasikan"}</button>{editKehidupanId && <button type="button" onClick={()=>{setEditKehidupanId(null); setJudulKonten(""); setDeskripsi("");}} className="w-full bg-stone-500 text-white px-4 py-2 rounded-md">Batal</button>}</div> </form> </div> <div className="bg-white rounded-xl shadow-md p-6"> <h3 className="font-bold mb-4 border-b pb-2">Daftar Publikasi</h3> <div className="space-y-3"> {dataKehidupan.slice((pageKehidupan-1)*itemsPerPage, pageKehidupan*itemsPerPage).map(item => ( <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg"> <div><div className="font-semibold text-sm line-clamp-1">{item.judul} <span className="text-red-600 text-xs">({item.kategori})</span></div><div className="text-xs text-slate-500">{item.tanggal}</div></div> <div className="flex gap-3"><button onClick={()=>handleEditKehidupanClick(item)} className="text-amber-600 text-xs font-bold">Edit</button><button onClick={()=>handleDelete("kehidupan", item.id)} className="text-red-500 text-xs font-bold">Hapus</button></div> </div> ))} </div> <Pagination totalItems={dataKehidupan.length} itemsPerPage={itemsPerPage} currentPage={pageKehidupan} setCurrentPage={setPageKehidupan}/> </div> </div> )}
        
        {/* --- KHUSUS TAB SKRIPSI (DITAMBAH TABEL APPROVAL) --- */}
        {activeTab === "skripsi" && allowedTabs.includes("skripsi") && ( 
          <div className="space-y-6"> 
            
            {/* Tabel Permohonan Akses Skripsi */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-l-amber-500 mb-8">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h2 className="text-lg font-bold text-slate-900">Permohonan Akses Baca Skripsi</h2>
                  <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-bold">Total: {dataPermohonanSkripsi.length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="bg-slate-50 border-y text-slate-600"><th className="p-3">Waktu</th><th className="p-3">Identitas Pemohon</th><th className="p-3">Target Skripsi</th><th className="p-3 text-center">Status & Aksi</th></tr></thead>
                  <tbody className="divide-y">
                    {dataPermohonanSkripsi.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-500">Belum ada permohonan akses.</td></tr> : (
                      dataPermohonanSkripsi.slice((pagePermohonan-1)*itemsPerPage, pagePermohonan*itemsPerPage).map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-3 text-xs">{item.waktu ? new Date(item.waktu.toDate()).toLocaleString('id-ID') : '-'}</td>
                          <td className="p-3">
                            <b>{item.nama}</b><br/>
                            <span className="text-xs text-stone-500">{item.instansi}</span><br/>
                            <span className="text-xs font-semibold text-amber-700">{item.noHp}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-xs font-bold bg-slate-200 px-2 py-0.5 rounded">{item.judulSkripsi}</span><br/>
                            <span className="text-[10px] text-stone-500 italic mt-1 block">Alasan: "{item.tujuan}"</span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex flex-col items-center gap-2">
                              {item.status === "Menunggu" ? (
                                <div className="flex gap-1 justify-center">
                                  <button onClick={() => handleKirimAksesSkripsi(item)} className="bg-green-600 text-white text-[10px] px-2 py-1 rounded font-bold hover:bg-green-700">Setujui & WA</button>
                                  <button onClick={() => handleTolakSkripsi(item)} className="bg-stone-200 text-stone-700 text-[10px] px-2 py-1 rounded font-bold hover:bg-stone-300">Tolak</button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${item.status === 'Disetujui' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.status}</span>
                                  <button onClick={() => handleResetStatusSkripsi(item.id)} className="text-[10px] text-amber-600 hover:text-amber-800 underline font-bold" title="Reset Status">Ubah Status</button>
                                </div>
                              )}
                              <button onClick={() => handleDelete("permohonan_skripsi", item.id)} className="text-red-500 text-[10px] hover:text-red-700 font-bold mt-1">Hapus Data</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination totalItems={dataPermohonanSkripsi.length} itemsPerPage={itemsPerPage} currentPage={pagePermohonan} setCurrentPage={setPagePermohonan}/>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6"> <h2 className="text-lg font-bold mb-4 border-b pb-2">{editSkripsiId ? "Edit Skripsi" : "Tambah Skripsi"}</h2> <form onSubmit={handleSubmitSkripsi} className="space-y-4"> <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama Penulis..." className="w-full px-4 py-2 border rounded-md" /> <input type="text" required value={jurusan} onChange={(e) => setJurusan(e.target.value)} placeholder="Jurusan..." className="w-full px-4 py-2 border rounded-md" /> <textarea required rows="1" value={judulSkripsi} onChange={(e) => setJudulSkripsi(e.target.value)} placeholder="Judul Skripsi..." className="w-full px-4 py-2 border rounded-md"></textarea> <input type="number" required value={tahun} onChange={(e) => setTahun(e.target.value)} placeholder="Tahun..." className="w-full px-4 py-2 border rounded-md" /> <input type="file" accept=".pdf" required={!editSkripsiId} onChange={(e) => setFilePDF(e.target.files[0])} className="w-full text-sm border p-2 rounded bg-slate-50" /> <div className="flex gap-2"><button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">{editSkripsiId ? "Simpan Perubahan" : "Tambahkan"}</button>{editSkripsiId && <button type="button" onClick={()=>{setEditSkripsiId(null); setNama(""); setJurusan(""); setJudulSkripsi(""); setTahun("");}} className="w-full bg-stone-500 text-white px-4 py-2 rounded-md">Batal</button>}</div> </form> </div> <div className="bg-white rounded-xl shadow-md p-6"> <h3 className="font-bold mb-4 border-b pb-2">Kelola Skripsi</h3> <div className="space-y-3"> {dataSkripsi.slice((pageSkripsi-1)*itemsPerPage, pageSkripsi*itemsPerPage).map(item => ( <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg"> <div><div className="font-semibold text-sm">{item.nama} - {item.tahun}</div><div className="text-xs line-clamp-1">{item.judul}</div></div> <div className="flex gap-3"><button onClick={()=>handleEditSkripsiClick(item)} className="text-amber-600 text-xs font-bold">Edit</button><button onClick={()=>handleDelete("skripsi", item.id)} className="text-red-500 text-xs font-bold">Hapus</button></div> </div> ))} </div> <Pagination totalItems={dataSkripsi.length} itemsPerPage={itemsPerPage} currentPage={pageSkripsi} setCurrentPage={setPageSkripsi}/> </div> </div> )}
        
        {/* --- TAB SUARA ALUMNI (DIUBAH JADI PANGKALAN DATA ALUMNI LENGKAP) --- */}
        {activeTab === "suara_alumni" && allowedTabs.includes("suara_alumni") && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold mb-4 border-b pb-2">{editPesanId ? "Edit Data Alumni" : "Tambah Data Alumni Baru"}</h2>
              <form onSubmit={handleSubmitPesanAlumni} className="space-y-4">
                
                {/* Baris 1: Nama & Asal Daerah */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Nama Lengkap</label>
                    <input type="text" required value={formAlumni.nama} onChange={(e) => setFormAlumni({...formAlumni, nama: e.target.value})} placeholder="Nama Alumni..." className="w-full px-4 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Asal Daerah / Kota</label>
                    <input type="text" required value={formAlumni.asal} onChange={(e) => setFormAlumni({...formAlumni, asal: e.target.value})} placeholder="Contoh: Padang, Bukittinggi..." className="w-full px-4 py-2 border rounded-md" />
                  </div>
                </div>

                {/* Baris 2: Kuliah & Jurusan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Kampus / Universitas</label>
                    <input type="text" required value={formAlumni.kuliah} onChange={(e) => setFormAlumni({...formAlumni, kuliah: e.target.value})} placeholder="Contoh: UNY, UGM, UIN..." className="w-full px-4 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Program Studi / Jurusan</label>
                    <input type="text" required value={formAlumni.jurusan} onChange={(e) => setFormAlumni({...formAlumni, jurusan: e.target.value})} placeholder="Contoh: Teknik Elektro..." className="w-full px-4 py-2 border rounded-md" />
                  </div>
                </div>

                {/* Baris 3: Tahun Masuk Asrama & Pekerjaan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Tahun Masuk Asrama (Angkatan)</label>
                    <input type="number" required value={formAlumni.angkatanAsrama} onChange={(e) => setFormAlumni({...formAlumni, angkatanAsrama: e.target.value})} placeholder="Contoh: 2018" className="w-full px-4 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Pekerjaan Saat Ini</label>
                    <input type="text" required value={formAlumni.pekerjaan} onChange={(e) => setFormAlumni({...formAlumni, pekerjaan: e.target.value})} placeholder="Contoh: Guru, Engineer, PNS..." className="w-full px-4 py-2 border rounded-md" />
                  </div>
                </div>

                {/* Baris 4: Judul Skripsi */}
                <div>
                  <label className="text-sm font-semibold mb-1 block">Judul Skripsi (Opsional)</label>
                  <textarea rows="2" value={formAlumni.skripsi} onChange={(e) => setFormAlumni({...formAlumni, skripsi: e.target.value})} placeholder="Judul Skripsi alumni saat lulus..." className="w-full px-4 py-2 border rounded-md"></textarea>
                </div>

                {/* Baris 5: Kesan Pesan */}
                <div>
                  <label className="text-sm font-semibold mb-1 block">Kata-kata / Kesan Pesan untuk Asrama</label>
                  <textarea required rows="3" value={formAlumni.pesan} onChange={(e) => setFormAlumni({...formAlumni, pesan: e.target.value})} placeholder="Kesan dan pesan singkat..." className="w-full px-4 py-2 border rounded-md"></textarea>
                </div>

                {/* Foto */}
                <div>
                  <label className="text-sm font-semibold mb-1 block">Foto Profil (Opsional jika sudah ada)</label>
                  <input type="file" id="fotoAlumni" accept="image/*" onChange={(e) => setFileFotoAlumni(e.target.files[0])} className="w-full text-sm border p-2 rounded bg-slate-50" />
                </div>

                <div className="flex gap-2">
                  <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">{editPesanId ? "Simpan Perubahan Data" : "Tambahkan ke Database"}</button>
                  {editPesanId && <button type="button" onClick={() => { setEditPesanId(null); setFormAlumni({ nama: "", asal: "", kuliah: "", jurusan: "", angkatanAsrama: "", pekerjaan: "", skripsi: "", pesan: "" }); setFileFotoAlumni(null); }} className="w-full bg-stone-500 text-white px-4 py-2 rounded-md">Batal</button>}
                </div>
              </form>
            </div>
            
            {/* Tabel Daftar Alumni */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-l-stone-800">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="font-bold text-lg text-slate-900">Database Alumni Asrama</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Total: {dataPesanAlumni.length}</span>
              </div>

              {dataPesanAlumni.length === 0 ? (
                <p className="text-sm text-stone-500 italic text-center py-8">Belum ada data alumni yang ditambahkan.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 border-y text-slate-600">
                        <th className="p-3">Profil</th>
                        <th className="p-3">Akademik</th>
                        <th className="p-3">Angkatan & Asal</th>
                        <th className="p-3">Pekerjaan</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {dataPesanAlumni.slice((pagePesanAlumni - 1) * itemsPerPage, pagePesanAlumni * itemsPerPage).map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-3 flex items-center gap-3">
                            <img src={item.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nama)}&background=991b1b&color=fff`} className="w-10 h-10 object-cover rounded-full border border-slate-200" alt="Profil" />
                            <div className="font-bold text-stone-900">{item.nama}</div>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold">{item.kuliah}</span><br/>
                            <span className="text-[10px] text-stone-500">{item.jurusan}</span>
                          </td>
                          <td className="p-3">
                            <span className="bg-stone-200 px-2 py-0.5 rounded text-xs font-bold">{item.angkatanAsrama}</span><br/>
                            <span className="text-[10px] text-stone-500">{item.asal}</span>
                          </td>
                          <td className="p-3 text-xs">{item.pekerjaan}</td>
                          <td className="p-3 text-center">
                            <div className="flex flex-col gap-1">
                              <button onClick={() => handleEditPesanClick(item)} className="text-amber-600 text-xs font-bold hover:underline">Edit</button>
                              <button onClick={() => handleDelete("pesan_alumni", item.id)} className="text-red-500 text-[10px] hover:underline">Hapus</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination totalItems={dataPesanAlumni.length} itemsPerPage={itemsPerPage} currentPage={pagePesanAlumni} setCurrentPage={setPagePesanAlumni} />
            </div>
          </div>
        )}

        {/* TAB LOG DATA */}
        {activeTab === "log" && allowedTabs.includes("log") && ( 
          <div className="space-y-6"> 
            
            {(role === "sekre" || role === "humas") && (
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-l-green-600"> 
                <div className="flex justify-between items-center mb-4 border-b pb-2"><h2 className="text-lg font-bold text-slate-900">Data Pendaftar Warga Asrama Baru</h2><span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Total: {dataPendaftarAsrama.length}</span></div> 
                <div className="overflow-x-auto"> 
                  <table className="w-full text-left text-sm"> 
                    <thead><tr className="bg-slate-50 border-y text-slate-600"><th className="p-3">Waktu Daftar</th><th className="p-3">Identitas & Kontak</th><th className="p-3">Dokumen</th><th className="p-3 text-center">Aksi</th></tr></thead> 
                    <tbody className="divide-y"> 
                      {dataPendaftarAsrama.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-500">Belum ada calon warga.</td></tr> : ( 
                        dataPendaftarAsrama.slice((pageDaftarAsrama-1)*itemsPerPage, pageDaftarAsrama*itemsPerPage).map(item => ( 
                          <tr key={item.id}><td className="p-3 text-xs">{item.waktuDaftar ? new Date(item.waktuDaftar.toDate()).toLocaleString('id-ID') : '-'}</td><td className="p-3"><b>{item.nama}</b><br/><span className="text-xs text-stone-500">{item.noHp} | {item.email}</span></td><td className="p-3"><div className="flex flex-wrap gap-2 text-[10px] font-bold mt-1">{item.urlFormulir && <a href={item.urlFormulir} target="_blank" className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Formulir</a>}{item.urlFoto && <a href={item.urlFoto} target="_blank" className="bg-amber-100 text-amber-700 px-2 py-1 rounded">Foto</a>}{item.urlKtp && <a href={item.urlKtp} target="_blank" className="bg-green-100 text-green-700 px-2 py-1 rounded">KTP</a>}</div></td><td className="p-3 text-center"><button onClick={() => handleDelete("pendaftaran_asrama", item.id)} className="text-red-500 text-xs font-bold">Hapus</button></td></tr> 
                        )) 
                      )} 
                    </tbody> 
                  </table> 
                </div> 
                <Pagination totalItems={dataPendaftarAsrama.length} itemsPerPage={itemsPerPage} currentPage={pageDaftarAsrama} setCurrentPage={setPageDaftarAsrama}/>
              </div> 
            )}

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

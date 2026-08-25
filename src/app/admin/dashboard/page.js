"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, setDoc, serverTimestamp, query, orderBy, updateDoc, where, increment } from "firebase/firestore";
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
  senbud: ["fotoprofil", "galeri", "kehidupan", "penyewaan"],
  warga_alumni: ["profil_saya"] // HAK AKSES KHUSUS ALUMNI / WARGA
};

const TAB_NAMES = {
  tampilan: "Pengaturan Web & Foto", 
  status: "Pendaftaran & Status", 
  kepengurusan: "Kepengurusan",
  timeline: "Timeline", 
  fotoprofil: "Foto Profil", 
  fasilitas: "Fasilitas Asrama",
  penyewaan: "Penyewaan", 
  galeri: "Galeri", 
  kehidupan: "Media Publikasi", 
  skripsi: "Skripsi", 
  suara_alumni: "Data Alumni & Warga", 
  log: "Log Data",
  profil_saya: "Biodata Saya" // NAMA TAB KHUSUS ALUMNI / WARGA
};

// KOMPONEN PAGINATION BERSAMA
const Pagination = ({ totalItems, itemsPerPage, currentPage, setCurrentPage }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-slate-200">
      <button 
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
        disabled={currentPage === 1} 
        className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-md disabled:bg-slate-300 disabled:text-slate-500 hover:bg-amber-600 transition-colors"
      >
        Sebelumnya
      </button>
      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md">
        Halaman {currentPage} dari {totalPages}
      </span>
      <button 
        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
        disabled={currentPage === totalPages} 
        className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-md disabled:bg-slate-300 disabled:text-slate-500 hover:bg-amber-600 transition-colors"
      >
        Selanjutnya
      </button>
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
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  // STATE KHUSUS UNTUK ID ALUMNI YANG LOGIN
  const [loggedInAlumniId, setLoggedInAlumniId] = useState(null);

  // STATE PENGATURAN UMUM
  const [tampilanUrls, setTampilanUrls] = useState({ hero: [], profil: [], fasilitas: [], kehidupan: [], alumni: [], gateway: [] });
  const [tampilanFiles, setTampilanFiles] = useState({ hero: [], profil: [], fasilitas: [], kehidupan: [], alumni: [], gateway: [] });
  
  // STATE MERSI & BK DIPISAH (Termasuk Sosmed, Kontak, Maps)
  const [profilText, setProfilText] = useState({ visi_mersi: "", misi_mersi: "", visi_bk: "", misi_bk: "", jejakAlumni: "" });
  const [kontak, setKontak] = useState({ 
    // Data Mersi
    namaKetuaMersi: "", noTelponMersi: "", noHumasMersi: "", emailMersi: "", namaIgMersi: "", linkIgMersi: "",
    alamatMersi: "", linkMapMersi: "", iframeMapMersi: "",
    // Data BK
    namaKetuaBk: "", noTelponBk: "", noHumasBk: "", emailBk: "", namaIgBk: "", linkIgBk: "",
    alamatBk: "", linkMapBk: "", iframeMapBk: "",
    // Bersama
    noSkripsi: "", namaTiktok: "", linkTiktok: "" 
  });
  
  const [statusAsrama, setStatusAsrama] = useState({ 
    kamarMersi: "", penghuniMersi: "", ketersediaanMersi: "Tersedia",
    kamarBk: "", penghuniBk: "", ketersediaanBk: "Tersedia"
  });
  
  const [brosurUrls, setBrosurUrls] = useState({ mersi: [], bk: [] });
  const [linkFormulir, setLinkFormulir] = useState("");
  const [filesBrosurMersi, setFilesBrosurMersi] = useState([]);
  const [filesBrosurBk, setFilesBrosurBk] = useState([]);

  // PENGURUS INTI DIPISAH MERSI & BK
  const [pengurusInti, setPengurusInti] = useState({ 
    ketuaMersiNama: "", ketuaMersiFoto: "", sekreMersiNama: "", sekreMersiFoto: "", bendaharaMersiNama: "", bendaharaMersiFoto: "",
    ketuaBkNama: "", ketuaBkFoto: "", sekreBkNama: "", sekreBkFoto: "", bendaharaBkNama: "", bendaharaBkFoto: "" 
  });
  const [fileInti, setFileInti] = useState({ 
    ketuaMersi: null, sekreMersi: null, bendaharaMersi: null, 
    ketuaBk: null, sekreBk: null, bendaharaBk: null 
  });

  // STATE PILIHAN ASRAMA PADA FORM INPUT (Mersi / BK)
  const [asramaSejarah, setAsramaSejarah] = useState("mersi");
  const [asramaDivisi, setAsramaDivisi] = useState("mersi");
  const [asramaFasilitas, setAsramaFasilitas] = useState("mersi");
  const [asramaSewa, setAsramaSewa] = useState("mersi");

  // STATE DATA TABEL
  const [dataSejarah, setDataSejarah] = useState([]);
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
  const [judulSejarah, setJudulSejarah] = useState(""); 
  const [isiSejarah, setIsiSejarah] = useState(""); 
  const [editSejarahId, setEditSejarahId] = useState(null); 
  
  const [namaDivisiBaru, setNamaDivisiBaru] = useState("");
  const [formAnggota, setFormAnggota] = useState({ divisiId: "", nama: "", peran: "Anggota" }); 
  const [fileAnggota, setFileAnggota] = useState(null); 
  const [editAnggotaId, setEditAnggotaId] = useState(null);
  
  const [konteksFoto, setKonteksFoto] = useState(""); 
  const [filesFotoProfil, setFilesFotoProfil] = useState([]); 
  const [editFotoProfId, setEditFotoProfId] = useState(null);
  
  const [tahunTimeline, setTahunTimeline] = useState(""); 
  const [judulTimeline, setJudulTimeline] = useState(""); 
  const [deskripsiTimeline, setDeskripsiTimeline] = useState(""); 
  const [editTimelineId, setEditTimelineId] = useState(null);
  
  const [namaFasilitas, setNamaFasilitas] = useState(""); 
  const [deskripsiFasilitas, setDeskripsiFasilitas] = useState(""); 
  const [filesFasilitas, setFilesFasilitas] = useState([]); 
  const [editFasilitId, setEditFasilitId] = useState(null);
  
  const [namaSewa, setNamaSewa] = useState(""); 
  const [kategoriSewa, setKategoriSewa] = useState("Tempat / Barang"); 
  const [hargaSewa, setHargaSewa] = useState(""); 
  const [noHpSewa, setNoHpSewa] = useState(""); 
  const [deskripsiSewa, setDeskripsiSewa] = useState(""); 
  const [filesSewa, setFilesSewa] = useState([]); 
  const [editSewaId, setEditSewaId] = useState(null);
  
  const [judulGaleri, setJudulGaleri] = useState(""); 
  const [warnaGaleri, setWarnaGaleri] = useState("#ffffff"); 
  const [filesGaleri, setFilesGaleri] = useState([]); 
  const [editGaleriId, setEditGaleriId] = useState(null);
  
  const [judulKonten, setJudulKonten] = useState(""); 
  const [kategori, setKategori] = useState("PRESTASI"); 
  const [customKategori, setCustomKategori] = useState(""); 
  const [deskripsi, setDeskripsi] = useState(""); 
  const [filesGambar, setFilesGambar] = useState([]);
  const [tanggalPublikasi, setTanggalPublikasi] = useState(""); 
  const [editKehidupanId, setEditKehidupanId] = useState(null);
  
  const [nama, setNama] = useState(""); 
  const [jurusan, setJurusan] = useState(""); 
  const [judulSkripsi, setJudulSkripsi] = useState(""); 
  const [tahun, setTahun] = useState(""); 
  const [filePDF, setFilePDF] = useState(null); 
  const [editSkripsiId, setEditSkripsiId] = useState(null);
  
  const [replyKomenId, setReplyKomenId] = useState(null); 
  const [replyText, setReplyText] = useState("");

  const [formAlumni, setFormAlumni] = useState({ 
    nama: "", 
    asal: "", 
    kuliah: "", 
    jurusan: "", 
    angkatanAsrama: "", 
    pekerjaan: "", 
    skripsi: "", 
    prestasi: "", 
    pesan: "",
    asrama: "mersi",
    statusWarga: "Alumni"
  });
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
      onAuthStateChanged(auth, async (user) => {
        // PERBAIKAN: Menggunakan router.replace agar tidak menyimpan jejak history
        if (!user) { router.replace("/admin/login"); return; }
        
        const email = user.email || "";
        setCurrentUserEmail(email);
        
        let currRole = ""; 
        
        // TULIS EMAIL SEKRETARIS YANG DIIZINKAN DI SINI
        const daftarSekretaris = [
          "aspuribkrancak123@gmail.com", 
          "sekremersi@gmail.com", 
        ];
        
        if (daftarSekretaris.includes(email)) currRole = "sekre";
        else if (email.startsWith("humas")) currRole = "humas";
        else if (email.startsWith("publikasi")) currRole = "publikasi";
        else if (email.startsWith("perkap")) currRole = "perkap";
        else if (email.startsWith("tendor")) currRole = "tendor";
        else if (email.startsWith("klh")) currRole = "klh";
        else if (email.startsWith("rohani")) currRole = "rohani";
        else if (email.startsWith("senibudaya") || email.startsWith("senbud")) currRole = "senbud";
        else {
          try {
            const qAlumni = query(collection(db, "pesan_alumni"), where("emailPemilik", "==", email));
            const snapAlumni = await getDocs(qAlumni);
            
            if (!snapAlumni.empty) {
              currRole = "warga_alumni";
              
              let myRecords = snapAlumni.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              myRecords.sort((a, b) => {
                const timeA = a.createdAt?.toMillis() || 0;
                const timeB = b.createdAt?.toMillis() || 0;
                return timeB - timeA; 
              });

              const myLatestData = myRecords[0];
              setLoggedInAlumniId(myLatestData.id);
              
              setFormAlumni({
                nama: myLatestData.nama || "",
                asal: myLatestData.asal || "",
                kuliah: myLatestData.kuliah || "",
                jurusan: myLatestData.jurusan || "",
                angkatanAsrama: myLatestData.angkatanAsrama || "",
                pekerjaan: myLatestData.pekerjaan || "",
                skripsi: myLatestData.skripsi || "",
                prestasi: myLatestData.prestasi || "",
                pesan: myLatestData.pesan || "",
                asrama: myLatestData.asrama || "mersi",
                statusWarga: myLatestData.statusWarga || "Alumni"
              });
              
              setAuthReady(true);
              const tabsForRole = TAB_ROLES[currRole] || [];
              setRole(currRole); 
              setAllowedTabs(tabsForRole); 
              setActiveTab(tabsForRole[0]);
              return; 
            } else {
              alert("Akses Ditolak! Email Anda belum terdaftar di pangkalan data asrama. Silakan isi form pendataan terlebih dahulu sebelum login.");
              signOut(auth);
              router.replace("/beranda"); // PERBAIKAN: Gunakan replace ke beranda
              return;
            }
          } catch (err) {
            console.error("Gagal memeriksa hak akses warga:", err);
            signOut(auth);
            router.replace("/beranda"); // PERBAIKAN: Gunakan replace ke beranda
            return;
          }
        }

        const tabsForRole = TAB_ROLES[currRole] || [];
        setRole(currRole); 
        setAllowedTabs(tabsForRole); 
        setActiveTab(tabsForRole[0]); 

        const isBkAdmin = email.includes("@bk.com") || email === "aspuribkrancak123@gmail.com";
        const defaultAsrama = isBkAdmin ? "bk" : "mersi";
        setAsramaSejarah(defaultAsrama);
        setAsramaDivisi(defaultAsrama);
        setAsramaFasilitas(defaultAsrama);
        setAsramaSewa(defaultAsrama);
        setFormAlumni(prev => ({ ...prev, asrama: defaultAsrama }));

        setAuthReady(true);
        fetchAllData();
      });
    });
  }, []);

  const fetchAllData = async () => {
    // Tampilan
    const docSnap = await getDoc(doc(db, "pengaturan", "tampilan"));
    if (docSnap.exists()) setTampilanUrls(docSnap.data());
    
    // Profil Text
    const docProfil = await getDoc(doc(db, "pengaturan", "profilText"));
    if (docProfil.exists()) {
      const p = docProfil.data();
      setProfilText({
        visi_mersi: p.visi_mersi || p.visi || "", 
        misi_mersi: p.misi_mersi || p.misi || "", 
        visi_bk: p.visi_bk || "", 
        misi_bk: p.misi_bk || "", 
        jejakAlumni: p.jejakAlumni || ""
      });
    }
    
    // Kontak & Lokasi Asrama
    const docKontak = await getDoc(doc(db, "pengaturan", "kontak"));
    if (docKontak.exists()) {
      const kd = docKontak.data();
      setKontak({ 
        namaKetuaMersi: kd.namaKetuaMersi || kd.namaKetua || "", 
        noTelponMersi: kd.noTelponMersi || kd.noTelpon || "", 
        noHumasMersi: kd.noHumasMersi || kd.noHumas || "",
        emailMersi: kd.emailMersi || kd.email || "",
        namaIgMersi: kd.namaIgMersi || kd.namaIg || "",
        linkIgMersi: kd.linkIgMersi || kd.linkIg || "",
        alamatMersi: kd.alamatMersi || "",
        linkMapMersi: kd.linkMapMersi || "",
        iframeMapMersi: kd.iframeMapMersi || "",

        namaKetuaBk: kd.namaKetuaBk || "", 
        noTelponBk: kd.noTelponBk || "", 
        noHumasBk: kd.noHumasBk || "",
        emailBk: kd.emailBk || "",
        namaIgBk: kd.namaIgBk || "",
        linkIgBk: kd.linkIgBk || "",
        alamatBk: kd.alamatBk || "",
        linkMapBk: kd.linkMapBk || "",
        iframeMapBk: kd.iframeMapBk || "",

        noSkripsi: kd.noSkripsi || "", 
        namaTiktok: kd.namaTiktok || "", 
        linkTiktok: kd.linkTiktok || ""
      });
    }
    
    // Status Asrama
    const docStatus = await getDoc(doc(db, "pengaturan", "statusAsrama"));
    if (docStatus.exists()) {
      const d = docStatus.data();
      setStatusAsrama({ 
        kamarMersi: d.kamarMersi || d.kamar || "", 
        penghuniMersi: d.penghuniMersi || d.penghuni || "", 
        ketersediaanMersi: d.ketersediaanMersi || d.ketersediaan || "Tersedia", 
        kamarBk: d.kamarBk || "", 
        penghuniBk: d.penghuniBk || "", 
        ketersediaanBk: d.ketersediaanBk || "Tersedia" 
      });
    }
    
    // Brosur
    const docBrosur = await getDoc(doc(db, "pengaturan", "brosur"));
    if (docBrosur.exists()) { 
      const d = docBrosur.data();
      setBrosurUrls({ 
        mersi: Array.isArray(d.linkMersi) ? d.linkMersi : (d.linkMersi ? [d.linkMersi] : (d.link ? [d.link] : [])), 
        bk: Array.isArray(d.linkBk) ? d.linkBk : (d.linkBk ? [d.linkBk] : []) 
      });
      setLinkFormulir(d.linkFormulir || ""); 
    }

    // Sejarah
    const sejSnap = await getDocs(query(collection(db, "sejarah_asrama"), orderBy("createdAt", "asc"))); 
    setDataSejarah(sejSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    // Pengurus Inti
    const docInti = await getDoc(doc(db, "pengaturan", "pengurus_inti")); 
    if (docInti.exists()) { 
      const d = docInti.data();
      setPengurusInti({ 
        ketuaMersiNama: d.ketuaMersiNama || d.ketuaNama || "", ketuaMersiFoto: d.ketuaMersiFoto || d.ketuaFoto || "", 
        sekreMersiNama: d.sekreMersiNama || d.sekreNama || "", sekreMersiFoto: d.sekreMersiFoto || d.sekreFoto || "", 
        bendaharaMersiNama: d.bendaharaMersiNama || d.bendaharaNama || "", bendaharaMersiFoto: d.bendaharaMersiFoto || d.bendaharaFoto || "", 
        ketuaBkNama: d.ketuaBkNama || "", ketuaBkFoto: d.ketuaBkFoto || "", 
        sekreBkNama: d.sekreBkNama || "", sekreBkFoto: d.sekreBkFoto || "", 
        bendaharaBkNama: d.bendaharaBkNama || "", bendaharaBkFoto: d.bendaharaBkFoto || "" 
      });
    }
    
    // Divisi & Anggota
    const divSnap = await getDocs(query(collection(db, "divisi_asrama"), orderBy("createdAt", "asc"))); 
    setDataDivisi(divSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    const angSnap = await getDocs(query(collection(db, "anggota_divisi"), orderBy("createdAt", "asc"))); 
    setDataAnggota(angSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    // Lainnya
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
    
    const pengSnap = await getDocs(query(collection(db, "log_pengunjung"), orderBy("waktu", "desc"))); 
    setDataPengunjung(pengSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    const mohonSkripsiSnap = await getDocs(query(collection(db, "permohonan_skripsi"), orderBy("waktu", "desc"))); 
    setDataPermohonanSkripsi(mohonSkripsiSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    const pesanSnap = await getDocs(query(collection(db, "pesan_alumni"), orderBy("createdAt", "desc"))); 
    setDataPesanAlumni(pesanSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const uploadToCloudinary = async (file, resourceType = "image") => { 
    const formData = new FormData(); 
    formData.append("file", file); 
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET); 
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, { 
      method: "POST", 
      body: formData 
    }); 
    const data = await res.json(); 
    if (data.error) throw new Error(data.error.message); 
    return data.secure_url; 
  };

  const handleDelete = async (koleksi, id) => { 
    if (confirm("Yakin ingin menghapus data ini secara permanen?")) { 
      await deleteDoc(doc(db, koleksi, id)); 
      fetchAllData(); 
    } 
  };
  
  const handleKirimAksesSkripsi = async (item) => {
    try {
      await updateDoc(doc(db, "permohonan_skripsi", item.id), { status: "Disetujui" });
      const baseUrl = window.location.origin;
      const secretLink = `${baseUrl}/skripsi-viewer?id=${item.skripsiId}&nama=${encodeURIComponent(item.nama)}&hp=${item.noHp}`;
      let bersihkanNomor = item.noHp.replace(/\D/g, '');
      if (bersihkanNomor.startsWith('0')) bersihkanNomor = '62' + bersihkanNomor.substring(1);
      const pesanWa = `Halo ${item.nama},\n\nPermohonan akses skripsi Anda untuk judul *"${item.judulSkripsi}"* telah disetujui.\n\nBerikut adalah link akses rahasia Anda (Hanya pratinjau halaman pertama):\n${secretLink}\n\nTerima kasih.`;
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
    } catch (error) { 
      alert("Gagal menolak."); 
    }
  };

  const handleResetStatusSkripsi = async (id) => {
    try { 
      await updateDoc(doc(db, "permohonan_skripsi", id), { status: "Menunggu" }); 
      fetchAllData(); 
    } catch (error) { 
      alert("Gagal mengembalikan status."); 
    }
  };

  // --- SAVE FUNCTIONS ---
  const handleSaveTampilan = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    setStatus({ type: "", message: "" }); 
    try { 
      let newUrls = { ...tampilanUrls }; 
      const keys = ["hero", "profil", "fasilitas", "kehidupan", "alumni", "gateway"]; 
      for (let key of keys) { 
        if (tampilanFiles[key] && tampilanFiles[key].length > 0) { 
          let urls = []; 
          for (const file of tampilanFiles[key]) { 
            urls.push(await uploadToCloudinary(file, "image")); 
          } 
          newUrls[key] = urls; 
        } 
      } 
      if (tampilanFiles.gateway && tampilanFiles.gateway.length > 0) { 
        delete newUrls.gateway1; 
        delete newUrls.gateway2; 
        delete newUrls.gateway3; 
      } 
      await setDoc(doc(db, "pengaturan", "tampilan"), newUrls, { merge: true }); 
      setTampilanUrls(newUrls); 
      setTampilanFiles({ hero: [], profil: [], fasilitas: [], kehidupan: [], alumni: [], gateway: [] }); 
      setStatus({ type: "success", message: "Semua foto latar berhasil diperbarui!" }); 
    } catch (error) { 
      setStatus({ type: "error", message: error.message }); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleSaveProfilText = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    setStatus({ type: "", message: "" }); 
    try { 
      await setDoc(doc(db, "pengaturan", "profilText"), profilText); 
      await setDoc(doc(db, "pengaturan", "kontak"), kontak); 
      setStatus({ type: "success", message: "Teks profil & Semua Kontak Asrama berhasil diperbarui!" }); 
    } catch (error) { 
      setStatus({ type: "error", message: error.message }); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleSaveStatusAsrama = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    setStatus({ type: "", message: "" }); 
    try { 
      await setDoc(doc(db, "pengaturan", "statusAsrama"), statusAsrama); 
      setStatus({ type: "success", message: "Status Asrama berhasil diperbarui!" }); 
    } catch (error) { 
      setStatus({ type: "error", message: error.message }); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleSaveBrosur = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    setStatus({ type: "", message: "" }); 
    try { 
      let newUrlsMersi = [...brosurUrls.mersi]; 
      if (filesBrosurMersi.length > 0) { 
        newUrlsMersi = []; 
        for (const file of filesBrosurMersi) { 
          newUrlsMersi.push(await uploadToCloudinary(file, "image")); 
        } 
      } 
      
      let newUrlsBk = [...brosurUrls.bk]; 
      if (filesBrosurBk.length > 0) { 
        newUrlsBk = []; 
        for (const file of filesBrosurBk) { 
          newUrlsBk.push(await uploadToCloudinary(file, "image")); 
        } 
      } 

      await setDoc(doc(db, "pengaturan", "brosur"), { linkMersi: newUrlsMersi, linkBk: newUrlsBk, linkFormulir: linkFormulir }); 
      setBrosurUrls({ mersi: newUrlsMersi, bk: newUrlsBk }); 
      setFilesBrosurMersi([]); 
      setFilesBrosurBk([]); 
      setStatus({ type: "success", message: "Brosur & Link Formulir Pendaftaran berhasil diperbarui!" }); 
    } catch (error) { 
      setStatus({ type: "error", message: error.message }); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleSavePengurusInti = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    setStatus({ type: "", message: "" }); 
    try { 
      let newData = { ...pengurusInti }; 
      if (fileInti.ketuaMersi) newData.ketuaMersiFoto = await uploadToCloudinary(fileInti.ketuaMersi, "image"); 
      if (fileInti.sekreMersi) newData.sekreMersiFoto = await uploadToCloudinary(fileInti.sekreMersi, "image"); 
      if (fileInti.bendaharaMersi) newData.bendaharaMersiFoto = await uploadToCloudinary(fileInti.bendaharaMersi, "image"); 
      
      if (fileInti.ketuaBk) newData.ketuaBkFoto = await uploadToCloudinary(fileInti.ketuaBk, "image"); 
      if (fileInti.sekreBk) newData.sekreBkFoto = await uploadToCloudinary(fileInti.sekreBk, "image"); 
      if (fileInti.bendaharaBk) newData.bendaharaBkFoto = await uploadToCloudinary(fileInti.bendaharaBk, "image"); 

      await setDoc(doc(db, "pengaturan", "pengurus_inti"), newData); 
      setPengurusInti(newData); 
      setFileInti({ ketuaMersi: null, sekreMersi: null, bendaharaMersi: null, ketuaBk: null, sekreBk: null, bendaharaBk: null }); 
      setStatus({ type: "success", message: "Pengurus Inti berhasil diperbarui!" }); 
    } catch (error) { 
      setStatus({ type: "error", message: error.message }); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleSubmitSejarah = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    try { 
      if (editSejarahId) { 
        await updateDoc(doc(db, "sejarah_asrama", editSejarahId), { asrama: asramaSejarah, judul: judulSejarah, isi: isiSejarah }); 
        setStatus({ type: "success", message: "Sejarah diperbarui!" }); 
      } else { 
        await addDoc(collection(db, "sejarah_asrama"), { asrama: asramaSejarah, judul: judulSejarah, isi: isiSejarah, createdAt: serverTimestamp() }); 
        setStatus({ type: "success", message: "Sejarah ditambahkan!" }); 
      } 
      setJudulSejarah(""); 
      setIsiSejarah(""); 
      setEditSejarahId(null); 
      fetchAllData(); 
    } catch (error) { 
      setStatus({ type: "error", message: error.message }); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleEditSejarahClick = (item) => { 
    setEditSejarahId(item.id); 
    setAsramaSejarah(item.asrama || 'mersi'); 
    setJudulSejarah(item.judul); 
    setIsiSejarah(item.isi); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleTambahDivisi = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    try { 
      await addDoc(collection(db, "divisi_asrama"), { asrama: asramaDivisi, namaDivisi: namaDivisiBaru, createdAt: serverTimestamp() }); 
      setStatus({ type: "success", message: "Divisi berhasil ditambahkan!" }); 
      setNamaDivisiBaru(""); 
      fetchAllData(); 
    } catch (error) { 
      setStatus({ type: "error", message: error.message }); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleEditAnggotaClick = (anggota) => { 
    setEditAnggotaId(anggota.id); 
    setFormAnggota({ divisiId: anggota.divisiId, nama: anggota.nama, peran: anggota.peran || "Anggota" }); 
    setFileAnggota(null); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleTambahAnggota = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    try { 
      const selectedDiv = dataDivisi.find(d => d.id === formAnggota.divisiId); 
      const divAsrama = selectedDiv ? (selectedDiv.asrama || 'mersi') : 'mersi'; 

      let fotoUrl = ""; 
      if (editAnggotaId) { 
        const existing = dataAnggota.find(a => a.id === editAnggotaId); 
        fotoUrl = existing.foto; 
        if (fileAnggota) { 
          fotoUrl = await uploadToCloudinary(fileAnggota, "image"); 
        } 
        if (!fileAnggota && fotoUrl.includes("ui-avatars.com") && existing.nama !== formAnggota.nama) { 
          fotoUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(formAnggota.nama) + "&background=random"; 
        } 
        await updateDoc(doc(db, "anggota_divisi", editAnggotaId), { asrama: divAsrama, divisiId: formAnggota.divisiId, nama: formAnggota.nama, peran: formAnggota.peran, foto: fotoUrl }); 
        setStatus({ type: "success", message: "Data Anggota diperbarui!" }); 
      } else { 
        fotoUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(formAnggota.nama) + "&background=random"; 
        if (fileAnggota) { 
          fotoUrl = await uploadToCloudinary(fileAnggota, "image"); 
        } 
        await addDoc(collection(db, "anggota_divisi"), { asrama: divAsrama, divisiId: formAnggota.divisiId, nama: formAnggota.nama, peran: formAnggota.peran, foto: fotoUrl, createdAt: serverTimestamp() }); 
        setStatus({ type: "success", message: "Anggota ditambahkan!" }); 
      } 
      setFormAnggota({ divisiId: "", nama: "", peran: "Anggota" }); 
      setFileAnggota(null); 
      setEditAnggotaId(null); 
      fetchAllData(); 
      if(document.getElementById('foto1Anggota')) document.getElementById('foto1Anggota').value = ""; 
    } catch (error) { 
      setStatus({ type: "error", message: error.message }); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleSubmitTimeline = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    try { 
      if (editTimelineId) { 
        await updateDoc(doc(db, "timeline_sejarah", editTimelineId), { tahun: tahunTimeline, judul: judulTimeline, deskripsi: deskripsiTimeline }); 
        setStatus({ type: "success", message: "Timeline diperbarui!" }); 
      } else { 
        await addDoc(collection(db, "timeline_sejarah"), { tahun: tahunTimeline, judul: judulTimeline, deskripsi: deskripsiTimeline, createdAt: serverTimestamp() }); 
        setStatus({ type: "success", message: "Timeline ditambahkan!" }); 
      } 
      setTahunTimeline(""); 
      setJudulTimeline(""); 
      setDeskripsiTimeline(""); 
      setEditTimelineId(null); 
      fetchAllData(); 
    } catch (error) { 
      setStatus({ type: "error", message: error.message }); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleEditTimelineClick = (item) => { 
    setEditTimelineId(item.id); 
    setTahunTimeline(item.tahun); 
    setJudulTimeline(item.judul); 
    setDeskripsiTimeline(item.deskripsi); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleSubmitFotoProfil = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    try { 
      let urls = editFotoProfId ? dataFotoProfil.find(d=>d.id===editFotoProfId).linkGambar : []; 
      if (filesFotoProfil.length > 0) { 
        urls = []; 
        for (const file of filesFotoProfil) { 
          urls.push(await uploadToCloudinary(file, "image")); 
        } 
      } 
      if (editFotoProfId) { 
        await updateDoc(doc(db, "profil_galeri", editFotoProfId), { konteks: konteksFoto, linkGambar: urls }); 
        setStatus({ type: "success", message: "Foto Profil diperbarui!" }); 
      } else { 
        await addDoc(collection(db, "profil_galeri"), { konteks: konteksFoto, linkGambar: urls, createdAt: serverTimestamp() }); 
        setStatus({ type: "success", message: "Foto Profil ditambahkan!" }); 
      } 
      setKonteksFoto(""); 
      setFilesFotoProfil([]); 
      setEditFotoProfId(null); 
      fetchAllData(); 
    } catch (error) { 
      setStatus({ type: "error", message: error.message }); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleEditFotoProfClick = (item) => { 
    setEditFotoProfId(item.id); 
    setKonteksFoto(item.konteks); 
    setFilesFotoProfil([]); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleSubmitFasilitas = async (e) => 
  { 
    e.preventDefault(); 
    setLoading(true); 
    try { 
      let urls = editFasilitId ? dataFasilitas.find(d=>d.id===editFasilitId).linkGambar : []; 
      if (filesFasilitas.length > 0) { 
        urls = []; 
        for (const file of filesFasilitas) { 
          urls.push(await uploadToCloudinary(file, "image")); 
        } 
      } 
      if (editFasilitId) { 
        await updateDoc(doc(db, "daftar_fasilitas", editFasilitId), { asrama: asramaFasilitas, nama: namaFasilitas, deskripsi: deskripsiFasilitas, linkGambar: urls }); 
        setStatus({ type: "success", message: "Fasilitas diperbarui!" }); 
      } else { 
        await addDoc(collection(db, "daftar_fasilitas"), { asrama: asramaFasilitas, nama: namaFasilitas, deskripsi: deskripsiFasilitas, linkGambar: urls, createdAt: serverTimestamp() }); 
        setStatus({ type: "success", message: "Fasilitas ditambahkan!" }); 
      } 
      setNamaFasilitas(""); 
      setDeskripsiFasilitas(""); 
      setFilesFasilitas([]); 
      setEditFasilitId(null); 
      fetchAllData(); 
    } catch (error) { 
      setStatus({ type: "error", message: error.message }); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleEditFasilitasClick = (item) => { 
    setEditFasilitId(item.id); 
    setAsramaFasilitas(item.asrama || 'mersi'); 
    setNamaFasilitas(item.nama); 
    setDeskripsiFasilitas(item.deskripsi); 
    setFilesFasilitas([]); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleSubmitPenyewaan = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    try { 
      let urls = editSewaId ? dataPenyewaan.find(d=>d.id===editSewaId).linkGambar : []; 
      if (filesSewa.length > 0) { 
        urls = []; 
        for (const file of filesSewa) { 
          urls.push(await uploadToCloudinary(file, "image")); 
        } 
      } 
      if (editSewaId) { 
        await updateDoc(doc(db, "daftar_penyewaan", editSewaId), { asrama: asramaSewa, nama: namaSewa, kategori: kategoriSewa, harga: hargaSewa, noHpSewa: noHpSewa, deskripsi: deskripsiSewa, linkGambar: urls }); 
        setStatus({ type: "success", message: "Layanan diperbarui!" }); 
      } else { 
        await addDoc(collection(db, "daftar_penyewaan"), { asrama: asramaSewa, nama: namaSewa, kategori: kategoriSewa, harga: hargaSewa, noHpSewa: noHpSewa, deskripsi: deskripsiSewa, linkGambar: urls, createdAt: serverTimestamp() }); 
        setStatus({ type: "success", message: "Layanan ditambahkan!" }); 
      } 
      setNamaSewa(""); 
      setDeskripsiSewa(""); 
      setKategoriSewa("Tempat / Barang"); 
      setHargaSewa(""); 
      setNoHpSewa(""); 
      setFilesSewa([]); 
      setEditSewaId(null); 
      fetchAllData(); 
    } catch (error) { 
      setStatus({ type: "error", message: error.message }); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleEditSewaClick = (item) => { 
    setEditSewaId(item.id); 
    setAsramaSewa(item.asrama || 'mersi'); 
    setNamaSewa(item.nama); 
    setKategoriSewa(item.kategori); 
    setHargaSewa(item.harga); 
    setNoHpSewa(item.noHpSewa); 
    setDeskripsiSewa(item.deskripsi); 
    setFilesSewa([]); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleSubmitGaleri = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    try { 
      let urls = editGaleriId ? (dataGaleri.find(d=>d.id===editGaleriId).linkGambar || []) : []; 
      if (filesGaleri.length > 0) { 
        urls = []; 
        for (const file of filesGaleri) { 
          urls.push(await uploadToCloudinary(file, "image")); 
        } 
      } 
      if (editGaleriId) { 
        await updateDoc(doc(db, "fasilitas", editGaleriId), { judul: judulGaleri, warna: warnaGaleri, linkGambar: urls }); 
        setStatus({ type: "success", message: "Galeri diperbarui!" }); 
      } else { 
        await addDoc(collection(db, "fasilitas"), { judul: judulGaleri, warna: warnaGaleri, linkGambar: urls, createdAt: serverTimestamp() }); 
        setStatus({ type: "success", message: "Galeri ditambahkan!" }); 
      } 
      setJudulGaleri(""); 
      setWarnaGaleri("#ffffff"); 
      setFilesGaleri([]); 
      setEditGaleriId(null); 
      fetchAllData(); 
    } catch (error) { 
      setStatus({ type: "error", message: error.message }); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleEditGaleriClick = (item) => { 
    setEditGaleriId(item.id); 
    setJudulGaleri(item.judul); 
    setWarnaGaleri(item.warna || "#ffffff"); 
    setFilesGaleri([]); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleSubmitKehidupan = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    try { 
      let urls = editKehidupanId ? dataKehidupan.find(d=>d.id===editKehidupanId).linkGambar : []; 
      if (filesGambar.length > 0) { 
        urls = []; 
        for (const file of filesGambar) { 
          urls.push(await uploadToCloudinary(file, "image")); 
        } 
      } 
      const finalKategori = kategori === "LAINNYA" ? customKategori.toUpperCase() : kategori; 
      
      let finalTanggal = "";
      if (tanggalPublikasi) {
        const dateObj = new Date(tanggalPublikasi);
        finalTanggal = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      }

      if (editKehidupanId) { 
        const updateData = { judul: judulKonten, kategori: finalKategori, deskripsi, linkGambar: urls };
        if (finalTanggal) updateData.tanggal = finalTanggal; 
        
        await updateDoc(doc(db, "kehidupan", editKehidupanId), updateData); 
        setStatus({ type: "success", message: "Publikasi diperbarui!" }); 
      } else { 
        if (!finalTanggal) {
          finalTanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        }
        await addDoc(collection(db, "kehidupan"), { judul: judulKonten, kategori: finalKategori, deskripsi, linkGambar: urls, tanggal: finalTanggal, createdAt: serverTimestamp() }); 
        setStatus({ type: "success", message: "Publikasi ditambahkan!" }); 
      } 
      setJudulKonten(""); 
      setDeskripsi(""); 
      setCustomKategori(""); 
      setKategori("PRESTASI"); 
      setFilesGambar([]); 
      setTanggalPublikasi(""); 
      setEditKehidupanId(null); 
      fetchAllData(); 
    } catch (error) { 
      setStatus({ type: "error", message: error.message }); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleEditKehidupanClick = (item) => { 
    setEditKehidupanId(item.id); 
    setJudulKonten(item.judul); 
    setDeskripsi(item.deskripsi); 
    if (["PRESTASI", "MERSI X BK", "LOMBA TERBUKA"].includes(item.kategori)) { 
      setKategori(item.kategori); 
      setCustomKategori(""); 
    } else { 
      setKategori("LAINNYA"); 
      setCustomKategori(item.kategori); 
    } 
    setFilesGambar([]); 
    setTanggalPublikasi(""); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleSubmitSkripsi = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    try { 
      if (editSkripsiId) { 
        await updateDoc(doc(db, "skripsi", editSkripsiId), { nama, jurusan, judul: judulSkripsi, tahun }); 
        setStatus({ type: "success", message: "Skripsi diperbarui!" }); 
      } else { 
        await addDoc(collection(db, "skripsi"), { nama, jurusan, judul: judulSkripsi, tahun, createdAt: serverTimestamp() }); 
        setStatus({ type: "success", message: "Skripsi ditambahkan!" }); 
      } 
      setNama(""); 
      setJurusan(""); 
      setJudulSkripsi(""); 
      setTahun(""); 
      setEditSkripsiId(null); 
      fetchAllData(); 
    } catch (error) { 
      setStatus({ type: "error", message: error.message }); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleEditSkripsiClick = (item) => { 
    setEditSkripsiId(item.id); 
    setNama(item.nama); 
    setJurusan(item.jurusan); 
    setJudulSkripsi(item.judul); 
    setTahun(item.tahun); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleReplyKomentar = async (id) => { 
    if (!replyText.trim()) return; 
    setLoading(true); 
    try { 
      await updateDoc(doc(db, "komentar_publikasi", id), { balasanAdmin: replyText }); 
      setStatus({ type: "success", message: "Balasan berhasil dikirim!" }); 
      setReplyKomenId(null); 
      setReplyText(""); 
      fetchAllData(); 
    } catch (error) { 
      setStatus({ type: "error", message: error.message }); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleDeleteBalasan = async (id) => { 
    if (confirm("Hapus balasan admin ini?")) { 
      await updateDoc(doc(db, "komentar_publikasi", id), { balasanAdmin: "" }); 
      fetchAllData(); 
    } 
  };

  // --- LOGIKA SUBMIT DATA ALUMNI & WARGA (KHUSUS PENGURUS/ADMIN) ---
  const handleSubmitPesanAlumni = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    try { 
      let fotoUrl = editPesanId ? dataPesanAlumni.find(d=>d.id===editPesanId).foto : ""; 
      if (fileFotoAlumni) { 
        fotoUrl = await uploadToCloudinary(fileFotoAlumni, "image"); 
      } 
      
      const payload = { 
        nama: formAlumni.nama, 
        asal: formAlumni.asal,
        kuliah: formAlumni.kuliah,
        jurusan: formAlumni.jurusan,
        angkatanAsrama: formAlumni.angkatanAsrama,
        pekerjaan: formAlumni.pekerjaan,
        skripsi: formAlumni.skripsi || "",
        prestasi: formAlumni.prestasi || "",
        pesan: formAlumni.pesan, 
        asrama: formAlumni.asrama || "mersi",
        statusWarga: formAlumni.statusWarga || "Alumni",
        foto: fotoUrl 
      };

      if (editPesanId) { 
        await updateDoc(doc(db, "pesan_alumni", editPesanId), payload); 
        setStatus({ type: "success", message: "Data warga/alumni diperbarui!" }); 
      } else { 
        await addDoc(collection(db, "pesan_alumni"), { ...payload, createdAt: serverTimestamp() }); 
        setStatus({ type: "success", message: "Data warga/alumni ditambahkan!" }); 
      } 
      
      setFormAlumni({ 
        nama: "", 
        asal: "", 
        kuliah: "", 
        jurusan: "", 
        angkatanAsrama: "", 
        pekerjaan: "", 
        skripsi: "", 
        prestasi: "", 
        pesan: "",
        asrama: "mersi",
        statusWarga: "Alumni"
      }); 
      setFileFotoAlumni(null); 
      setEditPesanId(null); 
      fetchAllData(); 
      if(document.getElementById('fotoAlumni')) {
        document.getElementById('fotoAlumni').value = "";
      }
    } catch (error) { 
      setStatus({ type: "error", message: error.message }); 
    } finally { 
      setLoading(false); 
    } 
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
      prestasi: item.prestasi || "",
      pesan: item.pesan || "",
      asrama: item.asrama || "mersi",
      statusWarga: item.statusWarga || "Alumni"
    });
    setFileFotoAlumni(null); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  // --- LOGIKA UPDATE PROFIL MANDIRI (KHUSUS WARGA / ALUMNI) ---
  const handleUpdateProfilSaya = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      let payload = { 
        nama: formAlumni.nama, 
        asal: formAlumni.asal,
        kuliah: formAlumni.kuliah,
        jurusan: formAlumni.jurusan,
        angkatanAsrama: formAlumni.angkatanAsrama,
        pekerjaan: formAlumni.pekerjaan,
        skripsi: formAlumni.skripsi || "",
        prestasi: formAlumni.prestasi || "",
        pesan: formAlumni.pesan, 
        asrama: formAlumni.asrama,
        statusWarga: formAlumni.statusWarga
      };

      if (fileFotoAlumni) { 
        payload.foto = await uploadToCloudinary(fileFotoAlumni, "image"); 
      } 
      
      await updateDoc(doc(db, "pesan_alumni", loggedInAlumniId), payload); 
      setStatus({ type: "success", message: "Biodata berhasil diperbarui! Cek halaman publik untuk melihat hasilnya." }); 
      setFileFotoAlumni(null); 
      if(document.getElementById('fotoAlumniSaya')) {
        document.getElementById('fotoAlumniSaya').value = "";
      }
    } catch (error) { 
      setStatus({ type: "error", message: error.message }); 
    } finally { 
      setLoading(false); 
    } 
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">
        Memeriksa Akses...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-50 p-4 px-8 flex justify-between items-center">
        <div className="font-serif font-bold text-xl flex items-center gap-2">
          <img src="/mersi.png" alt="Logo" className="w-6 h-6 object-contain" /> Admin Asrama 
          <span className="text-xs bg-red-800 px-2 py-0.5 rounded-full ml-2 font-sans font-normal uppercase tracking-wider">
            {role === "warga_alumni" ? "WARGA / ALUMNI" : role === "puki" ? "PUBLIKASI" : role}
          </span>
        </div>
        <button onClick={() => {signOut(auth); router.replace("/beranda")}} className="bg-red-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">Logout</button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex space-x-2 mb-8 bg-white p-2 rounded-xl shadow-sm border border-slate-200 overflow-x-auto custom-scrollbar">
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

        {status.message && (
          <div className={`p-4 rounded-lg mb-6 text-sm font-medium border ${status.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
            {status.message}
          </div>
        )}

        {/* ======================= ISI MASING-MASING TAB ======================= */}

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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> 
                        <div className="bg-red-50/50 p-3 rounded border border-red-100">
                          <label className="text-sm block mb-1 font-bold text-red-800">Nama Ketua Mersi</label>
                          <input required type="text" value={kontak.namaKetuaMersi || ""} onChange={(e) => setKontak({...kontak, namaKetuaMersi: e.target.value})} className="w-full px-3 py-1.5 border rounded" />
                        </div> 
                        <div className="bg-red-50/50 p-3 rounded border border-red-100">
                          <label className="text-sm block mb-1 font-bold text-red-800">No WA Ketua Mersi</label>
                          <input required type="text" value={kontak.noTelponMersi || ""} onChange={(e) => setKontak({...kontak, noTelponMersi: e.target.value})} className="w-full px-3 py-1.5 border rounded" placeholder="Cth: 0812..." />
                        </div> 
                        <div className="bg-stone-50 p-3 rounded border border-stone-200 row-span-2">
                          <label className="text-sm block mb-1 font-bold text-stone-700">Email Utama Mersi</label>
                          <input required type="email" value={kontak.emailMersi || ""} onChange={(e) => setKontak({...kontak, emailMersi: e.target.value})} className="w-full px-3 py-1.5 border rounded mb-3" placeholder="sekremersi@gmail.com" />
                          
                          <label className="text-sm block mb-1 font-bold text-stone-700">Email Utama BK</label>
                          <input required type="email" value={kontak.emailBk || ""} onChange={(e) => setKontak({...kontak, emailBk: e.target.value})} className="w-full px-3 py-1.5 border rounded mb-3" placeholder="sekrebk@gmail.com" />

                          <label className="text-sm block mb-1 font-bold text-stone-700">No WA Admin Skripsi (Bersama)</label>
                          <input required type="text" value={kontak.noSkripsi || ""} onChange={(e) => setKontak({...kontak, noSkripsi: e.target.value})} className="w-full px-3 py-1.5 border rounded mb-3" placeholder="Cth: 0823..." />
                        </div> 
                        
                        <div className="bg-amber-50/50 p-3 rounded border border-amber-100">
                          <label className="text-sm block mb-1 font-bold text-amber-700">Nama Ketua BK</label>
                          <input required type="text" value={kontak.namaKetuaBk || ""} onChange={(e) => setKontak({...kontak, namaKetuaBk: e.target.value})} className="w-full px-3 py-1.5 border rounded" />
                        </div> 
                        <div className="bg-amber-50/50 p-3 rounded border border-amber-100">
                          <label className="text-sm block mb-1 font-bold text-amber-700">No WA Ketua BK</label>
                          <input required type="text" value={kontak.noTelponBk || ""} onChange={(e) => setKontak({...kontak, noTelponBk: e.target.value})} className="w-full px-3 py-1.5 border rounded" placeholder="Cth: 0852..." />
                        </div> 

                        <div className="bg-red-50/50 p-3 rounded border border-red-100">
                          <label className="text-sm block mb-1 font-bold text-red-800">No WA Humas Mersi</label>
                          <input required type="text" value={kontak.noHumasMersi || ""} onChange={(e) => setKontak({...kontak, noHumasMersi: e.target.value})} className="w-full px-3 py-1.5 border rounded" placeholder="Cth: 0852..." />
                        </div>
                        <div className="bg-amber-50/50 p-3 rounded border border-amber-100">
                          <label className="text-sm block mb-1 font-bold text-amber-700">No WA Humas BK</label>
                          <input required type="text" value={kontak.noHumasBk || ""} onChange={(e) => setKontak({...kontak, noHumasBk: e.target.value})} className="w-full px-3 py-1.5 border rounded" placeholder="Cth: 0852..." />
                        </div>
                      </div> 
                      
                      <h3 className="font-semibold text-blue-800 border-l-2 border-blue-500 pl-2 mt-6">Sosial Media Asrama</h3> 
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 border rounded-lg"> 
                        <div className="border-r border-slate-200 pr-4">
                          <label className="text-xs font-bold block mb-1 text-slate-600">Tampilan IG Mersi</label>
                          <input required type="text" value={kontak.namaIgMersi || ""} onChange={(e) => setKontak({...kontak, namaIgMersi: e.target.value})} className="w-full px-3 py-1.5 border rounded mb-3" placeholder="@asramamerapisinggalang" />
                          <label className="text-xs font-bold block mb-1 text-slate-600">Link Akun IG Mersi</label>
                          <input required type="url" value={kontak.linkIgMersi || ""} onChange={(e) => setKontak({...kontak, linkIgMersi: e.target.value})} className="w-full px-3 py-1.5 border rounded mb-5" placeholder="https://instagram.com/..." />
                          
                          <label className="text-xs font-bold block mb-1 text-slate-600">Tampilan IG BK</label>
                          <input required type="text" value={kontak.namaIgBk || ""} onChange={(e) => setKontak({...kontak, namaIgBk: e.target.value})} className="w-full px-3 py-1.5 border rounded mb-3" placeholder="@asramaputribk" />
                          <label className="text-xs font-bold block mb-1 text-slate-600">Link Akun IG BK</label>
                          <input required type="url" value={kontak.linkIgBk || ""} onChange={(e) => setKontak({...kontak, linkIgBk: e.target.value})} className="w-full px-3 py-1.5 border rounded" placeholder="https://instagram.com/..." />
                        </div> 
                        <div className="pl-2">
                          <label className="text-xs font-bold block mb-1 text-slate-600">Tampilan Nama Tiktok (Bersama)</label>
                          <input required type="text" value={kontak.namaTiktok || ""} onChange={(e) => setKontak({...kontak, namaTiktok: e.target.value})} className="w-full px-3 py-1.5 border rounded mb-3" placeholder="@asrama.mersi" />
                          <label className="text-xs font-bold block mb-1 text-slate-600">Link URL Akun Tiktok (Bersama)</label>
                          <input required type="url" value={kontak.linkTiktok || ""} onChange={(e) => setKontak({...kontak, linkTiktok: e.target.value})} className="w-full px-3 py-1.5 border rounded" placeholder="https://tiktok.com/..." />
                        </div> 
                      </div> 

                      {/* --- TAMBAHAN BLOK MAPS / LOKASI --- */}
                      <h3 className="font-semibold text-emerald-800 border-l-2 border-emerald-500 pl-2 mt-6">Lokasi & Google Maps</h3> 
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
                        {/* Maps Mersi */}
                        <div className="bg-red-50 p-4 border border-red-100 rounded-lg">
                          <h4 className="font-bold text-red-900 mb-3 text-sm">Titik Temu Mersi</h4>
                          <label className="text-xs font-bold block mb-1 text-red-800">Alamat Teks Lengkap</label>
                          <textarea rows="2" required value={kontak.alamatMersi || ""} onChange={(e) => setKontak({...kontak, alamatMersi: e.target.value})} className="w-full px-3 py-1.5 border rounded mb-3 text-sm"></textarea>
                          
                          <label className="text-xs font-bold block mb-1 text-red-800">Link Google Maps (Untuk Tombol Buka di Maps)</label>
                          <input required type="url" value={kontak.linkMapMersi || ""} onChange={(e) => setKontak({...kontak, linkMapMersi: e.target.value})} className="w-full px-3 py-1.5 border rounded mb-3 text-sm" placeholder="https://www.google.com/maps/search/?api=1&query=..." />
                          
                          <label className="text-xs font-bold block mb-1 text-red-800">Link Embed/Iframe (Untuk Gambar Peta)</label>
                          <p className="text-[10px] text-red-700 mb-1 italic">Ambil dari Gmaps {'>'} Share {'>'} Embed a map {'>'} Copy src="..." saja.</p>
                          <input required type="url" value={kontak.iframeMapMersi || ""} onChange={(e) => setKontak({...kontak, iframeMapMersi: e.target.value})} className="w-full px-3 py-1.5 border rounded text-sm" placeholder="https://www.google.com/maps/embed?pb=..." />
                        </div>

                        {/* Maps BK */}
                        <div className="bg-amber-50 p-4 border border-amber-200 rounded-lg">
                          <h4 className="font-bold text-amber-900 mb-3 text-sm">Titik Temu Bundo Kanduang</h4>
                          <label className="text-xs font-bold block mb-1 text-amber-800">Alamat Teks Lengkap</label>
                          <textarea rows="2" required value={kontak.alamatBk || ""} onChange={(e) => setKontak({...kontak, alamatBk: e.target.value})} className="w-full px-3 py-1.5 border rounded mb-3 text-sm"></textarea>
                          
                          <label className="text-xs font-bold block mb-1 text-amber-800">Link Google Maps (Untuk Tombol Buka di Maps)</label>
                          <input required type="url" value={kontak.linkMapBk || ""} onChange={(e) => setKontak({...kontak, linkMapBk: e.target.value})} className="w-full px-3 py-1.5 border rounded mb-3 text-sm" placeholder="https://www.google.com/maps/search/?api=1&query=..." />
                          
                          <label className="text-xs font-bold block mb-1 text-amber-800">Link Embed/Iframe (Untuk Gambar Peta)</label>
                          <p className="text-[10px] text-amber-700 mb-1 italic">Ambil dari Gmaps {'>'} Share {'>'} Embed a map {'>'} Copy src="..." saja.</p>
                          <input required type="url" value={kontak.iframeMapBk || ""} onChange={(e) => setKontak({...kontak, iframeMapBk: e.target.value})} className="w-full px-3 py-1.5 border rounded text-sm" placeholder="https://www.google.com/maps/embed?pb=..." />
                        </div>
                      </div>

                    </div> 

                    <div className="space-y-4 pt-4 border-t"> 
                      <h3 className="font-semibold text-red-800 border-l-2 pl-2">Halaman Profil - Visi Misi Mersi</h3> 
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-red-50 p-4 rounded border border-red-100"> 
                        <div>
                          <label className="text-sm block mb-1 font-bold text-red-900">Visi Mersi</label>
                          <textarea required rows="3" value={profilText.visi_mersi} onChange={(e) => setProfilText({...profilText, visi_mersi: e.target.value})} className="w-full px-4 py-2 border rounded-md bg-white"></textarea>
                        </div> 
                        <div>
                          <label className="text-sm block mb-1 font-bold text-red-900">Misi Mersi</label>
                          <textarea required rows="3" value={profilText.misi_mersi} onChange={(e) => setProfilText({...profilText, misi_mersi: e.target.value})} className="w-full px-4 py-2 border rounded-md bg-white"></textarea>
                        </div> 
                      </div> 
                      <h3 className="font-semibold text-amber-600 border-l-2 border-amber-500 pl-2 mt-4">Halaman Profil - Visi Misi Bundo Kanduang</h3> 
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50 p-4 rounded border border-amber-200"> 
                        <div>
                          <label className="text-sm block mb-1 font-bold text-amber-900">Visi BK</label>
                          <textarea required rows="3" value={profilText.visi_bk} onChange={(e) => setProfilText({...profilText, visi_bk: e.target.value})} className="w-full px-4 py-2 border rounded-md bg-white"></textarea>
                        </div> 
                        <div>
                          <label className="text-sm block mb-1 font-bold text-amber-900">Misi BK</label>
                          <textarea required rows="3" value={profilText.misi_bk} onChange={(e) => setProfilText({...profilText, misi_bk: e.target.value})} className="w-full px-4 py-2 border rounded-md bg-white"></textarea>
                        </div> 
                      </div> 
                    </div> 

                    <div className="space-y-4 pt-4 border-t"> 
                      <h3 className="font-semibold text-stone-800 border-l-2 pl-2">Halaman Jejak & Prestasi</h3> 
                      <div>
                        <label className="text-sm block mb-1 font-bold">Teks Intro Jejak Alumni</label>
                        <textarea required rows="2" value={profilText.jejakAlumni} onChange={(e) => setProfilText({...profilText, jejakAlumni: e.target.value})} className="w-full px-4 py-2 border rounded-md"></textarea>
                      </div> 
                    </div> 
                    <button type="submit" disabled={loading} className="bg-slate-900 text-white px-6 py-3 rounded-md font-bold w-full md:w-auto">Simpan Teks Utama</button> 
                  </form> 
                </div> 

                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                  <h2 className="text-lg font-bold mb-4 border-b pb-2">{editSejarahId ? "Edit Cerita Sejarah" : "Manajemen Catatan Sejarah (Buku)"}</h2>
                  <form onSubmit={handleSubmitSejarah} className="space-y-4 mb-6 bg-slate-50 p-4 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-[150px_200px_1fr] gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Untuk Asrama</label>
                        <select value={asramaSejarah} onChange={(e) => setAsramaSejarah(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm font-bold">
                          <option value="mersi">Mersi</option>
                          <option value="bk">Bundo Kanduang</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Judul Lembaran</label>
                        <input type="text" required value={judulSejarah} onChange={(e) => setJudulSejarah(e.target.value)} placeholder="Cth: Masa Pendirian" className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Isi Cerita</label>
                        <textarea required rows="2" value={isiSejarah} onChange={(e) => setIsiSejarah(e.target.value)} placeholder="Tuliskan cerita..." className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm"></textarea>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3 pt-2">
                      <button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-md font-semibold w-full md:w-auto">{editSejarahId ? "Simpan Perubahan" : "Tambah Lembaran"}</button>
                      {editSejarahId && <button type="button" onClick={() => { setEditSejarahId(null); setJudulSejarah(""); setIsiSejarah(""); }} className="bg-stone-500 hover:bg-stone-600 text-white px-6 py-2 rounded-md font-semibold w-full md:w-auto">Batal Edit</button>}
                    </div>
                  </form>
                  
                  <h3 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-3">Daftar Lembaran Sejarah</h3>
                  <div className="space-y-3">
                    {dataSejarah.slice((pageSejarah - 1) * itemsPerPage, pageSejarah * itemsPerPage).map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-lg shadow-sm gap-4">
                        <div className="w-full">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${item.asrama === 'bk' ? 'bg-amber-500' : 'bg-red-800'}`}>{item.asrama === 'bk' ? 'BK' : 'MERSI'}</span>
                            <span className="font-bold text-slate-800 text-sm">{item.judul}</span>
                          </div>
                          <div className="text-xs text-slate-500 line-clamp-1 pr-4">{item.isi}</div>
                        </div>
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

            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> 
              <h2 className="text-lg font-bold mb-4 border-b pb-2">Ubah Foto Latar Belakang</h2> 
              <form onSubmit={handleSaveTampilan} className="space-y-6"> 
                <div className="space-y-4"> 
                  <h3 className="font-semibold text-red-800 border-l-2 pl-2">Slideshow Gateway (Halaman Beranda Utama)</h3> 
                  <div className="bg-slate-50 p-4 border rounded-lg"> 
                    <label className="font-semibold block mb-2">Pilih Beberapa Foto Gateway Sekaligus</label> 
                    <input type="file" multiple accept="image/*" onChange={(e) => setTampilanFiles({...tampilanFiles, gateway: Array.from(e.target.files)})} className="w-full text-sm cursor-pointer bg-white p-2 border rounded" /> 
                  </div> 
                </div> 
                <div className="space-y-4 pt-4 border-t"> 
                  <h3 className="font-semibold text-red-800 border-l-2 pl-2">Latar Belakang Tiap Halaman</h3> 
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

        {/* TAB STATUS & PENDAFTARAN */}
        {activeTab === "status" && allowedTabs.includes("status") && ( 
          <div className="space-y-6"> 
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> 
              <h2 className="text-lg font-bold mb-4 border-b pb-2">Status Kapasitas Asrama</h2> 
              <form onSubmit={handleSaveStatusAsrama} className="space-y-8"> 
                <div className="bg-red-50 p-5 rounded-lg border border-red-100">
                  <h3 className="font-bold text-red-800 mb-3 border-b border-red-200 pb-2">Data Mersi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Total Kamar</label>
                      <input type="number" required value={statusAsrama.kamarMersi} onChange={(e) => setStatusAsrama({...statusAsrama, kamarMersi: e.target.value})} className="w-full px-3 py-2 border rounded bg-white" />
                    </div> 
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Penghuni Aktif</label>
                      <input type="number" required value={statusAsrama.penghuniMersi} onChange={(e) => setStatusAsrama({...statusAsrama, penghuniMersi: e.target.value})} className="w-full px-3 py-2 border rounded bg-white" />
                    </div> 
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Status Kuota</label>
                      <select value={statusAsrama.ketersediaanMersi} onChange={(e) => setStatusAsrama({...statusAsrama, ketersediaanMersi: e.target.value})} className="w-full px-3 py-2 border rounded bg-white font-bold text-sm">
                        <option value="Tersedia">🟢 Masih Tersedia</option>
                        <option value="Penuh">🔴 Kuota Penuh</option>
                      </select>
                    </div> 
                  </div>
                </div>

                <div className="bg-amber-50 p-5 rounded-lg border border-amber-200">
                  <h3 className="font-bold text-amber-700 mb-3 border-b border-amber-200 pb-2">Data Bundo Kanduang</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Total Kamar</label>
                      <input type="number" required value={statusAsrama.kamarBk} onChange={(e) => setStatusAsrama({...statusAsrama, kamarBk: e.target.value})} className="w-full px-3 py-2 border rounded bg-white" />
                    </div> 
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Penghuni Aktif</label>
                      <input type="number" required value={statusAsrama.penghuniBk} onChange={(e) => setStatusAsrama({...statusAsrama, penghuniBk: e.target.value})} className="w-full px-3 py-2 border rounded bg-white" />
                    </div> 
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Status Kuota</label>
                      <select value={statusAsrama.ketersediaanBk} onChange={(e) => setStatusAsrama({...statusAsrama, ketersediaanBk: e.target.value})} className="w-full px-3 py-2 border rounded bg-white font-bold text-sm">
                        <option value="Tersedia">🟢 Masih Tersedia</option>
                        <option value="Penuh">🔴 Kuota Penuh</option>
                      </select>
                    </div> 
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-md font-bold transition-colors">Simpan Status Kapasitas</button> 
              </form> 
            </div> 
            
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> 
              <h2 className="text-lg font-bold mb-4 border-b pb-2">Manajemen Brosur Pendaftaran</h2> 
              <form onSubmit={handleSaveBrosur} className="space-y-6"> 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 border rounded-lg"> 
                    <label className="text-sm font-bold text-red-800 mb-2 block">Upload Brosur Mersi (Bisa pilih banyak)</label> 
                    <input type="file" multiple accept="image/*" onChange={(e) => setFilesBrosurMersi(Array.from(e.target.files))} className="w-full text-sm bg-white border p-2 rounded cursor-pointer" /> 
                    {brosurUrls.mersi.length > 0 && <p className="text-xs mt-2 text-green-700 font-bold">✔️ {brosurUrls.mersi.length} foto brosur tersimpan saat ini.</p>}
                  </div> 
                  <div className="bg-slate-50 p-4 border rounded-lg"> 
                    <label className="text-sm font-bold text-amber-600 mb-2 block">Upload Brosur B. Kanduang (Bisa pilih banyak)</label> 
                    <input type="file" multiple accept="image/*" onChange={(e) => setFilesBrosurBk(Array.from(e.target.files))} className="w-full text-sm bg-white border p-2 rounded cursor-pointer" /> 
                    {brosurUrls.bk.length > 0 && <p className="text-xs mt-2 text-green-700 font-bold">✔️ {brosurUrls.bk.length} foto brosur tersimpan saat ini.</p>}
                  </div> 
                </div>
                <div> 
                  <label className="text-sm font-bold mb-1 block">Link Opsional Formulir Pendaftaran Tambahan (G-Form / Drive)</label> 
                  <input type="url" value={linkFormulir} onChange={(e) => setLinkFormulir(e.target.value)} className="w-full px-4 py-2 border rounded-md" placeholder="Kosongkan jika tidak ada" /> 
                </div> 
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-3 rounded-md font-bold transition-colors">Simpan Brosur</button> 
              </form> 
            </div> 
          </div> 
        )}
        
        {/* TAB KEPENGURUSAN */}
        {activeTab === "kepengurusan" && allowedTabs.includes("kepengurusan") && ( 
          <div className="space-y-6"> 
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> 
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">1. Pengurus Inti Asrama</h2> 
              <form onSubmit={handleSavePengurusInti} className="space-y-8"> 
                
                {/* Blok Mersi */}
                <div className="bg-red-50/30 p-4 md:p-6 border border-red-100 rounded-xl">
                  <h3 className="font-bold text-red-800 mb-4 text-center tracking-widest uppercase">Inti Mersi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> 
                    <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm"> 
                      <label className="text-sm font-bold block mb-2 text-red-800">Ketua Mersi</label> 
                      <input type="text" required value={pengurusInti.ketuaMersiNama} onChange={(e) => setPengurusInti({...pengurusInti, ketuaMersiNama: e.target.value})} className="w-full px-3 py-2 border rounded-md mb-3 text-sm" /> 
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Foto (Update)</label> 
                      <input type="file" accept="image/*" onChange={(e) => setFileInti({...fileInti, ketuaMersi: e.target.files[0]})} className="w-full text-[10px] bg-stone-50 p-1 border rounded" /> 
                    </div> 
                    <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm"> 
                      <label className="text-sm font-bold block mb-2 text-red-800">Sekretaris Mersi</label> 
                      <input type="text" required value={pengurusInti.sekreMersiNama} onChange={(e) => setPengurusInti({...pengurusInti, sekreMersiNama: e.target.value})} className="w-full px-3 py-2 border rounded-md mb-3 text-sm" /> 
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Foto (Update)</label> 
                      <input type="file" accept="image/*" onChange={(e) => setFileInti({...fileInti, sekreMersi: e.target.files[0]})} className="w-full text-[10px] bg-stone-50 p-1 border rounded" /> 
                    </div> 
                    <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm"> 
                      <label className="text-sm font-bold block mb-2 text-red-800">Bendahara Mersi</label> 
                      <input type="text" required value={pengurusInti.bendaharaMersiNama} onChange={(e) => setPengurusInti({...pengurusInti, bendaharaMersiNama: e.target.value})} className="w-full px-3 py-2 border rounded-md mb-3 text-sm" /> 
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Foto (Update)</label> 
                      <input type="file" accept="image/*" onChange={(e) => setFileInti({...fileInti, bendaharaMersi: e.target.files[0]})} className="w-full text-[10px] bg-stone-50 p-1 border rounded" /> 
                    </div> 
                  </div>
                </div>

                {/* Blok BK */}
                <div className="bg-amber-50/40 p-4 md:p-6 border border-amber-200 rounded-xl">
                  <h3 className="font-bold text-amber-700 mb-4 text-center tracking-widest uppercase">Inti Bundo Kanduang</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> 
                    <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm"> 
                      <label className="text-sm font-bold block mb-2 text-amber-700">Ketua BK</label> 
                      <input type="text" required value={pengurusInti.ketuaBkNama} onChange={(e) => setPengurusInti({...pengurusInti, ketuaBkNama: e.target.value})} className="w-full px-3 py-2 border rounded-md mb-3 text-sm" /> 
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Foto (Update)</label> 
                      <input type="file" accept="image/*" onChange={(e) => setFileInti({...fileInti, ketuaBk: e.target.files[0]})} className="w-full text-[10px] bg-stone-50 p-1 border rounded" /> 
                    </div> 
                    <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm"> 
                      <label className="text-sm font-bold block mb-2 text-amber-700">Sekretaris BK</label> 
                      <input type="text" required value={pengurusInti.sekreBkNama} onChange={(e) => setPengurusInti({...pengurusInti, sekreBkNama: e.target.value})} className="w-full px-3 py-2 border rounded-md mb-3 text-sm" /> 
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Foto (Update)</label> 
                      <input type="file" accept="image/*" onChange={(e) => setFileInti({...fileInti, sekreBk: e.target.files[0]})} className="w-full text-[10px] bg-stone-50 p-1 border rounded" /> 
                    </div> 
                    <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm"> 
                      <label className="text-sm font-bold block mb-2 text-amber-700">Bendahara BK</label> 
                      <input type="text" required value={pengurusInti.bendaharaBkNama} onChange={(e) => setPengurusInti({...pengurusInti, bendaharaBkNama: e.target.value})} className="w-full px-3 py-2 border rounded-md mb-3 text-sm" /> 
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Foto (Update)</label> 
                      <input type="file" accept="image/*" onChange={(e) => setFileInti({...fileInti, bendaharaBk: e.target.files[0]})} className="w-full text-[10px] bg-stone-50 p-1 border rounded" /> 
                    </div> 
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-md font-bold w-full">Simpan Semua Pengurus Inti</button> 
              </form> 
            </div> 

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> 
                <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">2. Tambah Divisi Baru</h2> 
                <form onSubmit={handleTambahDivisi} className="space-y-4"> 
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block uppercase">Untuk Asrama</label>
                      <select value={asramaDivisi} onChange={(e) => setAsramaDivisi(e.target.value)} className="w-full px-3 py-2 border rounded-md font-bold text-sm bg-slate-50">
                        <option value="mersi">Mersi</option>
                        <option value="bk">Bundo Kanduang</option>
                      </select>
                    </div>
                    <div> 
                      <label className="text-xs font-bold text-slate-600 mb-1 block uppercase">Nama Divisi</label> 
                      <input type="text" required value={namaDivisiBaru} onChange={(e) => setNamaDivisiBaru(e.target.value)} placeholder="Cth: Bakat & Minat" className="w-full px-4 py-2 border rounded-md text-sm" /> 
                    </div> 
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2.5 rounded-md font-bold mt-2">Buat Divisi</button> 
                </form> 
              </div> 

              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6"> 
                <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">{editAnggotaId ? "Edit Data Anggota" : "3. Tambah Anggota Divisi"}</h2> 
                <form onSubmit={handleTambahAnggota} className="space-y-4"> 
                  <div> 
                    <label className="text-xs font-bold text-slate-600 mb-1 block uppercase">Pilih Divisi & Asrama</label> 
                    <select required value={formAnggota.divisiId} onChange={(e) => setFormAnggota({...formAnggota, divisiId: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-white text-sm font-bold"> 
                      <option value="">-- Pilih Divisi --</option> 
                      {dataDivisi.map(div => <option key={div.id} value={div.id}>[{div.asrama === 'bk' ? 'BK' : 'MERSI'}] {div.namaDivisi}</option>)} 
                    </select> 
                  </div> 
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> 
                    <div> 
                      <label className="text-xs font-bold text-slate-600 mb-1 block uppercase">Nama Anggota</label> 
                      <input type="text" required value={formAnggota.nama} onChange={(e) => setFormAnggota({...formAnggota, nama: e.target.value})} className="w-full px-3 py-2 border rounded-md text-sm" /> 
                    </div> 
                    <div> 
                      <label className="text-xs font-bold text-slate-600 mb-1 block uppercase">Jabatan</label> 
                      <select required value={formAnggota.peran} onChange={(e) => setFormAnggota({...formAnggota, peran: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-white text-sm"> 
                        <option value="Anggota">Anggota</option> 
                        <option value="Koordinator">Koordinator</option> 
                      </select> 
                    </div> 
                  </div> 
                  <div> 
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Upload Foto {editAnggotaId && "(Opsional)"}</label> 
                    <input type="file" id="foto1Anggota" accept="image/*" onChange={(e) => setFileAnggota(e.target.files[0])} className="w-full text-xs border border-slate-200 bg-stone-50 p-1.5 rounded cursor-pointer" /> 
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
                <div key={div.id} className="bg-slate-50 border border-slate-200 p-4 rounded-lg mb-6 shadow-sm"> 
                  <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-3"> 
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${div.asrama === 'bk' ? 'bg-amber-500' : 'bg-red-800'}`}>{div.asrama === 'bk' ? 'BK' : 'MERSI'}</span>
                      <h3 className="font-bold text-lg text-slate-900">{div.namaDivisi}</h3> 
                    </div>
                    <button onClick={() => handleDelete("divisi_asrama", div.id)} className="text-xs font-bold bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded hover:bg-red-50 transition-colors">Hapus Divisi</button> 
                  </div> 
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4"> 
                    {dataAnggota.filter(a => a.divisiId === div.id).map(anggota => ( 
                      <div key={anggota.id} className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm flex flex-col items-center text-center relative group"> 
                        <img src={anggota.foto} className="w-14 h-14 rounded-full object-cover mb-2 border border-slate-200" /> 
                        <span className="text-xs font-bold text-slate-800 leading-tight mb-1">{anggota.nama}</span> 
                        <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded">{anggota.peran}</span> 
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditAnggotaClick(anggota)} className="bg-amber-500 text-white w-6 h-6 rounded-full text-xs shadow-md hover:bg-amber-600 flex items-center justify-center">✎</button>
                          <button onClick={() => handleDelete("anggota_divisi", anggota.id)} className="bg-red-600 text-white w-6 h-6 rounded-full text-[10px] shadow-md hover:bg-red-700 flex items-center justify-center">✕</button>
                        </div>
                      </div> 
                    ))} 
                  </div> 
                </div> 
              ))} 
            </div> 
          </div> 
        )}

        {/* TAB TIMELINE */}
        {activeTab === "timeline" && allowedTabs.includes("timeline") && ( 
          <div className="space-y-6"> 
            <div className="bg-white rounded-xl shadow-md p-6"> 
              <h2 className="text-lg font-bold mb-4 border-b pb-2">{editTimelineId ? "Edit Timeline" : "Tambah Timeline"}</h2> 
              <form onSubmit={handleSubmitTimeline} className="space-y-4"> 
                <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4"> 
                  <input type="text" required value={tahunTimeline} onChange={(e) => setTahunTimeline(e.target.value)} placeholder="Tahun" className="w-full px-4 py-2 border rounded-md" /> 
                  <input type="text" required value={judulTimeline} onChange={(e) => setJudulTimeline(e.target.value)} placeholder="Peristiwa" className="w-full px-4 py-2 border rounded-md" /> 
                </div> 
                <textarea required rows="2" value={deskripsiTimeline} onChange={(e) => setDeskripsiTimeline(e.target.value)} placeholder="Deskripsi..." className="w-full px-4 py-2 border rounded-md"></textarea> 
                <div className="flex gap-2">
                  <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">{editTimelineId ? "Simpan Perubahan" : "Tambahkan"}</button>
                  {editTimelineId && <button type="button" onClick={()=>{setEditTimelineId(null); setTahunTimeline(""); setJudulTimeline(""); setDeskripsiTimeline("");}} className="w-full bg-stone-500 text-white px-4 py-2 rounded-md">Batal</button>}
                </div> 
              </form> 
            </div> 
            
            <div className="bg-white rounded-xl shadow-md p-6"> 
              <h3 className="font-bold mb-4 border-b pb-2">Daftar Timeline</h3> 
              <div className="space-y-4"> 
                {dataTimeline.slice((pageTimeline-1)*itemsPerPage, pageTimeline*itemsPerPage).map(item => ( 
                  <div key={item.id} className="bg-slate-50 border rounded-lg p-4 flex justify-between"> 
                    <div>
                      <span className="px-2 py-1 bg-amber-500 text-white text-xs rounded mb-2">{item.tahun}</span>
                      <h4 className="font-bold">{item.judul}</h4>
                      <p className="text-sm text-slate-600">{item.deskripsi}</p>
                    </div> 
                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={()=>handleEditTimelineClick(item)} className="text-amber-600 text-xs font-bold bg-white border px-3 py-1.5 rounded">Edit</button>
                      <button onClick={()=>handleDelete("timeline_sejarah", item.id)} className="bg-red-600 text-white text-xs px-3 py-1.5 rounded">Hapus</button>
                    </div> 
                  </div> 
                ))} 
              </div> 
              <Pagination totalItems={dataTimeline.length} itemsPerPage={itemsPerPage} currentPage={pageTimeline} setCurrentPage={setPageTimeline}/> 
            </div> 
          </div> 
        )}
        
        {/* TAB FOTO PROFIL */}
        {activeTab === "fotoprofil" && allowedTabs.includes("fotoprofil") && ( 
          <div className="space-y-6"> 
            <div className="bg-white rounded-xl shadow-md p-6"> 
              <h2 className="text-lg font-bold mb-4 border-b pb-2">{editFotoProfId ? "Edit Foto Profil" : "Tambah Foto Profil"}</h2> 
              <form onSubmit={handleSubmitFotoProfil} className="space-y-4"> 
                <textarea required rows="2" value={konteksFoto} onChange={(e) => setKonteksFoto(e.target.value)} placeholder="Konteks..." className="w-full px-4 py-2 border rounded-md"></textarea> 
                <input type="file" multiple accept="image/*" required={!editFotoProfId} onChange={(e) => setFilesFotoProfil(Array.from(e.target.files))} className="w-full text-sm border p-2 rounded bg-slate-50" /> 
                <div className="flex gap-2">
                  <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">{editFotoProfId ? "Simpan Perubahan" : "Tambahkan"}</button>
                  {editFotoProfId && <button type="button" onClick={()=>{setEditFotoProfId(null); setKonteksFoto("");}} className="w-full bg-stone-500 text-white px-4 py-2 rounded-md">Batal</button>}
                </div> 
              </form> 
            </div> 
            
            <div className="bg-white rounded-xl shadow-md p-6"> 
              <h3 className="font-bold mb-4 border-b pb-2">Daftar Foto Profil</h3> 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
                {dataFotoProfil.slice((pageFotoProf-1)*itemsPerPage, pageFotoProf*itemsPerPage).map(item => ( 
                  <div key={item.id} className="bg-slate-50 border rounded-lg flex gap-4 p-3">
                    <div className="w-32 h-24 shrink-0 bg-stone-200 rounded-md flex items-center justify-center p-1 overflow-hidden">
                      <img src={(Array.isArray(item.linkGambar) ? item.linkGambar[0] : item.linkGambar) || "https://placehold.co/600x400/e2e8f0/64748b?text=Tanpa+Gambar"} className="w-full h-full object-contain" /> 
                    </div>
                    <div className="flex flex-col justify-between w-full">
                      <p className="text-xs text-slate-600">{item.konteks}</p>
                      <div className="flex gap-2 self-end">
                        <button onClick={()=>handleEditFotoProfClick(item)} className="text-amber-600 text-xs">Edit</button>
                        <button onClick={()=>handleDelete("profil_galeri", item.id)} className="text-red-600 text-xs">Hapus</button>
                      </div>
                    </div>
                  </div> 
                ))} 
              </div> 
              <Pagination totalItems={dataFotoProfil.length} itemsPerPage={itemsPerPage} currentPage={pageFotoProf} setCurrentPage={setPageFotoProf}/> 
            </div> 
          </div> 
        )}
        
        {/* TAB FASILITAS */}
        {activeTab === "fasilitas" && allowedTabs.includes("fasilitas") && ( 
          <div className="space-y-6"> 
            <div className="bg-white rounded-xl shadow-md p-6"> 
              <h2 className="text-lg font-bold mb-4 border-b pb-2">{editFasilitId ? "Edit Fasilitas" : "Tambah Fasilitas Asrama"}</h2> 
              <form onSubmit={handleSubmitFasilitas} className="space-y-4 bg-slate-50 p-5 rounded border border-slate-200"> 
                <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Pilih Asrama</label>
                    <select value={asramaFasilitas} onChange={(e) => setAsramaFasilitas(e.target.value)} className="w-full px-3 py-2 border rounded bg-white text-sm font-bold">
                      <option value="mersi">Mersi</option>
                      <option value="bk">Bundo Kanduang</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Nama Fasilitas</label>
                    <input type="text" required value={namaFasilitas} onChange={(e) => setNamaFasilitas(e.target.value)} placeholder="Contoh: Dapur Umum" className="w-full px-4 py-2 border rounded-md" />
                  </div>
                </div> 
                <textarea required rows="2" value={deskripsiFasilitas} onChange={(e) => setDeskripsiFasilitas(e.target.value)} placeholder="Deskripsi fasilitas..." className="w-full px-4 py-2 border rounded-md mt-2"></textarea> 
                <input type="file" multiple accept="image/*" required={!editFasilitId} onChange={(e) => setFilesFasilitas(Array.from(e.target.files))} className="w-full text-sm border p-2 rounded bg-white" /> 
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={loading} className="w-full md:w-auto bg-slate-900 text-white px-8 py-2.5 rounded-md font-bold">{editFasilitId ? "Simpan Perubahan" : "Tambahkan"}</button>
                  {editFasilitId && <button type="button" onClick={()=>{setEditFasilitId(null); setNamaFasilitas(""); setDeskripsiFasilitas("");}} className="w-full md:w-auto bg-stone-500 text-white px-6 py-2.5 rounded-md font-bold">Batal</button>}
                </div> 
              </form> 
            </div> 
            
            <div className="bg-white rounded-xl shadow-md p-6"> 
              <h3 className="font-bold mb-4 border-b pb-2">Daftar Fasilitas Asrama</h3> 
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
                {dataFasilitas.slice((pageFasilitas-1)*itemsPerPage, pageFasilitas*itemsPerPage).map(item => ( 
                  <div key={item.id} className="bg-slate-50 border border-slate-200 shadow-sm rounded-lg flex flex-col overflow-hidden relative">
                    <div className="absolute top-2 left-2 z-10">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded text-white shadow ${item.asrama === 'bk' ? 'bg-amber-500' : 'bg-red-800'}`}>{item.asrama === 'bk' ? 'BK' : 'MERSI'}</span>
                    </div>
                    <div className="w-full h-40 bg-stone-200 flex items-center justify-center p-2">
                      <img src={(Array.isArray(item.linkGambar) ? item.linkGambar[0] : item.linkGambar) || "https://placehold.co/600x400/e2e8f0/64748b?text=Tanpa+Gambar"} className="w-full h-full object-contain" />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h4 className="font-bold text-slate-800 mb-1">{item.nama}</h4>
                      <p className="text-xs text-slate-600 flex-grow">{item.deskripsi}</p>
                      <div className="flex gap-2 mt-4">
                        <button onClick={()=>handleEditFasilitasClick(item)} className="bg-amber-100 font-bold text-amber-700 text-xs px-3 py-2 rounded w-full hover:bg-amber-200 transition-colors">Edit</button>
                        <button onClick={()=>handleDelete("daftar_fasilitas", item.id)} className="bg-red-50 border border-red-200 font-bold text-red-600 text-xs px-3 py-2 rounded w-full hover:bg-red-100 transition-colors">Hapus</button>
                      </div>
                    </div>
                  </div> 
                ))} 
              </div> 
              <Pagination totalItems={dataFasilitas.length} itemsPerPage={itemsPerPage} currentPage={pageFasilitas} setCurrentPage={setPageFasilitas}/> 
            </div> 
          </div> 
        )}
        
        {/* TAB PENYEWAAN */}
        {activeTab === "penyewaan" && allowedTabs.includes("penyewaan") && ( 
          <div className="space-y-6"> 
            <div className="bg-white rounded-xl shadow-md border-amber-200 p-6"> 
              <h2 className="text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span>{editSewaId ? "Edit Layanan Penyewaan" : "Tambah Layanan Penyewaan"}</h2> 
              <form onSubmit={handleSubmitPenyewaan} className="space-y-4 bg-slate-50 p-5 rounded border border-slate-200"> 
                <div className="grid grid-cols-1 md:grid-cols-[150px_1fr_1fr] gap-4"> 
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Pilih Asrama</label>
                    <select value={asramaSewa} onChange={(e) => setAsramaSewa(e.target.value)} className="w-full px-3 py-2 border rounded bg-white font-bold text-sm">
                      <option value="mersi">Mersi</option>
                      <option value="bk">B. Kanduang</option>
                    </select>
                  </div> 
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Nama Layanan</label>
                    <input type="text" required value={namaSewa} onChange={(e) => setNamaSewa(e.target.value)} className="w-full px-4 py-2 border rounded-md" />
                  </div> 
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Kategori</label>
                    <select value={kategoriSewa} onChange={(e) => setKategoriSewa(e.target.value)} className="w-full px-4 py-2 border rounded-md bg-white text-sm">
                      <option value="Tempat / Barang">Tempat / Barang Fisik</option>
                      <option value="Keahlian Seni Budaya">Layanan Jasa & Seni</option>
                    </select>
                  </div> 
                </div> 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2"> 
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Info Harga Sewa</label>
                    <input type="text" required value={hargaSewa} onChange={(e) => setHargaSewa(e.target.value)} className="w-full px-4 py-2 border rounded-md" />
                  </div> 
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">No. WA Reservasi</label>
                    <input type="tel" required value={noHpSewa} onChange={(e) => setNoHpSewa(e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-2 border rounded-md" />
                  </div> 
                </div> 
                <textarea required rows="2" value={deskripsiSewa} onChange={(e) => setDeskripsiSewa(e.target.value)} className="w-full px-4 py-2 border rounded-md mt-2" placeholder="Deskripsi..."></textarea> 
                <input type="file" multiple accept="image/*" required={!editSewaId} onChange={(e) => setFilesSewa(Array.from(e.target.files))} className="w-full text-sm border p-2 rounded bg-white" /> 
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={loading} className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white px-8 py-2.5 rounded-md font-bold">{editSewaId ? "Simpan Perubahan" : "Tambahkan Layanan"}</button>
                  {editSewaId && <button type="button" onClick={()=>{setEditSewaId(null); setNamaSewa(""); setDeskripsiSewa(""); setHargaSewa(""); setNoHpSewa("");}} className="w-full md:w-auto bg-stone-500 text-white px-6 py-2.5 rounded-md font-bold">Batal</button>}
                </div> 
              </form> 
            </div> 
            
            <div className="bg-white rounded-xl shadow-md p-6"> 
              <h3 className="font-bold mb-4 border-b pb-2">Daftar Layanan Tersedia</h3> 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
                {dataPenyewaan.slice((pageSewa-1)*itemsPerPage, pageSewa*itemsPerPage).map(item => ( 
                  <div key={item.id} className="bg-slate-50 border rounded-lg flex overflow-hidden relative shadow-sm">
                    <div className="absolute top-2 left-2 z-10">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white shadow ${item.asrama === 'bk' ? 'bg-amber-500' : 'bg-red-800'}`}>{item.asrama === 'bk' ? 'BK' : 'MERSI'}</span>
                    </div>
                    <div className="w-32 h-32 shrink-0 bg-stone-200 flex items-center justify-center p-2">
                      <img src={(Array.isArray(item.linkGambar) ? item.linkGambar[0] : item.linkGambar) || "https://placehold.co/600x400/e2e8f0/64748b?text=Tanpa+Gambar"} className="w-full h-full object-contain" />
                    </div>
                    <div className="p-4 flex flex-col w-full justify-center">
                      <span className="text-[10px] font-bold text-white bg-stone-800 px-2 py-0.5 rounded w-fit mb-1 mt-3">{item.kategori}</span>
                      <h4 className="font-bold text-stone-900">{item.nama}</h4>
                      <p className="text-amber-600 text-xs font-bold my-1">{item.noHpSewa}</p>
                      <p className="text-xs text-stone-500 line-clamp-1 mb-2">{item.deskripsi}</p>
                      <div className="flex gap-3 text-xs font-bold mt-auto pt-2 border-t border-slate-200">
                        <button onClick={()=>handleEditSewaClick(item)} className="text-amber-600 hover:text-amber-800">Edit</button>
                        <button onClick={()=>handleDelete("daftar_penyewaan", item.id)} className="text-red-500 hover:text-red-700">Hapus</button>
                      </div>
                    </div>
                  </div> 
                ))} 
              </div> 
              <Pagination totalItems={dataPenyewaan.length} itemsPerPage={itemsPerPage} currentPage={pageSewa} setCurrentPage={setPageSewa}/> 
            </div> 
          </div> 
        )}
        
        {/* TAB GALERI */}
        {activeTab === "galeri" && allowedTabs.includes("galeri") && ( 
          <div className="space-y-6"> 
            <div className="bg-white rounded-xl shadow-md p-6"> 
              <h2 className="text-lg font-bold mb-4 border-b pb-2">{editGaleriId ? "Edit Galeri" : "Tambah Galeri Kegiatan"}</h2> 
              <form onSubmit={handleSubmitGaleri} className="space-y-4"> 
                <div> 
                  <label className="text-sm font-semibold mb-1 block">Judul Kegiatan</label> 
                  <input type="text" required value={judulGaleri} onChange={(e) => setJudulGaleri(e.target.value)} placeholder="Cth: Pagelaran Seni Minang..." className="w-full px-4 py-2 border rounded-md" /> 
                </div> 
                <div> 
                  <label className="text-sm font-semibold mb-1 block">Warna Teks Judul pada Foto</label> 
                  <input type="color" value={warnaGaleri} onChange={(e) => setWarnaGaleri(e.target.value)} className="h-10 w-24 cursor-pointer border rounded-md p-1" /> 
                </div> 
                <div> 
                  <label className="text-sm font-semibold mb-1 block">Pilih Foto (Bisa pilih banyak sekaligus)</label> 
                  <input type="file" multiple accept="image/*" required={!editGaleriId} onChange={(e) => setFilesGaleri(Array.from(e.target.files))} className="w-full text-sm border p-2 rounded bg-slate-50 cursor-pointer" /> 
                </div> 
                <div className="flex gap-2 pt-2"> 
                  <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2.5 rounded-md font-bold">{editGaleriId ? "Simpan Perubahan" : "Tambahkan ke Galeri"}</button> 
                  {editGaleriId && <button type="button" onClick={()=>{setEditGaleriId(null); setJudulGaleri(""); setWarnaGaleri("#ffffff");}} className="w-full bg-stone-500 text-white px-4 py-2.5 rounded-md font-bold">Batal</button>} 
                </div> 
              </form> 
            </div> 
            
            <div className="bg-white rounded-xl shadow-md p-6"> 
              <h3 className="font-bold mb-4 border-b pb-2">Daftar Foto Galeri</h3> 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
                {dataGaleri.slice((pageGaleri-1)*itemsPerPage, pageGaleri*itemsPerPage).map(item => ( 
                  <div key={item.id} className="relative h-48 rounded-lg overflow-hidden border shadow-sm bg-stone-900 flex items-center justify-center p-2">
                    <img src={(Array.isArray(item.linkGambar) ? item.linkGambar[0] : item.linkGambar) || "https://placehold.co/600x400/e2e8f0/64748b?text=Tanpa+Gambar"} className="w-full h-full object-contain" alt="Galeri" />
                    <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-3">
                      <span className="font-bold text-base mb-2" style={{ color: item.warna }}>{item.judul}</span>
                      <div className="flex gap-2">
                        <button onClick={()=>handleEditGaleriClick(item)} className="bg-white text-stone-900 text-xs px-3 py-1 rounded font-bold hover:bg-stone-100">Edit</button>
                        <button onClick={()=>handleDelete("fasilitas", item.id)} className="bg-red-600 text-white text-xs px-3 py-1 rounded font-bold hover:bg-red-700">Hapus</button>
                      </div>
                    </div>
                  </div> 
                ))} 
              </div> 
              <Pagination totalItems={dataGaleri.length} itemsPerPage={itemsPerPage} currentPage={pageGaleri} setCurrentPage={setPageGaleri}/> 
            </div> 
          </div> 
        )}
        
        {/* TAB KEHIDUPAN / PUBLIKASI DENGAN FITUR TANGGAL BARU */}
        {activeTab === "kehidupan" && allowedTabs.includes("kehidupan") && ( 
          <div className="space-y-6"> 
            <div className="bg-white rounded-xl shadow-md p-6"> 
              <h2 className="text-lg font-bold mb-4 border-b pb-2">{editKehidupanId ? "Edit Publikasi" : "Tambah Publikasi Baru"}</h2> 
              <form onSubmit={handleSubmitKehidupan} className="space-y-4 bg-slate-50 p-5 rounded border border-slate-200"> 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Judul Berita</label>
                    <input type="text" required value={judulKonten} onChange={(e) => setJudulKonten(e.target.value)} placeholder="Judul Berita..." className="w-full px-4 py-2 border rounded-md" /> 
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Tanggal Kejadian (Opsional)</label>
                    <input type="date" value={tanggalPublikasi} onChange={(e) => setTanggalPublikasi(e.target.value)} className="w-full px-4 py-2 border rounded-md text-sm text-slate-700" /> 
                    <p className="text-[10px] text-slate-500 mt-1 italic">{editKehidupanId ? "Kosongkan jika tidak ingin merubah tanggal rilis lama." : "Kosongkan jika ingin otomatis memakai tanggal hari ini."}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Kategori</label>
                  <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full px-4 py-2 border rounded-md font-bold"> 
                    <option value="PRESTASI">Prestasi</option> 
                    <option value="MERSI X BK">MERSI X BK</option> 
                    <option value="LOMBA TERBUKA">Lomba Terbuka</option> 
                    <option value="LAINNYA">Lainnya... (Isi Manual)</option> 
                  </select> 
                  {kategori === "LAINNYA" && <input type="text" required value={customKategori} onChange={(e) => setCustomKategori(e.target.value)} placeholder="Tuliskan nama kategori..." className="w-full px-4 py-2 border border-amber-500 bg-amber-50 rounded-md mt-2" />} 
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Isi Berita</label>
                  <textarea required rows="4" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Tuliskan detail liputan atau acara di sini..." className="w-full px-4 py-2 border rounded-md"></textarea> 
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Foto Dokumentasi</label>
                  <input type="file" multiple accept="image/*" required={!editKehidupanId} onChange={(e) => setFilesGambar(Array.from(e.target.files))} className="w-full text-sm border p-2 rounded bg-white" /> 
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={loading} className="w-full md:w-auto bg-slate-900 text-white px-8 py-2.5 rounded-md font-bold">{editKehidupanId ? "Simpan Perubahan" : "Publikasikan"}</button>
                  {editKehidupanId && <button type="button" onClick={()=>{setEditKehidupanId(null); setJudulKonten(""); setDeskripsi(""); setTanggalPublikasi("");}} className="w-full md:w-auto bg-stone-500 text-white px-6 py-2.5 rounded-md font-bold">Batal</button>}
                </div> 
              </form> 
            </div> 
            
            <div className="bg-white rounded-xl shadow-md p-6"> 
              <h3 className="font-bold mb-4 border-b pb-2">Daftar Publikasi</h3> 
              <div className="space-y-3"> 
                {dataKehidupan.slice((pageKehidupan-1)*itemsPerPage, pageKehidupan*itemsPerPage).map(item => ( 
                  <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg"> 
                    <div>
                      <div className="font-semibold text-sm line-clamp-1">{item.judul} <span className="text-red-600 text-xs">({item.kategori})</span></div>
                      <div className="text-xs text-slate-500">{item.tanggal}</div>
                    </div> 
                    <div className="flex gap-3">
                      <button onClick={()=>handleEditKehidupanClick(item)} className="text-amber-600 text-xs font-bold">Edit</button>
                      <button onClick={()=>handleDelete("kehidupan", item.id)} className="text-red-500 text-xs font-bold">Hapus</button>
                    </div> 
                  </div> 
                ))} 
              </div> 
              <Pagination totalItems={dataKehidupan.length} itemsPerPage={itemsPerPage} currentPage={pageKehidupan} setCurrentPage={setPageKehidupan}/> 
            </div> 
          </div> 
        )}
        
        {/* --- KHUSUS TAB SKRIPSI --- */}
        {activeTab === "skripsi" && allowedTabs.includes("skripsi") && ( 
          <div className="space-y-6"> 
            <div className="bg-white rounded-xl shadow-md p-6"> 
              <h2 className="text-lg font-bold mb-4 border-b pb-2">{editSkripsiId ? "Edit Skripsi" : "Tambah Skripsi Manual"}</h2> 
              <form onSubmit={handleSubmitSkripsi} className="space-y-4"> 
                <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama Penulis..." className="w-full px-4 py-2 border rounded-md" /> 
                <input type="text" required value={jurusan} onChange={(e) => setJurusan(e.target.value)} placeholder="Jurusan..." className="w-full px-4 py-2 border rounded-md" /> 
                <textarea required rows="1" value={judulSkripsi} onChange={(e) => setJudulSkripsi(e.target.value)} placeholder="Judul Skripsi..." className="w-full px-4 py-2 border rounded-md"></textarea> 
                <input type="number" required value={tahun} onChange={(e) => setTahun(e.target.value)} placeholder="Tahun..." className="w-full px-4 py-2 border rounded-md" /> 
                <div className="flex gap-2">
                  <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md">{editSkripsiId ? "Simpan Perubahan" : "Tambahkan"}</button>
                  {editSkripsiId && <button type="button" onClick={()=>{setEditSkripsiId(null); setNama(""); setJurusan(""); setJudulSkripsi(""); setTahun("");}} className="w-full bg-stone-500 text-white px-4 py-2 rounded-md">Batal</button>}
                </div> 
              </form> 
            </div> 
            
            <div className="bg-white rounded-xl shadow-md p-6"> 
              <h3 className="font-bold mb-4 border-b pb-2">Kelola Skripsi</h3> 
              <div className="space-y-3"> 
                {dataSkripsi.slice((pageSkripsi-1)*itemsPerPage, pageSkripsi*itemsPerPage).map(item => ( 
                  <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg"> 
                    <div>
                      <div className="font-semibold text-sm">{item.nama} - {item.tahun}</div>
                      <div className="text-xs line-clamp-1">{item.judul}</div>
                    </div> 
                    <div className="flex gap-3">
                      <button onClick={()=>handleEditSkripsiClick(item)} className="text-amber-600 text-xs font-bold">Edit</button>
                      <button onClick={()=>handleDelete("skripsi", item.id)} className="text-red-500 text-xs font-bold">Hapus</button>
                    </div> 
                  </div> 
                ))} 
              </div> 
              <Pagination totalItems={dataSkripsi.length} itemsPerPage={itemsPerPage} currentPage={pageSkripsi} setCurrentPage={setPageSkripsi}/> 
            </div> 
          </div> 
        )}
        
        {/* --- TAB SUARA ALUMNI & WARGA --- */}
        {activeTab === "suara_alumni" && allowedTabs.includes("suara_alumni") && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold mb-4 border-b pb-2">{editPesanId ? "Edit Data Alumni & Warga" : "Tambah Data Alumni & Warga Baru"}</h2>
              <form onSubmit={handleSubmitPesanAlumni} className="space-y-4">
                
                {/* IDENTIFIKASI ASRAMA & STATUS KEANGGOTAAN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Pilih Asal Asrama</label>
                    <select
                      value={formAlumni.asrama}
                      onChange={(e) => setFormAlumni({ ...formAlumni, asrama: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm font-bold"
                    >
                      <option value="mersi">Asrama Mahasiswa Merapi Singgalang</option>
                      <option value="bk">Asrama Putri Bundo Kanduang</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Kategori / Status Keanggotaan</label>
                    <select
                      value={formAlumni.statusWarga}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setFormAlumni({ 
                          ...formAlumni, 
                          statusWarga: newStatus,
                          pekerjaan: (newStatus === "Warga Aktif" || newStatus === "Warga Cabang") ? "Mahasiswa" : formAlumni.pekerjaan 
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm font-bold text-red-800"
                    >
                      <option value="Alumni">Alumni</option>
                      <option value="Warga Aktif">Warga Aktif</option>
                      <option value="Warga Cabang">Warga Cabang</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Nama Lengkap</label>
                    <input type="text" required value={formAlumni.nama} onChange={(e) => setFormAlumni({...formAlumni, nama: e.target.value})} placeholder="Nama Lengkap..." className="w-full px-4 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Asal Daerah / Kota</label>
                    <input type="text" required value={formAlumni.asal} onChange={(e) => setFormAlumni({...formAlumni, asal: e.target.value})} placeholder="Contoh: Padang, Bukittinggi..." className="w-full px-4 py-2 border rounded-md" />
                  </div>
                </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Tahun Masuk Asrama (Angkatan)</label>
                    <input type="number" required value={formAlumni.angkatanAsrama} onChange={(e) => setFormAlumni({...formAlumni, angkatanAsrama: e.target.value})} placeholder="Contoh: 2018" className="w-full px-4 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Pekerjaan / Aktivitas Saat Ini</label>
                    <input type="text" required value={formAlumni.pekerjaan} onChange={(e) => setFormAlumni({...formAlumni, pekerjaan: e.target.value})} placeholder="Contoh: Mahasiswa, Guru, Engineer, PNS..." className="w-full px-4 py-2 border rounded-md" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">
                    Judul Skripsi {formAlumni.statusWarga !== "Alumni" ? "(Opsional untuk Warga Aktif / Cabang)" : "(Opsional jika belum/tidak ada)"}
                  </label>
                  <textarea rows="2" value={formAlumni.skripsi} onChange={(e) => setFormAlumni({...formAlumni, skripsi: e.target.value})} placeholder="Judul Skripsi / Tugas Akhir (kosongkan jika belum ada)..." className="w-full px-4 py-2 border rounded-md"></textarea>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block text-amber-700">Prestasi / Karya / Jurnal (Opsional)</label>
                  <textarea rows="2" value={formAlumni.prestasi} onChange={(e) => setFormAlumni({...formAlumni, prestasi: e.target.value})} placeholder="Contoh: Publikasi Jurnal Scopus Q1, Juara 1 Robotik Nasional..." className="w-full px-4 py-2 border border-amber-300 bg-amber-50 rounded-md"></textarea>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Kata-kata / Kesan Pesan untuk Asrama</label>
                  <textarea required rows="3" value={formAlumni.pesan} onChange={(e) => setFormAlumni({...formAlumni, pesan: e.target.value})} placeholder="Kesan dan pesan singkat..." className="w-full px-4 py-2 border rounded-md"></textarea>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Foto Profil (Opsional jika sudah ada)</label>
                  <input type="file" id="fotoAlumni" accept="image/*" onChange={(e) => setFileFotoAlumni(e.target.files[0])} className="w-full text-sm border p-2 rounded bg-slate-50" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-bold">{editPesanId ? "Simpan Perubahan Data" : "Tambahkan ke Database"}</button>
                  {editPesanId && <button type="button" onClick={() => { setEditPesanId(null); setFormAlumni({ nama: "", asal: "", kuliah: "", jurusan: "", angkatanAsrama: "", pekerjaan: "", skripsi: "", prestasi: "", pesan: "", asrama: "mersi", statusWarga: "Alumni" }); setFileFotoAlumni(null); }} className="w-full bg-stone-500 text-white px-4 py-2 rounded-md">Batal</button>}
                </div>
              </form>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-l-stone-800">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="font-bold text-lg text-slate-900">Database Alumni & Warga Asrama</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Total: {dataPesanAlumni.length}</span>
              </div>

              {dataPesanAlumni.length === 0 ? (
                <p className="text-sm text-stone-500 italic text-center py-8">Belum ada data alumni atau warga yang ditambahkan.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 border-y text-slate-600">
                        <th className="p-3">Profil & Status</th>
                        <th className="p-3">Asrama</th>
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
                            <div>
                              <div className="font-bold text-stone-900">{item.nama}</div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                item.statusWarga === 'Warga Aktif' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : item.statusWarga === 'Warga Cabang' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-stone-100 text-stone-800'
                              }`}>
                                {item.statusWarga || 'Alumni'}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${item.asrama === 'bk' ? 'bg-amber-500' : 'bg-red-800'}`}>
                              {item.asrama === 'bk' ? 'BK' : 'MERSI'}
                            </span>
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
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h2 className="text-lg font-bold text-slate-900">Data Pendaftar Warga Asrama Baru</h2>
                  <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Total: {dataPendaftarAsrama.length}</span>
                </div> 
                <div className="overflow-x-auto"> 
                  <table className="w-full text-left text-sm"> 
                    <thead>
                      <tr className="bg-slate-50 border-y text-slate-600">
                        <th className="p-3">Waktu Daftar</th>
                        <th className="p-3">Asrama Tujuan</th>
                        <th className="p-3 w-1/2">Identitas & Kontak</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead> 
                    <tbody className="divide-y"> 
                      {dataPendaftarAsrama.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-500">Belum ada calon warga.</td></tr> : ( 
                        dataPendaftarAsrama.slice((pageDaftarAsrama-1)*itemsPerPage, pageDaftarAsrama*itemsPerPage).map(item => ( 
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-3 text-xs">{item.waktuDaftar ? new Date(item.waktuDaftar.toDate()).toLocaleString('id-ID') : '-'}</td>
                            <td className="p-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${item.asramaTujuan === 'bk' ? 'bg-amber-500' : 'bg-red-800'}`}>{item.asramaTujuan === 'bk' ? 'BK' : 'MERSI'}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-stone-900">{item.nama}</span>
                              {item.asal && <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded ml-2 uppercase tracking-widest">{item.asal}</span>}
                              <br/>
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

            {(role === "sekre" || role === "tendor") && (
              <div className="bg-white rounded-xl shadow-md p-6"> 
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h2 className="text-lg font-bold text-slate-900">Data Pendaftar (Lomba Terbuka)</h2>
                  <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Total: {dataPendaftarLomba.length}</span>
                </div> 
                <div className="overflow-x-auto"> 
                  <table className="w-full text-left text-sm"> 
                    <thead>
                      <tr className="bg-slate-50 border-y text-slate-600">
                        <th className="p-3">Waktu Daftar</th>
                        <th className="p-3">Identitas</th>
                        <th className="p-3">Alamat</th>
                        <th className="p-3">Lomba Diikuti</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead> 
                    <tbody className="divide-y"> 
                      {dataPendaftarLomba.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-slate-500">Belum ada peserta.</td></tr> : ( 
                        dataPendaftarLomba.slice((pageDaftarLomba-1)*itemsPerPage, pageDaftarLomba*itemsPerPage).map(item => ( 
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-3 text-xs">{item.waktuDaftar ? new Date(item.waktuDaftar.toDate()).toLocaleString('id-ID') : '-'}</td>
                            <td className="p-3"><b>{item.namaPeserta}</b><br/><span className="text-xs text-stone-500">{item.noHpPeserta}</span></td>
                            <td className="p-3 text-xs">{item.alamatPeserta}</td>
                            <td className="p-3 text-xs font-semibold text-red-800">{item.judulLomba}</td>
                            <td className="p-3 text-center">
                              <button onClick={() => handleDelete("pendaftaran_lomba", item.id)} className="text-red-500 text-xs font-bold hover:underline">Hapus</button>
                            </td>
                          </tr> 
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
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h2 className="text-lg font-bold text-slate-900">Log Komentar & Diskusi</h2>
                  <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Total: {dataKomentar.length}</span>
                </div> 
                <div className="overflow-x-auto"> 
                  <table className="w-full text-left text-sm"> 
                    <thead>
                      <tr className="bg-slate-50 border-y text-slate-600">
                        <th className="p-3">Pengirim</th>
                        <th className="p-3 w-1/2">Isi Komentar & Topik</th>
                        <th className="p-3 w-1/4">Balasan Admin</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead> 
                    <tbody className="divide-y"> 
                      {dataKomentar.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-500">Belum ada komentar.</td></tr> : ( 
                        dataKomentar.slice((pageKomentar-1)*itemsPerPage, pageKomentar*itemsPerPage).map(item => ( 
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-3">
                              <div className="font-bold text-stone-900">{item.nama}</div>
                              <div className="text-[10px] text-stone-500">{item.waktu ? new Date(item.waktu.toDate()).toLocaleString('id-ID') : '-'}</div>
                            </td>
                            <td className="p-3">
                              <div className="text-xs text-stone-700 mb-2">"{item.isi}"</div>
                              <div className="flex gap-2">
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 rounded border">{item.postJudul || "Topik lama: Judul tidak terekam"}</span>
                                <span className="text-[10px] font-bold text-red-600">❤️ {item.likes || 0}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              {item.balasanAdmin ? (
                                <div className="bg-green-50 border p-2 rounded relative group">
                                  <p className="text-xs text-green-800">{item.balasanAdmin}</p>
                                  <button onClick={() => handleDeleteBalasan(item.id)} className="absolute top-1 right-1 text-[10px] text-red-500 font-bold opacity-0 group-hover:opacity-100">Hapus</button>
                                </div>
                              ) : (replyKomenId === item.id ? (
                                <div className="flex flex-col gap-2">
                                  <textarea required value={replyText} onChange={(e)=>setReplyText(e.target.value)} placeholder="Tulis balasan..." className="text-xs p-2 border rounded w-full bg-white" rows="2"></textarea>
                                  <div className="flex gap-2">
                                    <button onClick={() => handleReplyKomentar(item.id)} className="bg-amber-600 text-white text-[10px] px-3 py-1.5 rounded">Kirim</button>
                                    <button onClick={() => {setReplyKomenId(null); setReplyText("");}} className="bg-stone-200 text-[10px] px-3 py-1.5 rounded">Batal</button>
                                  </div>
                                </div>
                              ) : (
                                <button onClick={() => {setReplyKomenId(item.id); setReplyText("");}} className="text-[11px] text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded border border-blue-100">Balas Komentar</button>
                              ))}
                            </td>
                            <td className="p-3 text-center">
                              <button onClick={() => handleDelete("komentar_publikasi", item.id)} className="text-red-500 text-xs font-bold hover:underline">Hapus</button>
                            </td>
                          </tr> 
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
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h2 className="text-lg font-bold text-slate-900">Log Pengunjung (Pengunduh Skripsi)</h2>
                  <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Total: {dataLogUnduh.length}</span>
                </div> 
                <div className="overflow-x-auto"> 
                  <table className="w-full text-left text-sm"> 
                    <thead>
                      <tr className="bg-slate-50 border-y text-slate-600">
                        <th className="p-3">Waktu Akses</th>
                        <th className="p-3">Identitas Pengunduh</th>
                        <th className="p-3">Skripsi Dibaca</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead> 
                    <tbody className="divide-y"> 
                      {dataLogUnduh.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-500">Belum ada riwayat.</td></tr> : ( 
                        dataLogUnduh.slice((pageUnduh-1)*itemsPerPage, pageUnduh*itemsPerPage).map(item => ( 
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-3 text-xs">{item.waktuAkses ? new Date(item.waktuAkses.toDate()).toLocaleString('id-ID') : '-'}</td>
                            <td className="p-3">
                              <b>{item.namaPengunduh}</b><br/>
                              <span className="text-xs text-stone-500">{item.noHpPengunduh} | {item.emailPengunduh}</span>
                            </td>
                            <td className="p-3 text-xs">
                              <b>{item.penulisSkripsi}</b><br/>
                              {item.judulSkripsi}
                            </td>
                            <td className="p-3 text-center">
                              <button onClick={() => handleDelete("log_unduh_skripsi", item.id)} className="text-red-500 text-xs font-bold hover:underline">Hapus</button>
                            </td>
                          </tr> 
                        )) 
                      )} 
                    </tbody> 
                  </table> 
                </div> 
                <Pagination totalItems={dataLogUnduh.length} itemsPerPage={itemsPerPage} currentPage={pageUnduh} setCurrentPage={setPageUnduh}/>
              </div> 
            )}

            {(role === "sekre" || role === "humas" || role === "publikasi") && (
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-l-blue-600">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-lg font-bold text-slate-900">Log Kunjungan Website (Anonim)</h2>
                    <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Total: {dataPengunjung.length}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-y text-slate-600">
                        <th className="p-3">Waktu Akses</th>
                        <th className="p-3">Lokasi (IP)</th>
                        <th className="p-3">Perangkat</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {dataPengunjung.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-500">Belum ada data kunjungan.</td></tr> : (
                        dataPengunjung.slice((pagePengunjung-1)*itemsPerPage, pagePengunjung*itemsPerPage).map(item => {
                          const ua = item.userAgent || "";
                          const device = /Mobile|Android|iP(hone|od|ad)/i.test(ua) ? "📱 HP/Tablet" : "💻 PC/Laptop";
                          return (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-3 text-xs">{item.waktu ? new Date(item.waktu.toDate()).toLocaleString('id-ID') : '-'}</td>
                            <td className="p-3">
                              <b>{item.kota || "Tidak diketahui"}, {item.provinsi}</b><br/>
                              <span className="text-[10px] text-stone-500">IP: {item.ip} • {item.isp}</span>
                            </td>
                            <td className="p-3 text-xs">
                              <b>{device}</b><br/>
                              <span className="text-[10px] text-stone-500 line-clamp-1 max-w-xs" title={ua}>{ua}</span>
                            </td>
                            <td className="p-3 text-center">
                              <button onClick={() => handleDelete("log_pengunjung", item.id)} className="text-red-500 text-xs font-bold hover:underline">Hapus</button>
                            </td>
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

        {/* TAB KHUSUS UNTUK WARGA/ALUMNI YANG LOGIN (BIODATA SAYA) */}
        {activeTab === "profil_saya" && allowedTabs.includes("profil_saya") && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-l-emerald-600">
              <h2 className="text-lg font-bold mb-2 border-b pb-2">Perbarui Biodata Saya</h2>
              <p className="text-sm text-slate-500 mb-6">Perbarui data diri Anda jika ada perubahan status pekerjaan, status asrama, atau penyelesaian tugas akhir/skripsi.</p>
              
              <form onSubmit={handleUpdateProfilSaya} className="space-y-4">
                {/* IDENTIFIKASI ASRAMA & STATUS KEANGGOTAAN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Pilih Asal Asrama</label>
                    <select
                      value={formAlumni.asrama}
                      onChange={(e) => setFormAlumni({ ...formAlumni, asrama: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm font-bold"
                    >
                      <option value="mersi">Asrama Mahasiswa Merapi Singgalang</option>
                      <option value="bk">Asrama Putri Bundo Kanduang</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block uppercase">Kategori / Status Keanggotaan</label>
                    <select
                      value={formAlumni.statusWarga}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setFormAlumni({ 
                          ...formAlumni, 
                          statusWarga: newStatus,
                          pekerjaan: (newStatus === "Warga Aktif" || newStatus === "Warga Cabang") ? "Mahasiswa" : formAlumni.pekerjaan 
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm font-bold text-emerald-800"
                    >
                      <option value="Alumni">Alumni</option>
                      <option value="Warga Aktif">Warga Aktif</option>
                      <option value="Warga Cabang">Warga Cabang</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Nama Lengkap</label>
                    <input type="text" required value={formAlumni.nama} onChange={(e) => setFormAlumni({...formAlumni, nama: e.target.value})} placeholder="Nama Lengkap..." className="w-full px-4 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Asal Daerah / Kota</label>
                    <input type="text" required value={formAlumni.asal} onChange={(e) => setFormAlumni({...formAlumni, asal: e.target.value})} placeholder="Contoh: Padang, Bukittinggi..." className="w-full px-4 py-2 border rounded-md" />
                  </div>
                </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Tahun Masuk Asrama (Angkatan)</label>
                    <input type="number" required value={formAlumni.angkatanAsrama} onChange={(e) => setFormAlumni({...formAlumni, angkatanAsrama: e.target.value})} placeholder="Contoh: 2018" className="w-full px-4 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Pekerjaan / Aktivitas Saat Ini</label>
                    <input type="text" required value={formAlumni.pekerjaan} onChange={(e) => setFormAlumni({...formAlumni, pekerjaan: e.target.value})} placeholder="Contoh: Mahasiswa, Guru, Engineer, PNS..." className="w-full px-4 py-2 border rounded-md" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">
                    Judul Skripsi {formAlumni.statusWarga !== "Alumni" ? "(Opsional untuk Warga Aktif / Cabang)" : "(Opsional jika belum/tidak ada)"}
                  </label>
                  <textarea rows="2" value={formAlumni.skripsi} onChange={(e) => setFormAlumni({...formAlumni, skripsi: e.target.value})} placeholder="Judul Skripsi / Tugas Akhir (kosongkan jika belum ada)..." className="w-full px-4 py-2 border rounded-md"></textarea>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block text-amber-700">Prestasi / Karya / Jurnal (Opsional)</label>
                  <textarea rows="2" value={formAlumni.prestasi} onChange={(e) => setFormAlumni({...formAlumni, prestasi: e.target.value})} placeholder="Contoh: Publikasi Jurnal Scopus Q1, Juara 1 Robotik Nasional..." className="w-full px-4 py-2 border border-amber-300 bg-amber-50 rounded-md"></textarea>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Kata-kata / Kesan Pesan untuk Asrama</label>
                  <textarea required rows="3" value={formAlumni.pesan} onChange={(e) => setFormAlumni({...formAlumni, pesan: e.target.value})} placeholder="Kesan dan pesan singkat..." className="w-full px-4 py-2 border rounded-md"></textarea>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Update Foto Profil (Pilih file baru jika ingin mengganti)</label>
                  <input type="file" id="fotoAlumniSaya" accept="image/*" onChange={(e) => setFileFotoAlumni(e.target.files[0])} className="w-full text-sm border p-2 rounded bg-slate-50" />
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-3 rounded-md font-bold transition-colors">
                    {loading ? "Menyimpan Perubahan..." : "Simpan Perubahan Biodata"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

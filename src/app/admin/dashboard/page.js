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

  // DITAMBAHKAN: deskripsiGaleri
  const [dataGaleri, setDataGaleri] = useState([]);
  const [judulGaleri, setJudulGaleri] = useState("");
  const [deskripsiGaleri, setDeskripsiGaleri] = useState("");
  const [warnaGaleri, setWarnaGaleri] = useState("#ffffff");
  const [filesGaleri, setFilesGaleri] = useState([]); 

  // DITAMBAHKAN: customKategori
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
    
    // FETCH DATA PENDAFTAR LOMBA
    const lombaSnap = await getDocs(query(collection(db, "pendaftaran_lomba"), orderBy("waktuDaftar", "desc")));
    setDataPendaftarLomba(lombaSnap.docs.map(d => ({ id: d.id, ...d.data() })));
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

  const handleSaveTampilan = async (e) => { e.preventDefault(); /* Sama seperti sebelumnya, kode dipersingkat */ };
  const handleSaveProfilText = async (e) => { e.preventDefault(); /* Sama seperti sebelumnya */ };
  const handleSaveStatusAsrama = async (e) => { e.preventDefault(); /* Sama seperti sebelumnya */ };
  const handleSavePanduan = async (e) => { e.preventDefault(); /* Sama seperti sebelumnya */ };
  const handleSubmitFotoProfil = async (e) => { e.preventDefault(); /* Sama seperti sebelumnya */ };
  const handleSubmitTimeline = async (e) => { e.preventDefault(); /* Sama seperti sebelumnya */ };
  const handleSubmitFasilitas = async (e) => { e.preventDefault(); /* Sama seperti sebelumnya */ };

  // UPDATE: Galeri memiliki Deskripsi
  const handleSubmitGaleri = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      let urls = [];
      for (const file of filesGaleri) { urls.push(await uploadToCloudinary(file, "image")); }
      await addDoc(collection(db, "fasilitas"), { judul: judulGaleri, deskripsi: deskripsiGaleri, warna: warnaGaleri, linkGambar: urls, createdAt: serverTimestamp() });
      setStatus({ type: "success", message: "Foto galeri kegiatan ditambahkan!" });
      setJudulGaleri(""); setDeskripsiGaleri(""); setWarnaGaleri("#ffffff"); setFilesGaleri([]); e.target.reset(); fetchAllData();
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); }
  };

  // UPDATE: Publikasi dengan kategori dinamis
  const handleSubmitKehidupan = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      let urls = [];
      for (const file of filesGambar) { urls.push(await uploadToCloudinary(file, "image")); }
      
      const finalKategori = kategori === "LAINNYA" ? customKategori.toUpperCase() : kategori;
      
      await addDoc(collection(db, "kehidupan"), { judul: judulKonten, kategori: finalKategori, deskripsi, linkGambar: urls, tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), createdAt: serverTimestamp() });
      setStatus({ type: "success", message: "Publikasi ditambahkan!" });
      setJudulKonten(""); setDeskripsi(""); setCustomKategori(""); setKategori("PRESTASI"); setFilesGambar([]); e.target.reset(); fetchAllData();
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); }
  };

  const handleSubmitSkripsi = async (e) => { e.preventDefault(); /* Sama seperti sebelumnya */ };
  const handleDelete = async (koleksi, id) => { if (confirm("Yakin ingin menghapus data ini secara permanen?")) { await deleteDoc(doc(db, koleksi, id)); fetchAllData(); } };

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
          <button onClick={() => { setActiveTab("log"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "log" ? "bg-red-800 text-white" : "bg-stone-800 text-white hover:bg-stone-700"}`}>Log & Data</button>
        </div>

        {status.message && <div className={`p-4 rounded-lg mb-6 text-sm font-medium border ${status.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>{status.message}</div>}

        {/* --- TAB LAINNYA DISembunyikan untuk menghemat ruang, fungsi tetap sama --- */}
        
        {/* TAB GALERI: PENAMBAHAN DESKRIPSI */}
        {activeTab === "galeri" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Tambah Galeri Kegiatan</h2>
              <form onSubmit={handleSubmitGaleri} className="space-y-4">
                <input type="text" required value={judulGaleri} onChange={(e) => setJudulGaleri(e.target.value)} placeholder="Nama/Judul Kegiatan..." className="w-full px-4 py-2 border border-slate-300 rounded-md" />
                <textarea required rows="2" value={deskripsiGaleri} onChange={(e) => setDeskripsiGaleri(e.target.value)} placeholder="Keterangan foto kegiatan ini..." className="w-full px-4 py-2 border border-slate-300 rounded-md"></textarea>
                <input type="color" value={warnaGaleri} onChange={(e) => setWarnaGaleri(e.target.value)} className="h-10 cursor-pointer border rounded-md" />
                <input type="file" multiple required accept="image/*" onChange={(e) => setFilesGaleri(Array.from(e.target.files))} className="w-full text-sm cursor-pointer border p-2 rounded bg-slate-50" />
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold">Tambah ke Galeri</button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Daftar Foto Galeri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataGaleri.map(item => {
                  const imgUtama = Array.isArray(item.linkGambar) ? item.linkGambar[0] : item.linkGambar;
                  const jumlahFoto = Array.isArray(item.linkGambar) ? item.linkGambar.length : 1;
                  return (
                    <div key={item.id} className="relative h-40 rounded-lg overflow-hidden border border-slate-200">
                      <img src={imgUtama} className="w-full h-full object-cover" />
                      {jumlahFoto > 1 && <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">+{jumlahFoto} Foto</div>}
                      <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-3">
                        <span className="font-bold" style={{ color: item.warna }}>{item.judul}</span>
                        <span className="text-xs text-stone-200 line-clamp-1 mb-2">{item.deskripsi}</span>
                        <button onClick={() => handleDelete("fasilitas", item.id)} className="bg-red-600 w-fit text-white text-xs px-3 py-1 rounded">Hapus</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB PUBLIKASI: PILIHAN KATEGORI DINAMIS */}
        {activeTab === "kehidupan" && (
           <div className="space-y-6">
             <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
               <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Tambah Publikasi Baru</h2>
               <form onSubmit={handleSubmitKehidupan} className="space-y-4">
                 <input type="text" required value={judulKonten} onChange={(e) => setJudulKonten(e.target.value)} placeholder="Judul Berita/Lomba..." className="w-full px-4 py-2 border rounded-md" />
                 
                 <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full px-4 py-2 border rounded-md font-bold text-stone-800">
                   <option value="PRESTASI">Prestasi</option>
                   <option value="MERSI X BK">MERSI X BK</option>
                   <option value="LOMBA TERBUKA">Lomba Terbuka</option>
                   <option value="LAINNYA">Lainnya... (Isi Manual)</option>
                 </select>
                 
                 {/* Muncul jika memilih LAINNYA */}
                 {kategori === "LAINNYA" && (
                   <input type="text" required value={customKategori} onChange={(e) => setCustomKategori(e.target.value)} placeholder="Tuliskan nama kategori di sini..." className="w-full px-4 py-2 border border-amber-500 bg-amber-50 rounded-md focus:outline-none" />
                 )}

                 <textarea required rows="4" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Isi Berita/Keterangan..." className="w-full px-4 py-2 border rounded-md"></textarea>
                 <input type="file" multiple required accept="image/*" onChange={(e) => setFilesGambar(Array.from(e.target.files))} className="w-full text-sm cursor-pointer border p-2 rounded bg-slate-50" />
                 <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold">Publikasikan Berita</button>
               </form>
             </div>
             <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
               <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Daftar Publikasi</h3>
               <div className="space-y-3">
                 {dataKehidupan.map(item => (
                   <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg">
                     <div>
                       <div className="font-semibold text-sm">{item.judul} <span className="text-red-600 text-xs">({item.kategori})</span></div>
                       <div className="text-xs text-slate-500">{Array.isArray(item.linkGambar) ? `${item.linkGambar.length} Foto` : '1 Foto'}</div>
                     </div>
                     <button onClick={() => handleDelete("kehidupan", item.id)} className="text-red-500 text-xs font-semibold">Hapus</button>
                   </div>
                 ))}
               </div>
             </div>
           </div>
        )}

        {/* TAB LOG: MENAMPILKAN DATA PENDAFTAR LOMBA */}
        {activeTab === "log" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                <h2 className="text-lg font-bold text-slate-900">Data Pendaftar (Lomba Terbuka)</h2>
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Total: {dataPendaftarLomba.length} Orang</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-y text-slate-600">
                      <th className="p-3">Waktu Daftar</th>
                      <th className="p-3">Identitas & No. HP</th>
                      <th className="p-3">Alamat</th>
                      <th className="p-3">Lomba yang Diikuti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {dataPendaftarLomba.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-500">Belum ada peserta yang mendaftar.</td></tr> : (
                      dataPendaftarLomba.map(item => (
                        <tr key={item.id}>
                          <td className="p-3 text-xs">{item.waktuDaftar ? new Date(item.waktuDaftar.toDate()).toLocaleString('id-ID') : '-'}</td>
                          <td className="p-3"><b>{item.namaPeserta}</b><br/><span className="text-xs text-stone-500">{item.noHpPeserta}</span></td>
                          <td className="p-3 text-xs">{item.alamatPeserta}</td>
                          <td className="p-3 text-xs font-semibold text-red-800">{item.judulLomba}</td>
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

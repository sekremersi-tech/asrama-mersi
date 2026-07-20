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

  // State: Tampilan Foto Utama
  const [tampilanUrls, setTampilanUrls] = useState({ hero: "", profil: "", kehidupan: "", alumni: "", gateway1: "", gateway2: "", gateway3: "" });
  const [tampilanFiles, setTampilanFiles] = useState({ hero: null, profil: null, kehidupan: null, alumni: null, gateway1: null, gateway2: null, gateway3: null });
  
  // State: Teks Profil & Kontak Ketua
  const [profilText, setProfilText] = useState({ sejarah: "", visi: "", misi: "", jejakAlumni: "", nilai1: "", nilai2: "", nilai3: "" });
  const [kontak, setKontak] = useState({ namaKetua: "", noTelpon: "" });

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

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    const docSnap = await getDoc(doc(db, "pengaturan", "tampilan"));
    if (docSnap.exists()) setTampilanUrls(docSnap.data());
    
    const docProfil = await getDoc(doc(db, "pengaturan", "profilText"));
    if (docProfil.exists()) setProfilText(docProfil.data());

    const docKontak = await getDoc(doc(db, "pengaturan", "kontak"));
    if (docKontak.exists()) setKontak(docKontak.data());

    const galSnap = await getDocs(query(collection(db, "fasilitas"), orderBy("createdAt", "desc")));
    setDataGaleri(galSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    const kehSnap = await getDocs(query(collection(db, "kehidupan"), orderBy("createdAt", "desc")));
    setDataKehidupan(kehSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    const skrSnap = await getDocs(query(collection(db, "skripsi"), orderBy("tahun", "desc")));
    setDataSkripsi(skrSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const uploadToCloudinary = async (file, resourceType = "image") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, { method: "POST", body: formData });
    const data = await res.json();
    return data.secure_url;
  };

  const handleSaveTampilan = async (e) => {
    e.preventDefault(); setLoading(true); setStatus({ type: "", message: "" });
    try {
      let newUrls = { ...tampilanUrls };
      const keys = ["hero", "profil", "kehidupan", "alumni", "gateway1", "gateway2", "gateway3"];
      for (let key of keys) {
        if (tampilanFiles[key]) newUrls[key] = await uploadToCloudinary(tampilanFiles[key], "image");
      }
      await setDoc(doc(db, "pengaturan", "tampilan"), newUrls, { merge: true });
      setTampilanUrls(newUrls); 
      setTampilanFiles({ hero: null, profil: null, kehidupan: null, alumni: null, gateway1: null, gateway2: null, gateway3: null });
      setStatus({ type: "success", message: "Semua foto utama berhasil diperbarui!" });
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

  const handleSubmitGaleri = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const linkGambar = await uploadToCloudinary(fileGaleri, "image");
      await addDoc(collection(db, "fasilitas"), { judul: judulGaleri, warna: warnaGaleri, linkGambar, createdAt: serverTimestamp() });
      setStatus({ type: "success", message: "Foto galeri ditambahkan!" });
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
      if (filePDF) linkPDF = await uploadToCloudinary(filePDF, "raw");
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

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex space-x-2 mb-8 bg-white p-2 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <button onClick={() => { setActiveTab("tampilan"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "tampilan" ? "bg-red-50 text-red-800" : "text-slate-700 hover:bg-slate-50"}`}>Pengaturan Teks & Foto</button>
          <button onClick={() => { setActiveTab("galeri"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "galeri" ? "bg-red-50 text-red-800" : "text-slate-700 hover:bg-slate-50"}`}>Galeri Kegiatan</button>
          <button onClick={() => { setActiveTab("kehidupan"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "kehidupan" ? "bg-red-50 text-red-800" : "text-slate-700 hover:bg-slate-50"}`}>Media & Publikasi</button>
          <button onClick={() => { setActiveTab("skripsi"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "skripsi" ? "bg-red-50 text-red-800" : "text-slate-700 hover:bg-slate-50"}`}>Repositori Skripsi</button>
        </div>

        {status.message && <div className={`p-4 rounded-lg mb-6 text-sm font-medium border ${status.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>{status.message}</div>}

        {/* TAB 1: PENGATURAN TEKS & FOTO */}
        {activeTab === "tampilan" && (
          <div className="space-y-6">
            
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Edit Teks Website Asrama</h2>
              <form onSubmit={handleSaveProfilText} className="space-y-6">
                
                {/* Kontak Ketua */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-red-800 border-l-2 border-red-800 pl-2">Kontak Asrama (Footer)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-slate-800 text-sm block mb-1">Nama Ketua Asrama</label>
                      <input required type="text" value={kontak.namaKetua} onChange={(e) => setKontak({...kontak, namaKetua: e.target.value})} className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-md focus:ring-2 focus:ring-red-800" placeholder="Cth: Uda Fulan" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-800 text-sm block mb-1">Nomor WhatsApp / Telp</label>
                      <input required type="text" value={kontak.noTelpon} onChange={(e) => setKontak({...kontak, noTelpon: e.target.value})} className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-md focus:ring-2 focus:ring-red-800" placeholder="Cth: 08123456789" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-red-800 border-l-2 border-red-800 pl-2">Halaman Profil</h3>
                  <div>
                    <label className="font-semibold text-slate-800 text-sm block mb-1">Sejarah Asrama</label>
                    <textarea required rows="4" value={profilText.sejarah} onChange={(e) => setProfilText({...profilText, sejarah: e.target.value})} className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-md focus:ring-2 focus:ring-red-800"></textarea>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-slate-800 text-sm block mb-1">Visi</label>
                      <textarea required rows="3" value={profilText.visi} onChange={(e) => setProfilText({...profilText, visi: e.target.value})} className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-md focus:ring-2 focus:ring-red-800"></textarea>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-800 text-sm block mb-1">Misi</label>
                      <textarea required rows="3" value={profilText.misi} onChange={(e) => setProfilText({...profilText, misi: e.target.value})} className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-md focus:ring-2 focus:ring-red-800"></textarea>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="font-semibold text-slate-800 text-xs block mb-1">Nilai: Sistem Silang</label>
                      <textarea required rows="2" value={profilText.nilai1} onChange={(e) => setProfilText({...profilText, nilai1: e.target.value})} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 text-sm rounded-md focus:ring-2 focus:ring-red-800"></textarea>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-800 text-xs block mb-1">Nilai: Intelektualitas</label>
                      <textarea required rows="2" value={profilText.nilai2} onChange={(e) => setProfilText({...profilText, nilai2: e.target.value})} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 text-sm rounded-md focus:ring-2 focus:ring-red-800"></textarea>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-800 text-xs block mb-1">Nilai: Kemandirian</label>
                      <textarea required rows="2" value={profilText.nilai3} onChange={(e) => setProfilText({...profilText, nilai3: e.target.value})} className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 text-sm rounded-md focus:ring-2 focus:ring-red-800"></textarea>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-red-800 border-l-2 border-red-800 pl-2">Halaman Jaringan Alumni</h3>
                  <div>
                    <label className="font-semibold text-slate-800 text-sm block mb-1">Teks Jejak Alumni</label>
                    <textarea required rows="2" value={profilText.jejakAlumni} onChange={(e) => setProfilText({...profilText, jejakAlumni: e.target.value})} className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-md focus:ring-2 focus:ring-red-800"></textarea>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="bg-slate-900 text-white px-6 py-2 rounded-md font-semibold hover:bg-slate-800">{loading ? "Menyimpan..." : "Simpan Semua Teks & Kontak"}</button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Ubah Foto Latar Belakang (Header & Gateway)</h2>
              <form onSubmit={handleSaveTampilan} className="space-y-6">
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-red-800 border-l-2 border-red-800 pl-2">Slideshow Gateway (Halaman Awal)</h3>
                  {[1, 2, 3].map((num) => (
                    <div key={`gw${num}`} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border border-slate-200 bg-slate-50 p-4 rounded-lg">
                      <div>
                        <label className="font-semibold text-slate-800">Foto Gateway {num}</label>
                        <p className="text-xs text-slate-500 mt-1">Aktif: {tampilanUrls[`gateway${num}`] ? "Ya" : "Bawaan"}</p>
                      </div>
                      <input type="file" accept="image/*" onChange={(e) => setTampilanFiles({...tampilanFiles, [`gateway${num}`]: e.target.files[0]})} className="text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-white file:border-slate-300 file:border cursor-pointer" />
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-red-800 border-l-2 border-red-800 pl-2">Halaman Utama Website</h3>
                  {[
                    { id: 'hero', title: 'Beranda (Hero)' },
                    { id: 'profil', title: 'Halaman Profil' },
                    { id: 'kehidupan', title: 'Media & Publikasi' },
                    { id: 'alumni', title: 'Jaringan Alumni' }
                  ].map((item) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border border-slate-200 bg-slate-50 p-4 rounded-lg">
                      <div>
                        <label className="font-semibold text-slate-800">Foto Latar {item.title}</label>
                        <p className="text-xs text-slate-500 mt-1">Aktif: {tampilanUrls[item.id] ? "Ya" : "Bawaan"}</p>
                      </div>
                      <input type="file" accept="image/*" onChange={(e) => setTampilanFiles({...tampilanFiles, [item.id]: e.target.files[0]})} className="text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-white file:border-slate-300 file:border cursor-pointer" />
                    </div>
                  ))}
                </div>
                
                <button type="submit" disabled={loading} className="bg-slate-900 text-white px-6 py-2 rounded-md font-semibold hover:bg-slate-800">{loading ? "Menyimpan..." : "Simpan Semua Foto Latar"}</button>
              </form>
            </div>

          </div>
        )}

        {/* TAB 2, 3, 4 SAMA (Hanya ganti label Kehidupan ke Media & Publikasi) */}
        {activeTab === "galeri" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Tambah Foto Galeri Kegiatan</h2>
              <form onSubmit={handleSubmitGaleri} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_100px] gap-4">
                  <input type="text" required value={judulGaleri} onChange={(e) => setJudulGaleri(e.target.value)} placeholder="Nama/Judul Kegiatan..." className="px-4 py-2 border border-slate-300 bg-white rounded-md focus:ring-2 focus:ring-red-800" />
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-800 mb-1">Warna Teks</label>
                    <input type="color" value={warnaGaleri} onChange={(e) => setWarnaGaleri(e.target.value)} className="w-full h-10 cursor-pointer border border-slate-300 rounded-md p-0.5 bg-white" />
                  </div>
                </div>
                <input type="file" required accept="image/*" onChange={(e) => setFileGaleri(e.target.files[0])} className="w-full text-sm file:py-2 file:px-4 file:rounded-md file:bg-slate-100 file:border-0 cursor-pointer" />
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold hover:bg-slate-800">{loading ? "Menyimpan..." : "Tambah ke Galeri"}</button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Daftar Foto Galeri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataGaleri.map(item => (
                  <div key={item.id} className="relative h-40 rounded-lg overflow-hidden border border-slate-200">
                    <img src={item.linkGambar} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between p-3">
                      <span className="font-bold" style={{ color: item.warna }}>{item.judul}</span>
                      <button onClick={() => handleDelete("fasilitas", item.id)} className="bg-red-600 text-white text-xs px-3 py-1 rounded">Hapus</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "kehidupan" && (
           <div className="space-y-6">
             <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
               <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Tambah Publikasi Baru</h2>
               <form onSubmit={handleSubmitKehidupan} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
                   <input type="text" required value={judulKonten} onChange={(e) => setJudulKonten(e.target.value)} placeholder="Judul Publikasi..." className="px-4 py-2 border border-slate-300 bg-white rounded-md focus:ring-2 focus:ring-red-800" />
                   <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="px-4 py-2 border border-slate-300 bg-white rounded-md focus:ring-2 focus:ring-red-800">
                     <option value="PRESTASI">Prestasi</option>
                     <option value="KEWIRAUSAHAAN">Kewirausahaan</option>
                     <option value="MEDIA">Media & Publikasi</option>
                   </select>
                 </div>
                 <textarea required rows="3" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Deskripsi..." className="w-full px-4 py-2 border border-slate-300 bg-white rounded-md focus:ring-2 focus:ring-red-800"></textarea>
                 <input type="file" required accept="image/*" onChange={(e) => setFileGambar(e.target.files[0])} className="w-full text-sm file:py-2 file:px-4 file:rounded-md file:bg-slate-100 file:border-0 cursor-pointer" />
                 <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold hover:bg-slate-800">{loading ? "Menyimpan..." : "Publikasikan"}</button>
               </form>
             </div>
             <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
               <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Daftar Publikasi</h3>
               <div className="space-y-3">
                 {dataKehidupan.map(item => (
                   <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-lg">
                     <div><div className="font-semibold text-sm text-slate-900">{item.judul} <span className="text-red-600 text-xs">({item.kategori})</span></div></div>
                     <button onClick={() => handleDelete("kehidupan", item.id)} className="text-red-500 text-xs font-semibold hover:underline">Hapus</button>
                   </div>
                 ))}
               </div>
             </div>
           </div>
        )}

        {activeTab === "skripsi" && (
           <div className="space-y-6">
             <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
               <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Tambah Data Skripsi</h2>
               <form onSubmit={handleSubmitSkripsi} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama Alumni..." className="px-4 py-2 border border-slate-300 bg-white rounded-md focus:ring-2 focus:ring-red-800" />
                   <input type="text" required value={jurusan} onChange={(e) => setJurusan(e.target.value)} placeholder="Jurusan & Univ..." className="px-4 py-2 border border-slate-300 bg-white rounded-md focus:ring-2 focus:ring-red-800" />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-4">
                   <textarea required rows="1" value={judulSkripsi} onChange={(e) => setJudulSkripsi(e.target.value)} placeholder="Judul Skripsi..." className="w-full px-4 py-2 border border-slate-300 bg-white rounded-md focus:ring-2 focus:ring-red-800"></textarea>
                   <input type="number" required value={tahun} onChange={(e) => setTahun(e.target.value)} placeholder="Tahun" className="px-4 py-2 border border-slate-300 bg-white rounded-md focus:ring-2 focus:ring-red-800" />
                 </div>
                 <div>
                   <label className="text-sm font-semibold text-slate-800 block mb-1">Unggah File PDF</label>
                   <input type="file" accept=".pdf" onChange={(e) => setFilePDF(e.target.files[0])} className="w-full text-sm file:py-2 file:px-4 file:rounded-md file:bg-slate-100 file:border-0 cursor-pointer" />
                 </div>
                 <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold hover:bg-slate-800">{loading ? "Mengunggah..." : "Simpan Skripsi"}</button>
               </form>
             </div>
             <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
               <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Kelola Skripsi</h3>
               <div className="space-y-3">
                 {dataSkripsi.map(item => (
                   <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-lg">
                     <div>
                       <div className="font-semibold text-sm text-slate-900">{item.nama} <span className="text-slate-500 text-xs">- {item.tahun}</span></div>
                       <div className="text-xs text-slate-600 line-clamp-1">{item.judul}</div>
                     </div>
                     <button onClick={() => handleDelete("skripsi", item.id)} className="text-red-500 text-xs font-semibold hover:underline shrink-0 ml-4">Hapus</button>
                   </div>
                 ))}
               </div>
             </div>
           </div>
        )}
      </main>
    </div>
  );
}

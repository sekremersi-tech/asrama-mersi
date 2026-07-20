"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, setDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { signOut } from "firebase/auth";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("tampilan"); // tampilan, fasilitas, kehidupan, skripsi
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  // State: Tampilan Beranda & Profil
  const [tampilanUrls, setTampilanUrls] = useState({ hero: "", profil: "" });
  const [tampilanFiles, setTampilanFiles] = useState({ hero: null, profil: null });

  // State: Fasilitas Dinamis
  const [dataFasilitas, setDataFasilitas] = useState([]);
  const [judulFasilitas, setJudulFasilitas] = useState("");
  const [warnaFasilitas, setWarnaFasilitas] = useState("#ffffff");
  const [fileFasilitas, setFileFasilitas] = useState(null);

  // State: Kehidupan & Prestasi
  const [dataKehidupan, setDataKehidupan] = useState([]);
  const [judulKonten, setJudulKonten] = useState("");
  const [kategori, setKategori] = useState("PRESTASI");
  const [deskripsi, setDeskripsi] = useState("");
  const [fileGambar, setFileGambar] = useState(null);

  // State: Skripsi
  const [dataSkripsi, setDataSkripsi] = useState([]);
  const [nama, setNama] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [judulSkripsi, setJudulSkripsi] = useState("");
  const [tahun, setTahun] = useState("");
  const [filePDF, setFilePDF] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    // Tampilan
    const docSnap = await getDoc(doc(db, "pengaturan", "tampilan"));
    if (docSnap.exists()) setTampilanUrls(docSnap.data());
    // Fasilitas
    const fasSnap = await getDocs(query(collection(db, "fasilitas"), orderBy("createdAt", "desc")));
    setDataFasilitas(fasSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    // Kehidupan
    const kehSnap = await getDocs(query(collection(db, "kehidupan"), orderBy("createdAt", "desc")));
    setDataKehidupan(kehSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    // Skripsi
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

  // --- HANDLER SUBMIT ---
  const handleSaveTampilan = async (e) => {
    e.preventDefault(); setLoading(true); setStatus({ type: "", message: "" });
    try {
      let newUrls = { ...tampilanUrls };
      if (tampilanFiles.hero) newUrls.hero = await uploadToCloudinary(tampilanFiles.hero, "image");
      if (tampilanFiles.profil) newUrls.profil = await uploadToCloudinary(tampilanFiles.profil, "image");
      await setDoc(doc(db, "pengaturan", "tampilan"), newUrls, { merge: true });
      setTampilanUrls(newUrls); setTampilanFiles({ hero: null, profil: null });
      setStatus({ type: "success", message: "Foto beranda & profil diperbarui!" });
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); }
  };

  const handleSubmitFasilitas = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (!fileFasilitas) throw new Error("Wajib unggah foto fasilitas!");
      const linkGambar = await uploadToCloudinary(fileFasilitas, "image");
      await addDoc(collection(db, "fasilitas"), { judul: judulFasilitas, warna: warnaFasilitas, linkGambar, createdAt: serverTimestamp() });
      setStatus({ type: "success", message: "Fasilitas ditambahkan!" });
      setJudulFasilitas(""); setWarnaFasilitas("#ffffff"); setFileFasilitas(null); e.target.reset(); fetchAllData();
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); }
  };

  const handleSubmitKehidupan = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (!fileGambar) throw new Error("Wajib unggah foto dokumentasi!");
      const linkGambar = await uploadToCloudinary(fileGambar, "image");
      await addDoc(collection(db, "kehidupan"), { judul: judulKonten, kategori, deskripsi, linkGambar, tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), createdAt: serverTimestamp() });
      setStatus({ type: "success", message: "Berita ditambahkan!" });
      setJudulKonten(""); setDeskripsi(""); setFileGambar(null); e.target.reset(); fetchAllData();
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); }
  };

  const handleSubmitSkripsi = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      let linkPDF = "#";
      if (filePDF) linkPDF = await uploadToCloudinary(filePDF, "raw"); // "raw" untuk PDF
      await addDoc(collection(db, "skripsi"), { nama, jurusan, judul: judulSkripsi, tahun, linkPDF, createdAt: serverTimestamp() });
      setStatus({ type: "success", message: "Skripsi ditambahkan!" });
      setNama(""); setJurusan(""); setJudulSkripsi(""); setTahun(""); setFilePDF(null); e.target.reset(); fetchAllData();
    } catch (error) { setStatus({ type: "error", message: error.message }); } finally { setLoading(false); }
  };

  // --- HANDLER DELETE ---
  const handleDelete = async (koleksi, id) => {
    if (confirm("Yakin ingin menghapus data ini secara permanen?")) {
      await deleteDoc(doc(db, koleksi, id));
      fetchAllData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-50 p-4 px-8 flex justify-between items-center">
        <div className="font-serif font-bold text-xl"><span className="text-red-500">M</span> Admin Mersi</div>
        <button onClick={() => {signOut(auth); router.push("/admin/login")}} className="bg-red-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">Logout</button>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Menu Tab */}
        <div className="flex space-x-2 mb-8 bg-white p-2 rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <button onClick={() => { setActiveTab("tampilan"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "tampilan" ? "bg-red-50 text-red-800" : "text-slate-600 hover:bg-slate-50"}`}>Beranda & Profil</button>
          <button onClick={() => { setActiveTab("fasilitas"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "fasilitas" ? "bg-red-50 text-red-800" : "text-slate-600 hover:bg-slate-50"}`}>Kelola Fasilitas</button>
          <button onClick={() => { setActiveTab("kehidupan"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "kehidupan" ? "bg-red-50 text-red-800" : "text-slate-600 hover:bg-slate-50"}`}>Kehidupan & Prestasi</button>
          <button onClick={() => { setActiveTab("skripsi"); setStatus({}); }} className={`px-4 py-2 text-sm rounded-lg font-medium whitespace-nowrap ${activeTab === "skripsi" ? "bg-red-50 text-red-800" : "text-slate-600 hover:bg-slate-50"}`}>Repositori Skripsi</button>
        </div>

        {status.message && <div className={`p-4 rounded-lg mb-6 text-sm font-medium border ${status.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>{status.message}</div>}

        {/* TAB 1: TAMPILAN BERANDA & PROFIL */}
        {activeTab === "tampilan" && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Foto Beranda & Profil</h2>
            <form onSubmit={handleSaveTampilan} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border p-4 rounded-lg">
                <div><label className="font-medium">Foto Latar Beranda (Hero)</label><p className="text-xs text-slate-500">Aktif: {tampilanUrls.hero ? "Ya" : "Bawaan"}</p></div>
                <input type="file" accept="image/*" onChange={(e) => setTampilanFiles({...tampilanFiles, hero: e.target.files[0]})} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-slate-100 cursor-pointer" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border p-4 rounded-lg">
                <div><label className="font-medium">Foto Halaman Profil</label><p className="text-xs text-slate-500">Aktif: {tampilanUrls.profil ? "Ya" : "Bawaan"}</p></div>
                <input type="file" accept="image/*" onChange={(e) => setTampilanFiles({...tampilanFiles, profil: e.target.files[0]})} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-slate-100 cursor-pointer" />
              </div>
              <button type="submit" disabled={loading} className="bg-slate-900 text-white px-6 py-2 rounded-md font-semibold">{loading ? "Menyimpan..." : "Simpan Foto"}</button>
            </form>
          </div>
        )}

        {/* TAB 2: KELOLA FASILITAS (Dinamis + Warna Teks) */}
        {activeTab === "fasilitas" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h2 className="text-lg font-bold mb-4 border-b pb-2">Tambah Fasilitas Baru</h2>
              <form onSubmit={handleSubmitFasilitas} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_100px] gap-4">
                  <input type="text" required value={judulFasilitas} onChange={(e) => setJudulFasilitas(e.target.value)} placeholder="Nama Fasilitas..." className="px-4 py-2 border rounded-md" />
                  <div className="flex flex-col"><label className="text-xs text-slate-500 mb-1">Warna Teks</label><input type="color" value={warnaFasilitas} onChange={(e) => setWarnaFasilitas(e.target.value)} className="w-full h-8 cursor-pointer border rounded-md p-0.5" /></div>
                </div>
                <input type="file" required accept="image/*" onChange={(e) => setFileFasilitas(e.target.files[0])} className="w-full text-sm file:py-2 file:px-4 file:rounded-md file:bg-slate-100 file:border-0 cursor-pointer" />
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold">{loading ? "Menyimpan..." : "Tambah Fasilitas"}</button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h3 className="font-bold mb-4 border-b pb-2">Daftar Fasilitas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataFasilitas.map(item => (
                  <div key={item.id} className="relative h-32 rounded-lg overflow-hidden border">
                    <img src={item.linkGambar} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-end justify-between p-3">
                      <span className="font-bold" style={{ color: item.warna }}>{item.judul}</span>
                      <button onClick={() => handleDelete("fasilitas", item.id)} className="bg-red-600 text-white text-xs px-2 py-1 rounded">Hapus</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: KEHIDUPAN & PRESTASI */}
        {activeTab === "kehidupan" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h2 className="text-lg font-bold mb-4 border-b pb-2">Tambah Berita</h2>
              <form onSubmit={handleSubmitKehidupan} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
                  <input type="text" required value={judulKonten} onChange={(e) => setJudulKonten(e.target.value)} placeholder="Judul Berita..." className="px-4 py-2 border rounded-md" />
                  <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="px-4 py-2 border rounded-md bg-white">
                    <option value="PRESTASI">Prestasi</option>
                    <option value="KEWIRAUSAHAAN">Kewirausahaan</option>
                    <option value="KEHIDUPAN">Kehidupan Asrama</option>
                  </select>
                </div>
                <textarea required rows="3" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Deskripsi..." className="w-full px-4 py-2 border rounded-md"></textarea>
                <input type="file" required accept="image/*" onChange={(e) => setFileGambar(e.target.files[0])} className="w-full text-sm file:py-2 file:px-4 file:rounded-md file:bg-slate-100 file:border-0 cursor-pointer" />
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold">{loading ? "Menyimpan..." : "Publikasikan Berita"}</button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h3 className="font-bold mb-4 border-b pb-2">Daftar Berita</h3>
              <div className="space-y-3">
                {dataKehidupan.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg">
                    <div><div className="font-semibold text-sm">{item.judul} <span className="text-red-600 text-xs">({item.kategori})</span></div></div>
                    <button onClick={() => handleDelete("kehidupan", item.id)} className="text-red-500 text-xs font-semibold hover:underline">Hapus</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REPOSITORI SKRIPSI */}
        {activeTab === "skripsi" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h2 className="text-lg font-bold mb-4 border-b pb-2">Tambah Data Skripsi</h2>
              <form onSubmit={handleSubmitSkripsi} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama Alumni..." className="px-4 py-2 border rounded-md" />
                  <input type="text" required value={jurusan} onChange={(e) => setJurusan(e.target.value)} placeholder="Jurusan & Univ..." className="px-4 py-2 border rounded-md" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-4">
                  <textarea required rows="1" value={judulSkripsi} onChange={(e) => setJudulSkripsi(e.target.value)} placeholder="Judul Skripsi..." className="w-full px-4 py-2 border rounded-md"></textarea>
                  <input type="number" required value={tahun} onChange={(e) => setTahun(e.target.value)} placeholder="Tahun" className="px-4 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="text-sm text-slate-500 block mb-1">Unggah File PDF (Opsional tapi disarankan agar pengunjung bisa download)</label>
                  <input type="file" accept=".pdf" onChange={(e) => setFilePDF(e.target.files[0])} className="w-full text-sm file:py-2 file:px-4 file:rounded-md file:bg-slate-100 file:border-0 cursor-pointer" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-4 py-2 rounded-md font-semibold">{loading ? "Mengunggah..." : "Simpan Skripsi"}</button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h3 className="font-bold mb-4 border-b pb-2">Kelola Skripsi (Edit dengan cara Hapus lalu Tambah Baru)</h3>
              <div className="space-y-3">
                {dataSkripsi.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-lg">
                    <div>
                      <div className="font-semibold text-sm">{item.nama} <span className="text-slate-500 text-xs">- {item.tahun}</span></div>
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

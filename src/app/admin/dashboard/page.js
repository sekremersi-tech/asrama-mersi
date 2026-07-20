"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { LogOut, BookOpen, UploadCloud, Loader2, CheckCircle, AlertCircle, Image as ImageIcon, Trash2, LayoutDashboard } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("skripsi"); // 'skripsi' atau 'kehidupan'
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  // State untuk Form Skripsi
  const [nama, setNama] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [judul, setJudul] = useState("");
  const [tahun, setTahun] = useState("");
  const [filePDF, setFilePDF] = useState(null);

  // State untuk Form Kehidupan & Prestasi
  const [judulKonten, setJudulKonten] = useState("");
  const [kategori, setKategori] = useState("PRESTASI");
  const [deskripsi, setDeskripsi] = useState("");
  const [fileGambar, setFileGambar] = useState(null);
  
  // State untuk Data Tabel
  const [dataKehidupan, setDataKehidupan] = useState([]);

  useEffect(() => {
    if (activeTab === "kehidupan") {
      fetchDataKehidupan();
    }
  }, [activeTab]);

  const fetchDataKehidupan = async () => {
    try {
      const q = query(collection(db, "kehidupan"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDataKehidupan(data);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  const handleDeleteKonten = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus konten ini? Gambar yang sudah terhapus tidak dapat dikembalikan.")) {
      try {
        await deleteDoc(doc(db, "kehidupan", id));
        fetchDataKehidupan();
        setStatus({ type: "success", message: "Konten berhasil dihapus!" });
      } catch (error) {
        setStatus({ type: "error", message: "Gagal menghapus konten." });
      }
    }
  };

  // Fungsi Upload ke Cloudinary (Bisa untuk PDF maupun Gambar)
  const uploadToCloudinary = async (file, resourceType = "auto") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    if (!data.secure_url) throw new Error("Gagal mengunggah file ke Cloudinary.");
    return data.secure_url;
  };

  // Submit Skripsi
  const handleSubmitSkripsi = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      let linkPDF = "#";
      if (filePDF) {
        linkPDF = await uploadToCloudinary(filePDF, "raw"); // 'raw' untuk PDF
      }
      await addDoc(collection(db, "skripsi"), {
        nama, jurusan, judul, tahun, linkPDF, createdAt: serverTimestamp()
      });
      setStatus({ type: "success", message: "Data skripsi berhasil dipublikasikan!" });
      setNama(""); setJurusan(""); setJudul(""); setTahun(""); setFilePDF(null);
      e.target.reset();
    } catch (error) {
      setStatus({ type: "error", message: "Gagal menyimpan skripsi: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  // Submit Kehidupan & Prestasi
  const handleSubmitKehidupan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      if (!fileGambar) throw new Error("Anda wajib mengunggah foto dokumentasi!");
      
      const linkGambar = await uploadToCloudinary(fileGambar, "image"); // 'image' untuk foto
      
      await addDoc(collection(db, "kehidupan"), {
        judul: judulKonten,
        kategori,
        deskripsi,
        linkGambar,
        tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        createdAt: serverTimestamp()
      });
      
      setStatus({ type: "success", message: "Konten kehidupan/prestasi berhasil ditambahkan!" });
      setJudulKonten(""); setDeskripsi(""); setFileGambar(null);
      e.target.reset();
      fetchDataKehidupan(); // Refresh tabel
    } catch (error) {
      setStatus({ type: "error", message: "Gagal menyimpan konten: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 font-serif font-bold text-xl">
              <LayoutDashboard className="text-red-500" />
              <span>Admin Mersi</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-800 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Sistem Menu Tab */}
        <div className="flex space-x-2 mb-8 bg-white p-2 rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <button 
            onClick={() => { setActiveTab("skripsi"); setStatus({}); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === "skripsi" ? "bg-red-50 text-red-800" : "text-slate-600 hover:bg-slate-50"}`}
          >
            <BookOpen size={18} /> Repositori Skripsi
          </button>
          <button 
            onClick={() => { setActiveTab("kehidupan"); setStatus({}); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === "kehidupan" ? "bg-red-50 text-red-800" : "text-slate-600 hover:bg-slate-50"}`}
          >
            <ImageIcon size={18} /> Kehidupan & Prestasi
          </button>
        </div>

        {/* Notifikasi Global */}
        {status.message && (
          <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 shadow-sm ${status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {status.type === 'success' ? <CheckCircle size={20} className="shrink-0 mt-0.5" /> : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
            <p className="text-sm font-medium">{status.message}</p>
          </div>
        )}

        {/* ================= TAB SKRIPSI ================= */}
        {activeTab === "skripsi" && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-slate-100 p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-slate-900">Unggah Data Skripsi</h2>
              <p className="text-slate-500 text-sm mt-1">Tambahkan skripsi alumni ke repositori publik.</p>
            </div>
            <form onSubmit={handleSubmitSkripsi} className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap</label>
                  <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-800 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Jurusan & Universitas</label>
                  <input type="text" required value={jurusan} onChange={(e) => setJurusan(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-800 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Judul Skripsi</label>
                  <textarea required rows="2" value={judul} onChange={(e) => setJudul(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-800 outline-none resize-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tahun</label>
                  <input type="number" required value={tahun} onChange={(e) => setTahun(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-800 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">File PDF Skripsi (Opsional)</label>
                <input type="file" accept=".pdf" onChange={(e) => setFilePDF(e.target.files[0])} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer" />
              </div>
              <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-md font-semibold disabled:bg-slate-400">
                {loading ? <><Loader2 className="animate-spin" size={20} /> Memproses...</> : "Simpan Skripsi"}
              </button>
            </form>
          </div>
        )}

        {/* ================= TAB KEHIDUPAN & PRESTASI ================= */}
        {activeTab === "kehidupan" && (
          <div className="space-y-8">
            {/* Form Tambah Konten */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-slate-100 p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-slate-900">Manajemen Konten & Foto</h2>
                <p className="text-slate-500 text-sm mt-1">Unggah foto dan berita seputar prestasi, wirausaha, atau kegiatan asrama.</p>
              </div>
              <form onSubmit={handleSubmitKehidupan} className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Judul Konten/Berita</label>
                    <input type="text" required value={judulKonten} onChange={(e) => setJudulKonten(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-800 outline-none" placeholder="Contoh: Tim PKM-KC Asrama Raih Pendanaan..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Kategori</label>
                    <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-800 outline-none bg-white">
                      <option value="PRESTASI">Prestasi</option>
                      <option value="KEWIRAUSAHAAN">Kewirausahaan</option>
                      <option value="KEHIDUPAN">Kehidupan Asrama</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Deskripsi Singkat</label>
                  <textarea required rows="3" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-800 outline-none resize-none" placeholder="Ceritakan detail kegiatan atau pencapaian tersebut..."></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Unggah Foto Utama (Wajib)</label>
                  <div className="flex items-center gap-4">
                    <div className="shrink-0 w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                      {fileGambar ? <CheckCircle className="text-green-600" /> : <ImageIcon className="text-slate-400" />}
                    </div>
                    <input type="file" required accept="image/*" onChange={(e) => setFileGambar(e.target.files[0])} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-800 hover:file:bg-red-100 cursor-pointer" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-md font-semibold disabled:bg-slate-400">
                  {loading ? <><Loader2 className="animate-spin" size={20} /> Mengunggah Foto...</> : "Publikasikan Konten"}
                </button>
              </form>
            </div>

            {/* Tabel Kelola Konten */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Daftar Konten Terpublikasi</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{dataKehidupan.length} Item</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-gray-200 text-slate-600">
                    <tr>
                      <th className="p-4 font-medium">Foto</th>
                      <th className="p-4 font-medium">Judul & Kategori</th>
                      <th className="p-4 font-medium">Tanggal</th>
                      <th className="p-4 font-medium text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dataKehidupan.length === 0 ? (
                      <tr><td colSpan="4" className="p-8 text-center text-slate-500">Belum ada konten yang ditambahkan.</td></tr>
                    ) : (
                      dataKehidupan.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-4">
                            <div className="w-16 h-12 rounded overflow-hidden bg-slate-200">
                              <img src={item.linkGambar} alt={item.judul} className="w-full h-full object-cover" />
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-slate-900 line-clamp-1">{item.judul}</div>
                            <div className="text-xs text-red-800 font-medium mt-1">{item.kategori}</div>
                          </td>
                          <td className="p-4 text-slate-500 whitespace-nowrap">{item.tanggal}</td>
                          <td className="p-4 text-center">
                            <button onClick={() => handleDeleteKonten(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Hapus Konten">
                              <Trash2 size={18} />
                            </button>
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

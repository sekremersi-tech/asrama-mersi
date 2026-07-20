"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, setDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { signOut } from "firebase/auth";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("tampilan"); // Default tab ke pengaturan foto
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  // State untuk Konten Kehidupan
  const [dataKehidupan, setDataKehidupan] = useState([]);
  const [judulKonten, setJudulKonten] = useState("");
  const [kategori, setKategori] = useState("PRESTASI");
  const [deskripsi, setDeskripsi] = useState("");
  const [fileGambar, setFileGambar] = useState(null);

  // State untuk Pengaturan Tampilan (Foto-foto Website)
  const [tampilanUrls, setTampilanUrls] = useState({ hero: "", profil: "", kamar: "", ruang: "", perpus: "" });
  const [tampilanFiles, setTampilanFiles] = useState({ hero: null, profil: null, kamar: null, ruang: null, perpus: null });

  useEffect(() => {
    fetchDataKehidupan();
    fetchTampilan();
  }, []);

  const fetchDataKehidupan = async () => {
    const q = query(collection(db, "kehidupan"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    setDataKehidupan(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchTampilan = async () => {
    const docSnap = await getDoc(doc(db, "pengaturan", "tampilan"));
    if (docSnap.exists()) setTampilanUrls(docSnap.data());
  };

  const uploadToCloudinary = async (file, resourceType = "image") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, { method: "POST", body: formData });
    const data = await res.json();
    return data.secure_url;
  };

  // --- SUBMIT PENGATURAN TAMPILAN ---
  const handleSaveTampilan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      let newUrls = { ...tampilanUrls };
      const keys = ["hero", "profil", "kamar", "ruang", "perpus"];
      
      for (const key of keys) {
        if (tampilanFiles[key]) {
          newUrls[key] = await uploadToCloudinary(tampilanFiles[key], "image");
        }
      }
      
      await setDoc(doc(db, "pengaturan", "tampilan"), newUrls, { merge: true });
      setTampilanUrls(newUrls);
      setTampilanFiles({ hero: null, profil: null, kamar: null, ruang: null, perpus: null });
      setStatus({ type: "success", message: "Semua foto tampilan berhasil diperbarui!" });
    } catch (error) {
      setStatus({ type: "error", message: "Gagal menyimpan foto: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  // --- SUBMIT KONTEN KEHIDUPAN ---
  const handleSubmitKehidupan = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!fileGambar) throw new Error("Wajib unggah foto dokumentasi!");
      const linkGambar = await uploadToCloudinary(fileGambar, "image");
      await addDoc(collection(db, "kehidupan"), {
        judul: judulKonten, kategori, deskripsi, linkGambar,
        tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        createdAt: serverTimestamp()
      });
      setStatus({ type: "success", message: "Konten berhasil ditambahkan!" });
      setJudulKonten(""); setDeskripsi(""); setFileGambar(null); e.target.reset();
      fetchDataKehidupan();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKonten = async (id) => {
    if (confirm("Hapus konten ini secara permanen?")) {
      await deleteDoc(doc(db, "kehidupan", id));
      fetchDataKehidupan();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-50 p-4 px-8 flex justify-between items-center">
        <div className="font-serif font-bold text-xl flex items-center gap-2">
           <span className="text-red-500">M</span> Admin Mersi
        </div>
        <button onClick={() => {signOut(auth); router.push("/admin/login")}} className="bg-red-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">Logout</button>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Menu Tab */}
        <div className="flex space-x-2 mb-8 bg-white p-2 rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <button onClick={() => { setActiveTab("tampilan"); setStatus({}); }} className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap ${activeTab === "tampilan" ? "bg-red-50 text-red-800" : "text-slate-600 hover:bg-slate-50"}`}>Pengaturan Website</button>
          <button onClick={() => { setActiveTab("kehidupan"); setStatus({}); }} className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap ${activeTab === "kehidupan" ? "bg-red-50 text-red-800" : "text-slate-600 hover:bg-slate-50"}`}>Kehidupan & Prestasi</button>
        </div>

        {status.message && (
          <div className={`p-4 rounded-lg mb-6 text-sm font-medium border ${status.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
            {status.message}
          </div>
        )}

        {/* TAB 1: PENGATURAN TAMPILAN FOTO WEBSITE */}
        {activeTab === "tampilan" && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 border-b pb-4">Ubah Foto Website</h2>
            <form onSubmit={handleSaveTampilan} className="space-y-6">
              {[
                { id: "hero", label: "Foto Latar Beranda (Hero)", placeholder: "Upload foto lanskap asrama..." },
                { id: "profil", label: "Foto Halaman Profil", placeholder: "Upload foto bersama/gedung..." },
                { id: "kamar", label: "Foto Fasilitas: Kamar Hunian", placeholder: "Upload foto kamar..." },
                { id: "ruang", label: "Foto Fasilitas: Ruang Diskusi", placeholder: "Upload foto ruang diskusi..." },
                { id: "perpus", label: "Foto Fasilitas: Perpustakaan", placeholder: "Upload foto perpustakaan..." },
              ].map((item) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border p-4 rounded-lg bg-slate-50">
                  <div>
                    <label className="block font-medium text-slate-900">{item.label}</label>
                    <p className="text-xs text-slate-500 mt-1">Saat ini: {tampilanUrls[item.id] ? "Sudah ada foto terpasang" : "Belum ada foto (menggunakan bawaan)"}</p>
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => setTampilanFiles({...tampilanFiles, [item.id]: e.target.files[0]})} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-white file:text-slate-700 file:border-slate-200 file:border shadow-sm cursor-pointer" />
                </div>
              ))}
              <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-md font-semibold mt-4">
                {loading ? "Menyimpan Perubahan..." : "Simpan Semua Foto Tampilan"}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: KEHIDUPAN & PRESTASI (Tanpa Data Fiktif) */}
        {activeTab === "kehidupan" && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b pb-4">Tambah Berita / Prestasi Baru</h2>
              <form onSubmit={handleSubmitKehidupan} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
                  <input type="text" required value={judulKonten} onChange={(e) => setJudulKonten(e.target.value)} className="px-4 py-2 border rounded-md" placeholder="Judul Berita..." />
                  <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="px-4 py-2 border rounded-md">
                    <option value="PRESTASI">Prestasi</option>
                    <option value="KEWIRAUSAHAAN">Kewirausahaan</option>
                    <option value="KEHIDUPAN">Kehidupan Asrama</option>
                  </select>
                </div>
                <textarea required rows="3" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} className="w-full px-4 py-2 border rounded-md" placeholder="Deskripsi..."></textarea>
                <input type="file" required accept="image/*" onChange={(e) => setFileGambar(e.target.files[0])} className="w-full text-sm file:py-2 file:px-4 file:rounded-md file:bg-slate-100 file:border-0" />
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white px-6 py-3 rounded-md font-semibold">{loading ? "Menyimpan..." : "Publikasikan"}</button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h3 className="font-bold text-slate-900 mb-4 border-b pb-2">Daftar Konten Terpublikasi</h3>
              {dataKehidupan.length === 0 ? <p className="text-slate-500 text-sm">Belum ada data berita. Website Anda saat ini bersih.</p> : (
                <div className="space-y-4">
                  {dataKehidupan.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border">
                      <div>
                        <div className="font-semibold text-sm">{item.judul} <span className="text-red-600 text-xs ml-2">({item.kategori})</span></div>
                        <div className="text-xs text-slate-500">{item.tanggal}</div>
                      </div>
                      <button onClick={() => handleDeleteKonten(item.id)} className="text-red-500 text-sm hover:underline">Hapus</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

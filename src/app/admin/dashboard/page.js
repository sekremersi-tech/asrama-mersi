"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { LogOut, BookOpen, UploadCloud, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  
  // State untuk form
  const [nama, setNama] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [judul, setJudul] = useState("");
  const [tahun, setTahun] = useState("");
  const [filePDF, setFilePDF] = useState(null);
  
  // State untuk indikator proses
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleLogout = () => {
    // Arahkan kembali ke halaman login
    router.push("/admin/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      let linkPDF = "#";

      // 1. Proses Upload PDF ke Cloudinary
      if (filePDF) {
        const formData = new FormData();
        formData.append("file", filePDF);
        // Memanggil preset rahasia dari environment variables
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET); 
        
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
          { 
            method: "POST", 
            body: formData 
          }
        );
        
        const data = await res.json();
        
        if (data.secure_url) {
          linkPDF = data.secure_url;
        } else {
          throw new Error("Gagal mengunggah dokumen PDF ke server.");
        }
      }

      // 2. Proses Simpan Data Teks ke Firestore
      await addDoc(collection(db, "skripsi"), {
        nama,
        jurusan,
        judul,
        tahun,
        linkPDF,
        createdAt: serverTimestamp()
      });

      // Jika sukses, tampilkan pesan dan kosongkan form
      setStatus({ type: "success", message: "Data skripsi berhasil dipublikasikan ke halaman Alumni!" });
      setNama("");
      setJurusan("");
      setJudul("");
      setTahun("");
      setFilePDF(null);
      e.target.reset(); // Mengosongkan input file HTML

    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Gagal menyimpan data: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar Admin */}
      <nav className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 font-serif font-bold text-xl">
              <BookOpen className="text-red-500" />
              <span>Admin Mersi</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-800 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Konten Utama */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="bg-slate-100 p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-slate-900">Unggah Data Skripsi</h1>
            <p className="text-slate-500 text-sm mt-1">Tambahkan data skripsi atau tugas akhir alumni ke dalam repositori asrama.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            
            {/* Notifikasi Status */}
            {status.message && (
              <div className={`p-4 rounded-md flex items-start gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {status.type === 'success' ? <CheckCircle size={20} className="shrink-0 mt-0.5" /> : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
                <p className="text-sm font-medium">{status.message}</p>
              </div>
            )}

            {/* Input Nama & Jurusan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none transition-all"
                  placeholder="Contoh: Uda Mahasiswa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Jurusan & Universitas</label>
                <input 
                  type="text" 
                  required
                  value={jurusan}
                  onChange={(e) => setJurusan(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none transition-all"
                  placeholder="Contoh: Teknik Elektro, UGM"
                />
              </div>
            </div>

            {/* Input Judul & Tahun */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Judul Skripsi</label>
                <textarea 
                  required
                  rows="3"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none transition-all resize-none"
                  placeholder="Masukkan judul skripsi secara lengkap..."
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tahun</label>
                <input 
                  type="number" 
                  required
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-800 focus:border-red-800 outline-none transition-all"
                  placeholder="2026"
                />
              </div>
            </div>

            {/* Upload File */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Unggah File PDF (Opsional)</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md hover:bg-slate-50 transition-colors">
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                  <div className="flex text-sm text-slate-600 justify-center">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-red-800 hover:text-red-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-800 px-1">
                      <span>Pilih file PDF</span>
                      <input 
                        type="file" 
                        accept=".pdf" 
                        className="sr-only" 
                        onChange={(e) => setFilePDF(e.target.files[0])}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-slate-500">
                    {filePDF ? `Terpilih: ${filePDF.name}` : "Maksimal 10MB"}
                  </p>
                </div>
              </div>
            </div>

            {/* Tombol Submit */}
            <div className="pt-4 border-t border-slate-100">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-md font-semibold transition-all disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Memproses Data...
                  </>
                ) : (
                  "Simpan ke Database"
                )}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}

// src/app/admin/dashboard/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { uploadToCloudinary } from "@/utils/uploadCloudinary";
import { LogOut, FileText, UploadCloud } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("skripsi"); // 'skripsi' atau 'berita'
  const [isLoading, setIsLoading] = useState(false);

  // Otentikasi Sederhana
  useEffect(() => {
    const isAuth = sessionStorage.getItem("adminMersiAuth");
    if (!isAuth) {
      router.push("/admin/login");
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminMersiAuth");
    router.push("/");
  };

  // State Formulir Skripsi
  const [skripsiForm, setSkripsiForm] = useState({ nama: "", jurusan: "", judul: "", tahun: "", filePDF: null });

  // State Formulir Berita
  const [beritaForm, setBeritaForm] = useState({ judul: "", kategori: "", penulis: "", tanggal: "", ringkasan: "", isiLengkap: "", fileFoto: null });

  const submitSkripsi = async (e) => {
    e.preventDefault();
    if (!skripsiForm.filePDF) return alert("Pilih file PDF terlebih dahulu!");
    setIsLoading(true);
    try {
      const pdfUrl = await uploadToCloudinary(skripsiForm.filePDF);
      await addDoc(collection(db, "skripsi"), {
        nama: skripsiForm.nama,
        jurusan: skripsiForm.jurusan,
        judul: skripsiForm.judul,
        tahun: skripsiForm.tahun,
        linkPDF: pdfUrl,
        dibuatPada: serverTimestamp()
      });
      alert("Skripsi berhasil ditambahkan ke Repositori!");
      setSkripsiForm({ nama: "", jurusan: "", judul: "", tahun: "", filePDF: null });
    } catch (error) {
      alert("Terjadi kesalahan: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const submitBerita = async (e) => {
    e.preventDefault();
    if (!beritaForm.fileFoto) return alert("Pilih foto berita terlebih dahulu!");
    setIsLoading(true);
    try {
      const imgUrl = await uploadToCloudinary(beritaForm.fileFoto);
      await addDoc(collection(db, "berita"), {
        judul: beritaForm.judul,
        kategori: beritaForm.kategori,
        penulis: beritaForm.penulis,
        tanggal: beritaForm.tanggal,
        ringkasan: beritaForm.ringkasan,
        isiLengkap: beritaForm.isiLengkap,
        img: imgUrl,
        dibuatPada: serverTimestamp()
      });
      alert("Kabar terbaru berhasil dipublikasikan!");
      setBeritaForm({ judul: "", kategori: "", penulis: "", tanggal: "", ringkasan: "", isiLengkap: "", fileFoto: null });
    } catch (error) {
      alert("Terjadi kesalahan: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <div className="w-full md:w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 bg-red-800 text-center font-serif font-bold text-xl tracking-wider">
          MERAPI SINGGALANG
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab("skripsi")} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'skripsi' ? 'bg-slate-800 text-red-500' : 'hover:bg-slate-800'}`}
          >
            <FileText size={20} /> Repositori Skripsi
          </button>
          <button 
            onClick={() => setActiveTab("berita")} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'berita' ? 'bg-slate-800 text-red-500' : 'hover:bg-slate-800'}`}
          >
            <UploadCloud size={20} /> Kabar Asrama
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-800 px-4 py-2 rounded-lg transition-colors">
            <LogOut size={18} /> Keluar
          </button>
        </div>
      </div>

      {/* AREA KONTEN UTAMA */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 font-serif">
          {activeTab === 'skripsi' ? 'Unggah Skripsi Alumni' : 'Publikasi Kabar Asrama'}
        </h1>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-3xl">
          {/* FORM SKRIPSI */}
          {activeTab === 'skripsi' && (
            <form onSubmit={submitSkripsi} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input type="text" required value={skripsiForm.nama} onChange={(e)=>setSkripsiForm({...skripsiForm, nama: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md text-slate-900" placeholder="Cth: Uda Mahasiswa" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Kelulusan</label>
                  <input type="number" required value={skripsiForm.tahun} onChange={(e)=>setSkripsiForm({...skripsiForm, tahun: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md text-slate-900" placeholder="2026" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jurusan & Universitas</label>
                <input type="text" required value={skripsiForm.jurusan} onChange={(e)=>setSkripsiForm({...skripsiForm, jurusan: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md text-slate-900" placeholder="Pendidikan Teknik Mekatronika, UNY" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Skripsi / Tugas Akhir</label>
                <textarea required value={skripsiForm.judul} onChange={(e)=>setSkripsiForm({...skripsiForm, judul: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md h-24 text-slate-900"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Dokumen (PDF)</label>
                <input type="file" accept="application/pdf" required onChange={(e)=>setSkripsiForm({...skripsiForm, filePDF: e.target.files[0]})} className="w-full text-slate-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-800 hover:file:bg-red-100" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white py-3 rounded-md font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors">
                {isLoading ? "Mengunggah..." : "Simpan ke Repositori"}
              </button>
            </form>
          )}

          {/* FORM BERITA */}
          {activeTab === 'berita' && (
            <form onSubmit={submitBerita} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Berita</label>
                <input type="text" required value={beritaForm.judul} onChange={(e)=>setBeritaForm({...beritaForm, judul: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md text-slate-900" />
              </div>
              <div className="grid grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select required value={beritaForm.kategori} onChange={(e)=>setBeritaForm({...beritaForm, kategori: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md text-slate-900">
                    <option value="">Pilih...</option>
                    <option value="Prestasi">Prestasi</option>
                    <option value="Kehidupan">Kehidupan</option>
                    <option value="Kewirausahaan">Kewirausahaan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Penulis</label>
                  <input type="text" required value={beritaForm.penulis} onChange={(e)=>setBeritaForm({...beritaForm, penulis: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md text-slate-900" placeholder="Divisi/Nama" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input type="text" required value={beritaForm.tanggal} onChange={(e)=>setBeritaForm({...beritaForm, tanggal: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md text-slate-900" placeholder="12 Mei 2026" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ringkasan (Tampil di Kartu Depan)</label>
                <textarea required value={beritaForm.ringkasan} onChange={(e)=>setBeritaForm({...beritaForm, ringkasan: e.target.value})} maxLength={150} className="w-full p-2 border border-gray-300 rounded-md h-20 text-slate-900" placeholder="Maks 150 karakter..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Isi Berita Lengkap</label>
                <textarea required value={beritaForm.isiLengkap} onChange={(e)=>setBeritaForm({...beritaForm, isiLengkap: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md h-40 text-slate-900"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto Berita (JPG/PNG)</label>
                <input type="file" accept="image/*" required onChange={(e)=>setBeritaForm({...beritaForm, fileFoto: e.target.files[0]})} className="w-full text-slate-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-800 hover:file:bg-red-100" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white py-3 rounded-md font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors">
                {isLoading ? "Mengunggah..." : "Publikasikan Kabar"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
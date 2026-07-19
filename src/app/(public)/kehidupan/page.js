"use client";

import { useState } from "react";
import { X, Calendar, User, ArrowRight, Trophy } from "lucide-react";

export default function KehidupanPrestasi() {
  const [selectedNews, setSelectedNews] = useState(null);

  // Data statis sementara (akan diganti dari Firestore di Tahap 5)
  const daftarBerita = [
    {
      id: 1,
      kategori: "Prestasi",
      judul: "Tim PKM-KC Asrama Ciptakan Inovasi Reaktor Eco-Enzyme (ENZYRA)",
      tanggal: "12 Mei 2026",
      penulis: "Pengurus Asrama",
      ringkasan: "Kolaborasi inovatif oleh sanak asrama dalam merancang reaktor otomatis dengan pemantauan pH dan pengaduk motor...",
      isiLengkap: "Kolaborasi inovatif oleh sanak asrama dalam merancang reaktor otomatis (ENZYRA) dengan pemantauan pH dan pengaduk motor berhasil mempercepat waktu fermentasi. Prestasi ini membuktikan bahwa lingkungan asrama sangat mendukung terciptanya diskursus teknologi tepat guna di kalangan mahasiswa teknik. Keberhasilan menembus pendanaan PKM-KC ini diharapkan memotivasi warga asrama lainnya.",
      img: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 2,
      kategori: "Kewirausahaan",
      judul: "Gelar Wirausaha Mahasiswa: Mengembangkan Usaha Kuliner Gabin Isi Fla",
      tanggal: "03 April 2026",
      penulis: "Divisi Kewirausahaan",
      ringkasan: "Inisiatif kemandirian ekonomi warga melalui produksi dan pemasaran jajanan pasar inovatif di lingkungan kampus...",
      isiLengkap: "Selain unggul di bidang akademik, warga asrama juga didorong untuk mandiri secara ekonomi. Salah satu sanak kita berhasil mengembangkan usaha kecil menengah berbasis kuliner, yakni produksi Gabin isi fla. Melalui perhitungan margin laba yang cermat dan strategi pemasaran yang baik di kawasan kampus, inisiatif ini menjadi contoh nyata dari semangat kemandirian (entrepreneurship) perantau Minang.",
      img: "https://images.unsplash.com/photo-1556910103-1c02745a872f?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 3,
      kategori: "Kehidupan",
      judul: "Rapat Pleno Pengurus dan Evaluasi Asrama Merapi Singgalang",
      tanggal: "20 Januari 2026",
      penulis: "Sekretariat",
      ringkasan: "Evaluasi rutin dan penyusunan strategi kepengasuhan bersama Uda, Uni, dan seluruh penghuni asrama...",
      isiLengkap: "Dalam rangka menjaga keharmonisan dan kualitas kepengasuhan, rapat pleno dan evaluasi warga telah sukses digelar. Diskusi berjalan hangat, menegaskan kembali pentingnya nilai saling menghargai antar angkatan. Kegiatan ini juga membahas rencana perbaikan fasilitas belajar bersama untuk menunjang aktivitas perkuliahan.",
      img: "https://images.unsplash.com/photo-1577415124269-b9140d402422?auto=format&fit=crop&w=800&q=80"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 relative">
      {/* HEADER PAGE */}
      <div className="bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-serif flex items-center gap-3">
            <Trophy className="text-red-500" size={36} /> Kehidupan & Prestasi
          </h1>
          <p className="text-gray-400">Rekam jejak, inovasi, dan keseharian warga Asrama Merapi Singgalang.</p>
        </div>
      </div>

      {/* GRID BERITA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {daftarBerita.map((berita) => (
            <div key={berita.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all group flex flex-col">
              <div className="h-52 overflow-hidden relative">
                <img src={berita.img} alt={berita.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-red-800 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  {berita.kategori}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{berita.judul}</h3>
                <p className="text-gray-600 text-sm mb-6 flex-grow">{berita.ringkasan}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center text-xs text-gray-500 gap-2">
                    <Calendar size={14} /> {berita.tanggal}
                  </div>
                  <button 
                    onClick={() => setSelectedNews(berita)}
                    className="text-red-800 font-medium text-sm hover:text-red-900 flex items-center gap-1"
                  >
                    Baca <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DETIL BERITA */}
      {selectedNews && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedNews(null)}></div>
          <div className="relative bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-slate-50">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="bg-red-100 text-red-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider text-xs">{selectedNews.kategori}</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> {selectedNews.tanggal}</span>
                <span className="flex items-center gap-1 hidden sm:flex"><User size={14} /> {selectedNews.penulis}</span>
              </div>
              <button onClick={() => setSelectedNews(null)} className="text-gray-400 hover:text-gray-900 hover:bg-gray-200 p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-serif leading-tight">{selectedNews.judul}</h2>
              <img src={selectedNews.img} alt={selectedNews.judul} className="w-full h-64 md:h-80 object-cover rounded-xl mb-6" />
              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                <p>{selectedNews.isiLengkap}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
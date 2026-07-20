"use client";

import { BookOpen, Download, Search } from "lucide-react";
// ... (kode lainnya biarkan saja)

export default function JaringanAlumni() {
  // Data statis skripsi (Tahap 5 akan diambil dari Firestore)
  const daftarSkripsi = [
    {
      id: 1,
      nama: "Uda Mahasiswa",
      jurusan: "Pendidikan Teknik Mekatronika, UNY",
      judul: "Rancang Bangun Sistem Digital Twin pada Panel Surya Berbasis Logika Fuzzy (Gambut Guardian)",
      tahun: "2026",
      linkPDF: "#"
    },
    {
      id: 2,
      nama: "Sanak Inovator",
      jurusan: "Teknik Elektro, UGM",
      judul: "Purwarupa Deteksi Deepfake Portabel (DEEP-CHECK) menggunakan Raspberry Pi Edge AI",
      tahun: "2025",
      linkPDF: "#"
    },
    {
      id: 3,
      nama: "Uni Cendekia",
      jurusan: "Teknologi Informasi, UMY",
      judul: "Pengembangan Smart Walker Terapi (EduStep) dengan Sensor Load Cell dan Umpan Balik Haptik",
      tahun: "2025",
      linkPDF: "#"
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* HEADER PAGE */}
      <div className="bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 font-serif">Jaringan Alumni</h1>
          <p className="text-gray-400 text-lg">Jejak profesional dan repositori karya ilmiah warga asrama.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        
        {/* SEJARAH ALUMNI (Teks Wajib) */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 font-serif border-l-4 border-red-800 pl-4">Jejak Alumni</h2>
          <p className="text-gray-600 leading-relaxed text-lg text-justify">
            Sejak awal pendiriannya sampai sekarang asrama ini telah melahirkan ratusan alumni yang berkiprah di berbagai bidang profesi: Dosen (UGM, UMY, UNP, Unand, dsb), praktisi di BUMN/Swasta (PT. Semen Padang, BNI, Bank Mandiri, IPTN Bandung, Caltex), Pemerintahan (Kementerian/Pemda), hingga Konsultan, Lawyer, dan Jurnalis Nasional.
          </p>
        </div>

        {/* REPOSITORI SKRIPSI */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
            <div className="flex items-center gap-3">
              <BookOpen className="text-red-800" size={28} />
              <h2 className="text-2xl font-bold text-gray-900 font-serif">Repositori Skripsi Warga</h2>
            </div>
            
            {/* Kolom Pencarian Visual (Belum fungsional sebelum Firebase) */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari judul atau nama..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-red-800 focus:ring-1 focus:ring-red-800 text-sm"
              />
            </div>
          </div>

          {/* TABEL SKRIPSI */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-sm uppercase tracking-wider text-gray-500">
                  <th className="p-6 font-semibold">Tahun</th>
                  <th className="p-6 font-semibold">Nama & Jurusan</th>
                  <th className="p-6 font-semibold">Judul Skripsi / Tugas Akhir</th>
                  <th className="p-6 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {daftarSkripsi.map((skripsi) => (
                  <tr key={skripsi.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6 text-gray-900 font-medium whitespace-nowrap">{skripsi.tahun}</td>
                    <td className="p-6">
                      <div className="font-bold text-gray-900">{skripsi.nama}</div>
                      <div className="text-sm text-gray-500">{skripsi.jurusan}</div>
                    </td>
                    <td className="p-6 text-gray-700 leading-relaxed min-w-[300px]">
                      {skripsi.judul}
                    </td>
                    <td className="p-6 text-center align-middle">
                      <a 
                        href={skripsi.linkPDF} 
                        className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-red-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                      >
                        <Download size={16} /> PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Empty State / Pagination Note */}
          <div className="p-4 bg-slate-50 text-center text-sm text-gray-500 border-t border-gray-100">
            Menampilkan {daftarSkripsi.length} dokumen tersimpan.
          </div>
        </div>

      </div>
    </div>
  );
}

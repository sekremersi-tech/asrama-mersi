export default function ProfilAsrama() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* HEADER PAGE */}
      <div className="bg-slate-900 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 font-serif">Profil Asrama</h1>
          <p className="text-gray-400 text-lg">Mengenal lebih dekat rumah kedua sanak perantau.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 md:p-12">
          
          {/* SEJARAH (Teks Wajib) */}
          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-serif border-l-4 border-red-800 pl-4">Sejarah Asrama</h2>
            <div className="prose prose-lg text-gray-600 max-w-none text-justify leading-relaxed">
              <p>
                Asrama Mahasiswa Merapi Singgalang dibangun pada tahun 1962 oleh Yayasan Baringin, yang awal pendiriannya bertujuan untuk menangani masalah kesejahteraan mahasiswa asal Sumatera Barat terutama masalah ekonomi, dan masalah pondokan bagi mahasiswa yang baru datang. Asrama ini dibangun atas sumbangsih dan dukungan Gubenur Sumatera Barat, Kaharuddin Dt. Rangkayo Basa, Pangdam 17 Agustus, Kolonel Suryo Sumpono, Menteri Penerangan RI, Mr. Mohammad Yamin Menteri Perdatam RI, Khairul Shaleh, dan Syafri Sabirin (Mantan Gubernur BI). Seiring perjalanan waktu, Asrama Mahasiswa Merapi Singgalang dijadikan Asrama Pemerintah Propinsi Sumatera Barat, yang koordinasinya dipegang oleh Yayasan Baringin yang menaungi Asrama Mahasiswa Merapi Singgalang dan Asrama Mahasiswi Bundo Kanduang. Sementara pengelolaan sepenuhnya dilakukan oleh mahasiswa yang menghuni asrama.
              </p>
            </div>
          </section>

          <hr className="border-gray-100 mb-16" />

          {/* VISI & MISI */}
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 font-serif">Visi</h2>
                <p className="text-gray-600 bg-slate-50 p-6 rounded-lg border border-gray-100 leading-relaxed italic">
                  "Menjadi kawah candradimuka dan repositori intelektual yang unggul, berlandaskan kekeluargaan dan filosofi Adat Basandi Syarak, Syarak Basandi Kitabullah, bagi mahasiswa perantau Minangkabau di Yogyakarta."
                </p>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 font-serif">Nilai Kepengasuhan</h2>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <span className="text-red-800 font-bold">•</span>
                    <span><strong>Sistem Silang:</strong> Hubungan harmonis berlandaskan respek antara Uda, Uni, dan Sanak.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-800 font-bold">•</span>
                    <span><strong>Intelektualitas:</strong> Menjaga iklim akademik yang kompetitif dan suportif antar jurusan.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-800 font-bold">•</span>
                    <span><strong>Kemandirian:</strong> Pengelolaan asrama yang mandiri oleh warga, melatih jiwa kepemimpinan.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* FASILITAS (Galeri Placeholder) */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 font-serif border-l-4 border-red-800 pl-4">Fasilitas Asrama</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { nama: "Kamar Hunian Nyaman", img: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80" },
                { nama: "Ruang Diskusi & Belajar", img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80" },
                { nama: "Perpustakaan Mini", img: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=600&q=80" },
              ].map((fasilitas, idx) => (
                <div key={idx} className="group relative rounded-lg overflow-hidden h-48 bg-slate-200">
                  <img src={fasilitas.img} alt={fasilitas.nama} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent flex items-end p-4">
                    <h3 className="text-white font-medium">{fasilitas.nama}</h3>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
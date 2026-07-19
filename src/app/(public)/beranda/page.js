import Link from "next/link";
import { BookOpen, Users, Award, ArrowRight } from "lucide-react";

export default function Beranda() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 1. HERO SECTION */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Image (Placeholder Unsplash - Nuansa Kampus/Komunal) */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1920&q=80')" }}
        >
          {/* Overlay Gelap */}
          <div className="absolute inset-0 bg-slate-900/75 mix-blend-multiply"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <span className="inline-block py-1 px-3 rounded-full bg-red-800/80 text-white text-sm font-semibold tracking-wider mb-4 backdrop-blur-sm">
            ASRAMA MAHASISWA MERAPI SINGGALANG
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight font-serif">
            Ranah Minang di <br/>
            <span className="text-red-500">Serambi Kota Pelajar</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 font-light">
            Etalase prestasi, repositori intelektual, dan ruang tumbuh bersama yang merawat kehangatan tradisi bagi Uda, Uni, dan Sanak perantau Minangkabau di Yogyakarta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/profil" className="bg-red-800 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg">
              Mengenal Asrama
            </Link>
            <Link href="/alumni" className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-8 py-3 rounded-lg font-medium transition-all backdrop-blur-sm">
              Lihat Repositori Skripsi
            </Link>
          </div>
        </div>
      </section>

      {/* 2. STATISTIK DINAMIS (Struktur Awal) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="bg-white rounded-xl shadow-xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8 border border-gray-100">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <Users className="text-red-800 w-7 h-7" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">45+</h3>
            <p className="text-gray-500 font-medium">Warga Aktif</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 border-t md:border-t-0 md:border-l md:border-r border-gray-100">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <Award className="text-red-800 w-7 h-7" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">100+</h3>
            <p className="text-gray-500 font-medium">Alumni Berprestasi</p>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="text-red-800 w-7 h-7" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">0</h3>
            <p className="text-gray-500 font-medium">Skripsi Terekam</p>
          </div>
        </div>
      </section>

      {/* 3. KABAR TERBARU */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 font-serif mb-2">Kabar Terbaru</h2>
            <p className="text-gray-600">Dinamika dan pencapaian sanak di perantauan.</p>
          </div>
          <Link href="/kehidupan" className="hidden sm:flex items-center gap-2 text-red-800 font-medium hover:text-red-900 transition-colors">
            Lihat Semua <ArrowRight w={18} h={18} />
          </Link>
        </div>

        {/* Grid Kartu Berita (Statis sebelum Firebase) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow border border-gray-100 cursor-pointer group">
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={`https://images.unsplash.com/photo-1577415124269-b9140d402422?auto=format&fit=crop&w=600&q=80`} 
                  alt="Kabar Asrama" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <span className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2 block">Prestasi Warga</span>
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">Tim PKM-KC Asrama Berhasil Meraih Pendanaan Dikti 2026</h3>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  Kolaborasi lintas jurusan oleh sanak asrama dalam mengembangkan inovasi teknologi tepat guna membuahkan hasil membanggakan di kancah nasional...
                </p>
                <div className="text-sm font-medium text-gray-400">12 Mei 2026</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. CALL TO ACTION */}
      <section className="bg-slate-900 py-16 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Mari Berkarya Bersama Kami</h2>
          <p className="text-gray-300 mb-8 leading-relaxed">
            Asrama Mahasiswa Merapi Singgalang bukan sekadar tempat singgah, melainkan kawah candradimuka bagi para intelektual muda Minangkabau untuk saling asah, asih, dan asuh.
          </p>
          <Link href="/profil" className="inline-block bg-red-800 hover:bg-red-700 text-white px-8 py-3 rounded-md font-semibold transition-colors">
            Pelajari Nilai Asrama
          </Link>
        </div>
      </section>
    </div>
  );
}
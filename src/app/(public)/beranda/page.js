"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from "firebase/firestore";

// KOMPONEN: Slideshow Latar Belakang (Hero/Gateway)
const HeroSlider = ({ images, titleLine1, titleLine2, subtitle }) => {
  const imgArray = Array.isArray(images) ? images : (images ? [images] : []);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (imgArray.length <= 1) return;
    const timer = setInterval(() => setIdx(p => (p + 1) % imgArray.length), 4000);
    return () => clearInterval(timer);
  }, [imgArray.length]);

  return (
    <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-[#171412]">
      <div className="absolute inset-0 w-full h-full bg-[#171412]">
        {imgArray.map((bg, i) => (
          <div key={i} className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${i === idx ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url('${bg}')` }}></div>
        ))}
        <div className="absolute inset-0 bg-[#171412]/70"></div>
      </div>
      
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <span className="inline-block py-1.5 px-4 rounded-full bg-red-800/90 text-amber-400 text-xs font-bold tracking-widest mb-6 border border-red-700/50 backdrop-blur-sm">ASRAMA MAHASISWA MERAPI SINGGALANG</span>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-playfair leading-tight">
          {titleLine1} <br/><span className="text-amber-500">{titleLine2}</span>
        </h1>
        <p className="text-lg md:text-xl text-stone-300 mb-10 font-lora max-w-2xl mx-auto">{subtitle}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center font-sans">
          <Link href="/profil" className="bg-red-800 hover:bg-red-900 text-white px-8 py-3.5 rounded-lg font-semibold shadow-lg shadow-red-900/30 transition-all border border-red-700">Mengenal Asrama</Link>
          <Link href="/kehidupan" className="bg-[#171412]/50 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50 px-8 py-3.5 rounded-lg font-semibold transition-all backdrop-blur-sm">Lihat Media Publikasi</Link>
        </div>
      </div>
    </section>
  );
};

// KOMPONEN: Slider Gambar untuk Kartu Berita (Jika Foto > 1)
const SliderImage = ({ images, className }) => {
  const imgArray = Array.isArray(images) ? images : (images ? [images] : []);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (imgArray.length <= 1) return;
    const timer = setInterval(() => setIdx(p => (p + 1) % imgArray.length), 3500);
    return () => clearInterval(timer);
  }, [imgArray.length]);

  if (imgArray.length === 0) return <div className={`bg-stone-200 ${className}`}></div>;

  return (
    <div className={`relative overflow-hidden group w-full h-full ${className}`}>
      {imgArray.map((src, i) => (
        <img key={i} src={src} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 group-hover:scale-105 ease-in-out ${i === idx ? "opacity-100" : "opacity-0"}`} alt="Visual" />
      ))}
      {imgArray.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg border border-white/10 z-10 font-sans">
          +{imgArray.length} Foto
        </div>
      )}
    </div>
  );
};

export default function Beranda() {
  const [kabarTerbaru, setKabarTerbaru] = useState([]);
  const [bgHero, setBgHero] = useState([]); // Diubah menjadi Array agar cocok dengan HeroSlider

  useEffect(() => {
    const fetchData = async () => {
      const docSnap = await getDoc(doc(db, "pengaturan", "tampilan"));
      // Di Dashboard Admin kita telah mengganti 'gateway1, 2, 3' menjadi array 'gateway'
      // Jika Anda mengunggah lewat 'Latar Beranda', maka ia tersimpan di 'hero'
      // Kita prioritaskan 'gateway', kalau kosong ambil 'hero'
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.gateway && data.gateway.length > 0) {
          setBgHero(data.gateway);
        } else if (data.hero) {
          setBgHero(data.hero);
        }
      }

      const q = query(collection(db, "kehidupan"), orderBy("createdAt", "desc"), limit(3));
      const snapshot = await getDocs(q);
      setKabarTerbaru(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchData();
  }, []);

  return (
    <div className="bg-[#f9f8f6] font-lora overflow-x-hidden">
      
      {/* SUNTIKAN HERO SLIDER MULTI FOTO */}
      <HeroSlider 
        images={bgHero} 
        titleLine1="Ranah Minang di" 
        titleLine2="Serambi Kota Pelajar" 
        subtitle="Etalase prestasi, repositori intelektual, dan ruang tumbuh bersama merawat tradisi."
      />

      {/* KABAR TERBARU */}
      <section className="max-w-7xl mx-auto px-4 py-24 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 font-playfair mb-4">Kabar Terbaru</h2>
          <div className="w-16 h-1.5 bg-amber-500 mx-auto rounded-full"></div>
        </div>
        
        {kabarTerbaru.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-sm border border-[#e8e4db] text-stone-500 shadow-sm">Belum ada kabar terbaru.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {kabarTerbaru.map((item, idx) => (
              <div key={item.id} className="bg-white rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 overflow-hidden border border-[#e8e4db] group flex flex-col reveal opacity-0 translate-y-12" style={{ transitionDelay: `${(idx % 3) * 150}ms` }}>
                
                <div className="h-56 overflow-hidden relative">
                  <span className="absolute top-4 left-4 z-10 bg-red-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-wider shadow-md font-sans">{item.kategori}</span>
                  {/* Terapkan slider gambar pada kartu berita jika fotonya banyak */}
                  <SliderImage images={item.linkGambar} />
                </div>
                
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-stone-900 mb-3 line-clamp-2 group-hover:text-red-800 transition-colors font-playfair leading-snug">{item.judul}</h3>
                  <p className="text-stone-600 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">{item.deskripsi}</p>
                  <div className="text-xs text-amber-600 font-bold uppercase tracking-wider font-sans">{item.tanggal}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

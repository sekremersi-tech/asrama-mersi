"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";

const HeroSlider = ({ images, title }) => {
  const imgArray = Array.isArray(images) ? images : (images ? [images] : []);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (imgArray.length <= 1) return;
    const timer = setInterval(() => setIdx(p => (p + 1) % imgArray.length), 4000);
    return () => clearInterval(timer);
  }, [imgArray.length]);

  return (
    <div className="relative py-28 md:py-36 w-full bg-[#171412] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 w-full h-full bg-[#171412]">
        {imgArray.map((bg, i) => (
          <div key={i} className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${i === idx ? 'opacity-70' : 'opacity-0'}`} style={{ backgroundImage: `url('${bg}')` }}></div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#171412] via-[#171412]/80 to-[#171412]/40 backdrop-blur-[1px]"></div>
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-playfair drop-shadow-lg">{title}</h1>
        <div className="w-16 h-1.5 bg-amber-500 mx-auto rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
      </div>
    </div>
  );
};

export default function ProfilAsrama() {
  const [bgProfil, setBgProfil] = useState([]);
  const [profilText, setProfilText] = useState({ sejarah: "", visi: "", misi: "" });
  const [dataTimeline, setDataTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [pengurusInti, setPengurusInti] = useState(null);
  const [dataDivisi, setDataDivisi] = useState([]);
  const [dataAnggota, setDataAnggota] = useState([]);

  // STATE BUKU SEJARAH
  const [halamanSejarah, setHalamanSejarah] = useState([]);
  const [halAktif, setHalAktif] = useState(0);
  const [isAnimasiFlip, setIsAnimasiFlip] = useState(false);
  const [arahFlip, setArahFlip] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapFoto = await getDoc(doc(db, "pengaturan", "tampilan"));
        if (snapFoto.exists() && snapFoto.data().profil) setBgProfil(snapFoto.data().profil);
        
        const snapText = await getDoc(doc(db, "pengaturan", "profilText"));
        if (snapText.exists()) {
          const dataText = snapText.data();
          setProfilText(dataText);
          
          if (dataText.sejarah) {
            const pecah = dataText.sejarah.split(/\n\s*\n/).filter(p => p.trim() !== "");
            setHalamanSejarah(pecah.length > 0 ? pecah : [dataText.sejarah]);
          }
        }

        const timeSnap = await getDocs(query(collection(db, "timeline_sejarah"), orderBy("tahun", "asc")));
        setDataTimeline(timeSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const docInti = await getDoc(doc(db, "pengaturan", "pengurus_inti"));
        if (docInti.exists()) setPengurusInti(docInti.data());
        
        const divSnap = await getDocs(query(collection(db, "divisi_asrama"), orderBy("createdAt", "asc")));
        setDataDivisi(divSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const angSnap = await getDocs(query(collection(db, "anggota_divisi"), orderBy("createdAt", "asc")));
        setDataAnggota(angSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // FUNGSI ANIMASI FLIP BUKU 3D
  const changePage = (newIndex, direction) => {
    if (newIndex >= 0 && newIndex < halamanSejarah.length) {
      setArahFlip(direction);
      setIsAnimasiFlip(true);
      setTimeout(() => {
        setHalAktif(newIndex);
        setIsAnimasiFlip(false);
      }, 400); // Sinkron dengan durasi CSS
    }
  };

  return (
    <div className="bg-[#f9f8f6] pb-24 font-lora overflow-x-hidden relative">
      <style jsx global>{`
        /* Animasi Flip Buku 3D */
        .perspective-1000 { perspective: 1000px; }
        .flip-next { animation: flipNext 0.4s ease-in forwards; transform-origin: left center; }
        .flip-prev { animation: flipPrev 0.4s ease-in forwards; transform-origin: right center; }
        @keyframes flipNext { 0% { transform: rotateY(0deg); opacity: 1; } 100% { transform: rotateY(-90deg); opacity: 0; } }
        @keyframes flipPrev { 0% { transform: rotateY(0deg); opacity: 1; } 100% { transform: rotateY(90deg); opacity: 0; } }
        
        /* Animasi Melayang Peta */
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>

      <HeroSlider images={bgProfil} title="Profil Asrama" />

      {/* 1. SEJARAH BUKU BERTUMPUK ANIMASI FLIP 3D */}
      <div id="sejarah" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-24 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="text-center mb-10">
          <div className="w-12 h-1 bg-red-800 mx-auto rounded-full mb-6"></div>
        </div>
        
        <div className="relative mt-8 perspective-1000">
          <div className="absolute inset-0 bg-[#e8e4db] transform translate-y-4 -rotate-1 rounded-sm shadow-md"></div>
          <div className="absolute inset-0 bg-[#f4f2ec] transform translate-y-2 rotate-1 rounded-sm shadow-md"></div>
          
          <div className={`relative bg-[#fcfbf9] p-8 md:p-14 rounded-sm shadow-2xl border border-[#e8e4db] z-10 flex flex-col min-h-[400px] ${isAnimasiFlip ? (arahFlip === 'next' ? 'flip-next' : 'flip-prev') : 'transform rotateY-0 opacity-100 transition-all duration-500'}`}>
            
            <div className="flex justify-between items-center mb-8 border-b border-[#e8e4db] pb-4">
              <span className="text-amber-600 font-bold italic font-serif text-lg">Bagian {halAktif + 1}</span>
              <h2 className="text-3xl md:text-4xl font-bold text-stone-900 font-playfair">Catatan Sejarah</h2>
            </div>
            
            <div className="flex-grow flex items-center overflow-hidden">
              <p className="text-stone-700 leading-relaxed text-lg md:text-xl text-justify whitespace-pre-line font-lora">
                {loading ? "Memuat catatan lembar sejarah..." : halamanSejarah[halAktif]}
              </p>
            </div>

            <div className="mt-12 flex justify-between items-center text-sm font-bold tracking-widest font-sans uppercase">
              <button onClick={() => changePage(halAktif - 1, 'prev')} disabled={halAktif === 0 || isAnimasiFlip} className={`flex items-center gap-2 transition-colors ${halAktif === 0 ? 'text-stone-300 cursor-not-allowed' : 'text-stone-500 hover:text-red-800'}`}>← Balik Lembar</button>
              <span className="text-stone-400 font-serif italic text-base lowercase">{halAktif + 1} / {halamanSejarah.length || 1}</span>
              <button onClick={() => changePage(halAktif + 1, 'next')} disabled={halAktif === halamanSejarah.length - 1 || isAnimasiFlip} className={`flex items-center gap-2 transition-colors ${halAktif === halamanSejarah.length - 1 ? 'text-stone-300 cursor-not-allowed' : 'text-stone-900 hover:text-amber-600'}`}>Lanjut Baca →</button>
            </div>

          </div>
        </div>
      </div>

      {/* 2 & 3. VISI MISI & TIMELINE */}
      <div id="visimisi" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 scroll-mt-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5 flex flex-col gap-6 reveal opacity-0 translate-x-[-20px] transition-all duration-1000 ease-out">
            <div className="text-left mb-2"><h2 className="text-3xl font-bold text-stone-900 font-playfair mb-3">Tujuan Asrama</h2><div className="w-12 h-1 bg-amber-500 rounded-full"></div></div>
            <div className="bg-[#171412] text-white p-6 md:p-8 rounded-sm shadow-lg relative overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <h3 className="text-2xl font-bold font-playfair mb-4 text-amber-500">Visi Kami</h3>
              <p className="text-stone-300 leading-relaxed text-base">{loading ? "Memuat..." : profilText.visi}</p>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] border border-[#e8e4db] hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-2xl font-bold font-playfair mb-4 text-red-800">Misi Kami</h3>
              <p className="text-stone-600 leading-relaxed text-base whitespace-pre-line">{loading ? "Memuat..." : profilText.misi}</p>
            </div>
          </div>
          <div id="timeline" className="lg:col-span-7 reveal opacity-0 translate-x-[20px] transition-all duration-1000 ease-out delay-200">
            <div className="text-left mb-8"><h2 className="text-3xl font-bold text-stone-900 font-playfair mb-3">Garis Waktu</h2><div className="w-12 h-1 bg-amber-500 rounded-full"></div></div>
            {loading ? <p className="text-stone-500">Memuat timeline...</p> : dataTimeline.length === 0 ? <p className="text-stone-500">Belum ada catatan waktu.</p> : (
              <div className="relative border-l-2 border-amber-200 ml-3 md:ml-4 space-y-10 py-2">
                {dataTimeline.map((item, idx) => (
                  <div key={item.id} className="relative pl-8 md:pl-10 group" style={{ transitionDelay: `${idx * 150}ms` }}>
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-amber-500 rounded-full border-4 border-[#f9f8f6] group-hover:scale-150 group-hover:bg-red-800 transition-all duration-300"></div>
                    <div className="bg-white p-5 rounded-sm border border-stone-100 shadow-sm group-hover:shadow-md group-hover:border-amber-200 transition-all duration-300 transform group-hover:translate-x-2">
                      <div className="mb-2"><span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold tracking-widest rounded-sm">{item.tahun}</span></div>
                      <h3 className="text-lg font-bold text-stone-900 font-playfair mb-2 group-hover:text-amber-600 transition-colors">{item.judul}</h3>
                      <p className="text-stone-600 text-sm leading-relaxed">{item.deskripsi}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. STRUKTUR KEPENGURUSAN DENGAN ANIMASI FOTO FLIP */}
      <div id="kepengurusan" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 mb-20 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="text-center mb-16">
          <h4 className="text-amber-600 font-bold tracking-widest text-xs uppercase font-sans mb-3">Struktur Organisasi</h4>
          <h2 className="text-4xl font-bold text-stone-900 font-playfair mb-4">Kepengurusan Asrama</h2>
          <div className="w-16 h-1 bg-red-800 mx-auto rounded-full"></div>
        </div>

        {pengurusInti && (
          <div className="mb-20">
            <h3 className="text-center text-xl font-bold text-stone-400 uppercase tracking-widest font-sans mb-10">Pengurus Inti</h3>
            
            <div className="flex justify-center mb-8">
              <div className="bg-white p-8 rounded-sm shadow-xl border-t-4 border-red-800 flex flex-col items-center w-72 transform hover:-translate-y-2 transition-transform duration-300 group perspective-1000">
                {/* Animasi Flip 3D pada Foto */}
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-amber-100 mb-6 shadow-inner group-hover:rotate-y-180 transition-transform duration-700 transform-style-3d">
                  <img src={pengurusInti.ketuaFoto || `https://ui-avatars.com/api/?name=${pengurusInti.ketuaNama}&background=991b1b&color=fff`} className="w-full h-full object-cover" alt="Ketua" />
                </div>
                <h4 className="font-bold text-stone-900 text-xl text-center leading-tight mb-2 group-hover:text-red-800 transition-colors">{pengurusInti.ketuaNama || "Nama Ketua"}</h4>
                <p className="text-sm font-bold text-red-800 uppercase tracking-widest font-sans">Ketua Asrama</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-8">
              <div className="bg-white p-6 rounded-sm shadow-lg border-t-4 border-amber-500 flex flex-col items-center w-full sm:w-64 transform hover:-translate-y-2 transition-transform duration-300 group perspective-1000">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-stone-100 mb-5 shadow-inner group-hover:rotate-y-180 transition-transform duration-700 transform-style-3d">
                  <img src={pengurusInti.sekreFoto || `https://ui-avatars.com/api/?name=${pengurusInti.sekreNama}&background=f59e0b&color=fff`} className="w-full h-full object-cover" alt="Sekretaris" />
                </div>
                <h4 className="font-bold text-stone-900 text-lg text-center leading-tight mb-2 group-hover:text-amber-600 transition-colors">{pengurusInti.sekreNama || "Nama Sekretaris"}</h4>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest font-sans">Sekretaris</p>
              </div>

              <div className="bg-white p-6 rounded-sm shadow-lg border-t-4 border-amber-500 flex flex-col items-center w-full sm:w-64 transform hover:-translate-y-2 transition-transform duration-300 group perspective-1000">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-stone-100 mb-5 shadow-inner group-hover:rotate-y-180 transition-transform duration-700 transform-style-3d">
                  <img src={pengurusInti.bendaharaFoto || `https://ui-avatars.com/api/?name=${pengurusInti.bendaharaNama}&background=f59e0b&color=fff`} className="w-full h-full object-cover" alt="Bendahara" />
                </div>
                <h4 className="font-bold text-stone-900 text-lg text-center leading-tight mb-2 group-hover:text-amber-600 transition-colors">{pengurusInti.bendaharaNama || "Nama Bendahara"}</h4>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest font-sans">Bendahara</p>
              </div>
            </div>
          </div>
        )}

        {dataDivisi.length > 0 && (
          <div>
            <h3 className="text-center text-xl font-bold text-stone-400 uppercase tracking-widest font-sans mb-10">Divisi & Anggota</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dataDivisi.map(div => {
                const anggotaList = dataAnggota.filter(a => a.divisiId === div.id);
                return (
                  <div key={div.id} className="bg-white rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] border border-[#e8e4db] overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300 group">
                    <div className="bg-[#171412] py-4 px-6 text-center border-b-2 border-red-800 transition-colors group-hover:bg-red-800 group-hover:border-[#171412]">
                      <h4 className="text-white font-bold tracking-wider font-sans uppercase">{div.namaDivisi}</h4>
                    </div>
                    <div className="p-8 flex-grow">
                      {anggotaList.length === 0 ? <p className="text-sm text-stone-400 text-center italic">Belum ada anggota</p> : (
                        <div className="grid grid-cols-2 gap-6">
                          {anggotaList.map(anggota => (
                            <div key={anggota.id} className="flex flex-col items-center text-center group/member perspective-1000">
                              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-stone-200 mb-3 group-hover/member:border-amber-500 group-hover/member:scale-110 transition-all duration-300 shadow-sm">
                                <img src={anggota.foto} className="w-full h-full object-cover group-hover/member:rotate-y-180 transition-transform duration-700 transform-style-3d" alt={anggota.nama} />
                              </div>
                              <span className="text-xs font-semibold text-stone-800 leading-tight group-hover/member:text-amber-600 transition-colors">{anggota.nama}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. TITIK TEMU (MAPS DENGAN ANIMASI MELAYANG) */}
      <div id="lokasi" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 mb-10 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8 bg-white p-10 md:p-16 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e8e4db]">
          
          <div className="w-full lg:w-1/2 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100 shadow-sm"><div className="w-2 h-2 bg-red-800 rounded-full"></div></div>
            <h2 className="text-4xl md:text-5xl font-bold text-stone-900 font-playfair mb-6 leading-tight">Titik <br className="hidden md:block"/> Temu</h2>
            <p className="text-stone-600 text-lg leading-relaxed mb-8 max-w-sm">Jantung pergerakan dan ruang tumbuh bersama perantau Minang di sudut nyaman Kota Pelajar. Kami selalu terbuka untuk silaturahmi.</p>
            <div className="bg-stone-50 border-l-4 border-amber-500 p-5 rounded-r-lg shadow-sm w-full md:w-auto"><p className="text-sm text-stone-700 font-medium leading-relaxed font-sans">Jl. Marga Agung, Karangwaru, Kec. Tegalrejo,<br/>Kota Yogyakarta, Daerah Istimewa Yogyakarta 55241</p></div>
          </div>

          <div className="w-full lg:w-1/2 relative flex justify-center lg:justify-end animate-float">
            <div className="w-full max-w-md h-[400px] rounded-3xl overflow-hidden shadow-2xl relative z-10 border-4 border-white bg-stone-200">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.111956550505!2d110.36388911477484!3d-7.778007694394982!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a584a5a543593%3A0xc3baab4d7b7dbd76!2sAsrama%20Mahasiswa%20Merapi%20Singgalang!5e0!3m2!1sen!2sid!4v1689264560000!5m2!1sen!2sid" 
                width="100%" height="100%" style={{ border: 0, pointerEvents: 'none' }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Lokasi Asrama Merapi Singgalang">
              </iframe>
            </div>
            {/* Bayangan peta di bawah */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[80%] h-8 bg-black/20 blur-xl rounded-[100%]"></div>
          </div>

        </div>
      </div>

    </div>
  );
}

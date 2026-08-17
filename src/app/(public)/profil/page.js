"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, query, orderBy } from "firebase/firestore";
import ProfileCard from "@/components/ProfileCard";

const HeroSlider = ({ images, title, subtitle }) => { 
  const imgArray = Array.isArray(images) ? images : (images ? [images] : []);
  const [idx, setIdx] = useState(0);
  useEffect(() => { if (imgArray.length <= 1) return; const timer = setInterval(() => setIdx(p => (p + 1) % imgArray.length), 4000); return () => clearInterval(timer); }, [imgArray.length]);
  return (
    <div className="relative py-28 md:py-36 w-full bg-[#171412] flex flex-col items-center justify-center overflow-hidden text-center">
      <div className="absolute inset-0 w-full h-full bg-[#171412]">
        {imgArray.map((bg, i) => (<div key={i} className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${i === idx ? 'opacity-70' : 'opacity-0'}`} style={{ backgroundImage: `url('${bg}')` }}></div>))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#171412] via-[#171412]/80 to-[#171412]/40 backdrop-blur-[1px]"></div>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full flex flex-col items-center pb-8 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-playfair drop-shadow-lg">{title}</h1>
        {subtitle && <p className="text-stone-300 text-lg max-w-2xl mx-auto m-0 mb-6 font-lora">{subtitle}</p>}
        <div className="w-16 h-1.5 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
      </div>
    </div>
  );
};

export default function ProfilAsrama() {
  const [bgProfil, setBgProfil] = useState([]);
  const [profilText, setProfilText] = useState({ visi: "", misi: "" });
  const [dataSejarah, setDataSejarah] = useState([]);
  const [dataTimeline, setDataTimeline] = useState([]);
  const [pengurusInti, setPengurusInti] = useState(null);
  const [dataDivisi, setDataDivisi] = useState([]);
  const [dataAnggota, setDataAnggota] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination Sejarah
  const [sejarahPage, setSejarahPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapFoto = await getDoc(doc(db, "pengaturan", "tampilan"));
        if (snapFoto.exists() && snapFoto.data().profil) setBgProfil(snapFoto.data().profil);
        
        const snapText = await getDoc(doc(db, "pengaturan", "profilText"));
        if (snapText.exists()) setProfilText(snapText.data());

        const sejSnap = await getDocs(query(collection(db, "sejarah_asrama"), orderBy("createdAt", "asc")));
        setDataSejarah(sejSnap.docs.map(d => ({ id: d.id, ...d.data() })));

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

  const changeSejarahPage = (newIndex) => {
    if (newIndex >= 0 && newIndex < dataSejarah.length) {
      setIsAnimating(true);
      setTimeout(() => {
        setSejarahPage(newIndex);
        setIsAnimating(false);
      }, 400);
    }
  };

  return (
    <div className="bg-[#f9f8f6] pb-24 font-lora relative overflow-x-hidden">
      <style jsx global>{`
        .fade-out { animation: fadeOut 0.4s forwards ease-in-out; }
        .fade-in { animation: fadeIn 0.4s forwards ease-in-out; }
        @keyframes fadeOut { to { opacity: 0; transform: translateY(10px); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <HeroSlider images={bgProfil} title="Profil Asrama" subtitle="Rumah gadang bagi para perantau dari Sumatera Barat di Daerah Istimewa Yogyakarta." />

      {/* 1. CATATAN SEJARAH */}
      <div id="sejarah" className="max-w-4xl mx-auto px-4 mt-20 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        {dataSejarah.length > 0 && (
          <div className="bg-white p-8 md:p-14 rounded-sm shadow-2xl border border-[#e8e4db] relative perspective-1000">
            <div className="absolute inset-0 bg-[#e8e4db] transform translate-y-4 -rotate-1 rounded-sm -z-10"></div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-[#e8e4db] pb-4">
              <h2 className="text-3xl font-bold text-stone-900 font-playfair w-full text-center md:text-left">Catatan Sejarah</h2>
              <span className="text-amber-600 font-bold font-sans tracking-widest uppercase text-xs shrink-0 mt-4 md:mt-0">{dataSejarah[sejarahPage]?.judul}</span>
            </div>
            
            <div className={`min-h-[200px] flex flex-col justify-center ${isAnimating ? 'fade-out' : 'fade-in'}`}>
              <p className="text-stone-700 leading-relaxed text-lg whitespace-pre-line text-justify md:text-left drop-cap">
                {dataSejarah[sejarahPage]?.isi}
              </p>
            </div>

            <div className="mt-12 flex justify-between items-center text-sm font-bold tracking-widest font-sans uppercase">
              <button onClick={() => changeSejarahPage(sejarahPage - 1)} disabled={sejarahPage === 0 || isAnimating} className={`flex items-center gap-2 transition-colors ${sejarahPage === 0 ? 'text-stone-300 cursor-not-allowed' : 'text-stone-500 hover:text-red-800'}`}>← Balik Lembar</button>
              <span className="text-stone-400 font-serif italic text-base lowercase">{sejarahPage + 1} / {dataSejarah.length}</span>
              <button onClick={() => changeSejarahPage(sejarahPage + 1)} disabled={sejarahPage === dataSejarah.length - 1 || isAnimating} className={`flex items-center gap-2 transition-colors ${sejarahPage === dataSejarah.length - 1 ? 'text-stone-300 cursor-not-allowed' : 'text-stone-900 hover:text-amber-600'}`}>Lanjut Baca →</button>
            </div>
          </div>
        )}
      </div>

      {/* 2. VISI MISI & GARIS WAKTU */}
      <div id="visimisi" className="max-w-7xl mx-auto px-4 mt-32 mb-20 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* VISI MISI */}
          <div>
            <h2 className="text-3xl font-bold text-stone-900 font-playfair mb-8 flex items-center gap-4">
              Tujuan Asrama
              <div className="flex-grow h-px bg-stone-200"></div>
            </h2>
            <div className="bg-red-800 text-white p-8 md:p-10 rounded-sm shadow-xl mb-8 border-b-4 border-amber-500">
              <h3 className="font-sans font-bold tracking-widest uppercase text-amber-400 mb-4 text-sm">Visi Kami</h3>
              <p className="text-lg leading-relaxed font-playfair italic">"{profilText.visi}"</p>
            </div>
            <div className="bg-[#fcfbf9] p-8 md:p-10 rounded-sm shadow-sm border border-[#e8e4db]">
              <h3 className="font-sans font-bold tracking-widest uppercase text-red-800 mb-6 text-sm">Misi Kami</h3>
              <p className="text-stone-600 leading-relaxed whitespace-pre-line">{profilText.misi}</p>
            </div>
          </div>

          {/* TIMELINE */}
          <div id="timeline" className="scroll-mt-28">
            <h2 className="text-3xl font-bold text-stone-900 font-playfair mb-8 flex items-center gap-4">
              <div className="flex-grow h-px bg-stone-200 hidden lg:block"></div>
              Garis Waktu
              <div className="flex-grow h-px bg-stone-200 lg:hidden"></div>
            </h2>
            <div className="relative pl-8 border-l-2 border-amber-200 space-y-12 py-4">
              {dataTimeline.map((item, idx) => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-[41px] top-1 w-5 h-5 bg-white border-4 border-amber-500 rounded-full group-hover:bg-red-800 transition-colors shadow-sm"></div>
                  <div className="bg-amber-100 text-amber-800 font-bold font-sans text-xs tracking-widest uppercase px-3 py-1 w-fit rounded-sm mb-3">{item.tahun}</div>
                  <h4 className="font-bold text-xl text-stone-900 font-playfair mb-2 leading-snug">{item.judul}</h4>
                  <p className="text-stone-600 text-sm leading-relaxed">{item.deskripsi}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. STRUKTUR KEPENGURUSAN MENGGUNAKAN PROFILE CARD 3D */}
      <div id="kepengurusan" className="w-full bg-[#171412] mt-32 py-24 scroll-mt-0 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out border-t-8 border-red-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h4 className="text-amber-500 font-bold tracking-widest text-xs uppercase font-sans mb-3">Struktur Organisasi</h4>
            <h2 className="text-4xl md:text-5xl font-bold text-white font-playfair mb-4">Kepengurusan Asrama</h2>
            <p className="text-stone-400 font-lora italic">Gerakkan kursor atau miringkan HP Anda untuk melihat efek 3D.</p>
          </div>

          {loading ? <p className="text-center text-stone-400">Memuat struktur organisasi...</p> : (
            <>
              {/* PENGURUS INTI */}
              {pengurusInti && (
                <div className="mb-20">
                  <h3 className="text-center font-sans font-bold tracking-widest uppercase text-stone-400 mb-10 pb-4 border-b border-stone-800 max-w-xs mx-auto">Pengurus Inti</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-center max-w-5xl mx-auto">
                    {pengurusInti.ketuaNama && (
                      <ProfileCard name={pengurusInti.ketuaNama} status="Ketua Asrama" avatarUrl={pengurusInti.ketuaFoto} enableMobileTilt={true} />
                    )}
                    {pengurusInti.sekreNama && (
                      <ProfileCard name={pengurusInti.sekreNama} status="Sekretaris" avatarUrl={pengurusInti.sekreFoto} enableMobileTilt={true} />
                    )}
                    {pengurusInti.bendaharaNama && (
                      <ProfileCard name={pengurusInti.bendaharaNama} status="Bendahara" avatarUrl={pengurusInti.bendaharaFoto} enableMobileTilt={true} />
                    )}
                  </div>
                </div>
              )}

              {/* DIVISI DAN ANGGOTA */}
              {dataDivisi.map(div => {
                const anggotaDivisi = dataAnggota.filter(a => a.divisiId === div.id);
                if (anggotaDivisi.length === 0) return null;

                // Urutkan agar Koordinator tampil duluan
                const sortedAnggota = anggotaDivisi.sort((a, b) => {
                  if (a.peran === "Koordinator" && b.peran !== "Koordinator") return -1;
                  if (a.peran !== "Koordinator" && b.peran === "Koordinator") return 1;
                  return 0;
                });

                return (
                  <div key={div.id} className="mb-16">
                    <h3 className="text-center font-sans font-bold tracking-widest uppercase text-red-500 mb-8 pb-2 border-b border-stone-800 max-w-md mx-auto">{div.namaDivisi}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-center">
                      {sortedAnggota.map(anggota => (
                        <ProfileCard 
                          key={anggota.id} 
                          name={anggota.nama} 
                          status={anggota.peran} 
                          avatarUrl={anggota.foto} 
                          enableMobileTilt={true} 
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* 4. TITIK TEMU / LOKASI */}
      <div id="lokasi" className="max-w-7xl mx-auto px-4 mt-32 mb-10 scroll-mt-28 reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="bg-white p-8 md:p-14 rounded-sm shadow-[4px_4px_0px_0px_rgba(23,20,18,0.05)] border border-[#e8e4db] flex flex-col md:flex-row gap-12 items-center">
          <div className="w-full md:w-1/3">
            <h4 className="text-amber-600 font-bold tracking-widest text-xs uppercase font-sans mb-3 flex items-center gap-2"><div className="w-2 h-2 bg-red-800 rounded-full animate-pulse"></div> Lokasi</h4>
            <h2 className="text-4xl font-bold text-stone-900 font-playfair mb-6">Titik Temu</h2>
            <p className="text-stone-600 leading-relaxed mb-6">Jantung pergerakan dan ruang tumbuh bersama perantau Minang di sudut nyaman Kota Pelajar. Kami selalu terbuka untuk silaturahmi.</p>
            <div className="bg-stone-50 p-4 border-l-4 border-red-800 text-sm font-sans text-stone-700">Jl. Marga Agung, Karangwaru, Kec. Tegalrejo, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55241</div>
          </div>
          <div className="w-full md:w-2/3 h-80 bg-stone-200 rounded-sm overflow-hidden relative shadow-inner">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.1557025859345!2d110.3607062147774!3d-7.773307679269152!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a584ec66fb7bf%3A0x6e788e090dfc7b04!2sAsrama%20Mahasiswa%20Merapi%20Singgalang!5e0!3m2!1sen!2sid!4v1650000000000!5m2!1sen!2sid" 
              className="absolute inset-0 w-full h-full border-0" 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade">
            </iframe>
          </div>
        </div>
      </div>

    </div>
  );
}

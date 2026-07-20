"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Profil() {
  const [fotoProfil, setFotoProfil] = useState("");
  const [profilText, setProfilText] = useState({ sejarah: "Memuat...", visi: "Memuat...", misi: "Memuat...", nilai1: "Memuat...", nilai2: "Memuat...", nilai3: "Memuat..." });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapFoto = await getDoc(doc(db, "pengaturan", "tampilan"));
        if (snapFoto.exists() && snapFoto.data().profil) setFotoProfil(snapFoto.data().profil);

        const snapText = await getDoc(doc(db, "pengaturan", "profilText"));
        if (snapText.exists()) {
          const data = snapText.data();
          setProfilText({
            sejarah: data.sejarah || "Sejarah belum diatur.", visi: data.visi || "Visi belum diatur.", misi: data.misi || "Misi belum diatur.",
            nilai1: data.nilai1 || "Belum diatur.", nilai2: data.nilai2 || "Belum diatur.", nilai3: data.nilai3 || "Belum diatur."
          });
        }
      } catch (error) { console.error(error); }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-stone-50 pb-24">
      
      {/* HEADER HERO KONSISTEN */}
      <div className="relative py-24 md:py-32 w-full bg-[#171412] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" 
          style={{ backgroundImage: fotoProfil ? `url('${fotoProfil}')` : 'none', opacity: fotoProfil ? 1 : 0 }}
        >
          <div className="absolute inset-0 bg-[#171412]/70 backdrop-blur-[2px]"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white font-serif tracking-wide mb-4">Profil Asrama</h1>
          <div className="w-12 h-1 bg-amber-500 mx-auto rounded-full"></div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        
        {/* SEJARAH - Elegan Box */}
        <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 p-8 md:p-12 mb-10 border border-stone-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-800 to-amber-500"></div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-800"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg></div>
            <h2 className="text-3xl font-bold text-stone-900 font-serif">Sejarah Asrama</h2>
          </div>
          <p className="text-stone-600 leading-relaxed text-lg whitespace-pre-line text-justify">{profilText.sejarah}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-10">
            {/* VISI */}
            <div className="bg-white rounded-2xl shadow-md p-8 border border-stone-100 hover:border-amber-200 transition-colors">
              <h3 className="text-2xl font-bold text-stone-900 font-serif mb-5 flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Visi</h3>
              <div className="p-5 bg-[#fdfcf8] rounded-xl border-l-4 border-amber-500">
                <p className="text-stone-700 italic leading-relaxed text-justify whitespace-pre-line">"{profilText.visi}"</p>
              </div>
            </div>
            {/* MISI */}
            <div className="bg-white rounded-2xl shadow-md p-8 border border-stone-100 hover:border-red-200 transition-colors">
              <h3 className="text-2xl font-bold text-stone-900 font-serif mb-5 flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-red-800"></span> Misi</h3>
              <div className="p-5 bg-red-50/50 rounded-xl border-l-4 border-red-800">
                <p className="text-stone-700 leading-relaxed text-justify whitespace-pre-line">{profilText.misi}</p>
              </div>
            </div>
          </div>

          {/* NILAI KEPENGASUHAN */}
          <div className="bg-white rounded-2xl shadow-md p-8 md:p-10 border border-stone-100 h-fit">
            <h3 className="text-2xl font-bold text-stone-900 font-serif mb-8 border-b border-stone-100 pb-4">Nilai Kepengasuhan</h3>
            <ul className="space-y-8">
              <li className="flex gap-5">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 font-bold border border-amber-100">1</div>
                <div>
                  <h4 className="font-bold text-stone-900 mb-2 text-lg">Sistem Silang</h4>
                  <p className="text-stone-600 text-sm leading-relaxed">{profilText.nilai1}</p>
                </div>
              </li>
              <li className="flex gap-5">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-800 shrink-0 font-bold border border-red-100">2</div>
                <div>
                  <h4 className="font-bold text-stone-900 mb-2 text-lg">Intelektualitas</h4>
                  <p className="text-stone-600 text-sm leading-relaxed">{profilText.nilai2}</p>
                </div>
              </li>
              <li className="flex gap-5">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 shrink-0 font-bold border border-stone-200">3</div>
                <div>
                  <h4 className="font-bold text-stone-900 mb-2 text-lg">Kemandirian</h4>
                  <p className="text-stone-600 text-sm leading-relaxed">{profilText.nilai3}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

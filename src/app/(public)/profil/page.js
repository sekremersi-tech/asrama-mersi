"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Profil() {
  const [fotoProfil, setFotoProfil] = useState("");
  const [profilText, setProfilText] = useState({
    sejarah: "Memuat sejarah asrama...",
    visi: "Memuat visi...",
    misi: "Memuat misi...",
    nilai1: "Memuat deskripsi sistem silang...",
    nilai2: "Memuat deskripsi intelektualitas...",
    nilai3: "Memuat deskripsi kemandirian..."
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapFoto = await getDoc(doc(db, "pengaturan", "tampilan"));
        if (snapFoto.exists() && snapFoto.data().profil) setFotoProfil(snapFoto.data().profil);

        const snapText = await getDoc(doc(db, "pengaturan", "profilText"));
        if (snapText.exists()) {
          const data = snapText.data();
          setProfilText({
            sejarah: data.sejarah || "Sejarah belum diatur oleh admin.",
            visi: data.visi || "Visi belum diatur.",
            misi: data.misi || "Misi belum diatur.",
            nilai1: data.nilai1 || "Deskripsi sistem silang belum diatur.",
            nilai2: data.nilai2 || "Deskripsi intelektualitas belum diatur.",
            nilai3: data.nilai3 || "Deskripsi kemandirian belum diatur."
          });
        }
      } catch (error) { console.error(error); }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="h-64 md:h-96 relative w-full">
        <img src={fotoProfil} alt="Asrama Merapi Singgalang" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white font-serif tracking-wide">Profil Asrama</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="bg-white rounded-xl shadow-xl p-8 md:p-12 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-8 bg-red-800 rounded-full"></div>
            <h2 className="text-3xl font-bold text-slate-900 font-serif">Sejarah Asrama</h2>
          </div>
          <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line text-justify">{profilText.sejarah}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-slate-900 font-serif mb-4">Visi</h3>
              <div className="p-4 bg-slate-50 rounded-lg border-l-4 border-red-800">
                <p className="text-slate-700 italic leading-relaxed text-justify whitespace-pre-line">"{profilText.visi}"</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-slate-900 font-serif mb-4">Misi</h3>
              <div className="p-4 bg-slate-50 rounded-lg border-l-4 border-slate-800">
                <p className="text-slate-700 leading-relaxed text-justify whitespace-pre-line">{profilText.misi}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 h-fit">
            <h3 className="text-2xl font-bold text-slate-900 font-serif mb-6">Nilai Kepengasuhan</h3>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-red-800 mt-2 shrink-0"></div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Sistem Silang</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{profilText.nilai1}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-red-800 mt-2 shrink-0"></div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Intelektualitas</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{profilText.nilai2}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-red-800 mt-2 shrink-0"></div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Kemandirian</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{profilText.nilai3}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

function SecureViewerContent() {
  const searchParams = useSearchParams();
  const skripsiId = searchParams.get("id");
  const namaPeminta = searchParams.get("nama") || "NN";
  const hpPeminta = searchParams.get("hp") || "08xx";

  const [skripsi, setSkripsi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isBlurred, setIsBlurred] = useState(false);

  // Mencegah screenshot/rekam layar dengan memburamkan saat window tidak fokus
  useEffect(() => {
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    // Mencegah Print Screen (Terbatas pada browser desktop)
    const handleKeyDown = (e) => {
      if (e.key === "PrintScreen") {
        navigator.clipboard.writeText("Screenshot dinonaktifkan demi hak cipta.");
        setIsBlurred(true);
        setTimeout(() => setIsBlurred(false), 3000);
      }
    };
    window.addEventListener("keyup", handleKeyDown);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("keyup", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const fetchSkripsi = async () => {
      if (!skripsiId) {
        setError("Akses Ditolak: Link tidak valid.");
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "skripsi", skripsiId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSkripsi(docSnap.data());
        } else {
          setError("Dokumen skripsi tidak ditemukan.");
        }
      } catch (err) {
        setError("Terjadi kesalahan sistem.");
      } finally {
        setLoading(false);
      }
    };
    fetchSkripsi();
  }, [skripsiId]);

  // Fungsi untuk mengubah link PDF Cloudinary menjadi JPG Halaman 1, 2, dan 3
  const getPageImageUrl = (pdfUrl, pageNumber) => {
    if (!pdfUrl) return "";
    // Hapus format attachment agar tidak terdownload
    let cleanUrl = pdfUrl.replace("fl_attachment/", "");
    // Ganti ekstensi .pdf menjadi .jpg
    cleanUrl = cleanUrl.replace(/\.pdf$/i, ".jpg");
    // Tambahkan parameter halaman (pg_1, pg_2, dst)
    return cleanUrl.replace("/upload/", `/upload/pg_${pageNumber}/`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-900 text-white font-lora">Memuat Dokumen Rahasia...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-stone-900 text-red-500 font-bold font-lora">{error}</div>;

  return (
    <div 
      className="min-h-screen bg-[#1c1917] relative select-none"
      onContextMenu={(e) => e.preventDefault()} // Mencegah klik kanan
      style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none" }} // Mencegah tahan gambar di HP
    >
      {/* Peringatan Saat Layar Tidak Fokus */}
      {isBlurred && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center text-red-500 font-bold p-8 text-center flex-col gap-4">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
          <p>Tindakan Merekam/Screenshot Terdeteksi atau Layar Tidak Fokus.<br/>Melindungi Hak Cipta Skripsi.</p>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-stone-900 border-b border-stone-800 p-4 sticky top-0 z-40 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-white font-bold font-playfair line-clamp-1">{skripsi.judul}</h1>
          <p className="text-amber-500 text-xs font-sans tracking-widest uppercase">Penulis: {skripsi.nama} ({skripsi.tahun})</p>
        </div>
        <div className="bg-red-900/30 border border-red-800/50 text-red-200 px-3 py-1 rounded text-xs font-bold whitespace-nowrap">
          HANYA BACA (3 HALAMAN)
        </div>
      </div>

      {/* Area Dokumen dengan Watermark */}
      <div className={`relative max-w-4xl mx-auto p-4 md:p-8 transition-all duration-300 ${isBlurred ? 'blur-md opacity-50' : 'opacity-100'}`}>
        
        {/* WATERMARK BERJALAN YANG MEMENUHI LAYAR */}
        <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden opacity-[0.07] mix-blend-overlay">
          <div className="flex flex-wrap gap-12 rotate-[-30deg] scale-150 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4">
            {Array.from({ length: 150 }).map((_, i) => (
              <span key={i} className="text-3xl font-black text-white uppercase tracking-widest">
                DIBACA OLEH {namaPeminta} ({hpPeminta}) - HAK CIPTA MERSI - 
              </span>
            ))}
          </div>
        </div>

        {/* Gambar Halaman 1, 2, 3 */}
        <div className="space-y-8 relative z-20">
          {[1, 2, 3].map((page) => (
            <div key={page} className="bg-white rounded shadow-2xl relative">
              <div className="absolute top-2 right-2 bg-stone-900/60 backdrop-blur text-white text-xs px-2 py-1 rounded-sm z-10 pointer-events-none">Hal {page}</div>
              <img 
                src={getPageImageUrl(skripsi.linkPDF, page)} 
                alt={`Halaman ${page}`}
                className="w-full h-auto object-contain pointer-events-none"
                draggable="false"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-stone-500 text-sm font-lora border-t border-stone-800 pt-8 pb-12">
          <p>Anda telah mencapai batas 3 halaman yang diizinkan untuk pratinjau.</p>
          <p>Dilarang menyalin, merekam, atau menyebarkan dokumen ini tanpa izin.</p>
        </div>

      </div>
    </div>
  );
}

export default function SecureViewerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-900 text-white flex items-center justify-center">Memuat...</div>}>
      <SecureViewerContent />
    </Suspense>
  );
}

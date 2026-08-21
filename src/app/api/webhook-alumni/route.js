import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request) {
  try {
    const data = await request.json();

    let finalPekerjaan = data.pekerjaan || "";
    if (data.statusWarga === "Warga Aktif" || data.statusWarga === "Warga Cabang") {
      finalPekerjaan = "Mahasiswa";
    }

    // 1. PAYLOAD UNTUK TABEL ALUMNI/WARGA (Menyimpan semua data rahasia & publik)
    const payloadWarga = {
      nama: data.nama || "",
      asrama: data.asrama || "mersi", 
      statusWarga: data.statusWarga || "Alumni",
      asal: data.asal || "",
      kuliah: data.kuliah || "",
      jurusan: data.jurusan || "",
      angkatanAsrama: data.angkatanAsrama || "",
      pekerjaan: finalPekerjaan,
      skripsi: data.skripsi || "",
      prestasi: data.prestasi || "",
      pesan: data.pesan || "",
      foto: data.foto || "", 
      emailPemilik: data.emailPemilik || "", 
      noHp: data.noHp || "", // Disimpan di database, tapi tidak dimunculkan di halaman publik
      tahunLulus: data.tahunLulus || "",
      createdAt: serverTimestamp(),
    };

    // Eksekusi Simpan ke Tabel Warga
    await addDoc(collection(db, "pesan_alumni"), payloadWarga);

    // 2. LOGIKA DUPLIKASI KE REPOSITORI SKRIPSI (Jika judul skripsinya diisi)
    if (data.skripsi && data.skripsi.trim() !== "" && data.skripsi.toLowerCase() !== "-") {
      const payloadSkripsi = {
        nama: data.nama || "",
        jurusan: data.jurusan || "",
        judul: data.skripsi,
        tahun: data.tahunLulus || "", // Diambil dari input form baru
        createdAt: serverTimestamp()
      };
      
      // Eksekusi Simpan ke Tabel Repositori Skripsi
      await addDoc(collection(db, "skripsi"), payloadSkripsi);
    }

    return NextResponse.json({ success: true, message: 'Data masuk ke Pangkalan Warga & Repositori!' }, { status: 200 });
  } catch (error) {
    console.error("Gagal menerima Webhook:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

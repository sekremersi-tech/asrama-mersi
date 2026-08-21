import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request) {
  try {
    // 1. Menerima data JSON dari Google Form (Apps Script)
    const data = await request.json();

    // 2. Logika Cerdas: Jika dia Warga Aktif/Cabang, otomatis set pekerjaan jadi Mahasiswa
    let finalPekerjaan = data.pekerjaan || "";
    if (data.statusWarga === "Warga Aktif" || data.statusWarga === "Warga Cabang") {
      finalPekerjaan = "Mahasiswa";
    }

    // 3. Menyusun kerangka data sesuai dengan format database website kita
    const payload = {
      nama: data.nama || "",
      asrama: data.asrama || "mersi", // default mersi
      statusWarga: data.statusWarga || "Alumni", // default alumni
      asal: data.asal || "",
      kuliah: data.kuliah || "",
      jurusan: data.jurusan || "",
      angkatanAsrama: data.angkatanAsrama || "",
      pekerjaan: finalPekerjaan,
      skripsi: data.skripsi || "",
      prestasi: data.prestasi || "",
      pesan: data.pesan || "",
      foto: data.foto || "", // Jika kosong akan pakai avatar inisial nama
      createdAt: serverTimestamp(),
    };

    // 4. Menyimpan data langsung ke Firebase Database (koleksi pesan_alumni)
    await addDoc(collection(db, "pesan_alumni"), payload);

    return NextResponse.json({ success: true, message: 'Data sukses masuk ke Firebase!' }, { status: 200 });
  } catch (error) {
    console.error("Gagal menerima Webhook:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

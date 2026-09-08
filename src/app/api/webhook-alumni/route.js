import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

export async function POST(request) {
  try {
    const data = await request.json();

    // Logika penyesuaian pekerjaan untuk warga aktif
    let finalPekerjaan = data.pekerjaan || "";
    if (data.statusWarga === "Warga Aktif" || data.statusWarga === "Warga Cabang") {
      finalPekerjaan = "Mahasiswa";
    }

    // 1. CEK APAKAH EMAIL INI SUDAH PERNAH MENGISI FORM SEBELUMNYA
    const qWarga = query(collection(db, "pesan_alumni"), where("emailPemilik", "==", data.emailPemilik));
    const snapshotWarga = await getDocs(qWarga);

    if (!snapshotWarga.empty) {
      // ===== JIKA EMAIL SUDAH ADA: LAKUKAN UPDATE DATA LAMA =====
      const docId = snapshotWarga.docs[0].id;
      const docRef = doc(db, "pesan_alumni", docId);
      
      await updateDoc(docRef, {
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
        // CATATAN PENTING: Kolom "foto" dan "emailPemilik" sengaja TIDAK di-update 
        // agar foto yang sudah diunggah secara mandiri di website tidak tertimpa/hilang.
        noHp: data.noHp || "", 
        tahunLulus: data.tahunLulus || "",
        updatedAt: serverTimestamp(),
      });

    } else {
      // ===== JIKA EMAIL BELUM ADA: BUAT DATA BARU =====
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
        noHp: data.noHp || "", 
        tahunLulus: data.tahunLulus || "",
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, "pesan_alumni"), payloadWarga);
    }

    // 2. LOGIKA DUPLIKASI KE REPOSITORI SKRIPSI
    if (data.skripsi && data.skripsi.trim() !== "" && data.skripsi.toLowerCase() !== "-") {
      
      // Cegah Skripsi Ganda: Cek apakah skripsi atas nama & judul ini sudah ada di tabel
      const qSkripsi = query(
        collection(db, "skripsi"), 
        where("nama", "==", data.nama || ""),
        where("judul", "==", data.skripsi)
      );
      const snapshotSkripsi = await getDocs(qSkripsi);

      if (snapshotSkripsi.empty) {
        // Jika belum ada di repositori, tambahkan sebagai data baru
        const payloadSkripsi = {
          nama: data.nama || "",
          jurusan: data.jurusan || "",
          judul: data.skripsi,
          tahun: data.tahunLulus || "", 
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, "skripsi"), payloadSkripsi);
      }
    }

    return NextResponse.json({ success: true, message: 'Data berhasil diproses ke Pangkalan Warga & Repositori!' }, { status: 200 });
  } catch (error) {
    console.error("Gagal menerima Webhook:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

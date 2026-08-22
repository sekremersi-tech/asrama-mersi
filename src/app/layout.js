import "./globals.css"; // INI ADALAH KUNCI AGAR CSS/DESAINNYA MUNCUL

export const metadata = {
  title: "Asrama Pemerintah Sumatera Barat",
  description: "Asrama Mahasiswa Merapi Singgalang dan Bundo Kanduang Yogyakarta",
  verification: {
    google: "PkJcYokRvowvU0LMTeBlu54SX2NQRyI_rrpcXMZRzEY",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

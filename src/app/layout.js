import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Asrama Mahasiswa Merapi Singgalang",
  description: "Website resmi, informasi pendaftaran, dan repositori publikasi Asrama Mahasiswa Merapi Singgalang (Mersi) di Daerah Istimewa Yogyakarta.",
  keywords: [
    "Asrama Merapi Singgalang", 
    "Asrama Minang Jogja", 
    "Asrama Mahasiswa Padang di Yogyakarta", 
    "Pendaftaran Asrama Mersi", 
    "Mahasiswa Perantau Minang", 
    "Asrama Sumatera Barat Jogja"
  ],
  authors: [{ name: "Asrama Merapi Singgalang" }],
  icons: {
    icon: "/mersi.png", 
  },
  
  // VERIFIKASI GOOGLE SEARCH CONSOLE
  verification: {
    google: 'PkJcYokRvowvU0LMTeBlu54SX2NQRyI_rrpcXMZRzEY', 
  },

  openGraph: {
    title: 'Asrama Mahasiswa Merapi Singgalang',
    description: 'Rumah Gadang Perantau Minang di Yogyakarta. Temukan informasi pendaftaran, fasilitas, dan jejak prestasi warga asrama.',
    url: 'https://asramamersi.netlify.app', 
    siteName: 'Asrama Merapi Singgalang',
    images: [
      {
        url: '/mersi.png', 
        width: 800,
        height: 600,
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

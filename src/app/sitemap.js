export default function sitemap() {
  // GANTI URL DI BAWAH INI DENGAN DOMAIN NETLIFY / DOMAIN ASLI ANDA
  // Contoh: 'https://asramamersijogja.netlify.app' atau 'https://asramamersi.com'
  const baseUrl = 'https://asramamersi.netlify.app/'; 

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/beranda`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/profil`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/fasilitas`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/kehidupan`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9, // Publikasi sering update, prioritas tinggi
    },
    {
      url: `${baseUrl}/alumni`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];
}

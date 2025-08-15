// ===========================================
// Fungsi: fetchSheetData
// Tujuan: Mengambil data dari Google Sheets yang dipublikasikan sebagai CSV
// Output: Array objek, misal [{Tanggal, Wali_Kelas, Mata_Pelajaran, Kelas, Nama_Siswa, Status}, ...]
// ===========================================
async function fetchSheetData() {
  // URL CSV Google Sheets publik
  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQAEwBLEhaehGYlzYsNhBPfmozGvRZmpjyEOHC8rfgduB0JRurz-xwI_jfW8Fw8Vaz93a_E9tLyuIX9/pub?gid=0&single=true&output=csv";
  
  // Fetch data dari URL
  const res = await fetch(url);
  const csvText = await res.text(); // Ambil konten CSV sebagai teks
  
  // Pisahkan per baris dan buang baris kosong
  const lines = csvText.split("\n").filter(l => l.trim() !== "");
  
  // Ambil baris pertama sebagai header, trim spasi
  const headers = lines[0].split(",").map(h => h.trim());
  
  // Ubah setiap baris menjadi objek {header: value}
  return lines.slice(1).map(line => {
    const vals = line.split(","); // Pisahkan per kolom
    const obj = {};
    headers.forEach((h,i) => obj[h] = vals[i]?.trim() ?? ""); // isi "" jika kosong
    return obj;
  });
}

// ===========================================
// Main: Proses data dan tampilkan di tabel
// ===========================================
fetchSheetData().then(data => {
  // ===========================
  // Kelompokkan data berdasarkan Mata_Pelajaran + Kelas
  // ===========================
  const grouped = {}; // menampung hasil pengelompokan
  
  data.forEach(d => {
    // Kunci unik per Mapel + Kelas
    const key = `${d.Mata_Pelajaran}||${d.Kelas}`;
    
    // Jika belum ada, inisialisasi
    if(!grouped[key]) {
      grouped[key] = {
        mapel: d.Mata_Pelajaran, 
        kelas: d.Kelas, 
        tuntas: 0, 
        ujian: 0
      };
    }
    
    // Hitung status Tuntas dan Ujian
    const status = (d.Status || "").trim();
    if(status === "Tuntas") grouped[key].tuntas++;
    if(status === "Ujian") grouped[key].ujian++;
  });

  // ===========================
  // Tampilkan di tabel HTML
  // ===========================
  const tbody = document.getElementById('dataTable'); // tbody target
  tbody.innerHTML = ""; // Kosongkan isi tabel dulu

  if(Object.keys(grouped).length === 0){
    // Jika tidak ada data
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Data tidak tersedia</td></tr>';
  } else {
    // Jika ada data, buat baris per kelompok
    Object.values(grouped).forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.mapel}</td>
        <td>${row.kelas}</td>
        <td>${row.tuntas}</td>
        <td>${row.ujian}</td>
      `;
      tbody.appendChild(tr); // tambahkan ke tabel
    });
  }
});

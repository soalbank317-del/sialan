// ===========================================
// Variabel Global
// ===========================================
// Menyimpan seluruh data, data hasil filter, halaman saat ini, dan jumlah baris per halaman
let allData = [], filteredData = [], currentPage = 1, rowsPerPage = 15;

// ===========================================
// Fungsi: parseIndoDateTime
// ===========================================
// Tujuan: Mengubah string tanggal dari format Indonesia "dd/mm/yyyy hh:mm:ss" menjadi objek Date JS
// Input: "25/08/2025 14:30:00" atau "25/08/2025"
// Output: objek Date
function parseIndoDateTime(dateStr) {
  const [datePart, timePart] = dateStr.split(" "); // pisahkan tanggal dan waktu
  if (!datePart) return new Date(dateStr); // fallback jika format tidak sesuai
  const [day, month, year] = datePart.split("/").map(Number);
  let hours = 0, minutes = 0, seconds = 0;
  if (timePart) [hours, minutes, seconds] = timePart.split(":").map(Number);
  return new Date(year, month-1, day, hours, minutes, seconds); // bulan di JS 0-based
}

// ===========================================
// Fungsi: sortByLatestDate
// ===========================================
// Tujuan: Mengurutkan data berdasarkan tanggal terbaru
// Input: array data
// Output: array data terurut dari terbaru ke terlama
function sortByLatestDate(data) {
  return data.sort((a,b) => parseIndoDateTime(b.Tanggal) - parseIndoDateTime(a.Tanggal));
}

// ===========================================
// Fungsi: loadRekapData
// ===========================================
// Tujuan: Memuat data dari Google Sheets CSV
// Catatan: Sheet dipublikasikan sebagai CSV dengan tab sebagai pemisah
// Output: array objek {Tanggal, Wali_Kelas, Mata_Pelajaran, Kelas, Nama_Siswa, Status}
async function loadRekapData() {
  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQAEwBLEhaehGYlzYsNhBPfmozGvRZmpjyEOHC8rfgduB0JRurz-xwI_jfW8Fw8Vaz93a_E9tLyuIX9/pub?gid=0&single=true&output=csv";
  const res = await fetch(url);
  const csvText = await res.text();
  const lines = csvText.split("\n").filter(l => l.trim() !== ""); // hapus baris kosong
  // Gunakan tab sebagai pemisah karena CSV dipisahkan tab
  const headers = lines[0].split("\t").map(h => h.trim().replace(/\s+/g, "_")); 
  return lines.slice(1).map(line => {
    const vals = line.split("\t"); // pisahkan tiap kolom
    const obj = {};
    headers.forEach((h,i)=> obj[h] = (vals[i]||"").trim()); // mapping header → value
    return obj;
  });
}

// ===========================================
// Fungsi: renderTablePage
// ===========================================
// Tujuan: Menampilkan tabel sesuai halaman saat ini
// Input: nomor halaman
function renderTablePage(page){
  const tbody = document.querySelector('#rekapTable tbody');
  tbody.innerHTML = '';
  const start = (page-1)*rowsPerPage;
  const end = start + rowsPerPage;
  filteredData.slice(start,end).forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.Tanggal||""}</td>
      <td>${row.Wali_Kelas||""}</td>
      <td>${row.Mata_Pelajaran||""}</td>
      <td>${row.Kelas||""}</td>
      <td>${row.Nama_Siswa||""}</td>
      <td>${row.Status||""}</td>
    `;
    tbody.appendChild(tr);
  });
  if(filteredData.length === 0){
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Data tidak tersedia</td></tr>';
  }
  // Update indikator halaman
  document.getElementById('pageNum').textContent = currentPage;
  document.getElementById('totalPages').textContent = Math.ceil(filteredData.length/rowsPerPage);
}

// ===========================================
// Fungsi: applyFilters
// ===========================================
// Tujuan: Menerapkan filter kelas, mapel, status, dan pencarian nama siswa
// Output: memperbarui filteredData dan menampilkan tabel
function applyFilters(){
  const kelas = document.getElementById('filterKelas').value;
  const mapel = document.getElementById('filterMapel').value;
  const status = document.getElementById('filterStatus').value;
  const search = document.getElementById('searchNama').value.toLowerCase();

  filteredData = allData.filter(d =>
    (!kelas || d.Kelas===kelas) &&
    (!mapel || d.Mata_Pelajaran===mapel) &&
    (!status || d.Status===status) &&
    (!search || (d.Nama_Siswa||"").toLowerCase().includes(search))
  );

  filteredData = sortByLatestDate(filteredData);
  currentPage = 1;
  renderTablePage(currentPage);
}

// ===========================================
// Fungsi: init
// ===========================================
// Tujuan: Inisialisasi halaman, load data, populate filter, dan event listener
async function init(){
  allData = await loadRekapData(); // load CSV
  allData = sortByLatestDate(allData);
  filteredData = [...allData];

  // Populate filter Kelas dan Mapel
  const kelasSet = new Set(allData.map(d=>d.Kelas).filter(Boolean));
  const mapelSet = new Set(allData.map(d=>d.Mata_Pelajaran).filter(Boolean));

  kelasSet.forEach(k => document.getElementById('filterKelas').innerHTML += `<option value="${k}">${k}</option>`);
  mapelSet.forEach(m => document.getElementById('filterMapel').innerHTML += `<option value="${m}">${m}</option>`);

  renderTablePage(currentPage);

  // Event Listener untuk filter, reset, pagination, dan rows per page
  document.getElementById('applyFilter').addEventListener('click', applyFilters);
  document.getElementById('resetFilter').addEventListener('click', ()=>{
    document.getElementById('filterKelas').value = '';
    document.getElementById('filterMapel').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('searchNama').value = '';
    filteredData = sortByLatestDate([...allData]);
    currentPage = 1;
    renderTablePage(currentPage);
  });
  document.getElementById('rowsPerPage').addEventListener('change', e=>{
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderTablePage(currentPage);
  });
  document.getElementById('prevPage').addEventListener('click', ()=>{
    if(currentPage>1){currentPage--; renderTablePage(currentPage);}
  });
  document.getElementById('nextPage').addEventListener('click', ()=>{
    if(currentPage<Math.ceil(filteredData.length/rowsPerPage)){currentPage++; renderTablePage(currentPage);}
  });
}

// Jalankan inisialisasi saat halaman load
init();

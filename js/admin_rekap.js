// ===========================================
// Variabel Global
// ===========================================
// allData: menyimpan semua data dari Google Sheets
// filteredData: menyimpan data yang sudah difilter sesuai input user
// currentPage: halaman saat ini di tabel paginasi
// rowsPerPage: jumlah baris per halaman
let allData = [], filteredData = [], currentPage = 1, rowsPerPage = 15;

// ===========================================
// Fungsi: parseIndoDateTime
// ===========================================
// Mengubah string tanggal Indonesia "dd/mm/yyyy hh:mm:ss" menjadi objek Date JS
function parseIndoDateTime(dateStr) {
  const [datePart, timePart] = dateStr.split(" ");
  if (!datePart) return new Date(dateStr); // fallback
  const [day, month, year] = datePart.split("/").map(Number);
  let hours = 0, minutes = 0, seconds = 0;
  if (timePart) [hours, minutes, seconds] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

// ===========================================
// Fungsi: sortByLatestDate
// ===========================================
// Mengurutkan data berdasarkan tanggal terbaru ke terlama
function sortByLatestDate(data) {
  return data.sort((a, b) => parseIndoDateTime(b.Tanggal) - parseIndoDateTime(a.Tanggal));
}

// ===========================================
// Fungsi: loadRekapData
// ===========================================
// Mengambil data dari Google Sheets melalui Apps Script
// lalu menyimpan ke variabel global dan menampilkan halaman pertama
function loadRekapData() {
  google.script.run.withSuccessHandler(function(data) {
    allData = data;                    // simpan semua data
    filteredData = [...allData];       // salin data untuk filter
    allData = sortByLatestDate(allData); // urutkan berdasarkan tanggal terbaru
    renderTablePage(currentPage);      // tampilkan halaman pertama
  }).getRekapData();
}

// ===========================================
// Fungsi: renderTablePage
// ===========================================
// Menampilkan data di tabel sesuai halaman dan rowsPerPage
function renderTablePage(page) {
  const tbody = document.querySelector('#rekapTable tbody');
  tbody.innerHTML = '';                 // kosongkan tbody sebelum render
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;

  // Loop data yang sesuai halaman
  filteredData.slice(start, end).forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.Tanggal || ""}</td>
      <td>${row.Wali_Kelas || ""}</td>
      <td>${row.Mata_Pelajaran || ""}</td>
      <td>${row.Kelas || ""}</td>
      <td>${row.Nama_Siswa || ""}</td>
      <td>${row.Status || ""}</td>
    `;
    tbody.appendChild(tr);
  });

  // Jika tidak ada data, tampilkan pesan
  if (filteredData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Data tidak tersedia</td></tr>';
  }

  // Update indikator halaman
  document.getElementById('pageNum').textContent = currentPage;
  document.getElementById('totalPages').textContent = Math.ceil(filteredData.length / rowsPerPage);

  // Tampilkan jumlah data yang ditemukan
  document.getElementById('totalFiltered').textContent = `Jumlah Data Ditemukan: ${filteredData.length}`;
}

// ===========================================
// Fungsi: applyFilters
// ===========================================
// Filter data sesuai input user: kelas, mata pelajaran, status, nama siswa
function applyFilters() {
  const kelas = document.getElementById('filterKelas').value;
  const matapelajaran = document.getElementById('filterMatapelajaran').value;
  const status = document.getElementById('filterStatus').value;
  const search = document.getElementById('searchNama').value.toLowerCase();

  filteredData = allData.filter(d =>
    (!kelas || d.Kelas === kelas) &&
    (!matapelajaran || d.Mata_Pelajaran === matapelajaran) &&
    (!status || d.Status === status) &&
    (!search || (d.Nama_Siswa || "").toLowerCase().includes(search))
  );

  filteredData = sortByLatestDate(filteredData); // urutkan ulang
  currentPage = 1;                                // reset ke halaman 1
  renderTablePage(currentPage);
}

// ===========================================
// Fungsi: init
// ===========================================
// Inisialisasi halaman: load data, setup filter, pagination, rows per page
function init() {
  loadRekapData();

  // Populate filter options dari data yang ada
  const kelasSet = new Set(allData.map(d => d.Kelas).filter(Boolean));
  const matapelajaranSet = new Set(allData.map(d => d.Mata_Pelajaran).filter(Boolean));

  kelasSet.forEach(k => document.getElementById('filterKelas').innerHTML += `<option value="${k}">${k}</option>`);
  matapelajaranSet.forEach(m => document.getElementById('filterMatapelajaran').innerHTML += `<option value="${m}">${m}</option>`);

  // Event listener filter
  document.getElementById('applyFilter').addEventListener('click', applyFilters);

  // Reset filter
  document.getElementById('resetFilter').addEventListener('click', () => {
    document.getElementById('filterKelas').value = '';
    document.getElementById('filterMatapelajaran').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('searchNama').value = '';
    filteredData = sortByLatestDate([...allData]);
    currentPage = 1;
    renderTablePage(currentPage);
  });

  // Event listener untuk ubah jumlah baris per halaman
  document.getElementById('rowsPerPage').addEventListener('change', e => {
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderTablePage(currentPage);
  });

  // Pagination
  document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderTablePage(currentPage); }
  });
  document.getElementById('nextPage').addEventListener('click', () => {
    if (currentPage < Math.ceil(filteredData.length / rowsPerPage)) { currentPage++; renderTablePage(currentPage); }
  });
}

// ===========================================
// Jalankan inisialisasi saat halaman siap
// ===========================================
init();

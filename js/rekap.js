// ===========================================
// Variabel Global
// ===========================================
let allData = [], filteredData = [], currentPage = 1, rowsPerPage = 15;

// ===========================================
// Fungsi: parseIndoDateTime
// ===========================================
function parseIndoDateTime(dateStr) {
  const [datePart, timePart] = dateStr.split(" ");
  if (!datePart) return new Date(dateStr);
  const [day, month, year] = datePart.split("/").map(Number);
  let hours=0, minutes=0, seconds=0;
  if (timePart) [hours, minutes, seconds] = timePart.split(":").map(Number);
  return new Date(year, month-1, day, hours, minutes, seconds);
}

// ===========================================
// Fungsi: sortByLatestDate
// ===========================================
function sortByLatestDate(data) {
  return data.sort((a,b) => parseIndoDateTime(b.Tanggal) - parseIndoDateTime(a.Tanggal));
}

// ===========================================
// Fungsi: loadRekapData
// ===========================================
async function loadRekapData() {
  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQAEwBLEhaehGYlzYsNhBPfmozGvRZmpjyEOHC8rfgduB0JRurz-xwI_jfW8Fw8Vaz93a_E9tLyuIX9/pub?gid=0&single=true&output=csv";
  const res = await fetch(url);
  const csvText = await res.text();
  const lines = csvText.split("\n").filter(l => l.trim() !== "");
  const headers = lines[0].split(";").map(h => h.trim().replace(/\s+/g, "_"));
  return lines.slice(1).map(line => {
    const vals = line.split(";");
    const obj = {};
    headers.forEach((h,i)=> obj[h] = (vals[i]||"").trim());
    return obj;
  });
}

// ===========================================
// Fungsi: renderTablePage
// ===========================================
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

  // Tambahkan jumlah data yang ditemukan
  document.getElementById('totalFiltered').textContent = `Jumlah Data Ditemukan: ${filteredData.length}`;
}

// ===========================================
// Fungsi: applyFilters
// ===========================================
function applyFilters(){
  const kelas = document.getElementById('filterKelas').value;
  const matapelajaran = document.getElementById('filterMatapelajaran').value;
  const status = document.getElementById('filterStatus').value;
  const search = document.getElementById('searchNama').value.toLowerCase();

  filteredData = allData.filter(d =>
    (!kelas || d.Kelas===kelas) &&
    (!matapelajaran || d.Mata_Pelajaran===matapelajaran) &&
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
async function init(){
  allData = await loadRekapData();
  allData = sortByLatestDate(allData);
  filteredData = [...allData];

  // Populate filter options
  const kelasSet = new Set(allData.map(d=>d.Kelas).filter(Boolean));
  const matapelajaranSet = new Set(allData.map(d=>d.Mata_Pelajaran).filter(Boolean));
  kelasSet.forEach(k => document.getElementById('filterKelas').innerHTML += `<option value="${k}">${k}</option>`);
  matapelajaranSet.forEach(m => document.getElementById('filterMatapelajaran').innerHTML += `<option value="${m}">${m}</option>`);

  renderTablePage(currentPage);

  // Event listener
  document.getElementById('applyFilter').addEventListener('click', applyFilters);
  document.getElementById('resetFilter').addEventListener('click', ()=>{
    document.getElementById('filterKelas').value = '';
    document.getElementById('filtermatapelajaran').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('searchNama').value = '';
    filteredData = sortByLatestDate([...allData]);
    currentPage = 1;
    renderTablePage(currentPage);
  });

  document.getElementById('rowsPerPage').addEventListener('change', e => {
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderTablePage(currentPage);
  });

  document.getElementById('prevPage').addEventListener('click', ()=>{
    if(currentPage>1){ currentPage--; renderTablePage(currentPage);}
  });
  document.getElementById('nextPage').addEventListener('click', ()=>{
    if(currentPage<Math.ceil(filteredData.length/rowsPerPage)){ currentPage++; renderTablePage(currentPage);}
  });
}

// Jalankan inisialisasi
init();



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
  let hours = 0, minutes = 0, seconds = 0;
  if (timePart) [hours, minutes, seconds] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

// ===========================================
// Fungsi: sortByLatestDate
// ===========================================
function sortByLatestDate(data) {
  return data.sort((a, b) => parseIndoDateTime(b.Tanggal) - parseIndoDateTime(a.Tanggal));
}

// ===========================================
// Fungsi: loadRekapData
// ===========================================
function loadRekapData() {
  google.script.run.withSuccessHandler(function(data) {
    allData = data;
    filteredData = [...allData];
    allData = sortByLatestDate(allData);
    renderTablePage(currentPage);
  }).getRekapData();
}

// ===========================================
// Fungsi: renderTablePage
// ===========================================
function renderTablePage(page) {
  const tbody = document.querySelector('#rekapTable tbody');
  tbody.innerHTML = '';
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;

  filteredData.slice(start, end).forEach(row => {
    const tr = document.createElement('tr');
    tr.dataset.rowIndex = row.RowIndex;
    tr.innerHTML = `
      <td>${row.Tanggal || ""}</td>
      <td>${row.Wali_Kelas || ""}</td>
      <td>${row.Mata_Pelajaran || ""}</td>
      <td>${row.Kelas || ""}</td>
      <td>${row.Nama_Siswa || ""}</td>
      <td>${row.Status || ""}</td>
      <td><button class="edit-btn">Edit</button></td>
    `;
    tbody.appendChild(tr);
  });

  if (filteredData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Data tidak tersedia</td></tr>';
  }

  // Update indikator halaman
  document.getElementById('pageNum').textContent = currentPage;
  document.getElementById('totalPages').textContent = Math.ceil(filteredData.length / rowsPerPage);

  // Tampilkan jumlah data yang ditemukan
  document.getElementById('totalFiltered').textContent = `Jumlah Data Ditemukan: ${filteredData.length}`;

  // Event listener untuk tombol Edit
  document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', function() {
      const rowIndex = this.closest('tr').dataset.rowIndex;
      const rowData = filteredData.find(row => row.RowIndex == rowIndex);
      if (rowData) {
        openEditModal(rowData);
      }
    });
  });
}

// ===========================================
// Fungsi: openEditModal
// ===========================================
function openEditModal(rowData) {
  document.getElementById('editModal').style.display = 'block';
  document.getElementById('editNama').value = rowData.Nama_Siswa;
  document.getElementById('editStatus').value = rowData.Status;
  document.getElementById('editRowIndex').value = rowData.RowIndex;
}

// ===========================================
// Fungsi: closeEditModal
// ===========================================
function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
}

// ===========================================
// Fungsi: saveEdit
// ===========================================
function saveEdit() {
  const rowIndex = document.getElementById('editRowIndex').value;
  const updatedStatus = document.getElementById('editStatus').value;

  const updatedData = {
    Status: updatedStatus
  };

  google.script.run.withSuccessHandler(function() {
    const row = filteredData.find(row => row.RowIndex == rowIndex);
    if (row) {
      row.Status = updatedStatus;
      renderTablePage(currentPage);
      closeEditModal();
    }
  }).updateRekapData(updatedData, rowIndex);
}

// ===========================================
// Fungsi: applyFilters
// ===========================================
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

  filteredData = sortByLatestDate(filteredData);
  currentPage = 1;
  renderTablePage(currentPage);
}

// ===========================================
// Fungsi: init
// ===========================================
function init() {
  loadRekapData();

  // Populate filter options
  const kelasSet = new Set(allData.map(d => d.Kelas).filter(Boolean));
  const matapelajaranSet = new Set(allData.map(d => d.Mata_Pelajaran).filter(Boolean));

  kelasSet.forEach(k => document.getElementById('filterKelas').innerHTML += `<option value="${k}">${k}</option>`);
  matapelajaranSet.forEach(m => document.getElementById('filterMatapelajaran').innerHTML += `<option value="${m}">${m}</option>`);

  // Event listener filter
  document.getElementById('applyFilter').addEventListener('click', applyFilters);
  document.getElementById('resetFilter').addEventListener('click', () => {
    document.getElementById('filterKelas').value = '';
    document.getElementById('filterMatapelajaran').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('searchNama').value = '';
    filteredData = sortByLatestDate([...allData]);
    currentPage = 1;
    renderTablePage(currentPage);
  });

  // Event listener rows per page
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

  // Modal close
  document.getElementById('closeModal').addEventListener('click', closeEditModal);
  document.getElementById('saveEdit').addEventListener('click', saveEdit);
}

// Jalankan inisialisasi
init();

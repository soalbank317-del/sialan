// ==========================
// === Overlay / Loader ===
// ==========================
const overlay = document.createElement('div');
overlay.id = 'overlay';
Object.assign(overlay.style, {
  position: 'fixed',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  background: 'rgba(255,255,255,0.9)',
  zIndex: '9999',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});
overlay.innerHTML = `
  <div class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>
`;
document.body.prepend(overlay);

// ==========================
// === Proteksi Login ===
// ==========================
const user = sessionStorage.getItem('user');
if (!user) {
  overlay.remove();
  alert('Anda belum login! Akses ditolak.');
  window.location.href = 'login.html';
}

// ==========================
// === Logout Handler ===
// ==========================
document.getElementById('logoutBtn')?.addEventListener('click', e => {
  e.preventDefault();
  sessionStorage.removeItem('user');
  window.location.href = 'login.html';
});

// ==========================
// === REKAP DATA ===
// ==========================
if (document.getElementById('rekapTable')) {
  let allData = [], filteredData = [], currentPage = 1, rowsPerPage = 15;
  let selectedRowIndex = null; // Index baris yang sedang diedit

  // Fungsi parsing tanggal Indonesia menjadi objek Date
  function parseIndoDateTime(dateStr) {
    const [datePart, timePart] = dateStr.split(" ");
    if (!datePart) return new Date(dateStr);
    const [day, month, year] = datePart.split("/").map(Number);
    let hours = 0, minutes = 0, seconds = 0;
    if (timePart) [hours, minutes, seconds] = timePart.split(":").map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  // Fungsi sorting berdasarkan tanggal terbaru
  function sortByLatestDate(data) {
    return data.sort((a, b) => parseIndoDateTime(b.Tanggal) - parseIndoDateTime(a.Tanggal));
  }

  // Fungsi ambil data CSV dari Google Sheets
  async function loadRekapData() {
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQAEwBLEhaehGYlzYsNhBPfmozGvRZmpjyEOHC8rfgduB0JRurz-xwI_jfW8Fw8Vaz93a_E9tLyuIX9/pub?gid=0&single=true&output=csv";
    const res = await fetch(url);
    const csvText = await res.text();

    const rows = csvText.split(/\r?\n/).filter(Boolean)
      .map(r => r.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/));

    const headers = rows[0].map(h => h.trim().replace(/\s+/g, "_"));
    return rows.slice(1).map(vals => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = (vals[i] || "").replace(/^"|"$/g, "").trim());
      return obj;
    });
  }

  // Update total data yang difilter
  function updateTotalFiltered() {
    const totalEl = document.getElementById('totalFiltered');
    if (totalEl) totalEl.textContent = `Total Data: ${filteredData.length}`;
  }

  // Render tabel berdasarkan halaman
  function renderTablePage(page) {
    const tbody = document.querySelector('#rekapTable tbody');
    tbody.innerHTML = '';
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    filteredData.slice(start, end).forEach((row, idx) => {
      tbody.innerHTML += `
        <tr>
          <td>${row.Tanggal || ""}</td>
          <td>${row.Wali_Kelas || ""}</td>
          <td>${row.Mata_Pelajaran || ""}</td>
          <td>${row.Kelas || ""}</td>
          <td>${row.Nama_Siswa || ""}</td>
          <td>${row.Status || ""}</td>
          <td>
            <button class="btn btn-sm btn-warning editBtn" data-index="${start + idx}">Edit</button>
          </td>
        </tr>
      `;
    });

    if (filteredData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">Data tidak tersedia</td></tr>';
    }

    document.getElementById('pageNum').textContent = currentPage;
    document.getElementById('totalPages').textContent = Math.ceil(filteredData.length / rowsPerPage);
    updateTotalFiltered();

    // Event tombol edit
    document.querySelectorAll('.editBtn').forEach(btn => {
      btn.addEventListener('click', e => {
        selectedRowIndex = parseInt(e.target.dataset.index);
        openEditModal(filteredData[selectedRowIndex]);
      });
    });
  }

  // Modal edit data
  function openEditModal(data) {
    const modal = document.getElementById('editModal');
    document.getElementById('editTanggal').value = data.Tanggal || '';
    document.getElementById('editWali').value = data.Wali_Kelas || '';
    document.getElementById('editMapel').value = data.Mata_Pelajaran || '';
    document.getElementById('editKelas').value = data.Kelas || '';
    document.getElementById('editNama').value = data.Nama_Siswa || '';
    document.getElementById('editStatus').value = data.Status || '';
    modal.style.display = 'block';
  }

  function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
  }

  // Simpan perubahan dari modal
  function saveEditData() {
    const updatedData = {
      Tanggal: document.getElementById('editTanggal').value,
      Wali_Kelas: document.getElementById('editWali').value,
      Mata_Pelajaran: document.getElementById('editMapel').value,
      Kelas: document.getElementById('editKelas').value,
      Nama_Siswa: document.getElementById('editNama').value,
      Status: document.getElementById('editStatus').value
    };

    // Kirim ke Google Apps Script nanti di tahap berikut
    console.log("Data yang akan diupdate:", updatedData);

    closeEditModal();
  }

  // Filter data
  function applyFilters() {
    const kelas = document.getElementById('filterKelas').value;
    const mapel = document.getElementById('filterMapel').value;
    const status = document.getElementById('filterStatus').value;
    const search = document.getElementById('searchNama').value.toLowerCase();

    filteredData = allData.filter(d =>
      (!kelas || d.Kelas === kelas) &&
      (!mapel || d.Mata_Pelajaran === mapel) &&
      (!status || d.Status === status) &&
      (!search || (d.Nama_Siswa || "").toLowerCase().includes(search))
    );

    filteredData = sortByLatestDate(filteredData);
    currentPage = 1;
    renderTablePage(currentPage);
  }

  // Inisialisasi
  async function initRekap() {
    allData = await loadRekapData();
    allData = sortByLatestDate(allData);
    filteredData = [...allData];

    // Isi dropdown filter
    const kelasEl = document.getElementById('filterKelas');
    const mapelEl = document.getElementById('filterMapel');
    [...new Set(allData.map(d => d.Kelas).filter(Boolean))].forEach(k => {
      kelasEl.innerHTML += `<option value="${k}">${k}</option>`;
    });
    [...new Set(allData.map(d => d.Mata_Pelajaran).filter(Boolean))].forEach(m => {
      mapelEl.innerHTML += `<option value="${m}">${m}</option>`;
    });

    renderTablePage(currentPage);
    overlay.remove();

    // Event listeners
    document.getElementById('applyFilter').addEventListener('click', applyFilters);
    document.getElementById('resetFilter').addEventListener('click', () => {
      document.querySelectorAll('#filterKelas, #filterMapel, #filterStatus').forEach(el => el.value = '');
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
    document.getElementById('prevPage').addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderTablePage(currentPage);
      }
    });
    document.getElementById('nextPage').addEventListener('click', () => {
      if (currentPage < Math.ceil(filteredData.length / rowsPerPage)) {
        currentPage++;
        renderTablePage(currentPage);
      }
    });

    document.getElementById('saveEdit').addEventListener('click', saveEditData);
    document.getElementById('closeModal').addEventListener('click', closeEditModal);
  }

  initRekap();
}

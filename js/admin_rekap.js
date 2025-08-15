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
  window.location.href = 'index.html';
});

// ==========================
// === Rekap Data & Modal Edit ===
if (document.getElementById('rekapTable')) {
  const webAppUrl = "https://script.google.com/macros/s/AKfycbw9ZL7P-tNwXP6qZUiQCU3KJmorL429a9of8Hm_Si962P8NLCyro9Uq7BRqqulkie3M/exec";

  let allData = [], filteredData = [], currentPage = 1, rowsPerPage = 15;
  let selectedRowIndex = null;

  // ===== Fungsi parsing tanggal Indonesia menjadi Date =====
  function parseIndoDateTime(dateStr = '') {
    if(!dateStr) return new Date(0);
    const [datePart, timePart] = dateStr.split(" ");
    const [day, month, year] = (datePart || '').split("/").map(Number);
    let [hours=0, minutes=0, seconds=0] = (timePart || '').split(":").map(Number);
    return new Date(year, month-1, day, hours, minutes, seconds);
  }

  // ===== Fungsi sort data terbaru =====
  function sortByLatestDate(data) {
    return data.sort((a,b) => parseIndoDateTime(b.Tanggal) - parseIndoDateTime(a.Tanggal));
  }

  // ===== Fungsi load data dari Web App Google Apps Script =====
  async function loadRekapData() {
    try {
      const res = await fetch(webAppUrl);
      if(!res.ok) throw new Error('Gagal fetch data');
      return await res.json();
    } catch(err) {
      overlay.remove();
      alert('Gagal memuat data: ' + err.message);
      return [];
    }
  }

  // ===== Update total data yang difilter =====
  function updateTotalFiltered() {
    const totalEl = document.getElementById('totalFiltered');
    if (totalEl) totalEl.textContent = `Total Data: ${filteredData.length}`;
  }

  // ===== Render tabel =====
  function renderTablePage(page) {
    const tbody = document.querySelector('#rekapTable tbody');
    tbody.innerHTML = '';
    const start = (page-1)*rowsPerPage;
    const end = start + rowsPerPage;

    let html = '';
    filteredData.slice(start, end).forEach((row, idx) => {
      html += `
        <tr>
          <td>${row.Tanggal || ''}</td>
          <td>${row.Wali_Kelas || ''}</td>
          <td>${row.Mata_Pelajaran || ''}</td>
          <td>${row.Kelas || ''}</td>
          <td>${row.Nama_Siswa || ''}</td>
          <td>${row.Status || ''}</td>
          <td>
            <button class="btn btn-sm btn-warning editBtn" data-index="${start+idx}">Edit</button>
          </td>
        </tr>
      `;
    });

    if(html==='') html = '<tr><td colspan="7" class="text-center">Data tidak tersedia</td></tr>';
    tbody.innerHTML = html;

    document.getElementById('pageNum').textContent = currentPage;
    document.getElementById('totalPages').textContent = Math.ceil(filteredData.length/rowsPerPage) || 1;
    updateTotalFiltered();

    // Event listener tombol edit
    document.querySelectorAll('.editBtn').forEach(btn => {
      btn.addEventListener('click', e => {
        selectedRowIndex = parseInt(e.target.dataset.index);
        openEditModal(filteredData[selectedRowIndex]);
      });
    });
  }

  // ===== Modal edit data =====
  function openEditModal(data) {
    document.getElementById('editTanggal').value = data.Tanggal || '';
    document.getElementById('editWali').value = data.Wali_Kelas || '';
    document.getElementById('editMapel').value = data.Mata_Pelajaran || '';
    document.getElementById('editKelas').value = data.Kelas || '';
    document.getElementById('editNama').value = data.Nama_Siswa || '';
    document.getElementById('editStatus').value = data.Status || '';

    const modalEl = document.getElementById('editModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  // ===== Form submit edit data =====
  document.getElementById('editForm').addEventListener('submit', async function(e){
    e.preventDefault();
    if(selectedRowIndex===null) return;

    const updated = {
      Tanggal: document.getElementById('editTanggal').value,
      Wali_Kelas: document.getElementById('editWali').value,
      Mata_Pelajaran: document.getElementById('editMapel').value,
      Kelas: document.getElementById('editKelas').value,
      Nama_Siswa: document.getElementById('editNama').value,
      Status: document.getElementById('editStatus').value
    };

    // Update allData & filteredData agar tetap sinkron
    allData[selectedRowIndex] = {...updated};
    applyFilters();

    // Tutup modal
    const modalEl = document.getElementById('editModal');
    bootstrap.Modal.getInstance(modalEl).hide();

    // Kirim ke Web App untuk update Sheet
    try {
      await fetch(webAppUrl, {
        method: "POST",
        body: JSON.stringify({updatedData: updated, rowIndex: selectedRowIndex}),
        headers: {"Content-Type": "application/json"}
      });
    } catch(err) {
      alert('Gagal mengirim update: '+err.message);
    }
  });

  // ===== Filter data =====
  function applyFilters() {
    const kelas = document.getElementById('filterKelas').value;
    const mapel = document.getElementById('filterMapel').value;
    const status = document.getElementById('filterStatus').value;
    const search = document.getElementById('searchNama').value.toLowerCase();

    filteredData = allData.filter(d =>
      (!kelas || d.Kelas===kelas) &&
      (!mapel || d.Mata_Pelajaran===mapel) &&
      (!status || d.Status===status) &&
      (!search || (d.Nama_Siswa||'').toLowerCase().includes(search))
    );

    filteredData = sortByLatestDate(filteredData);
    currentPage = Math.min(currentPage, Math.ceil(filteredData.length/rowsPerPage) || 1);
    renderTablePage(currentPage);
  }

  // ===== Inisialisasi =====
  async function initRekap() {
    allData = await loadRekapData();
    allData = sortByLatestDate(allData);
    filteredData = [...allData];

    // Isi dropdown filter
    const kelasEl = document.getElementById('filterKelas');
    const mapelEl = document.getElementById('filterMapel');

    [...new Set(allData.map(d=>d.Kelas).filter(Boolean))].forEach(k=>{
      kelasEl.innerHTML += `<option value="${k}">${k}</option>`;
    });
    [...new Set(allData.map(d=>d.Mata_Pelajaran).filter(Boolean))].forEach(m=>{
      mapelEl.innerHTML += `<option value="${m}">${m}</option>`;
    });

    renderTablePage(currentPage);
    overlay.remove();

    // Event listener filter
    document.getElementById('applyFilter').addEventListener('click', applyFilters);
    document.getElementById('resetFilter').addEventListener('click', () => {
      document.querySelectorAll('#filterKelas,#filterMapel,#filterStatus').forEach(el=>el.value='');
      document.getElementById('searchNama').value='';
      filteredData = sortByLatestDate([...allData]);
      currentPage = 1;
      renderTablePage(currentPage);
    });

    // Filter otomatis saat mengetik
    document.getElementById('searchNama').addEventListener('input', applyFilters);

    // Pagination
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

  initRekap();
}

// ==========================
// === Proteksi Login ===
// ==========================
// Mengecek apakah user sudah login dari sessionStorage
const user = sessionStorage.getItem('user');
if(!user){
  overlay.remove(); // hapus overlay jika gagal login
  alert('Anda belum login! Akses ditolak.');
  window.location.href = 'login.html'; // arahkan ke halaman login
}


// ==========================
// === Logout Handler ===
// ==========================
// Event untuk tombol logout
document.getElementById('logoutBtn')?.addEventListener('click', e=>{
  e.preventDefault();
  sessionStorage.removeItem('user'); // hapus session login
  window.location.href='index.html'; // arahkan ke halaman utama
});


// ==========================
// === Rekap Data & Modal Edit ===
// ==========================
// Hanya dijalankan jika elemen tabel #rekapTable ada di halaman
if(document.getElementById('rekapTable')){
  let allData = [],        // semua data dari server
      filteredData = [],   // data yang sudah difilter
      currentPage = 1,     // halaman saat ini
      rowsPerPage = 15,    // jumlah baris per halaman
      selectedRowIndex = null; // index data yang sedang diedit


  // ===== Fungsi parsing tanggal Indonesia menjadi Date =====
  function parseIndoDate(dateStr){
    if(!dateStr) return new Date();
    const [d, m, y] = dateStr.split("/").map(Number);
    return new Date(y, m - 1, d); // urutan: tahun, bulan (0-based), tanggal
  }

  // ===== Fungsi urutkan data dari tanggal terbaru =====
  function sortByLatestDate(data){
    return data.sort((a, b) => parseIndoDate(b.Tanggal) - parseIndoDate(a.Tanggal));
  }


  // ===== Load data via Apps Script =====
  function loadRekapData(){
    google.script.run.withSuccessHandler(res=>{
      allData = res || [];
      allData = sortByLatestDate(allData);
      filteredData = [...allData];
      initFilters(); // siapkan pilihan filter
      renderTablePage(currentPage); // render tabel pertama kali
      overlay.remove(); // hilangkan loading
    }).getRekapData();
  }


  // ===== Initialize filter dropdowns =====
  function initFilters(){
    const kelasEl = document.getElementById('filterKelas');
    const mapelEl = document.getElementById('filterMapel');

    // Ambil daftar kelas unik dari data
    [...new Set(allData.map(d=>d.Kelas).filter(Boolean))].forEach(k=>{
      kelasEl.innerHTML += `<option value="${k}">${k}</option>`;
    });

    // Ambil daftar mata pelajaran unik
    [...new Set(allData.map(d=>d.Mata_Pelajaran).filter(Boolean))].forEach(m=>{
      mapelEl.innerHTML += `<option value="${m}">${m}</option>`;
    });
  }


  // ===== Render tabel halaman tertentu =====
  function renderTablePage(page){
    const tbody = document.querySelector('#rekapTable tbody');
    tbody.innerHTML = '';
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    // Tampilkan data per halaman
    filteredData.slice(start, end).forEach((row, idx)=>{
      tbody.innerHTML += `<tr>
        <td>${row.Tanggal || ''}</td>
        <td>${row.Wali_Kelas || ''}</td>
        <td>${row.Mata_Pelajaran || ''}</td>
        <td>${row.Kelas || ''}</td>
        <td>${row.Nama_Siswa || ''}</td>
        <td>${row.Status || ''}</td>
        <td><button class="btn btn-sm btn-warning editBtn" data-index="${start + idx}">Edit</button></td>
      </tr>`;
    });

    // Jika tidak ada data
    if(filteredData.length === 0){
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">Data tidak tersedia</td></tr>';
    }

    // Update pagination info
    document.getElementById('pageNum').textContent = currentPage;
    document.getElementById('totalPages').textContent = Math.ceil(filteredData.length / rowsPerPage);
    document.getElementById('totalFiltered').textContent = `Total Data: ${filteredData.length}`;

    // Event tombol edit
    document.querySelectorAll('.editBtn').forEach(btn=>{
      btn.addEventListener('click', e=>{
        selectedRowIndex = parseInt(e.target.dataset.index);
        openEditModal(filteredData[selectedRowIndex]);
      });
    });
  }


  // ===== Open modal edit =====
  function openEditModal(data){
    document.getElementById('editTanggal').value = data.Tanggal || '';
    document.getElementById('editWali').value = data.Wali_Kelas || '';
    document.getElementById('editMapel').value = data.Mata_Pelajaran || '';
    document.getElementById('editKelas').value = data.Kelas || '';
    document.getElementById('editNama').value = data.Nama_Siswa || '';
    document.getElementById('editStatus').value = data.Status || '';

    new bootstrap.Modal(document.getElementById('editModal')).show();
  }


  // ===== Submit edit form =====
  document.getElementById('editForm').addEventListener('submit', e=>{
    e.preventDefault();
    if(selectedRowIndex === null) return;

    const updatedData = {
      Tanggal: document.getElementById('editTanggal').value,
      Wali_Kelas: document.getElementById('editWali').value,
      Mata_Pelajaran: document.getElementById('editMapel').value,
      Kelas: document.getElementById('editKelas').value,
      Nama_Siswa: document.getElementById('editNama').value,
      Status: document.getElementById('editStatus').value
    };

    // Kirim ke server untuk update data
    google.script.run.withSuccessHandler(()=>{
      filteredData[selectedRowIndex] = updatedData; // update di array
      renderTablePage(currentPage); // render ulang tabel
      bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    }).updateRekapData(updatedData, selectedRowIndex);
  });


  // ===== Apply filter =====
  function applyFilters(){
    const kelas = document.getElementById('filterKelas').value;
    const mapel = document.getElementById('filterMapel').value;
    const status = document.getElementById('filterStatus').value;
    const search = document.getElementById('searchNama').value.toLowerCase();

    filteredData = allData.filter(d=>
      (!kelas || d.Kelas === kelas) &&
      (!mapel || d.Mata_Pelajaran === mapel) &&
      (!status || d.Status === status) &&
      (!search || (d.Nama_Siswa || '').toLowerCase().includes(search))
    );

    filteredData = sortByLatestDate(filteredData);
    currentPage = 1;
    renderTablePage(currentPage);
  }


  // ===== Reset filter =====
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


  // ===== Rows per page & pagination =====
  document.getElementById('rowsPerPage').addEventListener('change', e=>{
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderTablePage(currentPage);
  });

  document.getElementById('prevPage').addEventListener('click', ()=>{
    if(currentPage > 1){
      currentPage--;
      renderTablePage(currentPage);
    }
  });

  document.getElementById('nextPage').addEventListener('click', ()=>{
    if(currentPage < Math.ceil(filteredData.length / rowsPerPage)){
      currentPage++;
      renderTablePage(currentPage);
    }
  });


  // ===== Init awal =====
  loadRekapData(); // ambil data pertama kali dari server
}

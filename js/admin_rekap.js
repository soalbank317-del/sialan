// --- Overlay / Loader Proteksi Login ---
const overlay = document.createElement('div');
overlay.id = 'overlay';
overlay.style.position = 'fixed';
overlay.style.top = '0';
overlay.style.left = '0';
overlay.style.width = '100%';
overlay.style.height = '100%';
overlay.style.background = 'rgba(255,255,255,0.9)';
overlay.style.zIndex = '9999';
overlay.style.display = 'flex';
overlay.style.alignItems = 'center';
overlay.style.justifyContent = 'center';
overlay.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
document.body.prepend(overlay);

// --- Proteksi Login ---
const user = sessionStorage.getItem('user');
if(!user){
    overlay.style.display = 'none';
    alert('Anda belum login! Akses ditolak.');
    window.location.href = 'login.html';
} else {
    // Sembunyikan overlay setelah validasi session
    overlay.style.display = 'none';
}

// --- Logout ---
const logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn){
    logoutBtn.addEventListener('click', e=>{
        e.preventDefault();
        sessionStorage.removeItem('user');
        window.location.href = 'login.html';
    });
}

// --- Submit Form Input KBM ---
document.getElementById('inputForm').addEventListener('submit', function(e){
    e.preventDefault();
    
    const tanggal = document.getElementById('tanggal').value;
    const mapel = document.getElementById('mapel').value.trim();
    const kelas = document.getElementById('kelas').value.trim();
    const namaSiswa = document.getElementById('namaSiswa').value.trim();
    const status = document.getElementById('status').value;

    // --- Validasi Input ---
    if(!tanggal || !mapel || !kelas || !namaSiswa || !status){
        alert("Semua kolom wajib diisi!");
        return;
    }

    // --- Simulasi Menyimpan Data ---
    const dataObj = {
        Tanggal: tanggal,
        Mata_Pelajaran: mapel,
        Kelas: kelas,
        Nama_Siswa: namaSiswa,
        Status: status
    };
    console.log("Data disimpan:", dataObj);

    alert("Data berhasil disimpan (simulasi)");
    document.getElementById('inputForm').reset();
});
  
// --------------------------------------------------------------------------- //
// =======================================
// ========== REKAP DATA =================
// =======================================
if(document.getElementById('rekapTable')){
    let allData = [], filteredData = [], currentPage = 1, rowsPerPage = 15;

    function parseIndoDateTime(dateStr) {
      const [datePart, timePart] = dateStr.split(" ");
      if (!datePart) return new Date(dateStr);
      const [day, month, year] = datePart.split("/").map(Number);
      let hours = 0, minutes = 0, seconds = 0;
      if (timePart) [hours, minutes, seconds] = timePart.split(":").map(Number);
      return new Date(year, month-1, day, hours, minutes, seconds);
    }

    function sortByLatestDate(data) {
      return data.sort((a,b) => parseIndoDateTime(b.Tanggal) - parseIndoDateTime(a.Tanggal));
    }

    async function loadRekapData() {
      const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQAEwBLEhaehGYlzYsNhBPfmozGvRZmpjyEOHC8rfgduB0JRurz-xwI_jfW8Fw8Vaz93a_E9tLyuIX9/pub?gid=0&single=true&output=csv";
      const res = await fetch(url);
      const csvText = await res.text();
      const lines = csvText.split("\n").filter(l => l.trim() !== "");
      const headers = lines[0].split(",").map(h => h.trim().replace(/\s+/g, "_"));
      return lines.slice(1).map(line => {
        const vals = line.split(",");
        const obj = {};
        headers.forEach((h,i)=> obj[h] = (vals[i]||"").trim());
        return obj;
      });
    }

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
      document.getElementById('pageNum').textContent = currentPage;
      document.getElementById('totalPages').textContent = Math.ceil(filteredData.length/rowsPerPage);
    }

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

    async function initRekap(){
      allData = await loadRekapData();
      allData = sortByLatestDate(allData);
      filteredData = [...allData];
    
      const kelasSet = new Set(allData.map(d=>d.Kelas).filter(Boolean));
      const mapelSet = new Set(allData.map(d=>d.Mata_Pelajaran).filter(Boolean));
    
      kelasSet.forEach(k => document.getElementById('filterKelas').innerHTML += `<option value="${k}">${k}</option>`);
      mapelSet.forEach(m => document.getElementById('filterMapel').innerHTML += `<option value="${m}">${m}</option>`);
    
      renderTablePage(currentPage);
    
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

    initRekap();
}


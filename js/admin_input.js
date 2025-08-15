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
if(!user){
  overlay.remove();
  alert('Anda belum login! Akses ditolak.');
  window.location.href = 'login.html';
}

// ==========================
// === Logout Handler ===
// ==========================
document.getElementById('logoutBtn')?.addEventListener('click', e=>{
  e.preventDefault();
  sessionStorage.removeItem('user');
  window.location.href='index.html';
});

// CSV Publik Google Sheets
const urls = {
  waliKelas: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXOP4L2k61miTcFTlb4r0QigIWRsMzVazznXCbNLqaHBpwY9RKgjnXdW4figjJZLmrrPcXbU6Q1f-E/pub?gid=1201461529&single=true&output=csv",
  mapel: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXOP4L2k61miTcFTlb4r0QigIWRsMzVazznXCbNLqaHBpwY9RKgjnXdW4figjJZLmrrPcXbU6Q1f-E/pub?gid=1451676013&single=true&output=csv",
  kelas: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXOP4L2k61miTcFTlb4r0QigIWRsMzVazznXCbNLqaHBpwY9RKgjnXdW4figjJZLmrrPcXbU6Q1f-E/pub?gid=0&single=true&output=csv",
  siswa: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXOP4L2k61miTcFTlb4r0QigIWRsMzVazznXCbNLqaHBpwY9RKgjnXdW4figjJZLmrrPcXbU6Q1f-E/pub?gid=852230839&single=true&output=csv"
};

// Endpoint Apps Script untuk simpan data ke spreadsheet tujuan
const saveEndpoint = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

// Fungsi fetch CSV dan parsing
async function fetchCSV(url, columnIndexStart = 0) {
  const res = await fetch(url);
  const text = await res.text();
  return Papa.parse(text.trim(), { header: false }).data.map(r => r[columnIndexStart]);
}

// Inisialisasi dropdown
async function initDropdowns() {
  const waliData = await fetchCSV(urls.waliKelas, 0);
  const mapelData = await fetchCSV(urls.mapel, 0);
  const kelasData = await fetchCSV(urls.kelas, 1);

  const waliSelect = document.getElementById("waliKelas");
  waliSelect.innerHTML = '<option value="">Pilih Wali Kelas</option>';
  waliData.forEach(wk => { if(wk) { const opt = document.createElement("option"); opt.value=wk; opt.textContent=wk; waliSelect.appendChild(opt); } });

  const mapelSelect = document.getElementById("mapel");
  mapelSelect.innerHTML = '<option value="">Pilih Mata Pelajaran</option>';
  mapelData.forEach(mp => { if(mp) { const opt = document.createElement("option"); opt.value=mp; opt.textContent=mp; mapelSelect.appendChild(opt); } });

  const kelasSelect = document.getElementById("kelas");
  kelasSelect.innerHTML = '<option value="">Pilih Kelas</option>';
  kelasData.forEach(k => { if(k) { const opt = document.createElement("option"); opt.value=k; opt.textContent=k; kelasSelect.appendChild(opt); } });
}

// Fetch siswa per kelas
async function fetchSiswa() {
  const res = await fetch(urls.siswa);
  const text = await res.text();
  const data = Papa.parse(text.trim(), { header: false }).data;
  const siswaObj = {};
  data.forEach(r => {
    const kelas = r[0];
    const nama = r[1];
    if(kelas && nama) {
      if(!siswaObj[kelas]) siswaObj[kelas] = [];
      siswaObj[kelas].push(nama);
    }
  });
  return siswaObj;
}

// Event pilih kelas
async function initSiswaTable() {
  const siswaData = await fetchSiswa();
  const kelasSelect = document.getElementById("kelas");
  const tbody = document.querySelector("#siswaTable tbody");

  kelasSelect.addEventListener("change", () => {
    const selectedKelas = kelasSelect.value;
    tbody.innerHTML = "";
    const list = siswaData[selectedKelas] || [];
    list.forEach(siswa => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${siswa}</td>
        <td><select class="form-select" required>
          <option value="">Pilih Status</option>
          <option value="Tuntas">Tuntas</option>
          <option value="Ujian">Ujian</option>
        </select></td>`;
      tbody.appendChild(row);
    });
  });
}

// Submit form
document.getElementById("inputForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const rows = document.querySelectorAll("#siswaTable tbody tr");
  const siswaData = [];
  rows.forEach(row => {
    siswaData.push({ nama: row.cells[0].textContent, status: row.cells[1].querySelector("select").value });
  });

  const formData = {
    tanggal: document.getElementById("tanggal").value,
    waliKelas: document.getElementById("waliKelas").value,
    mapel: document.getElementById("mapel").value,
    kelas: document.getElementById("kelas").value,
    siswa: siswaData
  };

  // Kirim ke Apps Script untuk disimpan
  try {
    const res = await fetch(saveEndpoint, {
      method: "POST",
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" }
    });
    const result = await res.json();
    alert(result.message || "Data berhasil disimpan!");
  } catch(err) {
    console.error(err);
    alert("Gagal menyimpan data ke spreadsheet.");
  }
});

// Inisialisasi
initDropdowns();
initSiswaTable();


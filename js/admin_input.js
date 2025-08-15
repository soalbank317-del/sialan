// ==========================
// === 1. Overlay / Loader ===
// ==========================
// Membuat layer overlay untuk menutupi halaman saat halaman sedang load
const overlay = document.createElement('div');
overlay.id = 'overlay';
Object.assign(overlay.style, {
  position: 'fixed',          // menempel ke seluruh layar
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  background: 'rgba(255,255,255,0.9)', // semi-transparent putih
  zIndex: '9999',             // pastikan overlay di atas elemen lain
  display: 'flex',            // pakai flex untuk centering
  alignItems: 'center',
  justifyContent: 'center'
});
// HTML spinner bootstrap di overlay
overlay.innerHTML = `
  <div class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>
`;
// menambahkan overlay ke body di paling atas
document.body.prepend(overlay);

// ==========================
// === 2. Proteksi Login ===
// ==========================
// Mengecek apakah user sudah login atau belum
const user = sessionStorage.getItem('user');
if(!user){
  overlay.remove(); // hilangkan overlay
  alert('Anda belum login! Akses ditolak.');
  window.location.href = 'login.html'; // redirect ke halaman login
}

// ==========================
// === 3. Logout Handler ===
// ==========================
// Tombol logout untuk menghapus sessionStorage dan redirect
document.getElementById('logoutBtn')?.addEventListener('click', e=>{
  e.preventDefault();
  sessionStorage.removeItem('user'); // hapus data login
  window.location.href='index.html'; // redirect ke homepage
});

// ==========================
// === 4. URL CSV Google Sheets ===
// ==========================
// URL publik CSV Google Sheets yang sudah dipublish
const urls = {
  walikelas: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXOP4L2k61miTcFTlb4r0QigIWRsMzVazznXCbNLqaHBpwY9RKgjnXdW4figjJZLmrrPcXbU6Q1f-E/pub?gid=1201461529&single=true&output=csv",
  matapelajaran: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXOP4L2k61miTcFTlb4r0QigIWRsMzVazznXCbNLqaHBpwY9RKgjnXdW4figjJZLmrrPcXbU6Q1f-E/pub?gid=1451676013&single=true&output=csv",
  kelas: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXOP4L2k61miTcFTlb4r0QigIWRsMzVazznXCbNLqaHBpwY9RKgjnXdW4figjJZLmrrPcXbU6Q1f-E/pub?gid=0&single=true&output=csv",
  siswa: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXOP4L2k61miTcFTlb4r0QigIWRsMzVazznXCbNLqaHBpwY9RKgjnXdW4figjJZLmrrPcXbU6Q1f-E/pub?gid=852230839&single=true&output=csv"
};

// ==========================
// === 5. Endpoint Apps Script ===
// ==========================
// URL endpoint Google Apps Script untuk menyimpan data ke Google Sheet
const saveEndpoint = "https://script.google.com/macros/s/.../exec";

// ==========================
// === 6. Fungsi fetchCSV ===
// ==========================
// Fungsi untuk mengambil data CSV dari Google Sheets dan mengubahnya menjadi array
async function fetchCSV(url) {
  try {
    const res = await fetch(url);  // fetch CSV
    const text = await res.text();  // baca response sebagai text
    // validasi jika CSV tidak tersedia
    if(text.startsWith("<!DOCTYPE html>") || text.includes("Halaman Tidak Ditemukan")){
      throw new Error("CSV tidak tersedia / URL salah");
    }
    // parse CSV dengan PapaParse
    return Papa.parse(text.trim(), { header: false }).data;
  } catch(err){
    console.error("Gagal fetch CSV:", url, err);
    alert(`Gagal mengambil data dari ${url}. Pastikan sheet sudah di-publish ke web!`);
    return []; // jika gagal, kembalikan array kosong
  }
}

// ==========================
// === 7. Inisialisasi Dropdown ===
// ==========================
// Mengisi dropdown wali kelas, mata pelajaran, dan kelas
async function initDropdowns() {
  const waliData = await fetchCSV(urls.walikelas);
  const mapelData = await fetchCSV(urls.matapelajaran);
  const kelasData = await fetchCSV(urls.kelas);

  // Fungsi bantu mengisi dropdown
  const fillDropdown = (selectId, data, placeholder, colIndex=0) => {
    const select = document.getElementById(selectId);
    select.innerHTML = `<option value="">${placeholder}</option>`; // option default
    data.forEach(r=>{
      const d = r[colIndex]?.trim(); // ambil kolom sesuai index
      if(d){
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = d;
        select.appendChild(opt);
      }
    });
  };

  // Isi masing-masing dropdown
  fillDropdown("walikelas", waliData, "Pilih Wali Kelas", 0);
  fillDropdown("matapelajaran", mapelData, "Pilih Mata Pelajaran", 0);
  fillDropdown("kelas", kelasData, "Pilih Kelas", 0); // index kolom kelas = 0
}

// ==========================
// === 8. Fetch Siswa Per Kelas ===
// ==========================
// Mengelompokkan siswa berdasarkan kelas
async function fetchSiswa() {
  const res = await fetchCSV(urls.siswa); 
  const siswaObj = {};
  res.forEach(row=>{
    const kelas = row[0]?.trim(); // kolom 0 = kelas
    const nama = row[1]?.trim();  // kolom 1 = nama siswa
    if(kelas && nama){
      if(!siswaObj[kelas]) siswaObj[kelas] = [];
      siswaObj[kelas].push(nama);
    }
  });
  return siswaObj; // objek { kelas: [namaSiswa,...] }
}

// ==========================
// === 9. Generate Tabel Siswa ===
// ==========================
// Saat kelas dipilih, generate tabel siswa beserta dropdown status
async function initSiswaTable() {
  const siswaData = await fetchSiswa();
  const kelasSelect = document.getElementById("kelas");
  const tbody = document.querySelector("#siswaTable tbody");
  const statusButtons = document.getElementById("statusAllButtons");

  kelasSelect.addEventListener("change", () => {
    tbody.innerHTML = ""; // kosongkan tabel
    const list = siswaData[kelasSelect.value] || [];

    // tampilkan tombol "pilih semua status" jika ada siswa
    statusButtons.style.display = list.length > 0 ? "block" : "none";

    // generate baris tabel untuk tiap siswa
    list.forEach(namaSiswa=>{
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${namaSiswa}</td>
        <td>
          <select class="form-select" required>
            <option value="">Pilih Status</option>
            <option value="Tuntas">Tuntas</option>
            <option value="Ujian">Ujian</option>
          </select>
        </td>`;
      tbody.appendChild(row);
    });
  });
}

// ==========================
// === 10. Tombol Pilih Semua Status ===
// ==========================
function attachSelectAllButtons() {
  // tombol Tuntas semua
  document.getElementById('tuntasAll').addEventListener('click', ()=>{
    document.querySelectorAll("#siswaTable tbody select").forEach(s => s.value = "Tuntas");
  });
  // tombol Ujian semua
  document.getElementById('ujianAll').addEventListener('click', ()=>{
    document.querySelectorAll("#siswaTable tbody select").forEach(s => s.value = "Ujian");
  });
}

// ==========================
// === 11. Submit Form ===
// ==========================
document.getElementById("inputForm").addEventListener("submit", async (e)=>{
  e.preventDefault();

  const rows = document.querySelectorAll("#siswaTable tbody tr");
  const siswaData = [];
  rows.forEach(row=>{
    siswaData.push({
      nama: row.cells[0].textContent,
      status: row.cells[1].querySelector("select").value
    });
  });

  // bentuk data yang dikirim ke Apps Script
  const formData = {
    tanggal: document.getElementById("tanggal").value,
    walikelas: document.getElementById("walikelas").value,
    matapelajaran: document.getElementById("matapelajaran").value,
    kelas: document.getElementById("kelas").value,
    siswa: siswaData
  };

  try{
    const res = await fetch(saveEndpoint, {
      method: "POST",
      body: JSON.stringify({ form: formData }), // data dibungkus object 'form'
      headers: { "Content-Type": "application/json" }
    });
    const result = await res.json();
    alert(result.message || "Data berhasil disimpan!");
  } catch(err){
    console.error(err);
    alert("Gagal menyimpan data ke spreadsheet.");
  }
});

// ==========================
// === 12. Inisialisasi Halaman ===
// ==========================
// Jalankan semua fungsi saat halaman load
initDropdowns()
  .then(()=>initSiswaTable())
  .then(()=>attachSelectAllButtons())
  .finally(()=>overlay.remove()); // hilangkan overlay






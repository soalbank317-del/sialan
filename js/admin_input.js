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

// ==========================
// === URL CSV Google Sheets ===
// ==========================
const urls = {
  waliKelas: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXOP4L2k61miTcFTlb4r0QigIWRsMzVazznXCbNLqaHBpwY9RKgjnXdW4figjJZLmrrPcXbU6Q1f-E/pub?gid=1201461529&single=true&output=csv",
  mapel: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXOP4L2k61miTcFTlb4r0QigIWRsMzVazznXCbNLqaHBpwY9RKgjnXdW4figjJZLmrrPcXbU6Q1f-E/pub?gid=1451676013&single=true&output=csv",
  kelas: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXOP4L2k61miTcFTlb4r0QigIWRsMzVazznXCbNLqaHBpwY9RKgjnXdW4figjJZLmrrPcXbU6Q1f-E/pub?gid=0&single=true&output=csv",
  siswa: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXOP4L2k61miTcFTlb4r0QigIWRsMzVazznXCbNLqaHBpwY9RKgjnXdW4figjJZLmrrPcXbU6Q1f-E/pub?gid=852230839&single=true&output=csv"
};

// ==========================
// === Endpoint Apps Script ===
// ==========================
const saveEndpoint = "https://script.google.com/macros/s/AKfycbwv7x7eHXHQDjFQcylMbwVuFitikFfAEsm8ARwa9gibE1RKinQpwfTSSHMe3Eqr0gWH/exec";

// ==========================
// === Fungsi fetchCSV dengan validasi ===
// ==========================
async function fetchCSV(url) {
  try {
    const res = await fetch(url);
    const text = await res.text();
    if(text.startsWith("<!DOCTYPE html>") || text.includes("Halaman Tidak Ditemukan")){
      throw new Error("CSV tidak tersedia / URL salah");
    }
    return Papa.parse(text.trim(), { header: false }).data;
  } catch(err){
    console.error("Gagal fetch CSV:", url, err);
    alert(`Gagal mengambil data dari ${url}. Pastikan sheet sudah di-publish ke web!`);
    return [];
  }
}

// ==========================
// === Inisialisasi Dropdown ===
// ==========================
async function initDropdowns() {
  const waliData = await fetchCSV(urls.waliKelas);
  const mapelData = await fetchCSV(urls.mapel);
  const kelasData = await fetchCSV(urls.kelas);

  const fillDropdown = (selectId, data, placeholder, colIndex=0) => {
    const select = document.getElementById(selectId);
    select.innerHTML = `<option value="">${placeholder}</option>`;
    data.forEach(r=>{
      const d = r[colIndex]?.trim();
      if(d){
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = d;
        select.appendChild(opt);
      }
    });
  };

  fillDropdown("waliKelas", waliData, "Pilih Wali Kelas");
  fillDropdown("matapelajaran", mapelData, "Pilih Mata Pelajaran");
  fillDropdown("kelas", kelasData, "Pilih Kelas", 1);
}

// ==========================
// === Fetch Siswa Per Kelas ===
// ==========================
async function fetchSiswa() {
  const res = await fetchCSV(urls.siswa); 
  const siswaObj = {};
  res.forEach(row=>{
    const kelas = row[0]?.trim();
    const nama = row[1]?.trim();
    if(kelas && nama){
      if(!siswaObj[kelas]) siswaObj[kelas] = [];
      siswaObj[kelas].push(nama);
    }
  });
  return siswaObj;
}

// ==========================
// === Event Pilih Kelas & Generate Tabel ===
// ==========================
async function initSiswaTable() {
  const siswaData = await fetchSiswa();
  const kelasSelect = document.getElementById("kelas");
  const tbody = document.querySelector("#siswaTable tbody");
  const statusButtons = document.getElementById("statusAllButtons");

  kelasSelect.addEventListener("change", () => {
    tbody.innerHTML = "";
    const list = siswaData[kelasSelect.value] || [];

    if(list.length > 0){
      statusButtons.style.display = "block"; // tampilkan tombol
    } else {
      statusButtons.style.display = "none"; // sembunyikan tombol
    }

    list.forEach(namaSiswa=>{
      const row = document.createElement("tr");
      row.innerHTML = `<td>${namaSiswa}</td>
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
// === Tombol Pilih Semua Status ===
// ==========================
function attachSelectAllButtons() {
  document.getElementById('tuntasAll').addEventListener('click', ()=>{
    document.querySelectorAll("#siswaTable tbody select").forEach(s => s.value = "Tuntas");
  });

  document.getElementById('ujianAll').addEventListener('click', ()=>{
    document.querySelectorAll("#siswaTable tbody select").forEach(s => s.value = "Ujian");
  });
}

// ==========================
// === Submit Form ===
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

  const formData = {
    tanggal: document.getElementById("tanggal").value,
    waliKelas: document.getElementById("waliKelas").value,
    mapel: document.getElementById("mapel").value,
    kelas: document.getElementById("kelas").value,
    siswa: siswaData
  };

  try{
    const res = await fetch(saveEndpoint, {
      method: "POST",
      body: JSON.stringify(formData),
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
// === Inisialisasi Halaman ===
// ==========================
initDropdowns()
  .then(()=>initSiswaTable())
  .then(()=>attachSelectAllButtons())
  .finally(()=>overlay.remove());



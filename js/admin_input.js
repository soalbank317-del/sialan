// ==========================
// === 1) Overlay / Loader ==
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
// === 2) Proteksi Login ====
// ==========================
const user = sessionStorage.getItem('user');
if (!user) {
  overlay.remove();
  alert('Anda belum login! Akses ditolak.');
  window.location.href = 'login.html';
}

// ==========================
// === 3) Logout Handler ====
// ==========================
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  sessionStorage.removeItem('user');
  window.location.href = 'index.html';
});

// ==========================
// === 4) URL Google Sheet ==
// ==========================
// Ganti URL di bawah dengan URL CSV *asli* (bukan ...).
// Pastikan: File → Publish to the web → pilih setiap sheet → CSV.
const urls = {
  walikelas:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXOP4L2k61miTcFTlb4r0QigIWRsMzVazznXCbNLqaHBpwY9RKgjnXdW4figjJZLmrrPcXbU6Q1f-E/pub?gid=1201461529&single=true&output=csv",
  matapelajaran:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXOP4L2k61miTcFTlb4r0QigIWRsMzVazznXCbNLqaHBpwY9RKgjnXdW4figjJZLmrrPcXbU6Q1f-E/pub?gid=1451676013&single=true&output=csv",
  kelas:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXOP4L2k61miTcFTlb4r0QigIWRsMzVazznXCbNLqaHBpwY9RKgjnXdW4figjJZLmrrPcXbU6Q1f-E/pub?gid=0&single=true&output=csv",
  siswa:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXOP4L2k61miTcFTlb4r0QigIWRsMzVazznXCbNLqaHBpwY9RKgjnXdW4figjJZLmrrPcXbU6Q1f-E/pub?gid=852230839&single=true&output=csv",
};

// ==========================
// === 5) Endpoint Save  ====
// ==========================
// Ganti dengan URL Web App milik Apps Script kamu
const saveEndpoint = "https://script.google.com/macros/s/AKfycbywNxbXSdmT97-tdSFh9xdk4-Hjj5IOCVb9ziTNBfPEACnLJFsXKX7aVMC5vE88_vhC/exec"
// ==========================
// === 6) Util: fetchCSV  ====
// ==========================
async function fetchCSV(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    // kalau bukan CSV (HTML error), anggap gagal
    if (text.startsWith("<!DOCTYPE html>") || text.includes("<html")) {
      throw new Error("Bukan CSV (mungkin belum dipublish)");
    }

    // parse CSV → array of rows
    const parsed = Papa.parse(text.trim(), { header: false });
    let rows = parsed.data;

    // buang BOM di sel pertama kalau ada
    if (rows.length && typeof rows[0][0] === "string") {
      rows[0][0] = rows[0][0].replace(/^\uFEFF/, "");
    }

    // skip header kalau baris pertama berisi judul kolom
    // Aturan: jika sel-sel baris pertama bukan data (banyak huruf), kita treat as header
    const looksLikeHeader = rows.length > 0 && rows[0].some(cell => {
      const c = (cell || "").toString().trim();
      return c && /[A-Za-z]/.test(c);
    });

    if (looksLikeHeader) rows = rows.slice(1);

    return rows;
  } catch (err) {
    console.error("Gagal fetch CSV:", url, err);
    alert(`Gagal mengambil data dari ${url}.\nPastikan: Publish to web (CSV), Anyone with link can view.`);
    return [];
  }
}

// ==========================
// === 7) Isi Dropdown    ===
// ==========================
async function initDropdowns() {
  // Ambil data
  const [waliData, mapelData, kelasData] = await Promise.all([
    fetchCSV(urls.walikelas),
    fetchCSV(urls.matapelajaran),
    fetchCSV(urls.kelas),
  ]);

  // bantu isi dropdown
  const fillDropdown = (selectId, rows, placeholder, colIndex = 0) => {
    const select = document.getElementById(selectId);
    select.innerHTML = `<option value="">${placeholder}</option>`;
    const seen = new Set();
    rows.forEach((r) => {
      const v = (r[colIndex] || "").toString().trim();
      if (v && !seen.has(v)) {
        seen.add(v);
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;
        select.appendChild(opt);
      }
    });
  };

  fillDropdown("walikelas", waliData, "Pilih Wali Kelas", 0);
  fillDropdown("matapelajaran", mapelData, "Pilih Mata Pelajaran", 0);
  fillDropdown("kelas", kelasData, "Pilih Kelas", 0);
}

// ==========================
// === 8) Data Siswa       ===
// ==========================
async function fetchSiswaPerKelas() {
  const rows = await fetchCSV(urls.siswa);
  const byClass = {};
  rows.forEach((r) => {
    // asumsi: kolom 0 = Kelas, kolom 1 = Nama
    const kelas = (r[0] || "").toString().trim();
    const nama = (r[1] || "").toString().trim();
    if (kelas && nama) {
      if (!byClass[kelas]) byClass[kelas] = [];
      byClass[kelas].push(nama);
    }
  });
  return byClass;
}

// ==========================
// === 9) Tabel Siswa      ===
// ==========================
async function initSiswaTable() {
  const siswaByClass = await fetchSiswaPerKelas();
  const kelasSelect = document.getElementById("kelas");
  const tbody = document.querySelector("#siswaTable tbody");
  const statusButtons = document.getElementById("statusAllButtons");

  const render = () => {
    tbody.innerHTML = "";
    const list = siswaByClass[kelasSelect.value] || [];
    statusButtons.style.display = list.length > 0 ? "block" : "none";
    list.forEach((nama) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${nama}</td>
        <td>
          <select class="form-select" required>
            <option value="">Pilih Status</option>
            <option value="Tuntas">Tuntas</option>
            <option value="Ujian">Ujian</option>
          </select>
        </td>
      `;
      tbody.appendChild(tr);
    });
  };

  kelasSelect.addEventListener("change", render);
}

// ==========================
// === 10) Select-All Btn ===
// ==========================
function attachSelectAllButtons() {
  document.getElementById("tuntasAll").addEventListener("click", () => {
    document
      .querySelectorAll("#siswaTable tbody select")
      .forEach((s) => (s.value = "Tuntas"));
  });
  document.getElementById("ujianAll").addEventListener("click", () => {
    document
      .querySelectorAll("#siswaTable tbody select")
      .forEach((s) => (s.value = "Ujian"));
  });
}

// ==========================
// === 11) Submit Form     ===
// ==========================
function attachSubmit() {
  document.getElementById("inputForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const rows = Array.from(document.querySelectorAll("#siswaTable tbody tr"));
    const siswa = rows.map((row) => ({
      nama: row.cells[0].textContent.trim(),
      status: row.cells[1].querySelector("select").value,
    }));

    const payload = {
      form: {
        tanggal: document.getElementById("tanggal").value,
        walikelas: document.getElementById("walikelas").value,
        matapelajaran: document.getElementById("matapelajaran").value,
        kelas: document.getElementById("kelas").value,
        siswa,
      },
    };

    if (!payload.form.tanggal || !payload.form.walikelas || !payload.form.matapelajaran || !payload.form.kelas) {
      alert("Lengkapi Tanggal, Wali Kelas, Mata Pelajaran, dan Kelas.");
      return;
    }
    if (!siswa.length) {
      alert("Pilih kelas terlebih dahulu hingga daftar siswa muncul.");
      return;
    }

    try {
      const res = await fetch(saveEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      alert(json.message || "Data berhasil disimpan!");
      // reset minimal
      document.getElementById("siswaTable").querySelector("tbody").innerHTML = "";
      document.getElementById("statusAllButtons").style.display = "none";
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan data ke spreadsheet. Cek Web App GAS sudah deploy & akses Anyone.");
    }
  });
}

// ==========================
// === 12) Init on Ready   ===
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initDropdowns();
    await initSiswaTable();
    attachSelectAllButtons();
    attachSubmit();
  } finally {
    // pastikan overlay ditutup apapun hasilnya
    overlay.remove();
  }
});



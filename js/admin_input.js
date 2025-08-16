// --- Overlay dan proteksi login ---
const overlay = document.getElementById('overlay');
if(!sessionStorage.getItem('user')){
  overlay.remove();
  alert('Anda belum login!');
  window.location.href='login.html';
}

document.getElementById('logoutBtn')?.addEventListener('click', e=>{
  e.preventDefault();
  sessionStorage.removeItem('user');
  window.location.href='index.html';
});

// URL CSV siswa
const urlSiswa = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXOP4L2k61miTcFTlb4r0QigIWRsMzVazznXCbNLqaHBpwY9RKgjnXdW4figjJZLmrrPcXbU6Q1f-E/pub?gid=852230839&single=true&output=csv";

let tbody, statusButtons;

// --- Ambil CSV ---
async function fetchCSV(url){
  try{
    const res = await fetch(url,{cache:'no-store'});
    if(!res.ok) throw new Error(res.status);
    const text = await res.text();
    const parsed = Papa.parse(text.trim(),{header:false}); 
    let rows = parsed.data;
    if(rows.length>0 && rows[0].some(c=> c && /[A-Za-z]/.test(c))) rows=rows.slice(1);
    return rows;
  }catch(err){
    console.error("fetchCSV error:",err);
    alert("Gagal ambil CSV."); 
    return [];
  }
}

// --- Siswa per kelas ---
async function fetchSiswaPerKelas(){
  const rows = await fetchCSV(urlSiswa);
  const byClass={};
  rows.forEach(r=>{
    const kelas=(r[0]||"").trim(), nama=(r[1]||"").trim();
    if(kelas && nama){
      if(!byClass[kelas]) byClass[kelas]=[];
      byClass[kelas].push(nama);
    }
  });
  return byClass;
}

// --- Render tabel siswa ---
async function initSiswaTable(){
  const siswaByClass = await fetchSiswaPerKelas();
  const kelasSelect = document.getElementById('kelas');
  tbody = document.querySelector('#siswaTable tbody');
  statusButtons = document.getElementById('statusAllButtons');

  const render = ()=>{
    tbody.innerHTML='';
    const list = siswaByClass[kelasSelect.value]||[];
    if(list.length===0){
      statusButtons.style.display='none';
      tbody.innerHTML = `<tr><td colspan="2" class="text-center text-muted">Pilih kelas dulu</td></tr>`;
      return;
    }
    statusButtons.style.display='block';
    list.forEach(nama=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${nama}</td><td><select class="form-select" name="siswaStatus[]" required>
        <option value="">Pilih Status</option>
        <option value="Tuntas">Tuntas</option>
        <option value="Ujian">Ujian</option>
      </select></td>`;
      tbody.appendChild(tr);
    });
  };
  kelasSelect.addEventListener('change',render);
}

// --- Tombol select all ---
function attachSelectAllButtons(){
  document.getElementById('tuntasAll').addEventListener('click',()=>{
    document.querySelectorAll('#siswaTable tbody select').forEach(s=>s.value='Tuntas');
  });
  document.getElementById('ujianAll').addEventListener('click',()=>{
    document.querySelectorAll('#siswaTable tbody select').forEach(s=>s.value='Ujian');
  });
}

// --- Init ---
document.addEventListener('DOMContentLoaded', async ()=>{
  await initSiswaTable();
  attachSelectAllButtons();
  overlay.remove();
});

const overlay = document.createElement('div');
overlay.id = 'overlay';
Object.assign(overlay.style, {
  position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
  background: 'rgba(255,255,255,0.9)', zIndex: '9999',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
});
overlay.innerHTML = `<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>`;
document.body.prepend(overlay);

// Proteksi login
if(!sessionStorage.getItem('user')){
  overlay.remove(); alert('Anda belum login!'); window.location.href='login.html';
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', e=>{
  e.preventDefault(); sessionStorage.removeItem('user'); window.location.href='index.html';
});

// URL CSV siswa
const urlSiswa = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXOP4L2k61miTcFTlb4r0QigIWRsMzVazznXCbNLqaHBpwY9RKgjnXdW4figjJZLmrrPcXbU6Q1f-E/pub?gid=852230839&single=true&output=csv";

// Web App GAS
const saveEndpoint = "https://script.google.com/macros/s/AKfycbywNxbXSdmT97-tdSFh9xdk4-Hjj5IOCVb9ziTNBfPEACnLJFsXKX7aVMC5vE88_vhC/exec";

// Ambil CSV
async function fetchCSV(url){
  try{
    const res = await fetch(url,{cache:'no-store'}); if(!res.ok) throw new Error(res.status);
    const text = await res.text();
    if(text.startsWith("<!DOCTYPE") || text.includes("<html")) throw new Error("Bukan CSV");
    const parsed = Papa.parse(text.trim(),{header:false}); 
    let rows = parsed.data;
    if(rows.length && typeof rows[0][0]==='string') rows[0][0]=rows[0][0].replace(/^\uFEFF/,'');
    if(rows.length>0 && rows[0].some(c=> c && /[A-Za-z]/.test(c))) rows=rows.slice(1);
    return rows;
  }catch(err){ console.error(err); alert("Gagal ambil CSV."); return []; }
}

// Siswa per kelas
async function fetchSiswaPerKelas(){
  const rows = await fetchCSV(urlSiswa); const byClass={};
  rows.forEach(r=>{
    const kelas=(r[0]||"").trim(), nama=(r[1]||"").trim();
    if(kelas && nama){ if(!byClass[kelas]) byClass[kelas]=[]; byClass[kelas].push(nama);}
  });
  return byClass;
}

// Render tabel siswa
async function initSiswaTable(){
  const siswaByClass = await fetchSiswaPerKelas();
  const kelasSelect = document.getElementById('kelas');
  const tbody = document.querySelector('#siswaTable tbody');
  const statusButtons = document.getElementById('statusAllButtons');

  const render = ()=>{
    tbody.innerHTML=''; 
    const list = siswaByClass[kelasSelect.value]||[];
    statusButtons.style.display = list.length>0?'block':'none';
    list.forEach(nama=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${nama}</td><td><select class="form-select" required>
        <option value="">Pilih Status</option>
        <option value="Tuntas">Tuntas</option>
        <option value="Ujian">Ujian</option>
      </select></td>`;
      tbody.appendChild(tr);
    });
  };
  kelasSelect.addEventListener('change',render);
}

// Tombol select all
function attachSelectAllButtons(){
  document.getElementById('tuntasAll').addEventListener('click',()=>document.querySelectorAll('#siswaTable tbody select').forEach(s=>s.value='Tuntas'));
  document.getElementById('ujianAll').addEventListener('click',()=>document.querySelectorAll('#siswaTable tbody select').forEach(s=>s.value='Ujian'));
}

// Submit form
function attachSubmit(){
  document.getElementById('inputForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const rows = Array.from(document.querySelectorAll('#siswaTable tbody tr'));
    const siswa = rows.map(r=>({nama:r.cells[0].textContent.trim(), status:r.cells[1].querySelector('select').value}));

    const payload = { form:{
      walikelas: document.getElementById('walikelas').value,
      matapelajaran: document.getElementById('matapelajaran').value,
      kelas: document.getElementById('kelas').value,
      siswa
    }};

    if(!payload.form.walikelas || !payload.form.matapelajaran || !payload.form.kelas){ alert("Lengkapi semua."); return;}
    if(!siswa.length){ alert("Pilih kelas dulu."); return;}

    try{
      const res = await fetch(saveEndpoint,{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
      const json = await res.json();
      alert(json.message||"Data berhasil disimpan!");
      tbody.innerHTML=''; statusButtons.style.display='none';
    }catch(err){ console.error(err); alert("Gagal simpan data."); }
  });
}

// Init
document.addEventListener('DOMContentLoaded', async ()=>{
  try{ await initSiswaTable(); attachSelectAllButtons(); attachSubmit(); } finally{ overlay.remove(); }
});


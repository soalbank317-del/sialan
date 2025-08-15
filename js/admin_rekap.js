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

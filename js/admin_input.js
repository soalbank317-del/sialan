// Buat overlay loading
const overlay = document.createElement('div');
overlay.style.position = 'fixed';
overlay.style.top = 0;
overlay.style.left = 0;
overlay.style.width = '100%';
overlay.style.height = '100%';
overlay.style.background = '#fff';
overlay.style.zIndex = 9999;
overlay.style.display = 'flex';
overlay.style.alignItems = 'center';
overlay.style.justifyContent = 'center';
overlay.innerHTML = '<h5>Memeriksa login...</h5>';
document.body.appendChild(overlay);

// Proteksi Login
window.addEventListener('DOMContentLoaded', () => {
    const user = sessionStorage.getItem('user');

    if(!user){
        // redirect halus
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    } else {
        console.log("Admin:", user);
        // hapus overlay setelah valid
        document.body.removeChild(overlay);
    }
});

// Submit form input KBM
document.getElementById('inputForm').addEventListener('submit', function(e){
    e.preventDefault();
    
    const tanggal = document.getElementById('tanggal').value;
    const mapel = document.getElementById('mapel').value.trim();
    const kelas = document.getElementById('kelas').value.trim();
    const namaSiswa = document.getElementById('namaSiswa').value.trim();
    const status = document.getElementById('status').value;

    if(!tanggal || !mapel || !kelas || !namaSiswa || !status){
        alert("Semua kolom wajib diisi!");
        return;
    }

    console.log({Tanggal: tanggal, Mata_Pelajaran: mapel, Kelas: kelas, Nama_Siswa: namaSiswa, Status: status});
    alert("Data berhasil disimpan (simulasi)");
    document.getElementById('inputForm').reset();
});

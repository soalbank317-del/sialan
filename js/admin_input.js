// Proteksi Login
const user = sessionStorage.getItem('user');
if(!user){
  alert('Anda belum login! Akses ditolak.');
  window.location.href = 'login.html';
}

// Menampilkan nama user (opsional)
console.log("Admin:", user);

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

  // Simulasi menyimpan data
  console.log({Tanggal: tanggal, Mata_Pelajaran: mapel, Kelas: kelas, Nama_Siswa: namaSiswa, Status: status});

  alert("Data berhasil disimpan (simulasi)");
  document.getElementById('inputForm').reset();
});

// login.js

const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQXOP4L2k61miTcFTlb4r0QigIWRsMzVazznXCbNLqaHBpwY9RKgjnXdW4figjJZLmrrPcXbU6Q1f-E/pub?gid=1840020379&single=true&output=csv';

let userData = [];

// Disable tombol login sampai CSV selesai load
const loginButton = document.querySelector('#loginForm button[type="submit"]');
loginButton.disabled = true;

// Load data user dari CSV (asynchronous)
Papa.parse(csvUrl, {
  download: true,
  header: false,
  complete: function(results) {
    // Mulai dari baris kedua, hapus row kosong
    userData = results.data.slice(1).filter(row => row[0] && row[1]);
    loginButton.disabled = false; // aktifkan tombol login
  },
  error: function(err) {
    console.error('Error load CSV:', err);
    alert('Gagal load data user. Cek koneksi atau CSV link.');
  }
});

// Event listener login form
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const usernameInput = document.getElementById('username').value.trim().toLowerCase();
  const passwordInput = document.getElementById('password').value.trim();

  if (!usernameInput || !passwordInput) {
    alert('Username dan Password wajib diisi.');
    return;
  }

  // Cari user di CSV
  const validUser = userData.find(user => 
    user[0].trim().toLowerCase() === usernameInput &&
    user[1].trim() === passwordInput
  );

  if (validUser) {
    sessionStorage.setItem('user', usernameInput);
    // Redirect ke halaman admin input
    window.location.href = 'admin_input.html';
  } else {
    alert('Username atau Password salah.');
  }
});

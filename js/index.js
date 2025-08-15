// --- Statistik KBM ---
async function fetchSheetData() {
  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQAEwBLEhaehGYlzYsNhBPfmozGvRZmpjyEOHC8rfgduB0JRurz-xwI_jfW8Fw8Vaz93a_E9tLyuIX9/pub?gid=0&single=true&output=csv";
  const res = await fetch(url);
  const csvText = await res.text();
  const lines = csvText.split("\n").filter(l => l.trim() !== "");
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(",");
    const obj = {};
    headers.forEach((h,i) => obj[h] = vals[i]?.trim() ?? "");
    return obj;
  });
}

fetchSheetData().then(data => {
  const grouped = {};
  data.forEach(d => {
    const key = `${d.Mata_Pelajaran}||${d.Kelas}`;
    if(!grouped[key]) grouped[key] = {mapel:d.Mata_Pelajaran, kelas:d.Kelas, tuntas:0, ujian:0};
    const status = (d.Status || "").trim();
    if(status === "Tuntas") grouped[key].tuntas++;
    if(status === "Ujian") grouped[key].ujian++;
  });

  const tbody = document.getElementById('dataTable');
  tbody.innerHTML = "";
  if(Object.keys(grouped).length === 0){
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">Data tidak tersedia</td></tr>';
  } else {
      Object.values(grouped).forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${row.mapel}</td>
          <td>${row.kelas}</td>
          <td>${row.tuntas}</td>
          <td>${row.ujian}</td>
        `;
        tbody.appendChild(tr);
      });
  }
});

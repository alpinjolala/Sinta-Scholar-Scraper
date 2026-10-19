// Fungsi jeda untuk menunggu loading halaman dan menghindari pemblokiran
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

function showLoading(text) {
  let loader = document.getElementById("scraper-loading");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "scraper-loading";
    loader.style.cssText =
      "position:fixed; top:10px; right:10px; padding:15px; background:#4CAF50; color:white; z-index:9999; border-radius:5px; font-family:sans-serif; max-width: 300px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);";
    document.body.appendChild(loader);
  }
  loader.innerText = text;
}

function hideLoading() {
  const loader = document.getElementById("scraper-loading");
  if (loader) loader.remove();
}

// --- FUNGSI MODAL PENGATURAN HALAMAN ---
function askScrapeConfig() {
  return new Promise((resolve) => {
    const existing = document.getElementById("scraper-config-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "scraper-config-modal";
    modal.style.cssText =
      "position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:white; padding:25px; z-index:100000; border-radius:8px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); font-family:sans-serif; width: 350px; color:#333;";

    modal.innerHTML = `
      <h3 style="margin-top:0; border-bottom:1px solid #ddd; padding-bottom:10px; color:#333;">Pengaturan Scraping</h3>
      <div style="margin-bottom:20px; font-size:14px;">
        <label style="display:block; margin-bottom:10px; cursor:pointer;">
          <input type="radio" name="scrape_mode" value="all" checked> 
          Ambil Semua Halaman
        </label>
        <label style="display:block; cursor:pointer;">
          <input type="radio" name="scrape_mode" value="custom"> 
          Pilih Halaman Tertentu
        </label>
        <div id="custom-page-inputs" style="margin-top:10px; display:none; padding-left:25px; background:#f9f9f9; padding-bottom:10px; padding-top:10px; border-radius:5px;">
           <span style="display:inline-block; width:45px;">Dari</span> : Halaman <input type="number" id="scrape_start" value="1" min="1" style="width:50px; margin-bottom:5px; padding:3px;"><br>
           <span style="display:inline-block; width:45px;">Sampai</span> : Halaman <input type="number" id="scrape_end" value="3" min="1" style="width:50px; padding:3px;">
           <p style="font-size:11px; color:#777; margin-top:8px; line-height:1.4;">(Info Scholar: Membatasi klik 'Tampilkan Lainnya' & merentang artikel per kelipatan 20)</p>
        </div>
      </div>
      <div style="text-align:right;">
        <button id="btn-cancel-scrape" style="padding:8px 15px; margin-right:5px; cursor:pointer; border:1px solid #ccc; background:#eee; border-radius:4px; font-weight:bold; color:#555;">Batal</button>
        <button id="btn-start-scrape" style="padding:8px 15px; cursor:pointer; border:none; background:#4CAF50; color:white; border-radius:4px; font-weight:bold;">Mulai Ekstrak</button>
      </div>
    `;

    document.body.appendChild(modal);

    const radios = modal.querySelectorAll('input[name="scrape_mode"]');
    const customInputs = document.getElementById("custom-page-inputs");

    radios.forEach((r) =>
      r.addEventListener("change", (e) => {
        if (e.target.value === "custom") {
          customInputs.style.display = "block";
        } else {
          customInputs.style.display = "none";
        }
      }),
    );

    document
      .getElementById("btn-cancel-scrape")
      .addEventListener("click", () => {
        modal.remove();
        resolve(null);
      });

    document
      .getElementById("btn-start-scrape")
      .addEventListener("click", () => {
        const mode = document.querySelector(
          'input[name="scrape_mode"]:checked',
        ).value;
        const start =
          parseInt(document.getElementById("scrape_start").value) || 1;
        const end = parseInt(document.getElementById("scrape_end").value) || 1;

        if (mode === "custom" && start > end) {
          alert("Halaman awal tidak boleh lebih besar dari halaman akhir!");
          return;
        }

        modal.remove();
        resolve({ mode, start, end });
      });
  });
}

// --- FUNGSI KONVERSI JSON KE CSV ---
function convertToCSV(objArray) {
  if (!objArray || objArray.length === 0) return "";
  const headers = Array.from(new Set(objArray.flatMap(Object.keys)));
  let csv = headers.join(",") + "\n";

  objArray.forEach((row) => {
    let rowData = headers.map((header) => {
      let cellData =
        row[header] === null || row[header] === undefined
          ? ""
          : row[header].toString();
      if (
        cellData.includes(",") ||
        cellData.includes("\n") ||
        cellData.includes('"')
      ) {
        cellData = cellData.replace(/"/g, '""');
        cellData = `"${cellData}"`;
      }
      return cellData;
    });
    csv += rowData.join(",") + "\n";
  });
  return csv;
}

// --- FUNGSI GOOGLE SCHOLAR PROFIL UTAMA ---
async function scrapeAllScholar(config) {
  showLoading("Membuka halaman profil Scholar...");
  let loadMoreBtn = document.getElementById("gsc_bpf_more");

  let clickCount = 1;

  while (loadMoreBtn && !loadMoreBtn.disabled) {
    if (config.mode === "custom" && clickCount >= config.end) {
      break;
    }
    loadMoreBtn.click();
    clickCount++;
    await delay(2000);
    loadMoreBtn = document.getElementById("gsc_bpf_more");
  }

  const articleElements = document.querySelectorAll(".gsc_a_tr");
  let articleLinks = [];

  let startIndex = config.mode === "custom" ? (config.start - 1) * 20 : 0;
  let endIndex =
    config.mode === "custom" ? config.end * 20 : articleElements.length;

  articleElements.forEach((article, index) => {
    if (config.mode === "custom" && (index < startIndex || index >= endIndex))
      return;

    const linkEl = article.querySelector(".gsc_a_at");
    if (linkEl && linkEl.href) {
      articleLinks.push(linkEl.href);
    }
  });

  let data = [];

  for (let i = 0; i < articleLinks.length; i++) {
    showLoading(
      `Mengambil detail Scholar: ${i + 1} dari ${articleLinks.length} artikel yang dipilih...`,
    );
    try {
      const response = await fetch(articleLinks[i]);
      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");

      const title =
        doc.querySelector("#gsc_oci_title a")?.innerText ||
        doc.querySelector("#gsc_oci_title")?.innerText ||
        "";
      let articleData = {
        Sumber: "Google Scholar",
        Judul: title,
        Link: articleLinks[i],
      };

      const fields = doc.querySelectorAll(".gsc_oci_field");
      const values = doc.querySelectorAll(".gsc_oci_value");

      for (let j = 0; j < fields.length; j++) {
        const fieldName = fields[j].innerText.trim();
        const valueText = values[j].innerText.trim();

        if (fieldName === "Penulis" || fieldName === "Authors")
          articleData["Penulis"] = valueText;
        if (fieldName === "Tanggal terbit" || fieldName === "Publication date")
          articleData["Tahun Terbit"] = valueText;
        if (fieldName === "Jurnal" || fieldName === "Journal")
          articleData["Jurnal"] = valueText;
        if (fieldName === "Penerbit" || fieldName === "Publisher")
          articleData["Penerbit"] = valueText;
        if (fieldName === "Deskripsi" || fieldName === "Description")
          articleData["Abstrak"] = valueText;
      }

      data.push(articleData);
      await delay(3000);
    } catch (error) {
      console.error("Gagal mengambil detail artikel:", error);
    }
  }

  hideLoading();
  return data;
}

// --- FUNGSI SINTA ---
function extractSintaData(htmlDocument, pageUrl) {
  const articles = htmlDocument.querySelectorAll(".ar-item, .ar-list-item");
  let data = [];

  const urlObj = new URL(pageUrl);
  const viewParam = urlObj.searchParams.get("view") || "scopus";

  articles.forEach((article) => {
    const titleEl =
      article.querySelector(".ar-title a") || article.querySelector(".title a");
    const title = titleEl?.innerText?.trim() || "";
    const linkArtikelSinta = titleEl?.href || "";

    let year = "";
    const textEls = article.querySelectorAll("*");
    textEls.forEach((el) => {
      const txt = el.innerText?.trim();
      if (txt && /^(19|20)\d{2}$/.test(txt) && el.children.length === 0) {
        year = txt;
      }
    });
    if (!year)
      year = article.querySelector(".ar-year")?.innerText?.trim() || "";

    if (title) {
      let authors = "-";
      let journalName = "-";
      let journalLink = "-";
      let citation = "0";
      let ranking = "-";
      let akreditasi = "-";
      let doiLink = "-";

      // 1. Ambil data Sitasi, Akreditasi, Ranking, DOI (Semua Sumber)
      const linksAndSpans = article.querySelectorAll("a, span, div");
      linksAndSpans.forEach((el) => {
        const text = el.innerText.trim();
        const textLower = text.toLowerCase();
        const href = el.href || "";

        if (textLower.match(/^q[1-4]\b/)) {
          ranking = text;
        } else if (textLower.includes("accred")) {
          akreditasi = text.replace(/accred\s*:/i, "").trim();
        } else if (
          textLower.includes("cited") ||
          textLower.includes("citation")
        ) {
          citation = text.replace(/[^0-9]/g, "");
        } else if (textLower.includes("doi:")) {
          let extractedDoi = text.replace(/doi\s*:/i, "").trim();
          if (extractedDoi !== "-" && extractedDoi !== "") {
            let cleanDoi = extractedDoi.replace(/https?:\/\/doi\.org\//i, "");
            doiLink = "https://doi.org/" + cleanDoi;
          } else {
            doiLink = "-";
          }
        } else if (
          el.tagName === "A" &&
          href !== linkArtikelSinta &&
          text.length > 3 &&
          !textLower.includes("creator") &&
          !text.match(/^(19|20)\d{2}$/)
        ) {
          if (!textLower.includes("doi:") && !textLower.includes("accred")) {
            if (viewParam !== "googlescholar" && viewParam !== "wos") {
              if (
                journalName === "-" ||
                href.includes("garuda") ||
                href.includes("journal")
              ) {
                journalName = text;
                journalLink = href;
              }
            }
          }
        }
      });

      // 2. Ekstrak Penulis untuk Garuda/Scopus
      const divs = article.querySelectorAll("div, span");
      divs.forEach((div) => {
        const txt = div.innerText.trim();
        if (txt.includes("Creator :") && txt.length < 200) {
          authors = txt.split("Creator :")[1].trim();
        } else if (txt.includes("Creator:") && txt.length < 200) {
          authors = txt.split("Creator:")[1].trim();
        }
      });

      // 3. PERBAIKAN SPESIFIK GOOGLE SCHOLAR DI SINTA (Pemecahan Baris Teks)
      if (viewParam === "googlescholar" || viewParam === "wos") {
        // Memecah teks dari seluruh artikel menjadi array baris demi baris
        let lines = article.innerText
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        // Membuang baris pertama jika itu adalah judul artikel
        if (
          lines.length > 0 &&
          (lines[0] === title ||
            title.includes(lines[0]) ||
            lines[0].includes(title.substring(0, 15)))
        ) {
          lines.shift();
        }

        // Menyaring (membuang) baris yang murni angka tahun atau tulisan sitasi
        let filteredLines = lines.filter((l) => {
          let isPureYear = /^(19|20)\d{2}$/.test(l);
          let isCitation =
            /\b\d+\s*cited\b/i.test(l) || /\b\d+\s*citation/i.test(l);
          return !isPureYear && !isCitation;
        });

        // Sisanya pastilah Penulis (Baris Pertama) dan Jurnal (Baris Kedua)
        if (filteredLines.length > 0) authors = filteredLines[0];
        if (filteredLines.length > 1) journalName = filteredLines[1];
      }

      // --- SUSUN DATA AKHIR ---
      let itemData = {
        Sumber: `SINTA (${viewParam.toUpperCase()})`,
        Judul: title,
        Tahun: year,
      };

      if (viewParam === "scopus") {
        itemData["Ranking Artikel/Jurnal"] = ranking;
        itemData["Nama Jurnal"] = journalName;
        itemData["Link Artikel (SINTA)"] = linkArtikelSinta;
        itemData["Creator/Penulis"] = authors;
        itemData["Jumlah Sitasi"] = citation;
      } else if (viewParam === "garuda") {
        itemData["Nama Jurnal"] = journalName;
        itemData["Link Garuda (di SINTA)"] = journalLink || linkArtikelSinta;
        itemData["Creator/Penulis"] = authors;
        itemData["Tautan DOI"] = doiLink;
        itemData["Akreditasi Jurnal"] = akreditasi;
        itemData["Jumlah Sitasi"] = citation;
      } else if (viewParam === "googlescholar" || viewParam === "wos") {
        itemData["Nama Jurnal"] = journalName;
        itemData["Link Jurnal"] = linkArtikelSinta;
        itemData["Creator/Penulis"] = authors;
        itemData["Jumlah Sitasi"] = citation;
      }

      data.push(itemData);
    }
  });
  return data;
}

async function scrapeAllSinta(config) {
  let allData = [];

  let urlObj = new URL(window.location.href);
  urlObj.searchParams.delete("page");

  let startPage = config.mode === "all" ? 1 : config.start;
  let pageNum = startPage;
  let hasMoreData = true;

  while (hasMoreData) {
    if (config.mode === "custom" && pageNum > config.end) {
      break;
    }

    showLoading(`Mengambil data SINTA Halaman ${pageNum}...`);

    try {
      urlObj.searchParams.set("page", pageNum);
      const response = await fetch(urlObj.toString());
      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");

      const newData = extractSintaData(doc, urlObj.toString());

      if (newData.length > 0) {
        allData.push(...newData);
        pageNum++;
        await delay(1500);
      } else {
        hasMoreData = false;
      }
    } catch (error) {
      hasMoreData = false;
    }
  }

  const uniqueData = Array.from(new Set(allData.map((a) => a.Judul))).map(
    (judul) => {
      return allData.find((a) => a.Judul === judul);
    },
  );

  hideLoading();
  return uniqueData;
}

// --- FUNGSI UTAMA ---
async function main() {
  const config = await askScrapeConfig();
  if (!config) return;

  let result = [];
  if (window.location.hostname.includes("scholar.google.com")) {
    result = await scrapeAllScholar(config);
  } else if (window.location.hostname.includes("sinta.kemdiktisaintek.go.id")) {
    result = await scrapeAllSinta(config);
  } else {
    alert(
      "Harap buka halaman profil Google Scholar atau SINTA terlebih dahulu.",
    );
    return;
  }

  if (result.length > 0) {
    const csvData = convertToCSV(result);
    const blob = new Blob(["\uFEFF" + csvData], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const isSinta = window.location.hostname.includes("sinta");
    const prefix = isSinta ? "SINTA" : "SCHOLAR";
    a.download = `Data_Publikasi_${prefix}_${Date.now()}.csv`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    alert(
      `Selesai! Berhasil mengekstrak ${result.length} publikasi dari halaman yang Anda pilih.`,
    );
  } else {
    alert("Tidak ada data ditemukan pada rentang halaman tersebut.");
  }
}

main();

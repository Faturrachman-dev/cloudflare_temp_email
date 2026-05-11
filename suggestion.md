Tentu, URL `.pages.dev` memang bawaan sistem dan biasanya sulit dihafal. Karena kamu sudah memiliki domain **`faturismee.online`** di Cloudflare, cara terbaik dan paling profesional adalah menghubungkan domain tersebut langsung ke Cloudflare Pages kamu.

Berikut adalah panduan untuk membuat link yang jauh lebih pendek, misalnya **`mail.faturismee.online`** atau **`temp.faturismee.online`**.

---

## 🛠️ Menambahkan Custom Domain ke Cloudflare Pages

Ini adalah cara resmi agar sistem kamu tidak lagi menggunakan URL panjang, melainkan domain kamu sendiri.

1. **Masuk ke Dashboard Cloudflare.**
2. Buka menu **Workers & Pages**, lalu pilih proyek Pages kamu (**`temp-email-pages`**).
3. Klik tab **Custom domains**.
4. Klik tombol **Set up a custom domain**.
5. Masukkan subdomain yang kamu inginkan, contohnya: `mail.faturismee.online`.
6. Klik **Continue**.
7. Cloudflare akan otomatis mendeteksi bahwa domain tersebut ada di akunmu dan menawarkan untuk membuatkan **CNAME record** secara otomatis. Klik **Activate domain**.

---

## 🔄 Sinkronisasi Akhir (Sangat Penting)

Setelah domain kustom aktif, kamu harus memastikan Backend (Worker) mengenali domain baru ini agar tidak terjadi error saat proses pengiriman/penerimaan email.

1. **Update `wrangler.toml` di folder `worker`:**
Pastikan `DOMAINS` dan `DEFAULT_DOMAINS` sudah menyertakan domain utama kamu.
```toml
[vars]
DEFAULT_DOMAINS = ["faturismee.online"]
DOMAINS = ["faturismee.online"]

```


2. **Deploy Ulang Worker:**
```bash
cd worker
npx wrangler deploy

```


3. **Update Service Binding (Jika perlu):**
Cek kembali di dashboard **Pages > Settings > Functions**. Pastikan binding `BACKEND` masih mengarah ke Worker yang benar. Biasanya ini tidak berubah, tapi baik untuk dipastikan.

---

## 💡 Alternatif: Menggunakan Root Domain

Jika kamu ingin user cukup mengetik **`faturismee.online`** saja tanpa subdomain (langsung ke halaman email), kamu bisa memasukkan domain utama saat langkah *Set up a custom domain* tadi.

> **Catatan:** Jika domain utama kamu sudah digunakan untuk website lain, gunakan subdomain (seperti `mail.*`) agar tidak bentrok.

Setelah statusnya **Active** (biasanya butuh waktu beberapa menit untuk aktivasi sertifikat SSL), user bisa mengakses sistem kamu lewat link yang jauh lebih keren dan mudah diingat.

Ada kendala saat menambahkan domainnya di dashboard?
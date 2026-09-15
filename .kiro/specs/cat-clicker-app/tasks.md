# Implementation Plan: Cat Clicker App

## Overview

Implementasi Cat Clicker App sebagai single-page application menggunakan HTML5, Tailwind CSS (CDN), dan Vanilla JavaScript. Pendekatan incremental: mulai dari struktur file dan data, kemudian modul logika inti, lalu controller dan DOM, dan terakhir styling animasi serta integrasi keseluruhan.

## Tasks

- [x] 1. Buat struktur proyek dan file dasar
  - Buat direktori `cat-clicker-app/`, `cat-clicker-app/css/`, dan `cat-clicker-app/js/`
  - Buat file kosong: `index.html`, `css/animations.css`, `js/reactions.js`, `js/reactionEngine.js`, `js/counterModule.js`, `js/app.js`
  - Siapkan aset gambar kucing di folder `assets/` (atau gunakan placeholder URL)
  - _Requirements: 1.1, 1.2_

- [x] 2. Implementasi data Reaction Pool
  - [x] 2.1 Tulis `js/reactions.js` — definisikan `REACTION_POOL`
    - Export konstanta `REACTION_POOL` berupa array minimal 5 objek `Reaction`
    - Setiap Reaction memiliki `id`, `text` (teks + emoji unik), `animationClass`, dan `duration` (1000–2000ms)
    - Pastikan tidak ada dua Reaction dengan kombinasi `text` + `animationClass` yang identik
    - _Requirements: 3.1, 2.3, 2.4_

  - [ ]* 2.2 Tulis property test untuk REACTION_POOL
    - **Property 3: Durasi animasi setiap reaksi tidak melebihi 2000ms**
    - **Validates: Requirements 2.4**
    - **Property 4: Reaction_Pool memenuhi invariant ukuran dan keunikan**
    - **Validates: Requirements 3.1**

- [x] 3. Implementasi modul `reactionEngine.js`
  - [x] 3.1 Implementasi fungsi `isValidReaction(reaction)` dan `isValidPool(pool)`
    - `isValidReaction`: cek keberadaan dan tipe field `id`, `text`, `animationClass`, `duration`
    - `isValidPool`: cek array tidak kosong dan semua elemen valid menggunakan `isValidReaction`
    - Export kedua fungsi
    - _Requirements: 3.5_

  - [x] 3.2 Implementasi fungsi `pickRandom(pool, randomFn = Math.random)`
    - Panggil `isValidPool(pool)`, lempar `Error` jika tidak valid
    - Pilih indeks acak menggunakan `randomFn` dengan distribusi seragam
    - Kembalikan elemen `Reaction` yang terpilih
    - Export fungsi
    - _Requirements: 2.1, 3.2, 3.3, 3.5_

  - [ ]* 3.3 Tulis property test untuk `reactionEngine.js`
    - **Property 1: Pemilihan reaksi terdistribusi seragam**
    - **Validates: Requirements 2.1, 3.2**
    - **Property 5: Pemilihan acak menggunakan with-replacement**
    - **Validates: Requirements 3.3**
    - **Property 6: Pool tidak valid menghasilkan error, bukan perubahan display**
    - **Validates: Requirements 3.5**

  - [ ]* 3.4 Tulis unit test untuk `reactionEngine.js`
    - Test: `pickRandom` mengembalikan elemen dari pool
    - Test: `pickRandom` dengan pool 1 elemen selalu mengembalikan elemen tersebut
    - Test: `isValidPool` mengembalikan `false` untuk array kosong
    - Test: `isValidPool` mengembalikan `false` untuk input bukan array
    - Test: `isValidReaction` mengembalikan `false` untuk objek tanpa field wajib
    - _Requirements: 3.5_

- [x] 4. Implementasi modul `counterModule.js`
  - [x] 4.1 Implementasi factory function `createCounter()`
    - Simpan state counter secara internal (closure)
    - Implementasi method `increment()`, `getValue()`, dan `reset()`
    - Export fungsi `createCounter`
    - _Requirements: 2.2, 1.4_

  - [ ]* 4.2 Tulis property test untuk `counterModule.js`
    - **Property 2: Counter bertambah tepat 1 per klik**
    - **Validates: Requirements 2.2**

  - [ ]* 4.3 Tulis unit test untuk `counterModule.js`
    - Test: Counter baru dimulai dengan nilai 0
    - Test: Setelah `increment()`, `getValue()` mengembalikan 1
    - Test: `reset()` mengembalikan counter ke 0
    - _Requirements: 1.4, 2.2_

- [x] 5. Checkpoint — Pastikan semua modul logika berfungsi
  - Pastikan semua test untuk `reactionEngine.js` dan `counterModule.js` lulus, tanyakan ke user jika ada pertanyaan.

- [x] 6. Buat struktur HTML `index.html`
  - [x] 6.1 Tulis kerangka `index.html` dengan metadata dan link CDN
    - Tambahkan `<!DOCTYPE html>`, `<html lang="id">`, `<meta charset>`, `<meta viewport>`
    - Tambahkan link Tailwind CSS via CDN di `<head>`
    - Tambahkan link `css/animations.css` di `<head>`
    - Tambahkan judul aplikasi (teks 1–60 karakter) yang terlihat di viewport
    - _Requirements: 1.1, 1.3, 5.1_

  - [x] 6.2 Implementasi komponen `Cat_Display` di HTML
    - Tambahkan `<div id="cat-display">` dengan atribut `role="button"` dan `aria-label`
    - Tambahkan `<img id="cat-image">` dengan `src`, `alt` non-kosong, dan class Tailwind `max-w-full`
    - Tambahkan `<div id="reaction-overlay">` dengan `aria-live="polite"` dan `<span id="reaction-text" class="hidden">`
    - _Requirements: 1.2, 4.2, 4.3, 5.3_

  - [x] 6.3 Implementasi komponen `Click_Counter` di HTML
    - Tambahkan `<div id="counter-display">` dengan label dan `<span id="counter-value">0</span>`
    - Pastikan warna teks memenuhi kontras WCAG AA (4.5:1) terhadap latar belakang menggunakan kelas Tailwind
    - _Requirements: 1.4, 4.4_

  - [x] 6.4 Tambahkan tag `<script>` untuk modul JavaScript
    - Tambahkan `<script type="module" src="js/app.js">` sebelum penutup `</body>`
    - _Requirements: 1.1_

- [x] 7. Buat animasi CSS di `css/animations.css`
  - [x] 7.1 Definisikan semua `@keyframes` dan kelas animasi
    - Tulis `@keyframes` untuk: `bounce`, `shake`, `wobble`, `spin`, `pulse`
    - Buat kelas `.anim-bounce`, `.anim-shake`, `.anim-wobble`, `.anim-spin`, `.anim-pulse`
    - Pastikan setiap `animation-duration` tidak melebihi 2000ms
    - _Requirements: 2.4, 2.5_

- [x] 8. Implementasi controller `app.js`
  - [x] 8.1 Inisialisasi aplikasi dan state
    - Import `REACTION_POOL` dari `reactions.js`, `pickRandom` dari `reactionEngine.js`, `createCounter` dari `counterModule.js`
    - Deklarasi objek `state: { activeTimerId, isAnimating, currentReaction }`
    - Buat instance counter menggunakan `createCounter()`
    - Implementasi `updateCounterDisplay(value)` — perbarui teks `#counter-value`
    - _Requirements: 1.4, 2.2_

  - [x] 8.2 Implementasi fungsi `showReaction(reaction)` dan `hideReaction()`
    - `showReaction`: tampilkan `#reaction-text` dengan `reaction.text`, tambahkan `reaction.animationClass` ke `#cat-image`, set `state.isAnimating = true`
    - `hideReaction`: sembunyikan `#reaction-overlay`, hapus semua kelas animasi dari `#cat-image`, reset state ke idle
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 8.3 Implementasi fungsi `cancelCurrentReaction()`
    - Jika `state.activeTimerId` ada, panggil `clearTimeout(state.activeTimerId)`
    - Panggil `hideReaction()` untuk membersihkan tampilan
    - Set `state.activeTimerId = null` dan `state.isAnimating = false`
    - _Requirements: 2.6, 3.4_

  - [x] 8.4 Implementasi event handler klik pada `#cat-display`
    - Jika `state.isAnimating === true`, panggil `cancelCurrentReaction()` terlebih dahulu
    - Panggil `pickRandom(REACTION_POOL)` — tangkap error, tampilkan pesan error di overlay jika pool tidak valid
    - Panggil `counter.increment()` dan `updateCounterDisplay(counter.getValue())`
    - Panggil `showReaction(reaction)`, set `state.activeTimerId = setTimeout(hideReaction, reaction.duration)`
    - Daftarkan handler via `addEventListener('click', handler)` pada `DOMContentLoaded`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 3.5, 5.2_

  - [x] 8.5 Implementasi penanganan error gambar (`onerror` pada `#cat-image`)
    - Tambahkan listener `error` pada `#cat-image`
    - Saat error: sembunyikan elemen `<img>`, tampilkan teks alt sebagai fallback di area yang sama
    - _Requirements: 5.3_

- [x] 9. Checkpoint — Pastikan seluruh alur aplikasi berfungsi
  - Pastikan semua test integrasi DOM lulus dan aplikasi berjalan secara manual di browser, tanyakan ke user jika ada pertanyaan.

- [x] 10. Verifikasi aksesibilitas dan responsivitas
  - [x] 10.1 Tulis unit test aksesibilitas
    - Test: elemen `<img>` memiliki atribut `alt` tidak kosong
    - Test: `<div id="cat-display">` memiliki `role="button"` dan `aria-label`
    - Test: `<div id="reaction-overlay">` memiliki `aria-live="polite"`
    - _Requirements: 4.3_

  - [ ]* 10.2 Tulis unit test responsivitas
    - Test: tidak ada `overflow-x` pada viewport 320px, 768px, dan 1440px (menggunakan jsdom atau Playwright)
    - Test: `#counter-value` terlihat dalam viewport tanpa scroll
    - _Requirements: 4.1, 4.2, 4.4_

- [x] 11. Final Checkpoint — Pastikan semua test lulus
  - Pastikan semua test (unit, property, integrasi) lulus. Tanyakan ke user jika ada pertanyaan atau penyesuaian yang diperlukan sebelum dianggap selesai.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk traceability
- Tailwind CSS digunakan via CDN — tidak ada build step yang diperlukan
- Property test menggunakan library **fast-check**, unit/integrasi test menggunakan **Vitest** atau **Jest**
- Animasi harus selalu diselesaikan dengan `setTimeout` sesuai `reaction.duration`, bukan hanya mengandalkan event `animationend`
- Semua modul JavaScript menggunakan ES Module (`import`/`export`) agar kompatibel dengan `type="module"` di `<script>`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "4.1"] },
    { "id": 1, "tasks": ["2.2", "3.1", "4.2", "4.3"] },
    { "id": 2, "tasks": ["3.2", "6.1"] },
    { "id": 3, "tasks": ["3.3", "3.4", "6.2", "6.3", "6.4", "7.1"] },
    { "id": 4, "tasks": ["8.1"] },
    { "id": 5, "tasks": ["8.2", "8.3"] },
    { "id": 6, "tasks": ["8.4", "8.5"] },
    { "id": 7, "tasks": ["10.1"] },
    { "id": 8, "tasks": ["10.2"] }
  ]
}
```

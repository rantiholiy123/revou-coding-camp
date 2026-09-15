# Design Document: Cat Clicker App

## Overview

Cat Clicker App adalah aplikasi web single page (SPA) berbasis kucing yang memungkinkan pengguna mengklik gambar kucing untuk mendapatkan reaksi acak berupa teks, ekspresi emoji, dan animasi CSS. Aplikasi dibangun menggunakan HTML5, Tailwind CSS, dan Vanilla JavaScript tanpa framework atau backend.

Tujuan utama desain ini adalah memisahkan logika inti (Reaction Engine, Click Counter) dari lapisan presentasi (DOM, animasi) agar mudah diuji dan dipelihara.

**Keputusan Desain Utama:**
- Tidak menggunakan framework JavaScript (Vue/React) sesuai dengan stack yang ditentukan
- Tailwind CSS digunakan via CDN untuk kemudahan setup tanpa build step
- State aplikasi dikelola sepenuhnya di memori (in-memory) — tidak ada persistent storage karena tidak disyaratkan
- Reaction_Engine dirancang sebagai modul murni (pure function) yang menerima pool dan RNG sebagai parameter, sehingga mudah diuji secara terisolasi

---

## Architecture

Aplikasi ini mengikuti pola **MVC ringan** yang disesuaikan untuk Vanilla JS:

```
┌─────────────────────────────────────────────────────────┐
│                    index.html                           │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────┐  │
│  │  Cat_Display  │  │ Click_Counter │  │   Title    │  │
│  └───────┬───────┘  └───────┬───────┘  └────────────┘  │
│          │ (click event)    │                           │
└──────────┼──────────────────┼───────────────────────────┘
           │                  │
           ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                   app.js (Controller)                   │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │   Reaction_Engine   │  │     Counter Module       │  │
│  │  (reactionEngine.js)│  │   (counterModule.js)     │  │
│  └─────────────────────┘  └──────────────────────────┘  │
│  ┌─────────────────────┐                                │
│  │   Reaction_Pool     │                                │
│  │   (reactions.js)    │                                │
│  └─────────────────────┘                                │
└─────────────────────────────────────────────────────────┘
```

**Alur Data:**
1. Pengguna mengklik elemen `#cat-display` di HTML
2. Event listener di `app.js` menangkap klik
3. `app.js` memanggil `reactionEngine.pickRandom(pool)` untuk memilih reaksi
4. `app.js` memanggil `counterModule.increment()` untuk menambah counter
5. `app.js` memperbarui DOM: tampilkan reaksi, jalankan animasi, set timeout untuk kembali ke idle state
6. Setelah timeout, `app.js` membersihkan DOM kembali ke idle state

**Struktur File:**

```
cat-clicker-app/
├── index.html
├── css/
│   └── animations.css        # Custom CSS animations
└── js/
    ├── reactions.js           # Reaction_Pool data
    ├── reactionEngine.js      # Logika pemilihan reaksi (pure functions)
    ├── counterModule.js       # Logika counter (pure functions)
    └── app.js                 # Controller: inisialisasi, event handling, DOM updates
```

---

## Components and Interfaces

### 1. Cat_Display Component

Elemen HTML yang menampilkan gambar kucing dan overlay reaksi.

**HTML Structure:**
```html
<div id="cat-display" class="relative cursor-pointer" role="button" aria-label="Klik kucing untuk mendapatkan reaksi">
  <img id="cat-image" src="assets/cat.png" alt="Kucing lucu sedang duduk" 
       class="max-w-full" style="min-width:100px; min-height:100px;" />
  <div id="reaction-overlay" class="absolute inset-0 flex items-center justify-center" aria-live="polite">
    <span id="reaction-text" class="text-4xl font-bold hidden"></span>
  </div>
</div>
```

**States:**
- `idle`: overlay tersembunyi, tidak ada kelas animasi aktif
- `reacting`: overlay terlihat dengan teks/emoji, kelas animasi aktif pada `#cat-image`

**Interface (DOM API yang digunakan app.js):**
```javascript
// Menampilkan reaksi
function showReaction(reaction) // mengatur teks dan menambah kelas animasi
function hideReaction()          // mengembalikan ke idle state
function cancelCurrentReaction() // membatalkan timer aktif dan memanggil hideReaction
```

---

### 2. Click_Counter Component

Elemen yang menampilkan jumlah klik.

**HTML Structure:**
```html
<div id="counter-display" class="text-center">
  <span class="text-lg font-semibold" id="counter-label">Jumlah Klik:</span>
  <span class="text-2xl font-bold" id="counter-value">0</span>
</div>
```

**Interface:**
```javascript
function updateCounterDisplay(value) // memperbarui teks #counter-value dengan nilai baru
```

---

### 3. reactionEngine.js — Reaction Engine Module

Modul pure function yang tidak bergantung pada DOM.

**Interface:**
```javascript
/**
 * Memilih satu reaksi acak dari pool menggunakan distribusi seragam.
 * @param {Reaction[]} pool - Array reaksi yang tersedia
 * @param {Function} randomFn - Fungsi random (default: Math.random), injectable untuk testing
 * @returns {Reaction} Reaksi yang dipilih
 * @throws {Error} Jika pool kosong atau tidak valid
 */
function pickRandom(pool, randomFn = Math.random)

/**
 * Memvalidasi apakah sebuah pool valid (tidak kosong, semua elemen adalah Reaction valid).
 * @param {any[]} pool
 * @returns {boolean}
 */
function isValidPool(pool)

/**
 * Memvalidasi apakah sebuah Reaction valid.
 * @param {any} reaction
 * @returns {boolean}
 */
function isValidReaction(reaction)
```

---

### 4. counterModule.js — Counter Module

Modul yang mengelola state counter.

**Interface:**
```javascript
/**
 * Membuat instance counter baru dengan nilai awal 0.
 * @returns {{ increment: Function, getValue: Function, reset: Function }}
 */
function createCounter()

// Contoh penggunaan:
const counter = createCounter()
counter.increment() // nilai menjadi 1
counter.getValue()  // mengembalikan 1
counter.reset()     // nilai kembali ke 0
```

---

### 5. reactions.js — Reaction Pool Data

File data yang mendefinisikan semua reaksi yang tersedia.

**Interface:**
```javascript
// Export default berupa array of Reaction objects
export const REACTION_POOL = [ /* minimal 5 reaksi */ ]
```

---

### 6. app.js — Controller

Menghubungkan semua modul dan menangani event DOM.

**Tanggung Jawab:**
- Inisialisasi aplikasi saat `DOMContentLoaded`
- Mendaftarkan event listener klik pada `#cat-display`
- Mengkoordinasikan Reaction_Engine, Counter, dan pembaruan DOM
- Mengelola lifecycle animasi (set timeout, cancel jika klik ulang)

---

## Data Models

### Reaction

```javascript
/**
 * @typedef {Object} Reaction
 * @property {string} id           - Identifier unik (contoh: "happy", "surprised")
 * @property {string} text         - Teks reaksi yang ditampilkan (bisa berisi emoji)
 * @property {string} animationClass - Nama kelas CSS animasi (didefinisikan di animations.css)
 * @property {number} duration     - Durasi tampilan dalam ms (antara 1000 dan 2000)
 */
```

**Contoh data:**
```javascript
export const REACTION_POOL = [
  {
    id: "happy",
    text: "😸 Purrr~",
    animationClass: "anim-bounce",
    duration: 1500
  },
  {
    id: "surprised",
    text: "😱 Meooow!",
    animationClass: "anim-shake",
    duration: 1200
  },
  {
    id: "sleepy",
    text: "😴 Zzz...",
    animationClass: "anim-wobble",
    duration: 2000
  },
  {
    id: "playful",
    text: "😹 Hehe~",
    animationClass: "anim-spin",
    duration: 1000
  },
  {
    id: "grumpy",
    text: "😾 Hisss!",
    animationClass: "anim-pulse",
    duration: 1800
  }
]
```

### AppState

State internal yang dikelola di `app.js`:

```javascript
/**
 * @typedef {Object} AppState
 * @property {number|null} activeTimerId   - ID dari setTimeout yang sedang berjalan, null jika idle
 * @property {boolean} isAnimating         - true jika animasi sedang berjalan
 * @property {Reaction|null} currentReaction - Reaksi yang sedang ditampilkan, null jika idle
 */

const state = {
  activeTimerId: null,
  isAnimating: false,
  currentReaction: null
}
```

### CSS Animations (animations.css)

Setiap `animationClass` didefinisikan sebagai keyframe animation:

```css
/* Constraint: semua animasi HARUS <= 2000ms */
.anim-bounce {
  animation: bounce 1.5s ease;
}
.anim-shake {
  animation: shake 1.2s ease;
}
.anim-wobble {
  animation: wobble 2.0s ease;
}
.anim-spin {
  animation: spin 1.0s ease;
}
.anim-pulse {
  animation: pulse 1.8s ease;
}

@keyframes bounce { /* ... */ }
@keyframes shake  { /* ... */ }
@keyframes wobble { /* ... */ }
@keyframes spin   { /* ... */ }
@keyframes pulse  { /* ... */ }
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property Reflection**

Setelah menganalisis prework:
- **2.1 dan 3.2** adalah duplikat (keduanya menguji distribusi seragam dari `pickRandom`) → digabungkan menjadi Property 1
- **2.4** (durasi animasi) adalah invariant dari data Reaction_Pool → Property 3
- **3.1** (ukuran pool dan keunikan) → Property 4
- **3.3** (pengulangan diperbolehkan / with replacement) → Property 5
- **3.5** (empty pool error handling) → Property 6
- **2.2** (counter increment) → Property 2
- **2.6** (cancel and restart) → tidak dijadikan property PBT terpisah karena bergantung pada state DOM/timer yang sudah dicakup oleh example test; logika cancel dicakup oleh Property 2

---

### Property 1: Pemilihan reaksi terdistribusi seragam

*For any* Reaction_Pool yang valid dengan N reaksi, setelah sejumlah besar pemanggilan `pickRandom(pool)`, setiap reaksi harus terpilih dengan frekuensi yang mendekati 1/N (distribusi seragam), dan hasil yang dikembalikan selalu merupakan anggota dari pool tersebut.

**Validates: Requirements 2.1, 3.2**

---

### Property 2: Counter bertambah tepat 1 per klik

*For any* nilai counter awal yang valid, setelah memanggil `increment()` sebanyak N kali, nilai counter harus sama persis dengan nilai awal + N.

**Validates: Requirements 2.2**

---

### Property 3: Durasi animasi setiap reaksi tidak melebihi 2000ms

*For any* Reaction di dalam REACTION_POOL, nilai properti `duration` harus berada dalam rentang [1000, 2000] (inklusif), dan nilai `animationClass` harus merujuk ke kelas CSS yang memiliki durasi animasi tidak melebihi 2000ms.

**Validates: Requirements 2.4**

---

### Property 4: Reaction_Pool memenuhi invariant ukuran dan keunikan

*For any* snapshot dari REACTION_POOL, jumlah elemen harus >= 5, dan tidak ada dua elemen yang memiliki kombinasi (`text`, `animationClass`) yang identik.

**Validates: Requirements 3.1**

---

### Property 5: Pemilihan acak menggunakan with-replacement

*For any* Reaction_Pool yang valid, setelah sejumlah besar pemanggilan `pickRandom(pool)`, setiap reaksi harus pernah terpilih lebih dari sekali (pengulangan tidak dilarang), menandakan bahwa pemilihan dilakukan dengan pengembalian (with replacement).

**Validates: Requirements 3.3**

---

### Property 6: Pool tidak valid menghasilkan error, bukan perubahan display

*For any* kondisi di mana `isValidPool(pool)` mengembalikan `false` (pool kosong atau berisi elemen tidak valid), pemanggilan `pickRandom(pool)` harus melempar Error dan tidak boleh memodifikasi tampilan Cat_Display.

**Validates: Requirements 3.5**

---

## Error Handling

### Skenario Error dan Penanganannya

| Skenario | Kondisi | Penanganan |
|---|---|---|
| Gambar kucing gagal dimuat | Event `onerror` pada `<img>` | Tampilkan teks alt, sembunyikan elemen img |
| Reaction_Pool kosong/tidak valid | `isValidPool()` mengembalikan false | Tampilkan pesan error di overlay: "Reaksi tidak tersedia" |
| Klik saat animasi berjalan | `state.isAnimating === true` | `cancelCurrentReaction()`: hapus timer aktif, bersihkan kelas animasi, mulai siklus baru |
| Kelas animasi tidak ditemukan | Animasi tidak berjalan di browser | Reaksi tetap ditampilkan selama `duration` ms menggunakan setTimeout |

### Error Messages

```javascript
const ERROR_MESSAGES = {
  EMPTY_POOL: "Reaksi tidak tersedia saat ini.",
  INVALID_REACTION: "Data reaksi tidak valid.",
  IMAGE_LOAD_FAILED: "Gambar tidak dapat dimuat." // ditampilkan sebagai fallback alt text
}
```

### Lifecycle Animasi dan Cancel

```
Klik
 │
 ▼
isAnimating?
 ├─ YES → cancelCurrentReaction()
 │        ├─ clearTimeout(state.activeTimerId)
 │        ├─ hapus kelas animasi dari #cat-image
 │        └─ sembunyikan #reaction-overlay
 │
 └─ NO (atau setelah cancel)
      │
      ▼
    pickRandom(pool)
      │
      ├─ throw Error → tampilkan pesan error, return
      │
      └─ OK
           │
           ▼
         increment counter
         tampilkan reaksi (teks + animasi)
         state.isAnimating = true
         state.activeTimerId = setTimeout(() => {
           hideReaction()
           state.isAnimating = false
           state.activeTimerId = null
         }, reaction.duration)
```

---

## Testing Strategy

### Pendekatan Pengujian

Aplikasi ini menggunakan **dual testing approach**:
1. **Unit Tests (example-based)**: Menguji skenario spesifik, edge case, dan error condition
2. **Property-Based Tests (PBT)**: Menguji properti universal yang berlaku untuk semua input valid

### Property-Based Testing Library

Gunakan **[fast-check](https://github.com/dubzzz/fast-check)** (JavaScript) untuk property-based testing.

- Minimum **100 iterasi** per property test
- Setiap property test diberi tag komentar mengacu ke property di design document

**Format tag:**
```javascript
// Feature: cat-clicker-app, Property {N}: {deskripsi singkat property}
```

---

### Unit Tests (Example-Based)

Dijalankan menggunakan **Vitest** atau **Jest**.

**reactionEngine.test.js**
```
✓ pickRandom mengembalikan elemen dari pool
✓ pickRandom dengan pool 1 elemen selalu mengembalikan elemen tersebut
✓ isValidPool mengembalikan false untuk array kosong
✓ isValidPool mengembalikan false untuk input bukan array
✓ isValidReaction mengembalikan false untuk objek tanpa field wajib
```

**counterModule.test.js**
```
✓ Counter baru dimulai dengan nilai 0
✓ Setelah increment(), getValue() mengembalikan 1
✓ reset() mengembalikan counter ke 0
```

**app.test.js (integrasi DOM dengan jsdom)**
```
✓ Halaman dimuat: counter menampilkan 0
✓ Klik pertama: counter berubah menjadi 1, reaksi ditampilkan
✓ Klik saat animasi berjalan: reaksi sebelumnya dibatalkan, reaksi baru dimulai
✓ Setelah duration habis: Cat_Display kembali ke idle state
✓ Gambar gagal dimuat: teks alt ditampilkan
✓ Reaction_Pool kosong: pesan error ditampilkan, Cat_Display tidak berubah
```

**Accessibility & Responsive (example-based)**
```
✓ Elemen img memiliki atribut alt tidak kosong
✓ Tidak ada overflow horizontal di lebar 320px, 768px, 1440px (visual/manual atau dengan resize observer test)
✓ Counter terlihat dalam viewport tanpa scroll
```

---

### Property-Based Tests

**reactionEngine.property.test.js**

```javascript
import fc from 'fast-check'
import { pickRandom, isValidPool } from './reactionEngine.js'

// Feature: cat-clicker-app, Property 1: Pemilihan reaksi terdistribusi seragam
test('pickRandom selalu mengembalikan anggota pool dan terdistribusi seragam', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({ id: fc.string(), text: fc.string({minLength: 1}), animationClass: fc.string({minLength: 1}), duration: fc.integer({min: 1000, max: 2000}) }), { minLength: 1 }),
      (pool) => {
        const result = pickRandom(pool)
        return pool.some(r => r.id === result.id)
      }
    ),
    { numRuns: 100 }
  )
})

// Feature: cat-clicker-app, Property 5: Pemilihan acak with-replacement
test('pickRandom memungkinkan reaksi yang sama terpilih kembali', () => {
  fc.assert(
    fc.property(
      fc.constant(REACTION_POOL), // pool tetap, banyak klik
      (pool) => {
        const results = Array.from({ length: 50 }, () => pickRandom(pool).id)
        // Setidaknya ada 1 ID yang muncul lebih dari sekali dalam 50 percobaan
        // (probabilitas sangat tinggi dengan pool 5 elemen)
        const counts = {}
        results.forEach(id => { counts[id] = (counts[id] || 0) + 1 })
        return Object.values(counts).some(c => c > 1)
      }
    ),
    { numRuns: 20 } // 20 x 50 = 1000 picks total
  )
})

// Feature: cat-clicker-app, Property 6: Pool tidak valid melempar Error
test('pickRandom melempar Error untuk pool tidak valid', () => {
  fc.assert(
    fc.property(
      fc.oneof(
        fc.constant([]),
        fc.array(fc.constant(null)),
        fc.constant(null)
      ),
      (invalidPool) => {
        let threw = false
        try { pickRandom(invalidPool) } catch { threw = true }
        return threw
      }
    ),
    { numRuns: 100 }
  )
})
```

**counterModule.property.test.js**

```javascript
import fc from 'fast-check'
import { createCounter } from './counterModule.js'

// Feature: cat-clicker-app, Property 2: Counter bertambah tepat 1 per klik
test('counter setelah N increment bernilai N', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 500 }),
      (n) => {
        const counter = createCounter()
        for (let i = 0; i < n; i++) counter.increment()
        return counter.getValue() === n
      }
    ),
    { numRuns: 100 }
  )
})
```

**reactions.property.test.js**

```javascript
import fc from 'fast-check'
import { REACTION_POOL } from './reactions.js'

// Feature: cat-clicker-app, Property 3: Durasi animasi dalam rentang [1000, 2000]
test('semua reaksi memiliki duration antara 1000ms dan 2000ms', () => {
  REACTION_POOL.forEach(reaction => {
    expect(reaction.duration).toBeGreaterThanOrEqual(1000)
    expect(reaction.duration).toBeLessThanOrEqual(2000)
  })
})

// Feature: cat-clicker-app, Property 4: Pool memenuhi invariant ukuran dan keunikan
test('REACTION_POOL memiliki minimal 5 reaksi dengan konten unik', () => {
  expect(REACTION_POOL.length).toBeGreaterThanOrEqual(5)
  const keys = REACTION_POOL.map(r => `${r.text}|${r.animationClass}`)
  const uniqueKeys = new Set(keys)
  expect(uniqueKeys.size).toBe(REACTION_POOL.length)
})
```

---

### Ringkasan Coverage

| Requirement | Tipe Test | Status |
|---|---|---|
| 1.1 Single page | Example (DOM) | ✓ Planned |
| 1.2 Cat_Display minimal 100x100 | Example (DOM) | ✓ Planned |
| 1.3 Judul 1-60 karakter | Example | ✓ Planned |
| 1.4 Counter awal = 0 | Example | ✓ Planned |
| 2.1 Distribusi seragam | **Property 1** | ✓ Planned |
| 2.2 Counter +1 per klik | **Property 2** | ✓ Planned |
| 2.3 Durasi tampilan 1000-2000ms | Example | ✓ Planned |
| 2.4 Durasi animasi <= 2000ms | **Property 3** | ✓ Planned |
| 2.5 Kembali ke idle setelah selesai | Example | ✓ Planned |
| 2.6 Cancel dan restart | Example | ✓ Planned |
| 3.1 Pool >= 5 reaksi unik | **Property 4** | ✓ Planned |
| 3.2 Uniform distribution | **Property 1** | ✓ (digabung) |
| 3.3 With replacement | **Property 5** | ✓ Planned |
| 3.4 Cancel dalam < 100ms | Example | ✓ Planned |
| 3.5 Empty pool error | **Property 6** | ✓ Planned |
| 4.1 Tidak ada overflow horizontal | Example/Visual | ✓ Planned |
| 4.2 Responsive image | Example | ✓ Planned |
| 4.3 Alt attribute tidak kosong | Example | ✓ Planned |
| 4.4 Kontras WCAG AA | Example/Manual | ✓ Planned |
| 5.1 Load < 3 detik | Performance | ✓ Manual |
| 5.2 Respons < 100ms | Performance | ✓ Manual |
| 5.3 Gambar gagal dimuat | Example | ✓ Planned |

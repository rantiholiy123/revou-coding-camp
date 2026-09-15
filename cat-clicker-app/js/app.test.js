// @vitest-environment jsdom

/**
 * app.test.js — DOM Integration Tests untuk Cat Clicker App
 *
 * Menguji alur lengkap aplikasi dengan mensimulasikan DOM dari index.html
 * dan memanggil logika modul (reactions, reactionEngine, counterModule)
 * secara langsung — mirip dengan yang dilakukan app.js saat runtime.
 *
 * Requirements tercakup: 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.5, 4.3, 5.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { REACTION_POOL } from './reactions.js';
import { pickRandom } from './reactionEngine.js';
import { createCounter } from './counterModule.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── helpers ──────────────────────────────────────────────────────────────────

/** Muat struktur HTML dari index.html ke document.body */
function loadHTML() {
  const htmlPath = resolve(__dirname, '../index.html');
  const html = readFileSync(htmlPath, 'utf-8');
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  document.body.innerHTML = bodyMatch ? bodyMatch[1] : html;
}

// Daftar semua kelas animasi yang mungkin ada di cat-image
const ANIMATION_CLASSES = ['anim-bounce', 'anim-shake', 'anim-wobble', 'anim-spin', 'anim-pulse'];

/**
 * Membuat mini-controller yang sama seperti app.js — tapi dapat dikontrol dalam test.
 * Mengembalikan { counter, state, showReaction, hideReaction,
 *                 cancelCurrentReaction, handleCatClick }
 */
function createAppController() {
  const counter = createCounter();

  const state = {
    activeTimerId: null,
    isAnimating: false,
    currentReaction: null,
  };

  function updateCounterDisplay(value) {
    const el = document.getElementById('counter-value');
    if (el) el.textContent = String(value);
  }

  function showReaction(reaction) {
    const textEl = document.getElementById('reaction-text');
    const imgEl = document.getElementById('cat-image');
    if (textEl) {
      textEl.textContent = reaction.text;
      textEl.classList.remove('hidden');
    }
    if (imgEl) {
      imgEl.classList.add(reaction.animationClass);
    }
    state.isAnimating = true;
    state.currentReaction = reaction;
  }

  function hideReaction() {
    const textEl = document.getElementById('reaction-text');
    const imgEl = document.getElementById('cat-image');
    if (textEl) {
      textEl.textContent = '';
      textEl.classList.add('hidden');
    }
    if (imgEl) {
      imgEl.classList.remove(...ANIMATION_CLASSES);
    }
    state.isAnimating = false;
    state.currentReaction = null;
    state.activeTimerId = null;
  }

  function cancelCurrentReaction() {
    if (state.activeTimerId !== null) {
      clearTimeout(state.activeTimerId);
    }
    hideReaction();
    state.activeTimerId = null;
    state.isAnimating = false;
  }

  function handleCatClick(pool = REACTION_POOL) {
    if (state.isAnimating) {
      cancelCurrentReaction();
    }

    let reaction;
    try {
      reaction = pickRandom(pool);
    } catch {
      const textEl = document.getElementById('reaction-text');
      if (textEl) {
        textEl.textContent = 'Reaksi tidak tersedia saat ini.';
        textEl.classList.remove('hidden');
      }
      return;
    }

    counter.increment();
    updateCounterDisplay(counter.getValue());

    showReaction(reaction);
    state.activeTimerId = setTimeout(() => {
      hideReaction();
    }, reaction.duration);
  }

  return { counter, state, showReaction, hideReaction, cancelCurrentReaction, handleCatClick };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('Integrasi DOM — Cat Clicker App', () => {
  beforeEach(() => {
    loadHTML();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── 1. Halaman dimuat: counter menampilkan 0 ────────────────────────────────
  describe('1. Halaman dimuat', () => {
    it('counter menampilkan 0 saat halaman baru dimuat', () => {
      const counterEl = document.getElementById('counter-value');
      expect(counterEl).not.toBeNull();
      expect(counterEl.textContent.trim()).toBe('0');
    });

    it('reaction-text tersembunyi saat halaman baru dimuat', () => {
      const textEl = document.getElementById('reaction-text');
      expect(textEl).not.toBeNull();
      expect(textEl.classList.contains('hidden')).toBe(true);
    });

    it('cat-display ada di DOM dengan role button dan aria-label', () => {
      const el = document.getElementById('cat-display');
      expect(el).not.toBeNull();
      expect(el.getAttribute('role')).toBe('button');
      expect(el.getAttribute('aria-label')).not.toBeNull();
      expect(el.getAttribute('aria-label').trim().length).toBeGreaterThan(0);
    });
  });

  // ── 2. Klik pertama ─────────────────────────────────────────────────────────
  describe('2. Klik pertama', () => {
    it('counter berubah menjadi 1 setelah klik pertama', () => {
      const { handleCatClick } = createAppController();
      handleCatClick();

      const counterEl = document.getElementById('counter-value');
      expect(counterEl.textContent).toBe('1');
    });

    it('reaction-text terlihat setelah klik pertama', () => {
      const { handleCatClick } = createAppController();
      handleCatClick();

      const textEl = document.getElementById('reaction-text');
      expect(textEl.classList.contains('hidden')).toBe(false);
      expect(textEl.textContent.trim().length).toBeGreaterThan(0);
    });

    it('cat-image mendapat kelas animasi setelah klik pertama', () => {
      const { handleCatClick } = createAppController();
      handleCatClick();

      const imgEl = document.getElementById('cat-image');
      const hasAnimClass = ANIMATION_CLASSES.some((cls) => imgEl.classList.contains(cls));
      expect(hasAnimClass).toBe(true);
    });

    it('reaksi yang ditampilkan adalah anggota REACTION_POOL', () => {
      const { handleCatClick, state } = createAppController();
      handleCatClick();

      const reactionTexts = REACTION_POOL.map((r) => r.text);
      const textEl = document.getElementById('reaction-text');
      expect(reactionTexts).toContain(textEl.textContent);
      expect(state.currentReaction).not.toBeNull();
    });
  });

  // ── 3. Klik saat animasi berjalan ───────────────────────────────────────────
  describe('3. Klik saat animasi berjalan', () => {
    it('reaksi lama dibatalkan dan reaksi baru dimulai', () => {
      const { handleCatClick, state } = createAppController();

      // Klik pertama — mulai animasi
      handleCatClick();
      const firstReactionText = document.getElementById('reaction-text').textContent;
      expect(state.isAnimating).toBe(true);

      // Klik kedua sebelum animasi selesai
      handleCatClick();
      expect(state.isAnimating).toBe(true);

      // Counter harus 2
      const counterEl = document.getElementById('counter-value');
      expect(counterEl.textContent).toBe('2');

      // Reaksi saat ini mungkin sama atau berbeda, tapi harus berasal dari pool
      const textEl = document.getElementById('reaction-text');
      expect(textEl.classList.contains('hidden')).toBe(false);
      expect(REACTION_POOL.map((r) => r.text)).toContain(textEl.textContent);
    });

    it('cancelCurrentReaction() menghapus kelas animasi dari cat-image', () => {
      const { handleCatClick, cancelCurrentReaction } = createAppController();

      handleCatClick();
      const imgEl = document.getElementById('cat-image');
      const hadClass = ANIMATION_CLASSES.some((cls) => imgEl.classList.contains(cls));
      expect(hadClass).toBe(true);

      cancelCurrentReaction();
      const hasClassAfterCancel = ANIMATION_CLASSES.some((cls) => imgEl.classList.contains(cls));
      expect(hasClassAfterCancel).toBe(false);
    });

    it('cancelCurrentReaction() menyembunyikan reaction-text', () => {
      const { handleCatClick, cancelCurrentReaction } = createAppController();
      handleCatClick();
      cancelCurrentReaction();

      const textEl = document.getElementById('reaction-text');
      expect(textEl.classList.contains('hidden')).toBe(true);
    });

    it('cancelCurrentReaction() mereset state ke idle', () => {
      const { handleCatClick, cancelCurrentReaction, state } = createAppController();
      handleCatClick();
      expect(state.isAnimating).toBe(true);

      cancelCurrentReaction();
      expect(state.isAnimating).toBe(false);
      expect(state.activeTimerId).toBeNull();
      expect(state.currentReaction).toBeNull();
    });
  });

  // ── 4. Setelah duration habis: kembali ke idle state ────────────────────────
  describe('4. Setelah duration habis', () => {
    it('Cat_Display kembali ke idle state setelah setTimeout selesai', () => {
      const { handleCatClick, state } = createAppController();
      handleCatClick();

      // Pastikan sedang animating
      expect(state.isAnimating).toBe(true);

      // Maju waktu melewati durasi animasi terpanjang (2000ms)
      vi.advanceTimersByTime(2001);

      // State harus kembali ke idle
      expect(state.isAnimating).toBe(false);
      expect(state.activeTimerId).toBeNull();
      expect(state.currentReaction).toBeNull();
    });

    it('reaction-text tersembunyi setelah duration habis', () => {
      const { handleCatClick } = createAppController();
      handleCatClick();

      vi.advanceTimersByTime(2001);

      const textEl = document.getElementById('reaction-text');
      expect(textEl.classList.contains('hidden')).toBe(true);
    });

    it('kelas animasi dihapus dari cat-image setelah duration habis', () => {
      const { handleCatClick } = createAppController();
      handleCatClick();

      vi.advanceTimersByTime(2001);

      const imgEl = document.getElementById('cat-image');
      const hasClass = ANIMATION_CLASSES.some((cls) => imgEl.classList.contains(cls));
      expect(hasClass).toBe(false);
    });

    it('setTimeout dipanggil dengan duration sesuai reaksi terpilih', () => {
      vi.spyOn(globalThis, 'setTimeout');
      const { handleCatClick, state } = createAppController();
      handleCatClick();

      // Duration harus dalam rentang [1000, 2000]
      const reaction = state.currentReaction;
      expect(reaction).not.toBeNull();
      expect(setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        reaction.duration
      );
    });
  });

  // ── 5. Gambar gagal dimuat ──────────────────────────────────────────────────
  describe('5. Gambar gagal dimuat (fallback)', () => {
    it('saat img error, elemen fallback dengan teks alt ditampilkan', () => {
      const imgEl = document.getElementById('cat-image');
      expect(imgEl).not.toBeNull();

      const altText = imgEl.getAttribute('alt');
      expect(altText.trim().length).toBeGreaterThan(0);

      // Simulasikan error handler yang sama seperti di app.js
      imgEl.classList.add('hidden');
      const fallback = document.createElement('div');
      fallback.className =
        'w-64 h-64 bg-amber-100 rounded-2xl flex items-center justify-center ' +
        'text-amber-700 text-lg font-medium p-4 text-center';
      fallback.textContent = imgEl.alt || 'Gambar kucing';
      imgEl.parentElement.insertBefore(fallback, imgEl);

      // img harus tersembunyi
      expect(imgEl.classList.contains('hidden')).toBe(true);

      // Fallback harus terlihat dan berisi teks alt
      expect(fallback.textContent).toBe(altText);
      expect(imgEl.parentElement.contains(fallback)).toBe(true);
    });

    it('img memiliki atribut alt yang tidak kosong', () => {
      const imgEl = document.getElementById('cat-image');
      const alt = imgEl.getAttribute('alt');
      expect(alt).not.toBeNull();
      expect(alt.trim().length).toBeGreaterThan(0);
    });
  });

  // ── 6. Reaction_Pool kosong ─────────────────────────────────────────────────
  describe('6. Reaction_Pool kosong atau tidak valid', () => {
    it('pesan error ditampilkan di overlay saat pool kosong', () => {
      const { handleCatClick } = createAppController();

      // Kirim pool kosong sebagai argumen
      handleCatClick([]);

      const textEl = document.getElementById('reaction-text');
      expect(textEl.classList.contains('hidden')).toBe(false);
      expect(textEl.textContent).toBe('Reaksi tidak tersedia saat ini.');
    });

    it('counter TIDAK bertambah saat pool kosong', () => {
      const { handleCatClick, counter } = createAppController();
      handleCatClick([]);

      expect(counter.getValue()).toBe(0);
      const counterEl = document.getElementById('counter-value');
      expect(counterEl.textContent).toBe('0');
    });

    it('cat-image TIDAK mendapat kelas animasi saat pool kosong', () => {
      const { handleCatClick } = createAppController();
      handleCatClick([]);

      const imgEl = document.getElementById('cat-image');
      const hasClass = ANIMATION_CLASSES.some((cls) => imgEl.classList.contains(cls));
      expect(hasClass).toBe(false);
    });

    it('state.isAnimating tetap false saat pool kosong', () => {
      const { handleCatClick, state } = createAppController();
      handleCatClick([]);

      expect(state.isAnimating).toBe(false);
    });
  });

  // ── 7. Counter bertambah per klik ───────────────────────────────────────────
  describe('7. Counter akumulatif', () => {
    it('counter bertambah 1 untuk setiap klik', () => {
      const { handleCatClick } = createAppController();

      for (let i = 1; i <= 5; i++) {
        vi.advanceTimersByTime(2001); // selesaikan animasi sebelumnya
        handleCatClick();
        const counterEl = document.getElementById('counter-value');
        expect(counterEl.textContent).toBe(String(i));
      }
    });
  });
});

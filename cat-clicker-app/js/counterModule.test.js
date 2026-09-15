/**
 * counterModule.test.js — Unit Tests untuk Counter Module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createCounter } from './counterModule.js';

describe('createCounter()', () => {
  it('counter baru dimulai dengan nilai 0', () => {
    const counter = createCounter();
    expect(counter.getValue()).toBe(0);
  });

  it('setelah increment(), getValue() mengembalikan 1', () => {
    const counter = createCounter();
    counter.increment();
    expect(counter.getValue()).toBe(1);
  });

  it('beberapa increment() menambah nilai secara akumulatif', () => {
    const counter = createCounter();
    counter.increment();
    counter.increment();
    counter.increment();
    expect(counter.getValue()).toBe(3);
  });

  it('reset() mengembalikan counter ke 0', () => {
    const counter = createCounter();
    counter.increment();
    counter.increment();
    counter.reset();
    expect(counter.getValue()).toBe(0);
  });

  it('setiap createCounter() menghasilkan instance independen', () => {
    const counterA = createCounter();
    const counterB = createCounter();
    counterA.increment();
    counterA.increment();
    counterB.increment();
    expect(counterA.getValue()).toBe(2);
    expect(counterB.getValue()).toBe(1);
  });
});

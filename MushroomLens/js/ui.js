/* ============================================================
 * js/ui.js  -  MushroomLens
 * โหมดสว่าง/มืด  (ปุ่มดวงอาทิตย์/พระจันทร์ในแถบเมนู จำค่าไว้ในเบราว์เซอร์)
 * ไฟล์นี้ไม่แก้โค้ดเดิม ทำงานเพิ่มต่อจากโค้ดเดิมเท่านั้น
 * ============================================================ */
(() => {
'use strict';
const KEY = 'ml_theme';
const root = document.documentElement;
const store = {
  get: () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
  set: v => { try { localStorage.setItem(KEY, v); } catch (e) {} }
};
const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
const systemTheme = () => (mq && mq.matches ? 'light' : 'dark');

let meta = document.querySelector('meta[name="theme-color"]');
if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }

/* ---------- 1) โหมดสว่าง/มืด ---------- */
let btn = null;
function apply(t) {
  root.setAttribute('data-theme', t);
  meta.content = t === 'light' ? '#F6F6F0' : '#0A0A09';
  if (btn) {
    const toLight = t === 'dark';   // ปุ่มแสดงโหมดที่จะสลับไป
    btn.querySelector('.ms').textContent = toLight ? 'light_mode' : 'dark_mode';
    const label = toLight ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด';
    btn.setAttribute('aria-label', label); btn.title = label;
  }
}
const current = () => root.getAttribute('data-theme') || store.get() || systemTheme();

const bar = document.querySelector('.nav-r');
if (bar) {
  btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'ib'; btn.id = 'themeBtn';
  btn.innerHTML = '<span class="ms">light_mode</span>';
  bar.insertBefore(btn, bar.firstChild);
  btn.addEventListener('click', () => {
    const next = current() === 'light' ? 'dark' : 'light';
    store.set(next); apply(next);
  });
}
apply(store.get() || systemTheme());
// ถ้าผู้ใช้ยังไม่เคยกดเลือกเอง ให้ตามการตั้งค่าของอุปกรณ์
if (mq && mq.addEventListener) mq.addEventListener('change', () => { if (!store.get()) apply(systemTheme()); });
})();
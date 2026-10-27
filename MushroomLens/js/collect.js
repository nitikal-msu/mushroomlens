/* ============================================================
 * js/collect.js  -  MushroomLens
 * ส่งข้อมูลวิจัยไป Google Sheets (ผ่าน Google Apps Script) เฉพาะเมื่อผู้ใช้ "ติ๊กยินยอม"
 *   - ผลการวิเคราะห์ (+ รูป ถ้ายินยอมเพิ่ม)   - ความคิดเห็น "ผลถูก/ไม่ถูก"
 *   - ชื่อ/อีเมล/เวลาเข้าสู่ระบบ (ไม่ส่งรหัสผ่านเด็ดขาด)
 * ถ้า ENDPOINT ว่าง ไฟล์นี้จะไม่ทำอะไรเลย เว็บทำงานเหมือนเดิม
 * ============================================================ */
(() => {
'use strict';
const ENDPOINT = '';   // วาง URL ของ Web app ลงท้าย /exec (ดูคู่มือ)  ว่าง = ปิดการเก็บข้อมูลทั้งหมด
const TOKEN = '';      // ต้องตรงกับ TOKEN ใน Code.gs
const CONTACT = '';    // อีเมลผู้วิจัยสำหรับถอนความยินยอม/ขอลบข้อมูล (ไม่บังคับ แต่ควรใส่)
const CONSENT_VERSION = 'v1';
const MODEL_ID = 'NjGIhsdRA';
if (!ENDPOINT) return;

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
const device = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
let sid = ls.get('ml_sid'); if (!sid) { sid = uid(); ls.set('ml_sid', sid); }

async function send(data) {
  try {
    const r = await fetch(ENDPOINT, { method: 'POST', body: JSON.stringify(Object.assign({ token: TOKEN }, data)) });
    const j = await r.json().catch(() => ({}));
    if (j && j.ok === false) console.warn('[MushroomLens] เซิร์ฟเวอร์ไม่รับข้อมูล:', j.error);
    return j;
  } catch (e) { console.warn('[MushroomLens] ส่งข้อมูลไม่สำเร็จ', e); }
}
// รหัสผู้ใช้แบบไม่ระบุตัวตนโดยตรง (แฮชจากอีเมล) ใช้เชื่อมตาราง Logins กับ Scans
async function keyOf(email) {
  const s = String(email || '').trim().toLowerCase(); if (!s) return '';
  try { if (crypto.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('').slice(0, 16); } } catch (e) {}
  let h = 5381; for (const ch of s) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0; return 'x' + h.toString(16);
}
const userEmail = () => { try { return (JSON.parse(ls.get('ml_user')) || {}).email || ''; } catch (e) { return ''; } };

/* ---------- ความยินยอมในส่วน Classify ---------- */
let C = { r: false, i: false };
try { const s = JSON.parse(ls.get('ml_consent')); if (s && s.v === CONSENT_VERSION) C = { r: !!s.r, i: !!s.i }; } catch (e) {}
const gw = $('goWrap');
if (gw) {
  const box = document.createElement('div'); box.className = 'consent glass';
  box.innerHTML = `<b>การเก็บข้อมูลเพื่อการวิจัย (ไม่บังคับ)</b>
    <p>MushroomLens เป็นโครงการวิจัย หากคุณยินยอม ระบบจะบันทึกข้อมูลลงฐานข้อมูลของโครงการเพื่อวิเคราะห์ความแม่นยำของโมเดล คุณใช้งานได้ตามปกติแม้ไม่ยินยอม</p>
    <label><input type="checkbox" id="cR"> ยินยอมให้บันทึกผลการวิเคราะห์ (ชื่อที่โมเดลทำนาย ความมั่นใจ วันเวลา ประเภทอุปกรณ์)</label>
    <label><input type="checkbox" id="cI"> ยินยอมให้เก็บรูปภาพที่อัปโหลดไว้ใช้พัฒนาโมเดล</label>
    <small>รูปถูกย่อและตัดข้อมูลในไฟล์ (เช่น พิกัด) ออกก่อนส่ง · กรุณาอย่าถ่ายให้ติดใบหน้าบุคคล · ไม่เก็บรหัสผ่าน${CONTACT ? ' · ขอถอนความยินยอมหรือลบข้อมูลได้ที่ ' + esc(CONTACT) : ''}</small>`;
  gw.parentNode.insertBefore(box, gw);
  const r = $('cR'), i = $('cI'); r.checked = C.r; i.checked = C.i;
  const save = () => { C = { r: r.checked, i: i.checked }; ls.set('ml_consent', JSON.stringify({ v: CONSENT_VERSION, r: C.r, i: C.i })); };
  r.addEventListener('change', () => { if (!r.checked) i.checked = false; save(); });
  i.addEventListener('change', () => { if (i.checked) r.checked = true; save(); });
}

/* ---------- ส่งผลการวิเคราะห์ + แบบสอบถามความถูกต้อง ---------- */
window.addEventListener('ml:result', async ev => {
  if (!C.r && !C.i) return;
  const { preds, url, state } = ev.detail;
  const sorted = [...preds].sort((a, b) => b.probability - a.probability);
  const scanId = uid();
  showFeedback(scanId, sorted.map(p => p.className));
  send({
    action: 'scan', scanId, sid, userKey: await keyOf(userEmail()),
    p: sorted.slice(0, 3).map(x => [x.className, +x.probability.toFixed(4)]),
    state, device, model: MODEL_ID, consentVersion: CONSENT_VERSION, consentImage: C.i,
    image: C.i && url ? url.split(',')[1] : ''
  });
});

function showFeedback(scanId, labels) {
  const res = $('result'); if (!res) return;
  const box = document.createElement('div'); box.className = 'fb glass';
  box.innerHTML = `<b>ผลนี้ถูกต้องไหม? (ช่วยพัฒนาโมเดล)</b>
    <div class="fb-row"><button type="button" class="chip" data-v="ok">ถูกต้อง</button><button type="button" class="chip" data-v="wrong">ไม่ถูกต้อง</button></div>
    <div class="fb-wrong" hidden><select class="inp" aria-label="ชื่อเห็ดที่ถูกต้อง">${labels.map(l => `<option>${esc(l)}</option>`).join('')}<option value="ไม่ใช่เห็ดในรายการ/ไม่ทราบ">ไม่ใช่เห็ดในรายการ / ไม่ทราบ</option></select><button type="button" class="chip" data-v="send">ส่ง</button></div>
    <small hidden>ขอบคุณสำหรับความคิดเห็น</small>`;
  res.insertBefore(box, res.querySelector('.res-foot'));
  const done = () => { box.querySelector('.fb-row').hidden = true; box.querySelector('.fb-wrong').hidden = true; box.querySelector('small').hidden = false; };
  box.addEventListener('click', e => {
    const v = e.target.dataset && e.target.dataset.v; if (!v) return;
    if (v === 'ok') { send({ action: 'feedback', scanId, sid, verdict: 'ถูกต้อง', correct: '' }); done(); }
    else if (v === 'wrong') box.querySelector('.fb-wrong').hidden = false;
    else if (v === 'send') { send({ action: 'feedback', scanId, sid, verdict: 'ไม่ถูกต้อง', correct: box.querySelector('select').value }); done(); }
  });
}

/* ---------- บันทึกการเข้าสู่ระบบ (เมื่อติ๊กยินยอม) ---------- */
const lf = $('lf');
if (lf) {
  const btn = lf.querySelector('button.btn');
  const ck = document.createElement('label'); ck.className = 'ck';
  ck.innerHTML = '<input type="checkbox" id="cLogin"><span>ยินยอมให้บันทึกชื่อ อีเมล และเวลาเข้าสู่ระบบไว้ในฐานข้อมูลของโครงการวิจัย (ไม่บังคับ)</span>';
  if (btn) btn.parentNode.insertBefore(ck, btn);
  const note = lf.querySelector('small');
  if (note) note.textContent = 'หมายเหตุ: เป็นเวอร์ชันสาธิต ยังไม่ยืนยันตัวตนจริง และไม่เก็บรหัสผ่านไม่ว่ากรณีใด ชื่อและอีเมลถูกจำไว้ในเบราว์เซอร์นี้ และจะถูกส่งเข้าฐานข้อมูลวิจัยเฉพาะเมื่อคุณติ๊กยินยอมด้านบน';
  // ใช้ capture เพื่ออ่านค่าก่อนที่โค้ดเดิมจะล้างฟอร์ม
  document.addEventListener('submit', e => {
    if (e.target !== lf || !$('cLogin').checked) return;
    const email = $('lmail').value.trim(), name = $('lname').value.trim(); if (!email) return;
    keyOf(email).then(k => send({ action: 'login', sid, userKey: k, name, email, device, consentVersion: CONSENT_VERSION }));
  }, true);
}
})();
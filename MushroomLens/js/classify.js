/* ============================================================
 * js/classify.js  -  MushroomLens
 * เชื่อมโมเดล Teachable Machine เข้ากับส่วน Classify ใน index.html
 * ขั้นตอน: เลือกรูป -> กด "วิเคราะห์ภาพ" -> โมเดลทำนาย -> แสดงผลแบบการ์ดผลลัพธ์
 * ============================================================ */
(() => {
'use strict';

/* ---------- ตั้งค่า (แก้ตรงนี้ได้) ---------- */
// ลิงก์โมเดลจาก Teachable Machine (ต้องลงท้ายด้วย /)
// ถ้าดาวน์โหลดโมเดลมาไว้ในเครื่อง ให้วาง model.json, metadata.json, weights.bin ไว้ที่ model/ แล้วเปลี่ยนเป็น 'model/'
const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/NjGIhsdRA/';
const CONF_OK  = 0.80;  // มั่นใจตั้งแต่ 80% ขึ้นไป = แสดงผลปกติ
const CONF_MIN = 0.50;  // 50-79% = แสดงผลแต่เตือนว่าความมั่นใจต่ำ, ต่ำกว่า 50% = ระบุชนิดไม่ได้
const MAX_SIDE = 800;   // ย่อรูปให้ด้านยาวไม่เกินกี่พิกเซลก่อนวิเคราะห์
const ALIAS = {};       // จับคู่ชื่อคลาสในโมเดล -> ชื่อในคลังสายพันธุ์ เช่น { 'เห็ดถ่าน': 'เห็ดถ่านใหญ่' }
const INFO  = {};       // ข้อมูลของคลาสที่ไม่มีในคลัง เช่น { 'ชื่อคลาส': { s:'ชื่อวิทยาศาสตร์', c:'safe', d:'ลักษณะเด่น', w:'เห็ดที่ควรระวังสับสน' } }

// ชื่อคลาสในโมเดลที่หมายถึง "ไม่ใช่เห็ดที่รู้จัก" (ขึ้นต้นด้วยคำเหล่านี้) ถ้าโมเดลตอบคลาสนี้ จะแสดงว่า "ระบุชนิดไม่ได้"
const OTHER_CLASS = /^\s*(อื่น|other|unknown|ไม่ใช่|ไม่รู้จัก|none|background|negative)/i;

const CATS = { safe: 'กินได้ หากระบุถูกชนิด', check: 'ต้องตรวจสอบ', toxic: 'มีพิษ' };
const ICON = { safe: 'check_circle', check: 'info', toxic: 'warning' };
const LIBS = [
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js',
  'https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js'
];
const HEIC_LIB = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const loadScript = src => new Promise((ok, no) => {
  const s = document.createElement('script');
  s.src = src; s.onload = ok; s.onerror = () => no(new Error('โหลดไลบรารีไม่สำเร็จ: ' + src));
  document.head.appendChild(s);
});

/* ---------- ข้อมูลสายพันธุ์ (ดึงจากอาร์เรย์ S ใน index.html) ---------- */
const SP = () => { try { return typeof S !== 'undefined' && Array.isArray(S) ? S : []; } catch (e) { return []; } };
const norm = s => String(s || '').replace(/\(.*?\)/g, '').replace(/\s+/g, '').replace(/^เห็ด/, '');

function getSpecies(label) {
  if (INFO[label]) return Object.assign({ n: label }, INFO[label]);
  const list = SP(); if (!list.length) return null;
  const tokens = String(ALIAS[label] || label).split(/[\/,|]/).map(norm).filter(Boolean);
  for (const t of tokens) { const m = list.find(x => norm(x.n) === t); if (m) return m; }
  for (const t of tokens) {                      // จับคู่แบบหลวม ใช้เมื่อเจอชนิดเดียวเท่านั้น กันจับคู่ผิดชนิด
    if (t.length < 3) continue;
    const ms = list.filter(x => { const n = norm(x.n); return n && (n.includes(t) || t.includes(n)); });
    if (ms.length === 1) return ms[0];
  }
  return null;
}

/* ---------- โหลดโมเดล (โหลดครั้งแรกตอนผู้ใช้เลือกรูป) ---------- */
let modelP = null;
function getModel() {
  if (!modelP) {
    modelP = (async () => {
      if (!window.tf) await loadScript(LIBS[0]);
      if (!window.tmImage) await loadScript(LIBS[1]);
      const base = MODEL_URL.endsWith('/') ? MODEL_URL : MODEL_URL + '/';
      const m = await window.tmImage.load(base + 'model.json', base + 'metadata.json');
      try { console.info('[MushroomLens] คลาสในโมเดล:', m.getClassLabels()); } catch (e) {}
      return m;
    })();
    modelP.catch(() => { modelP = null; });
  }
  return modelP;
}

/* ---------- สร้างผลลัพธ์ ---------- */
function stateOf(sorted) {
  const top = sorted[0], p = top.probability;
  if (OTHER_CLASS.test(String(top.className))) return 'unknown';   // โมเดลบอกว่า "ไม่ใช่เห็ดที่รู้จัก"
  return p >= CONF_OK ? 'ok' : p >= CONF_MIN ? 'low' : 'unknown';
}
function build(preds, url) {
  const sorted = [...preds].sort((a, b) => b.probability - a.probability);
  const top = sorted[0], p = top.probability, pct = Math.round(p * 100);
  const state = stateOf(sorted);
  const sp = state === 'unknown' ? null : getSpecies(top.className);
  const isToxic = !!(sp && sp.c === 'toxic');
  const cat = isToxic ? 'toxic' : 'check';   // ผลจาก AI ไม่แสดงสีเขียว/ป้าย "กินได้" เพื่อไม่ชี้นำให้รับประทาน
  const title = state === 'unknown' ? 'ไม่สามารถระบุชนิดได้' : (sp ? sp.n : top.className);
  const badge = state === 'unknown' ? 'ไม่สามารถระบุชนิดได้' : isToxic ? CATS.toxic : state === 'low' ? 'ความมั่นใจต่ำ · ห้ามใช้ตัดสินใจกิน' : 'ผลเบื้องต้น · ต้องให้ผู้เชี่ยวชาญยืนยัน';
  const desc = state === 'unknown'
    ? 'โมเดลมั่นใจต่ำเกินไป ภาพอาจไม่ชัด มุมไม่เหมาะสม หรือเป็นเห็ดชนิดที่โมเดลไม่รู้จัก'
    : (sp && sp.d) || 'ยังไม่มีคำอธิบายลักษณะเด่นของสายพันธุ์นี้ในคลัง';
  const generic = 'เห็ดกินได้หลายชนิดมีเห็ดพิษที่หน้าตาใกล้เคียงกันมาก';
  const warn = state === 'unknown'
    ? 'ผลจำแนกไม่น่าเชื่อถือพอ'
    : (sp && sp.w) || generic;
  const lib = sp && state !== 'unknown' ? ({ safe: 'ข้อมูลในคลัง: มีรายงานว่ากินได้ เฉพาะเมื่อระบุชนิดถูกต้องเท่านั้น', check: 'ข้อมูลในคลัง: ต้องให้ผู้เชี่ยวชาญตรวจสอบก่อน', toxic: 'ข้อมูลในคลัง: เห็ดมีพิษ ห้ามรับประทาน' }[sp.c] || '') : '';
  // ภาพตัวอย่างจากคลัง ให้ผู้ใช้เทียบด้วยตาตัวเอง (ช่วยจับกรณีที่โมเดลทายผิดชัดเจน)
  const ref = sp && sp.i && state !== 'unknown' && typeof thumb === 'function'
    ? `<div class="res-ref glass"><div class="thumb">${thumb(sp)}</div><div class="rr-b"><b>เทียบกับภาพตัวอย่างในคลัง</b><p>ภาพของคุณหน้าตาเหมือนภาพตัวอย่างนี้หรือไม่ ถ้า<u>รูปร่าง สี หรือลักษณะแตกต่างอย่างชัดเจน อย่าเชื่อผลนี้</u></p></div></div>` : '';
  const others = sorted.slice(1, 4).filter(x => x.probability >= 0.01);

  return `
  <button type="button" class="res-back" id="rBack"><span class="ms">arrow_back</span>กลับไปหน้าสแกน</button>
  <div class="res-alert" role="alert"><span class="ms">report</span><div><b>ผลนี้เป็นเพียงการคาดเดาของ AI ไม่ใช่การยืนยันว่ากินได้</b><p>โมเดลรู้จักเฉพาะเห็ดที่ถูกฝึกมา หากเป็นเห็ดชนิดอื่น รวมถึงเห็ดพิษ โมเดลอาจเลือกชนิดที่ใกล้เคียงที่สุดมาตอบ และแสดงความมั่นใจสูงได้ ควรให้ผู้เชี่ยวชาญในท้องถิ่นตรวจสอบทุกครั้งก่อนบริโภค</p></div></div>
  <div class="res-grid">
    <div><div class="res-img"><img src="${url}" alt="ภาพที่อัปโหลด"><span class="res-tag"><span class="ms" style="font-size:16px">image</span>ภาพจากการอัปโหลด</span></div>${ref}</div>
    <div>
      <div class="res-card glass ${cat}">
        <div class="res-top">
          <div><h3>${esc(title)}</h3>${sp && sp.s && state !== 'unknown' ? `<i>${esc(sp.s)}</i>` : ''}${state === 'low' ? '<br><small style="color:var(--warn)">ผลนี้เป็นเพียงความเป็นไปได้</small>' : ''}</div>
          <span class="bdg"><span class="ms" style="font-size:16px">${ICON[cat]}</span>${esc(badge)}</span>
        </div>
        <hr>
        <div class="res-conf"><span>ความมั่นใจของโมเดล</span><b>${pct}%</b></div>
        <div class="res-bar"><div style="width:${pct}%"></div></div>
        <h4>ลักษณะเด่น</h4><p>${esc(desc)}</p>
        ${lib ? `<p class="res-lib">${esc(lib)}</p>` : ''}
        ${sp && sp.r && state !== 'unknown' ? `<p style="margin-top:8px"><span class="ms" style="font-size:16px">location_on</span> พบใน: ${esc(sp.r)}</p>` : ''}
      </div>
      <div class="res-warn">
        <h4><span class="ms">warning</span>${state === 'unknown' ? 'คำเตือน' : 'ระวังเห็ดที่มีลักษณะคล้าย'}</h4>
        <p>${esc(warn)} หากไม่แน่ใจ <u>ห้ามรับประทานเด็ดขาด</u></p>
      </div>
      ${others.length ? `<div class="res-others glass"><h4>ผลลำดับถัดไป</h4><ul>${others.map(o => `<li><span>${esc(o.className)}</span><b>${Math.round(o.probability * 100)}%</b></li>`).join('')}</ul></div>` : ''}
    </div>
  </div>
  <div class="res-foot"><span>ข้อมูลอ้างอิง: โมเดลจำแนกภาพ (Teachable Machine) ฝึกจากชุดข้อมูลภาพเห็ดป่าไทยของโครงการ MushroomLens</span></div>`;
}

/* ---------- ส่วนควบคุมหน้าจอ ---------- */
const el = { drop: $('drop'), file: $('file'), prev: $('prev'), go: $('go'), goWrap: $('goWrap'), out: $('out'), outt: $('outt'), result: $('result') };
if (el.drop && el.file && el.go && el.result) {
  let current = null;

  const msg = (text, kind) => {
    el.out.hidden = false; el.outt.textContent = text;
    const ic = el.out.querySelector('.ms'); if (ic) ic.textContent = kind === 'error' ? 'error' : kind === 'wait' ? 'hourglass_top' : 'info';
  };
  const hideMsg = () => { el.out.hidden = true; };

  const loadImg = blob => new Promise((ok, no) => {
    const u = URL.createObjectURL(blob), im = new Image();
    im.onload = () => { URL.revokeObjectURL(u); ok(im); };
    im.onerror = () => { URL.revokeObjectURL(u); no(new Error('อ่านรูปไม่ได้')); };
    im.src = u;
  });
  async function heicToJpg(file) {
    if (!window.heic2any) await loadScript(HEIC_LIB);
    const o = await window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
    return Array.isArray(o) ? o[0] : o;
  }

  async function prepare(file) {
    const heic = /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
    let img;
    try { img = await loadImg(file); }
    catch (e) {
      if (!heic) throw e;
      msg('กำลังแปลงไฟล์ HEIC เป็น JPG...', 'wait');
      img = await loadImg(await heicToJpg(file));
    }
    const k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
    return { canvas: c, url: c.toDataURL('image/jpeg', 0.9) };
  }

  async function onFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/') && !/\.hei[cf]$/i.test(file.name)) { msg('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG)', 'error'); return; }
    el.go.disabled = true;
    try {
      current = await prepare(file);
      el.prev.src = current.url; el.prev.hidden = false; el.go.disabled = false;
      msg('เคล็ดลับ: ให้เห็ดอยู่กลางภาพและเห็นชัด เพราะโมเดลจะวิเคราะห์ส่วนกลางของภาพ', 'info');
      getModel().catch(() => {});   // เริ่มโหลดโมเดลล่วงหน้า
    } catch (e) {
      console.error(e); current = null;
      msg('เปิดรูปนี้ไม่ได้ ลองใช้ไฟล์ JPG หรือ PNG', 'error');
    }
  }

  el.file.addEventListener('change', () => onFile(el.file.files[0]));
  el.drop.addEventListener('dragover', e => { e.preventDefault(); el.drop.classList.add('over'); });
  el.drop.addEventListener('dragleave', () => el.drop.classList.remove('over'));
  el.drop.addEventListener('drop', e => { e.preventDefault(); el.drop.classList.remove('over'); onFile(e.dataTransfer.files[0]); });

  el.go.addEventListener('click', async () => {
    if (!current) return;
    el.go.disabled = true; msg('กำลังวิเคราะห์ภาพ... (ครั้งแรกอาจใช้เวลาโหลดโมเดลสักครู่)', 'wait');
    try {
      const model = await getModel();
      const preds = await model.predict(current.canvas);
      el.result.innerHTML = build(preds, current.url);
      hideMsg(); el.result.hidden = false; el.drop.hidden = true; el.goWrap.hidden = true;
      $('rBack').addEventListener('click', reset);
      el.result.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // แจ้งส่วนเก็บข้อมูลวิจัย (js/collect.js) ว่ามีผลใหม่
      window.dispatchEvent(new CustomEvent('ml:result', { detail: { preds, url: current.url, state: stateOf([...preds].sort((a, b) => b.probability - a.probability)) } }));
    } catch (e) {
      console.error(e);
      msg('วิเคราะห์ไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่ (ดูรายละเอียดที่ Console กด F12)', 'error');
    } finally { el.go.disabled = !current; }
  });

  function reset() {
    el.result.hidden = true; el.result.innerHTML = '';
    el.drop.hidden = false; el.goWrap.hidden = false;
    el.file.value = ''; el.prev.hidden = true; el.prev.removeAttribute('src'); el.go.disabled = true; current = null; hideMsg();
    const sec = $('classify'); if (sec) sec.scrollIntoView({ behavior: 'smooth' });
  }
}

window.MLClassify = { getSpecies, build };   // ใช้ทดสอบใน Console
})();
/* ============================================================
 * js/stats.js  -  MushroomLens
 * ทำให้แถบสถิติ 3 การ์ด (15 สายพันธุ์ / 511 ภาพ / ความเสี่ยงสูง) ใช้งานได้จริง:
 *  - ตัวเลขนับขึ้นเมื่อเลื่อนมาถึง   - แสงตามเมาส์บนการ์ด
 *  - กดการ์ดแล้วมีแผงรายละเอียดเปิดด้านล่าง พร้อมปุ่มลิงก์ไปส่วนที่เกี่ยวข้อง
 * ไม่แก้ HTML เดิม และไม่พังถ้าหาการ์ดไม่เจอ
 * ============================================================ */
(() => {
'use strict';
const wrap = document.querySelector('.stats');
const cards = wrap ? [...wrap.querySelectorAll('.stat')] : [];
if (cards.length < 3) return;
const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const SP = () => { try { return typeof S !== 'undefined' && Array.isArray(S) ? S : []; } catch (e) { return []; } };
const num = c => +(c.querySelector('b[data-n]') || {}).dataset?.n || 0;

/* ---------- เนื้อหาแผงรายละเอียด (ตัวเลขดึงจากข้อมูลจริงในหน้า) ---------- */
function panel(i) {
  const list = SP(), cnt = k => list.filter(x => x.c === k).length;
  const species = num(cards[0]), photos = num(cards[1]);
  if (i === 0) return {
    icon: 'library_books', title: `${species} สายพันธุ์ในชุดข้อมูลฝึกโมเดล`,
    body: `โมเดล AI ถูกฝึกจากภาพเห็ดที่ผู้เชี่ยวชาญยืนยันว่ากินได้ ${species} สายพันธุ์` +
      (list.length ? ` ส่วนคลังสายพันธุ์ในเว็บนี้มี ${list.length} ชนิด (กินได้ ${cnt('safe')} · ต้องตรวจสอบ ${cnt('check')} · มีพิษ ${cnt('toxic')}) ไว้แสดงข้อมูลและเตือนภัย` : ''),
    links: [['#species', 'ดูคลังสายพันธุ์', 'park']]
  };
  if (i === 1) return {
    icon: 'photo_library', title: `${photos} ภาพถ่ายจริง`,
    body: `ภาพเห็ดที่ถ่ายในสภาพแวดล้อมจริง ผ่านการตรวจสอบก่อนนำไปฝึกโมเดล` + (species ? ` เฉลี่ยประมาณ ${Math.round(photos / species)} ภาพต่อสายพันธุ์` : ''),
    links: [['#verify', 'ดูขั้นตอนตรวจสอบข้อมูล', 'verified'], ['#research', 'ดูโครงสร้างงานวิจัย', 'science']]
  };
  return {
    icon: 'warning', title: 'ทำไมจึงเป็นความเสี่ยงสูง',
    body: 'เห็ดพิษหลายชนิดมีหน้าตาใกล้เคียงกับเห็ดกินได้มาก และโมเดลนี้ฝึกจากเห็ดกินได้เท่านั้น จึงไม่รู้จักเห็ดพิษ หากไม่แน่ใจ ห้ามรับประทานเด็ดขาด และควรให้ผู้เชี่ยวชาญในท้องถิ่นตรวจสอบทุกครั้ง',
    links: [['#lookalike', 'ดูคู่เห็ดที่สับสนบ่อย', 'compare_arrows']], bad: true
  };
}

/* ---------- แผงรายละเอียด ---------- */
const drawer = document.createElement('div');
drawer.className = 'stat-drawer glass'; drawer.id = 'statDrawer'; drawer.hidden = true;
drawer.setAttribute('aria-live', 'polite');
wrap.insertAdjacentElement('afterend', drawer);
let open = -1;

function show(i) {
  cards.forEach((c, k) => { c.classList.toggle('on', k === i); c.setAttribute('aria-expanded', k === i ? 'true' : 'false'); });
  if (i < 0) { drawer.hidden = true; open = -1; return; }
  const p = panel(i);
  drawer.className = 'stat-drawer glass' + (p.bad ? ' bad' : '');
  drawer.innerHTML = `<span class="ms sd-ic">${p.icon}</span><div><h3>${p.title}</h3><p>${p.body}</p>
    <div class="sd-links">${p.links.map(l => `<a class="btn ghost" href="${l[0]}"><span class="ms">${l[2]}</span>${l[1]}</a>`).join('')}</div></div>`;
  drawer.hidden = false; open = i;
}

cards.forEach((c, i) => {
  c.setAttribute('role', 'button'); c.tabIndex = 0; c.setAttribute('aria-expanded', 'false'); c.setAttribute('aria-controls', 'statDrawer');
  c.insertAdjacentHTML('beforeend', '<span class="stat-hint">ดูรายละเอียด<span class="ms">expand_more</span></span>');
  c.addEventListener('click', () => show(open === i ? -1 : i));
  c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(open === i ? -1 : i); } });
  c.addEventListener('pointermove', e => {          // แสงตามเมาส์
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && open >= 0) show(-1); });

/* ---------- นับตัวเลขขึ้นเมื่อเลื่อนมาถึง ---------- */
function countUp(el, to) {
  const t0 = performance.now(), dur = 1300;
  const step = t => {
    const k = Math.min(1, (t - t0) / dur);
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const nums = cards.map(c => c.querySelector('b[data-n]')).filter(Boolean);
if (!reduce && 'IntersectionObserver' in window && nums.length) {
  nums.forEach(n => { n.textContent = '0'; });
  const io = new IntersectionObserver(es => {
    if (es.some(e => e.isIntersecting)) { nums.forEach(n => countUp(n, +n.dataset.n)); io.disconnect(); }
  }, { threshold: 0.4 });
  io.observe(wrap);
}
})();
const passages = [
  'The quick brown fox jumps over the lazy dog. Swift typing wins the race!',
  'SnarkyType is for the bold — type fast, stay snarky, and have fun.',
  'Practice a little each day and watch your speed and accuracy climb.',
  'Tiny sparks of focus lead to fast, fluid typing. Keep going!'
];

const typingContent = document.getElementById('typingContent');
const caret = document.getElementById('caret');
const hiddenInput = document.getElementById('hiddenInput');
const wpmDisplay = document.querySelector('#wpm span');
const accDisplay = document.querySelector('#accuracy span');
const timerDisplay = document.querySelector('#timer span');
const resetBtn = document.getElementById('resetBtn');
const randomBtn = document.getElementById('randomBtn');
const startTestBtn = document.getElementById('startTestBtn');
const focusBtn = document.getElementById('focusBtn');

let current = '';
let chars = [];
let pos = 0;
let correct = 0;
let startedAt = null;
let timerInterval = null;
let isTyping = false;
let roasts = [];

// load snarky roasts
fetch('roasts.json').then(r=>r.json()).then(arr=>{ roasts = arr || []; }).catch(()=>{ roasts = ["You're a legend. No roast available."]; });

function pickPassage() {
  return passages[Math.floor(Math.random()*passages.length)];
}

function render(text) {
  typingContent.innerHTML = '';
  chars = text.split('').map((ch, i) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = ch;
    typingContent.appendChild(span);
    return span;
  });
  pos = 0; correct = 0; updateStats(); placeCaretAt(0);
  // reset caret state
  caret.classList.remove('typing');
  caret.classList.add('idle');
}

function placeCaretAt(index) {
  // if no chars, hide caret
  if (chars.length === 0) return;
  const idx = Math.min(index, chars.length-1);
  const span = chars[idx];
  // compute position relative to the positioned ancestor (canvasContainer)
  // typingContent is inside canvasContainer and canvasContainer is position:relative
  const left = (typingContent.offsetLeft || 0) + (span.offsetLeft || 0);
  const top = (typingContent.offsetTop || 0) + (span.offsetTop || 0);
  const height = span.offsetHeight || parseFloat(getComputedStyle(span).lineHeight) || 24;
  caret.style.left = `${Math.max(0, left)}px`;
  caret.style.top = `${Math.max(0, top)}px`;
  caret.style.height = `${height}px`;
}

function updateStats() {
  const secs = startedAt ? Math.max(1, Math.floor((Date.now()-startedAt)/1000)) : 0;
  const minutes = Math.max(1/60, secs/60);
  const wpm = startedAt ? Math.round((correct/5)/minutes) : 0;
  const accuracy = pos===0?100:Math.max(0, Math.round((correct/pos)*100));
  wpmDisplay.textContent = wpm;
  accDisplay.textContent = accuracy + '%';
  timerDisplay.textContent = secs + 's';
}

function startTimerIfNeeded() {
  if (!startedAt) {
    startedAt = Date.now();
    timerInterval = setInterval(updateStats, 800);
  }
}

function reset() {
  clearInterval(timerInterval); timerInterval = null; startedAt = null;
  // hide results and re-enable input
  const rp = document.getElementById('resultPanel'); if (rp) rp.hidden = true;
  hiddenInput.disabled = false;
  render(pickPassage());
}

// Use a hidden input to open mobile keyboard and reliably capture input
typingContent.addEventListener('click', (e)=>{
  hiddenInput.focus({preventScroll:true});
});

// input handler for character input
hiddenInput.addEventListener('input', (e)=>{
  const val = hiddenInput.value;
  if (!val) return;
  // take the last character typed
  const ch = val[val.length-1];
  hiddenInput.value = '';
  startTimerIfNeeded();
  isTyping = true; caret.classList.add('typing'); caret.classList.remove('idle');
  const expected = chars[pos] ? chars[pos].textContent : '';
  if (ch === expected) {
    chars[pos].classList.add('correct'); correct++;
  } else {
    if (chars[pos]) chars[pos].classList.add('incorrect');
  }
  pos++;
  placeCaretAt(Math.min(pos, chars.length-1));
  updateStats();
  // finish test when we've typed all characters
  if (pos >= chars.length) {
    finishTest();
  }
  // small delay to mark stopped typing
  clearTimeout(window.__typingTimer);
  window.__typingTimer = setTimeout(()=>{
    isTyping = false; caret.classList.remove('typing'); caret.classList.add('idle');
  }, 800);
});

// backspace and other keys
hiddenInput.addEventListener('keydown', (e)=>{
  if (e.key === 'Backspace') {
    e.preventDefault();
    if (pos>0) {
      pos--; if (chars[pos]) chars[pos].classList.remove('correct','incorrect');
      placeCaretAt(Math.min(pos, chars.length-1));
      updateStats();
    }
  } else if (e.key === 'Escape') {
    reset();
  }
});

resetBtn.addEventListener('click', reset);
randomBtn.addEventListener('click', ()=>{ render(pickPassage()); startedAt=null; clearInterval(timerInterval); timerInterval=null; updateStats(); caret.classList.add('idle'); caret.classList.remove('typing'); const rp = document.getElementById('resultPanel'); if (rp) rp.hidden = true; hiddenInput.disabled = false; });
startTestBtn.addEventListener('click', ()=>{ document.body.classList.add('testing-mode'); window.scrollTo({top: document.getElementById('demoSection').offsetTop - 20, behavior:'smooth'}); });

// focus button to trigger mobile keyboard (focus hidden input)
if (focusBtn) {
  focusBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    // attempt to focus the hidden input to trigger mobile keyboard
    try { hiddenInput.focus({preventScroll:true}); } catch(err){ hiddenInput.focus(); }
    // small UX nudge: briefly ensure caret follows
    setTimeout(()=> placeCaretAt(pos), 60);
  });
}

// Finish test, show results and a random roast
function finishTest(){
  if (timerInterval) clearInterval(timerInterval);
  // compute final stats
  const secs = startedAt ? Math.max(1, Math.floor((Date.now()-startedAt)/1000)) : 0;
  const minutes = Math.max(1/60, secs/60);
  const wpm = startedAt ? Math.round((correct/5)/minutes) : 0;
  const accuracy = pos===0?100:Math.max(0, Math.round((correct/pos)*100));

  // populate results
  const rp = document.getElementById('resultPanel');
  if (rp){
    document.getElementById('resultWpm').textContent = wpm;
    document.getElementById('resultAcc').textContent = accuracy + '%';
    document.getElementById('resultTime').textContent = secs + 's';
    const roast = (roasts && roasts.length) ? roasts[Math.floor(Math.random()*roasts.length)] : "Nicely done (no roast available).";
    document.getElementById('resultRoast').textContent = roast;
    rp.hidden = false;
  }

  // disable input to avoid extra keystrokes
  hiddenInput.disabled = true;
  caret.classList.remove('typing'); caret.classList.add('idle');
}

// result actions
document.addEventListener('click', (e)=>{
  if (e.target && e.target.id === 'retryBtn'){
    // enable and reset
    hiddenInput.disabled = false;
    document.getElementById('resultPanel').hidden = true;
    render(pickPassage()); startedAt=null; clearInterval(timerInterval); timerInterval=null; updateStats();
    hiddenInput.focus({preventScroll:true});
  } else if (e.target && e.target.id === 'closeResults'){
    const rp = document.getElementById('resultPanel'); if (rp) rp.hidden = true; hiddenInput.disabled = false;
  }
});

// Initialize
render(pickPassage());

// keep caret following on window resize
window.addEventListener('resize', ()=> placeCaretAt(pos));

// Lenis smooth scroll and scroll-driven reveal
if (window.Lenis) {
  const lenis = new Lenis({ duration: 1.2, smooth: true });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
}

// Intersection observer for reveal
const sections = document.querySelectorAll('.section');
const obs = new IntersectionObserver((entries)=>{
  entries.forEach(en=>{ if (en.isIntersecting) en.target.classList.add('in-view'); });
}, {threshold:0.18});
sections.forEach(s=>obs.observe(s));

// Countdown to Jan 31
function updateCountdown(){
  const target = new Date(new Date().getFullYear(), 0, 31, 0, 0, 0); // Jan 31 current year
  const now = new Date();
  // if passed, keep next year
  if (now > target) target.setFullYear(target.getFullYear()+1);
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000*60*60*24));
  const hours = Math.floor((diff%(1000*60*60*24))/(1000*60*60));
  const mins = Math.floor((diff%(1000*60*60))/(1000*60));
  const secs = Math.floor((diff%(1000*60))/1000);
  const el = document.getElementById('countdownValue');
  if (el) el.textContent = `${days}d ${hours}h ${mins}m ${secs}s`;
}
setInterval(updateCountdown, 1000); updateCountdown();

/* ---------- Scroll-driven animations & parallax ---------- */
const scrollSections = document.querySelectorAll('.section');
let ticking = false;
function onScrollUpdate(scrollY){
  const docH = document.body.scrollHeight - window.innerHeight || 1;
  const pct = Math.min(1, Math.max(0, scrollY / docH));
  // update background position for subtle gradient move
  document.documentElement.style.setProperty('--bg-pos', `${Math.round(pct * 80 + 10)}%`);

  scrollSections.forEach(sec => {
    const rect = sec.getBoundingClientRect();
    const progress = 1 - Math.min(1, Math.max(0, rect.top / window.innerHeight));
    sec.style.setProperty('--progress', progress);
    // parallax children
    sec.querySelectorAll('.parallax').forEach(el=>{
      const speed = parseFloat(el.dataset.speed || 0.12);
      const t = -rect.top * speed;
      el.style.transform = `translateY(${t.toFixed(2)}px)`;
      el.style.willChange = 'transform';
    });
  });
}

function handleScroll(){
  if(!ticking){
    ticking = true;
    requestAnimationFrame(()=>{
      const s = window.scrollY || document.documentElement.scrollTop || 0;
      onScrollUpdate(s);
      ticking = false;
    });
  }
}

// Hook into Lenis if present for smooth-scroll events; fallback to native
if (window.Lenis && typeof Lenis === 'function') {
  // if Lenis instance created earlier, it will call raf; attach a scroll listener to window as well
  // ensure we still run our update loop
  window.addEventListener('scroll', handleScroll, {passive:true});
  // run once to prime positions
  handleScroll();
} else {
  window.addEventListener('scroll', handleScroll, {passive:true});
  handleScroll();
}

// Also update on resize
window.addEventListener('resize', handleScroll);

/* ---------- Canvas sparks particle system ---------- */
(function(){
  const canvas = document.getElementById('sparkCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, DPR = Math.max(1, window.devicePixelRatio || 1);
  let particles = [];
  const colors = ['6,182,212','96,165,250','14,165,201'];

  function resize(){
    w = window.innerWidth;
    h = window.innerHeight;
    DPR = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    // recreate particles for new size
    make();
  }

  function make(){
    // density based on area, capped
    const area = Math.max(1, w * h);
    const count = Math.max(40, Math.min(160, Math.round(area / 90000)));
    particles = [];
    for(let i=0;i<count;i++){
      particles.push({
        x: Math.random()*w,
        y: Math.random()*h,
        vx: (Math.random()-0.5)*0.12,
        vy: (Math.random()-0.5)*0.12,
        r: Math.random()*0.8+0.4,
        life: Math.random()*300+120,
        ttl: 0,
        c: colors[Math.floor(Math.random()*colors.length)]
      });
    }
  }

  let mouse = {x: w/2, y: h/2, down:false};
  window.addEventListener('mousemove', e=>{ mouse.x = e.clientX; mouse.y = e.clientY; });

  function step(){
    ctx.clearRect(0,0,w,h);
    // subtle easing towards mouse to create interaction
    particles.forEach(p=>{
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx*dx + dy*dy) + 0.001;
      // soft attraction but tiny magnitude for aesthetics
      const force = Math.min(0.08, 250 / (dist*dist));
      p.vx += (dx / dist) * force * 0.0008;
      p.vy += (dy / dist) * force * 0.0008;

      // gentle drift and damping
      p.vx *= 0.994; p.vy *= 0.994;
      p.x += p.vx; p.y += p.vy;

      // wrap-around
      if(p.x < -10) p.x = w + 10;
      if(p.x > w + 10) p.x = -10;
      if(p.y < -10) p.y = h + 10;
      if(p.y > h + 10) p.y = -10;

      // fade in/out subtly with ttl
      p.ttl += 1;
      const alpha = Math.max(0.03, Math.sin((p.ttl / p.life) * Math.PI) * 0.55);

      ctx.beginPath();
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r*6);
      g.addColorStop(0, `rgba(${p.c}, ${alpha})`);
      g.addColorStop(1, 'rgba(6,20,36,0)');
      ctx.fillStyle = g;
      ctx.arc(p.x, p.y, p.r*4, 0, Math.PI*2);
      ctx.fill();
    });

    requestAnimationFrame(step);
  }

  // repulse particles from text bounding boxes for subtle interaction
  function applyTextRepulsion(){
    const avoid = Array.from(document.querySelectorAll('.creator-card, .testers-grid, .hero-left, .demo-inner, .container'));
    const boxes = avoid.map(el=>el.getBoundingClientRect());
    particles.forEach(p=>{
      boxes.forEach(b=>{
        const bx = b.left + b.width/2;
        const by = b.top + b.height/2;
        const dx = p.x - bx; const dy = p.y - by; const dist = Math.sqrt(dx*dx+dy*dy)+0.001;
        if(dist < Math.max(b.width,b.height)*0.6){
          const push = (Math.max(b.width,b.height)*0.6 - dist) * 0.002;
          p.vx += (dx/dist) * push;
          p.vy += (dy/dist) * push;
        }
      });
    });
  }

  // init
  resize(); make();
  window.addEventListener('resize', ()=>{ resize(); });
  // call text repulsion occasionally
  setInterval(applyTextRepulsion, 400);
  requestAnimationFrame(step);
})();



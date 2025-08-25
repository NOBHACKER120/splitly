// survey-bot.js - Advanced external form-filling bot (injectable)
// Usage:
// 1) Host file and use bookmarklet to inject, or
// 2) Paste into Console on the target page, then use the UI that appears at top-right.
// Do not use on pages you do not own or have permission to automate.

(function(){
  if(window.__SURVEY_BOT_INJECTED) { console.warn('Survey bot already injected'); return; }
  window.__SURVEY_BOT_INJECTED = true;

  // ---------- Minimal CSS ----------
  const css = `
  #sb_inject_ui{position:fixed; right:12px; top:12px; width:360px; z-index:2147483647; font-family:Inter,Arial,sans-serif;}
  #sb_inject_ui .panel{background:#fff;border-radius:10px;padding:10px;border:1px solid rgba(0,0,0,0.06);box-shadow:0 6px 24px rgba(2,6,23,0.12);}
  #sb_inject_ui h4{margin:0 0 8px 0;font-size:14px;}
  #sb_inject_ui .row{display:flex;gap:8px;margin-bottom:8px;}
  #sb_inject_ui input[type="text"], #sb_inject_ui select, #sb_inject_ui input[type="number"]{padding:6px 8px;border-radius:6px;border:1px solid #e6e9ef;width:100%;}
  #sb_inject_ui button{padding:8px 10px;border-radius:7px;border:0;cursor:pointer;background:#2563eb;color:#fff;font-weight:700;}
  #sb_inject_ui .ghost{background:transparent;color:#2563eb;border:1px solid rgba(37,99,235,0.12);}
  #sb_inject_ui .log{height:140px;overflow:auto;background:#071225;color:#9ee7ff;padding:8px;border-radius:6px;font-family:monospace;font-size:12px;}
  #sb_inject_ui label{font-size:12px;color:#334155;display:block;margin-bottom:4px;}
  #sb_inject_ui .rule{display:flex;gap:6px;align-items:center;margin-bottom:6px;}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ---------- Panel HTML ----------
  const panel = document.createElement('div');
  panel.id = 'sb_inject_ui';
  panel.innerHTML = `
  <div class="panel">
    <h4>Survey Bot (external)</h4>
    <div style="font-size:12px;color:#6b7280;margin-bottom:8px">Rules & controls (domain-local storage)</div>

    <div class="row">
      <input id="sb_match" type="text" placeholder="match token (e.g. city, name)">
      <select id="sb_action"><option value="fixed">Fixed</option><option value="random">Random list</option><option value="random_good">Random (good)</option><option value="today">Today</option><option value="skip">Skip</option></select>
    </div>
    <div class="row"><input id="sb_value" type="text" placeholder="value or comma list"></div>
    <div style="display:flex;gap:6px;margin-bottom:8px;"><button id="sb_add">Add Rule</button><button id="sb_start" class="ghost">Start</button><button id="sb_stop" class="ghost">Stop</button></div>

    <div style="display:flex;gap:6px;margin-bottom:8px;">
      <label style="flex:1"><input id="sb_autosubmit" type="checkbox"> Auto-submit</label>
      <input id="sb_speed" type="number" value="35" style="width:90px" title="ms per char">
    </div>
    <div style="margin-bottom:8px;">
      <div style="font-weight:700;font-size:12px;margin-bottom:4px">Rules</div>
      <div id="sb_rules" style="max-height:90px;overflow:auto;border:1px solid #eef2f8;padding:6px;border-radius:6px"></div>
    </div>
    <div style="margin-bottom:8px;">
      <div style="font-weight:700;font-size:12px;margin-bottom:4px">Action log</div>
      <div class="log" id="sb_log"></div>
    </div>

    <div style="display:flex;gap:8px;">
      <button id="sb_preview" class="ghost">Preview</button>
      <button id="sb_clearlog" class="ghost">Clear log</button>
    </div>
  </div>
  `;
  document.body.appendChild(panel);

  // ---------- State ----------
  const LOG = document.getElementById('sb_log');
  const RULES_BOX = document.getElementById('sb_rules');
  let rules = []; // {id, match, action, value}
  const RULES_KEY = 'survey_bot_rules_' + location.hostname;
  const ANSWERS_KEY = 'survey_bot_answers_' + location.hostname;

  // ---------- Utilities ----------
  function log(msg){
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    const d = document.createElement('div'); d.textContent = line;
    LOG.appendChild(d); LOG.scrollTop = LOG.scrollHeight;
    console.log('[survey-bot]', msg);
  }
  function saveRules(){ localStorage.setItem(RULES_KEY, JSON.stringify(rules)); }
  function loadRules(){ try{ rules = JSON.parse(localStorage.getItem(RULES_KEY)) || []; }catch(e){ rules = []; } renderRules(); }
  function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
  function randomChoice(arr){ if(!arr||arr.length===0) return null; return arr[Math.floor(Math.random()*arr.length)]; }
  function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }
  function id(){ return 'r_' + Math.random().toString(36).slice(2,9); }

  // ---------- UI wiring ----------
  const matchInput = document.getElementById('sb_match');
  const actionSelect = document.getElementById('sb_action');
  const valueInput = document.getElementById('sb_value');
  const addBtn = document.getElementById('sb_add');
  const startBtn = document.getElementById('sb_start');
  const stopBtn = document.getElementById('sb_stop');
  const autosubmitChk = document.getElementById('sb_autosubmit');
  const speedInput = document.getElementById('sb_speed');
  const previewBtn = document.getElementById('sb_preview');
  const clearLogBtn = document.getElementById('sb_clearlog');

  addBtn.addEventListener('click', ()=>{
    const m = matchInput.value.trim();
    if(!m){ alert('Enter match token first'); return; }
    rules.push({ id: id(), match: m, action: actionSelect.value, value: valueInput.value.trim() });
    matchInput.value = ''; valueInput.value = '';
    renderRules(); saveRules(); log('Added rule: '+m);
  });

  clearLogBtn.addEventListener('click', ()=>{ LOG.innerHTML=''; });

  function renderRules(){
    RULES_BOX.innerHTML = '';
    for(const r of rules){
      const row = document.createElement('div'); row.className='rule';
      row.innerHTML = `<div style="flex:1; font-size:13px">${escapeHtml(r.match)} → <strong>${escapeHtml(r.action)}</strong> ${r.value?('('+escapeHtml(r.value)+')'):''}</div><button data-id="${r.id}" style="background:#ef4444;color:white;border:0;padding:6px;border-radius:6px">X</button>`;
      RULES_BOX.appendChild(row);
      row.querySelector('button').addEventListener('click', ()=>{ rules = rules.filter(x=>x.id!==r.id); renderRules(); saveRules(); });
    }
  }

  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }

  // ---------- smart generators ----------
  const fallbackNames = ['Aman Kumar','Priya Sharma','Rohit Singh','Anika Patel','Sana Khan','Aditya Mehta'];
  const fallbackCities = ['Mumbai','Delhi','Bengaluru','Chennai','Pune','Hyderabad'];
  function genName(){ return randomChoice(fallbackNames); }
  function genEmailFromName(name){ return name.toLowerCase().replace(/\s+/g,'.') + randInt(1,999) + '@example.com'; }
  // random-good generator: pick plausible values for field label
  function genGoodAnswerForLabel(label){
    label = (label||'').toLowerCase();
    if(label.includes('name')) return genName();
    if(label.includes('email')) return genEmailFromName(genName());
    if(label.includes('city')) return randomChoice(fallbackCities);
    if(label.includes('age')) return String(randInt(18,45));
    if(label.includes('phone')||label.includes('mobile')) return '+91' + (9000000000 + randInt(0,999999999)).toString().slice(1);
    if(label.includes('date')) return new Date().toISOString().slice(0,10);
    if(label.includes('rating')||label.includes('satisf')) return String(randInt(3,5));
    if(label.includes('brand')) return randomChoice(['Nike','Adidas','Puma','Reebok']);
    if(label.includes('comment')||label.includes('suggest')) return 'No suggestions — works well!';
    return 'Sample answer';
  }

  // fetch RandomUser for rich data (optional)
  async function fetchRandomUser(){
    try{
      const r = await fetch('https://randomuser.me/api/?nat=in,us&inc=name,email,phone', {cache:'no-store'});
      if(!r.ok) throw new Error('randomuser failed');
      const j = await r.json();
      const u = j.results[0];
      return {name: u.name.first + ' ' + u.name.last, email: u.email, phone: u.phone};
    } catch(e){
      log('RandomUser fetch failed — using fallback data');
      return null;
    }
  }

  // ---------- Matching rule finder ----------
  function findRuleForField(field){
    const name = (field.name||'').toLowerCase();
    const id = (field.id||'').toLowerCase();
    const label = (getLabelText(field)||'').toLowerCase();
    for(const r of rules){
      const t = (r.match||'').toLowerCase();
      if(!t) continue;
      if(name.includes(t) || id.includes(t) || label.includes(t)) return r;
    }
    return null;
  }

  // get label text for a field (best-effort)
  function getLabelText(field){
    if(!field) return '';
    if(field.id){
      const lbl = document.querySelector('label[for="'+field.id+'"]');
      if(lbl) return lbl.textContent.trim();
    }
    // try parent label
    const p = field.closest('label');
    if(p) return p.textContent.trim();
    // try previous sibling label
    const prev = field.previousElementSibling;
    if(prev && prev.tagName && prev.tagName.toLowerCase()==='label') return prev.textContent.trim();
    // try nearest label in ancestor
    const ancestor = field.closest('div, section, form');
    if(ancestor){
      const lbl = ancestor.querySelector('label');
      if(lbl) return lbl.textContent.trim();
    }
    return '';
  }

  // data persistence across pages (domain-scoped)
  function loadAnswers(){
    try{ return JSON.parse(localStorage.getItem(ANSWERS_KEY) || '{}'); } catch(e){ return {}; }
  }
  function saveAnswers(ans){ localStorage.setItem(ANSWERS_KEY, JSON.stringify(ans || {})); }

  // ---------- field fillers (core) ----------
  async function fillField(field, options){
    const label = getLabelText(field) || field.name || field.id || field.type || 'field';
    const rule = findRuleForField(field);
    // attempt to use network data for realism
    let remoteUser = null;
    try { remoteUser = await fetchRandomUser(); } catch(e){ remoteUser = null; }

    // helper to dispatch events so frameworks pick changes
    function dispatchInputEvents(el){
      el.dispatchEvent(new Event('input', {bubbles:true}));
      el.dispatchEvent(new Event('change', {bubbles:true}));
      el.dispatchEvent(new Event('blur', {bubbles:true}));
    }

    // typing simulation function
    async function typeInto(el, text){
      el.focus();
      el.value = '';
      for(const ch of text){
        el.value += ch;
        dispatchInputEvents(el);
        await sleep(Number(speedInput.value || 35) + randInt(-10, 40));
      }
      el.blur();
    }

    // --------- text inputs ---------
    if(field.tagName.toLowerCase() === 'input' && ['text','email','number','tel'].includes(field.type)){
      let final = '';
      if(rule){
        if(rule.action === 'fixed'){ final = rule.value; }
        else if(rule.action === 'random'){ final = randomChoice((rule.value || '').split(',').map(s=>s.trim()).filter(Boolean)) || genGoodAnswerForLabel(label); }
        else if(rule.action === 'random_good'){ final = genGoodAnswerForLabel(label); }
        else if(rule.action === 'today'){ final = new Date().toISOString().slice(0,10); }
        else if(rule.action === 'skip'){ log(`Skipping ${label}`); return null; }
      } else {
        // heuristics: use remote data when available
        if(field.type === 'email' && remoteUser) final = remoteUser.email;
        else if(field.type === 'tel' && remoteUser) final = remoteUser.phone;
        else final = genGoodAnswerForLabel(label);
      }

      await typeInto(field, final);
      log(`Filled text "${label}" -> ${final}`);
      return final;
    }

    // textarea
    if(field.tagName.toLowerCase() === 'textarea'){
      let final = '';
      if(rule){
        if(rule.action === 'fixed') final = rule.value;
        else final = rule.value || 'This is automated test feedback.';
      } else final = 'This is automated test feedback.';
      await typeInto(field, final);
      log(`Filled textarea "${label}"`);
      return final;
    }

    // select (single)
    if(field.tagName.toLowerCase() === 'select' && !field.multiple){
      if(rule && rule.action === 'skip'){ log(`Skipping select ${label}`); return null; }
      let chosen = null;
      if(rule){
        if(rule.action === 'fixed'){
          const want = (rule.value||'').trim().toLowerCase();
          for(const opt of Array.from(field.options)){
            if(opt.value.toLowerCase() === want || (opt.text||'').trim().toLowerCase() === want){ chosen = opt; break; }
          }
        } else if(rule.action === 'random'){
          const parts = (rule.value||'').split(',').map(s=>s.trim()).filter(Boolean);
          if(parts.length) {
            const pick = randomChoice(parts);
            for(const opt of Array.from(field.options)){ if(opt.value===pick || opt.text===pick) { chosen=opt; break; } }
          }
        } else if(rule.action === 'random_good'){
          // prefer city-like options
          const preferred = ['Mumbai','Delhi','Bengaluru','Chennai','Pune','Other'];
          for(const p of preferred){
            for(const opt of Array.from(field.options)){
              if(opt.text.trim() === p || opt.value === p) { chosen = opt; break; }
            }
            if(chosen) break;
          }
        }
      }
      if(!chosen){
        // fallback heuristic: pick first non-empty option
        for(const opt of Array.from(field.options)){
          if(opt.value && opt.value.trim() !== ''){ chosen = opt; break; }
        }
      }
      if(chosen){ field.value = chosen.value; field.dispatchEvent(new Event('change', {bubbles:true})); log(`Selected ${label} -> ${chosen.text}`); return chosen.value; }
      log(`No option chosen for ${label}`); return null;
    }

    // select multiple
    if(field.tagName.toLowerCase() === 'select' && field.multiple){
      if(rule && rule.action === 'skip'){ log(`Skipping multi-select ${label}`); return null; }
      let picks = [];
      if(rule && (rule.action === 'fixed' || rule.action === 'random')){
        const parts = (rule.value||'').split(',').map(s=>s.trim()).filter(Boolean);
        for(const p of parts){
          for(const opt of Array.from(field.options)){
            if(opt.value === p || (opt.text||'').trim() === p){ picks.push(opt); break; }
          }
        }
      }
      if(picks.length === 0){
        // pick 1-2 random
        const opts = Array.from(field.options).filter(o=>o.value);
        const k = Math.min(randInt(1,2), opts.length);
        while(picks.length < k){
          const c = randomChoice(opts.filter(o=>!picks.includes(o)));
          if(c) picks.push(c);
        }
      }
      // apply selections
      for(const opt of field.options) opt.selected = false;
      for(const p of picks) p.selected = true;
      field.dispatchEvent(new Event('change', {bubbles:true}));
      log(`Multi-select ${label} -> [${picks.map(p=>p.text).join(', ')}]`);
      return picks.map(p=>p.value);
    }

    // radio group
    if(field.tagName.toLowerCase() === 'input' && field.type === 'radio'){
      const name = field.name;
      const radios = Array.from(document.querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`));
      if(radios.length){
        let pick = radios[0];
        const ruleFor = findRuleForField(field);
        if(ruleFor && (ruleFor.action === 'fixed' || ruleFor.action === 'random')){
          const parts = (ruleFor.value||'').split(',').map(s=>s.trim().toLowerCase());
          for(const r of radios){
            const lab = (getLabelText(r)||'').trim().toLowerCase();
            if(parts.includes(r.value.toLowerCase()) || parts.includes(lab)){ pick = r; break; }
          }
        }
        pick.checked = true;
        pick.dispatchEvent(new Event('change', {bubbles:true}));
        log(`Radio ${label} -> ${pick.value}`);
        return pick.value;
      }
    }

    // checkboxes group
    if(field.tagName.toLowerCase() === 'input' && field.type === 'checkbox'){
      const name = field.name;
      const checks = Array.from(document.querySelectorAll(`input[type="checkbox"][name="${CSS.escape(name)}"]`));
      if(checks.length){
        // default: pick 1 or 2 first ones or according to rule
        const ruleFor = findRuleForField(field);
        let picks = [];
        if(ruleFor && (ruleFor.action === 'fixed' || ruleFor.action === 'random')){
          const parts = (ruleFor.value||'').split(',').map(s=>s.trim().toLowerCase());
          for(const cb of checks){
            const lab = (getLabelText(cb) || '').trim().toLowerCase();
            if(parts.includes(cb.value.toLowerCase()) || parts.includes(lab)) picks.push(cb);
          }
        }
        if(picks.length === 0){
          const k = Math.min(2, checks.length);
          for(let i=0;i<k;i++) picks.push(checks[i]);
        }
        // apply
        checks.forEach(c=>c.checked=false);
        for(const p of picks){ p.checked=true; p.dispatchEvent(new Event('change',{bubbles:true})); }
        log(`Checkbox ${label} -> [${picks.map(p=>getLabelText(p)||p.value).join(', ')}]`);
        return picks.map(p=>p.value);
      }
    }

    // range slider
    if(field.tagName.toLowerCase() === 'input' && field.type === 'range'){
      let v = field.max || 5;
      if(rule && rule.action === 'fixed') v = rule.value;
      else if(rule && rule.action === 'random') v = String(randInt(Number(field.min||1), Number(field.max||5)));
      else v = String(Math.max(Number(field.min||1), Math.ceil(Number(field.max||5)/2)));
      field.value = v; field.dispatchEvent(new Event('input',{bubbles:true})); log(`Range ${label} -> ${v}`);
      return v;
    }

    // unknown types
    log(`Unhandled field: ${label} (tag=${field.tagName}, type=${field.type})`);
    return null;
  }

  // ---------- Runner that iterates form controls in DOM order ----------
  let running = false;
  async function runBotOnce(){
    if(running){ log('Bot already running'); return; }
    running = true;
    log('Bot started on ' + location.href);

    // gather controls inside first <form> if present, else whole doc
    const form = document.querySelector('form') || document;
    const controls = Array.from(form.querySelectorAll('input, textarea, select')).filter(el=>{
      if(el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return false;
      // skip buttons
      return true;
    });

    // handle radio groups: ensure we pass one representative only by name
    const handledRadioNames = new Set();
    for(const field of controls){
      if(!running) break;
      if(field.tagName.toLowerCase()==='input' && field.type==='radio'){
        if(handledRadioNames.has(field.name)) continue;
        handledRadioNames.add(field.name);
      }

      // If field is not visible or disabled, skip
      if(!(field.offsetWidth || field.offsetHeight || field.getClientRects().length)) {
        log('Skipping hidden field: ' + (getLabelText(field)||field.name||field.id));
        continue;
      }

      // fill
      try{
        const val = await fillField(field);
        // persist to local storage map
        const key = (getLabelText(field)||field.name||field.id||field.type).slice(0,60);
        const answers = loadAnswers();
        answers[key] = val === undefined ? null : val;
        saveAnswers(answers);

        // small random delay between fields
        await sleep(randInt(200, Number(speedInput.value||35) + 200));
      }catch(e){
        console.warn('Error filling field:', e);
      }
    }

    log('Bot finished filling page');

    // if autosubmit
    if(autosubmitChk.checked){
      const f = document.querySelector('form');
      if(f){
        log('Auto-submit: dispatching submit');
        f.dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
        try{ if(typeof f.submit === 'function') f.submit(); }catch(e){ console.warn(e); }
      } else {
        log('No form to submit on this page');
      }
    }

    running = false;
  }

  // Start/Stop wiring
  startBtn.addEventListener('click', ()=>{ runBotOnce().catch(e=>console.error(e)); });
  stopBtn.addEventListener('click', ()=>{ running = false; log('Stop requested'); });

  // preview: show planned values (not actual fill)
  previewBtn.addEventListener('click', ()=>{
    const f = document.querySelector('form') || document;
    const ctrls = Array.from(f.querySelectorAll('input,textarea,select')).filter(el => !(el.type==='hidden'||el.type==='submit'||el.type==='button'));
    let preview = '';
    ctrls.forEach(c=>{
      const label = getLabelText(c) || c.name || c.id || c.type;
      const r = findRuleForField(c);
      let previewVal = '(heuristic)';
      if(r){
        if(r.action === 'fixed') previewVal = r.value;
        else if(r.action === 'random') previewVal = '(random from list)';
        else if(r.action === 'random_good') previewVal = '(random good)';
        else if(r.action === 'today') previewVal = (new Date().toISOString().slice(0,10));
      } else {
        previewVal = genGoodAnswerForLabel(label);
      }
      preview += `${label}: ${previewVal}\n`;
    });
    alert('Preview:\n\n' + preview);
  });

  // Save/load rules from localStorage
  loadRules();

  // auto-load rules UI if none: create sample rules for demo (city->Mumbai, element->Air)
  if(!rules || rules.length === 0){
    rules = [
      { id: id(), match: 'city', action: 'fixed', value: 'Mumbai' },
      { id: id(), match: 'element', action: 'fixed', value: 'Air' },
      { id: id(), match: 'brand', action: 'random', value: 'Nike,Adidas,Puma,Reebok' }
    ];
    saveRules(); renderRules(); log('Loaded demo rules (city->Mumbai, element->Air, brand->random)');
  }

  // small helper: when user double-clicks panel remove it
  panel.addEventListener('dblclick', ()=>{ panel.remove(); log('Panel removed'); });

  // Expose to window for debugging
  window.__surveyBot = { run: runBotOnce, rules: rules, saveRules: saveRules, loadRules: loadRules, log: log };

  log('Survey bot injected. Use the UI to add rules and start.');

})();

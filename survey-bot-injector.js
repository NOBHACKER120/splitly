/* Survey Bot Injector — Embed Version
   Save this file to your site and load it with:
   <script src="/survey-bot-injector.js"></script>
   (Then open any page on your site that contains a form.)
*/

(function(){
  'use strict';

  // Basic CSS
  const css = `
  #sbPanel{position:fixed; right:12px; top:12px; width:340px; z-index:2147483647; font-family:Inter, Arial, sans-serif;}
  #sbPanel .panel{background:#fff; border-radius:10px; box-shadow:0 6px 22px rgba(2,6,23,0.18); padding:10px; border:1px solid rgba(2,6,23,0.06);}
  #sbPanel h4{margin:0 0 8px 0; font-size:14px;}
  #sbPanel .row{display:flex; gap:8px; margin-bottom:8px;}
  #sbPanel input[type="text"], #sbPanel select, #sbPanel input[type="number"]{padding:6px 8px; border-radius:6px; border:1px solid #e6e9ef; width:100%;}
  #sbPanel button{padding:8px 10px; border-radius:7px; border:0; cursor:pointer; background:#2563eb; color:#fff; font-weight:700;}
  #sbPanel .btn-ghost{background:transparent; color:#2563eb; border:1px solid rgba(37,99,235,0.12);}
  #sbPanel .log{height:120px; overflow:auto; background:#06070a; color:#9ad1ff; padding:8px; font-family:monospace; font-size:12px; border-radius:6px;}
  #sbPanel label{font-size:12px; color:#334155; display:block; margin-bottom:4px;}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  // The panel
  const panelWrap = document.createElement('div'); panelWrap.id = 'sbPanel';
  panelWrap.innerHTML = `
    <div class="panel">
      <h4>Survey Bot Injector</h4>
      <div style="font-size:12px;color:#6b7280;margin-bottom:8px">Configure rules & run the bot on this page (testing only)</div>

      <div class="row"><input id="sbMatch" type="text" placeholder="match token (e.g. city)"><select id="sbAction">
        <option value="fixed">Fixed</option>
        <option value="random">Random list</option>
        <option value="today">Today (date)</option>
        <option value="random_text">Random text</option>
        <option value="skip">Skip</option>
      </select></div>

      <div class="row"><input id="sbValue" type="text" placeholder="value (for fixed or comma-separated list)"></div>

      <div style="display:flex; gap:6px; margin-bottom:8px;">
        <button id="sbAdd">Add rule</button>
        <button id="sbStart" class="btn-ghost">Start</button>
      </div>

      <div style="margin-bottom:8px;">
        <label>Type speed (ms/char)</label>
        <input id="sbSpeed" type="number" value="35">
      </div>

      <div style="margin-bottom:8px;">
        <label>Delay between fields (ms)</label>
        <input id="sbDelay" type="number" value="500">
      </div>

      <div style="display:flex; gap:6px; margin-bottom:8px;">
        <label style="flex:1"><input id="sbAutoSubmit" type="checkbox"> Auto-submit</label>
        <button id="sbPreview" class="btn-ghost">Preview</button>
      </div>

      <div style="margin-bottom:8px;">
        <div style="font-weight:700; font-size:12px; margin-bottom:4px">Rules</div>
        <div id="sbRules" style="max-height:110px; overflow:auto; border:1px solid #eef2f6; padding:6px; border-radius:6px"></div>
      </div>

      <div style="margin-bottom:8px;">
        <div style="font-weight:700; font-size:12px; margin-bottom:4px">Action Log</div>
        <div class="log" id="sbLog"></div>
      </div>
    </div>
  `;
  document.body.appendChild(panelWrap);

  // state & elements
  const sbRules = []; // {id, match, action, value}
  const el = {
    match: document.getElementById('sbMatch'),
    action: document.getElementById('sbAction'),
    value: document.getElementById('sbValue'),
    add: document.getElementById('sbAdd'),
    start: document.getElementById('sbStart'),
    speed: document.getElementById('sbSpeed'),
    delay: document.getElementById('sbDelay'),
    autosubmit: document.getElementById('sbAutoSubmit'),
    rulesBox: document.getElementById('sbRules'),
    log: document.getElementById('sbLog'),
    preview: document.getElementById('sbPreview'),
  };

  function log(msg){
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    const d = document.createElement('div'); d.textContent = line;
    el.log.appendChild(d);
    el.log.scrollTop = el.log.scrollHeight;
  }

  function renderRules(){
    el.rulesBox.innerHTML = '';
    sbRules.forEach(r=>{
      const d = document.createElement('div');
      d.style.display='flex'; d.style.justifyContent='space-between'; d.style.alignItems='center'; d.style.marginBottom='4px';
      d.innerHTML = `<div style="font-size:12px">${r.match} → ${r.action} ${r.value?('('+r.value+')'):''}</div><button data-id="${r.id}" style="background:#ef4444;color:white;border-radius:6px;padding:4px 6px;border:0;cursor:pointer">X</button>`;
      el.rulesBox.appendChild(d);
      d.querySelector('button').addEventListener('click', ()=>{
        const id = d.querySelector('button').dataset.id;
        const idx = sbRules.findIndex(x=>x.id===id);
        if(idx>=0) sbRules.splice(idx,1);
        renderRules();
      });
    });
  }

  el.add.addEventListener('click', ()=>{
    const m = el.match.value.trim();
    if(!m){ alert('enter match token'); return; }
    sbRules.push({ id: 'r_'+Math.random().toString(36).slice(2,9), match: m, action: el.action.value, value: el.value.value.trim() });
    el.match.value=''; el.value.value='';
    renderRules();
    log('Added rule: ' + m);
  });

  // label helper
  function getLabelText(field){
    if(!field) return '';
    if(field.id){
      const label = document.querySelector('label[for="'+field.id+'"]');
      if(label) return label.innerText || label.textContent;
    }
    let prev = field.previousElementSibling;
    if(prev && prev.tagName.toLowerCase()==='label') return prev.innerText;
    const lab = field.closest('label');
    if(lab) return lab.innerText;
    return '';
  }

  function findRuleForField(field){
    const name = (field.name||'').toLowerCase();
    const id = (field.id||'').toLowerCase();
    const label = (getLabelText(field)||'').toLowerCase();
    for(const r of sbRules){
      const t = r.match.toLowerCase();
      if(name.includes(t) || id.includes(t) || label.includes(t)) return r;
    }
    return null;
  }

  function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
  function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }
  function randomChoice(a){ return a[Math.floor(Math.random()*a.length)]; }
  const demoNames = ['Aman Kumar','Priya Sharma','Rohit Singh','Anika Patel','Sameer Verma'];
  function genName(){ return randomChoice(demoNames); }
  function genEmail(){ return genName().toLowerCase().replace(/\s+/g,'.') + randInt(1,999)+'@example.com'; }
  function genText(label){ if(label.toLowerCase().includes('city')) return randomChoice(['Mumbai','Delhi','Bengaluru']); return 'Auto generated answer'; }
  function genToday(){ const d=new Date(); return d.toISOString().slice(0,10); }

  async function fillControl(elm){
    const rule = findRuleForField(elm);
    const seen = (getLabelText(elm)||elm.name||elm.id||elm.type);
    log('Filling: ' + seen);

    if(elm.tagName.toLowerCase()==='input' && (elm.type==='text' || elm.type==='email' || elm.type==='tel' || elm.type==='number')){
      let final = '';
      if(rule){
        if(rule.action==='fixed') final = rule.value;
        else if(rule.action==='random_text') final = genText(seen);
        else final = rule.value || genText(seen);
      } else {
        if(elm.type==='email') final = genEmail();
        else if(seen.toLowerCase().includes('name')) final = genName();
        else final = genText(seen);
      }
      elm.focus();
      elm.value='';
      const speed = Number(document.getElementById('sbSpeed').value||35);
      for(const ch of final){
        elm.value += ch;
        elm.dispatchEvent(new Event('input',{bubbles:true}));
        await sleep(speed + randInt(-10,40));
      }
      elm.blur();
      return;
    }

    if(elm.tagName.toLowerCase()==='textarea'){
      let final = (rule && rule.action==='fixed')? rule.value : 'This is an automated demo comment.';
      elm.focus(); elm.value=''; for(const ch of final){ elm.value += ch; elm.dispatchEvent(new Event('input',{bubbles:true})); await sleep(30); } elm.blur(); return;
    }

    if(elm.tagName.toLowerCase()==='select' && !elm.multiple){
      let chosen = null;
      if(rule){
        if(rule.action === 'fixed'){
          const want = (rule.value||'').trim().toLowerCase();
          for(const opt of Array.from(elm.options)){
            if(opt.value.toLowerCase()===want || opt.text.toLowerCase()===want){ chosen = opt; break; }
          }
        } else if(rule.action === 'random'){
          const parts = (rule.value||'').split(',').map(s=>s.trim()).filter(Boolean);
          if(parts.length) {
            const pick = randomChoice(parts);
            for(const opt of Array.from(elm.options)){ if(opt.value===pick || opt.text===pick) { chosen=opt; break; } }
          }
        }
      }
      if(!chosen){
        for(const pref of ['Mumbai','Delhi','Bengaluru','Other']){
          for(const opt of Array.from(elm.options)){
            if(opt.text.trim()===pref || opt.value===pref){ chosen=opt; break; }
          }
          if(chosen) break;
        }
      }
      if(!chosen) chosen = Array.from(elm.options).find(o => o.value);
      if(chosen){ elm.value = chosen.value; elm.dispatchEvent(new Event('change',{bubbles:true})); }
      return;
    }

    if(elm.tagName.toLowerCase()==='input' && (elm.type==='checkbox' || elm.type==='radio')){
      const name = elm.name;
      if(elm.type==='radio'){
        const radios = Array.from(document.querySelectorAll('input[type="radio"][name="'+name+'"]'));
        if(radios.length){
          let pick = radios[0];
          const ruleRadio = findRuleForField(elm);
          if(ruleRadio && (ruleRadio.action==='fixed' || ruleRadio.action==='random')){
            const parts = (ruleRadio.value||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
            for(const r of radios){ const lab = getLabelText(r).toLowerCase(); if(parts.includes(r.value.toLowerCase()) || parts.includes(lab)) pick = r; }
          }
          pick.checked = true; pick.dispatchEvent(new Event('change',{bubbles:true})); return;
        }
      }
      if(elm.type==='checkbox'){
        const checks = Array.from(document.querySelectorAll('input[type="checkbox"][name="'+name+'"]'));
        if(checks.length){
          const k = Math.min(checks.length, 2);
          checks.forEach(c=>c.checked=false);
          for(let i=0;i<k;i++){
            const c = checks[i]; c.checked = true; c.dispatchEvent(new Event('change',{bubbles:true}));
          }
        }
        return;
      }
    }

    if(elm.tagName.toLowerCase()==='input' && elm.type==='date'){
      if(findRuleForField(elm) && findRuleForField(elm).action==='today'){ elm.value = genToday(); elm.dispatchEvent(new Event('change',{bubbles:true})); return; }
      else { elm.value = genToday(); elm.dispatchEvent(new Event('change',{bubbles:true})); return; }
    }

    if(elm.tagName.toLowerCase()==='input' && elm.type==='range'){ elm.value = elm.max || 5; elm.dispatchEvent(new Event('input',{bubbles:true})); return; }

    log('Unhandled: ' + elm.tagName + ' / ' + (elm.type||''));
  }

  async function runBotOnPage(){
    log('Bot starting on page: ' + location.href);
    const delayBetween = Number(document.getElementById('sbDelay').value||500);
    const theForm = document.querySelector('form') || document.body;
    const controls = Array.from(theForm.querySelectorAll('input, textarea, select')).filter(c => {
      if(c.type==='hidden' || c.type==='submit' || c.type==='button') return false; return true;
    });
    for(const c of controls){
      if(!panelWrap || !document.body.contains(panelWrap)) { log('Panel removed -> stopping'); break; }
      if(c.type==='radio'){
        const allSame = document.querySelectorAll('input[type="radio"][name="'+c.name+'"]');
        if(allSame.length>1 && allSame[0] !== c) continue;
      }
      await fillControl(c);
      await sleep(delayBetween + randInt(0,200));
    }
    log('Bot finished filling controls.');
    if(document.getElementById('sbAutoSubmit').checked){
      log('Auto-submit is on: submitting form (if present)');
      const f = document.querySelector('form');
      if(f){
        f.dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
        if(typeof f.submit === 'function') try{ f.submit(); }catch(e){ console.warn(e); }
      } else log('No form element found to submit.');
    }
  }

  el.start.addEventListener('click', ()=>{ runBotOnPage().catch(e=>console.error(e)); });
  el.preview.addEventListener('click', ()=>{
    const theForm = document.querySelector('form') || document.body;
    const contr = Array.from(theForm.querySelectorAll('input,textarea,select')).filter(c=> !(c.type==='hidden'||c.type==='submit'||c.type==='button'));
    let out = '';
    for(const c of contr){
      const r = findRuleForField(c);
      const label = (getLabelText(c)||c.name||c.id||c.type);
      if(c.tagName.toLowerCase()==='select' && !c.multiple){
        let chosen = '(heuristic)';
        if(r && r.action==='fixed') chosen = r.value;
        out += `${label}: ${chosen}\n`;
      } else if(c.tagName.toLowerCase()==='input' && (c.type==='text'||c.type==='email')){
        let s = '(auto)';
        if(r && r.action === 'fixed') s = r.value;
        out += `${label}: ${s}\n`;
      } else if(c.tagName.toLowerCase()==='textarea') {
        out += `${label}: (text area preview)\n`;
      } else out += `${label}: (preview)\n`;
    }
    alert('Preview (basic):\n\n' + out);
  });

  panelWrap.addEventListener('dblclick', ()=>{ panelWrap.remove(); log('Panel removed by user'); });
  log('Survey Bot Injector ready. Use the panel to add rules and press Start.');

})();

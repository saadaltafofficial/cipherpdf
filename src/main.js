import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './style.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
const app = document.querySelector('#app');
let files = [];
let selected = 0;
let busy = false;

function h(str) { return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function bytes(n) { return n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(2)} MB`; }
function save(data, name) {
  const url = URL.createObjectURL(new Blob([data], {type:'application/pdf'}));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
function setMessage(message, error=false) {
  const status = document.querySelector('#status');
  if (status) { status.textContent = message; status.className = error ? 'status error' : 'status'; }
}
function render() {
  app.innerHTML = `
    <header><div class="brand"><span class="brand-icon">◈</span><span>Cipher<span class="accent">PDF</span></span><span class="pill">ALPHA 0.1</span></div><span class="local"><span class="dot"></span> LOCAL-FIRST · NO UPLOADS</span></header>
    <main><section class="hero"><div class="eyebrow">OPEN-SOURCE DOCUMENT TOOLS</div><h1>Your PDFs.<br/><em>Your control.</em></h1><p>Merge, split, rotate and verify PDFs right in your browser. Your files never leave your device.</p></section>
    <section class="workspace"><div class="left"><label id="dropzone" class="dropzone" for="fileinput"><span class="upload-icon">↑</span><strong>Drop PDF documents here</strong><span>or click to browse your files</span><small>Multiple PDFs supported · processed locally</small></label><input id="fileinput" type="file" accept="application/pdf,.pdf" multiple hidden />
    <div class="sectiontitle">YOUR DOCUMENTS <span>${files.length} FILE${files.length===1?'':'S'}</span></div>
    <div class="files">${files.length ? files.map((f,i)=>`<button type="button" class="file ${selected===i?'active':''}" data-select="${i}"><span class="fileicon">PDF</span><span class="filemeta"><strong>${h(f.name)}</strong><small>${f.pageCount} page${f.pageCount===1?'':'s'} · ${bytes(f.data.length)}</small></span><span class="remove" role="button" aria-label="Remove file" data-remove="${i}">×</span></button>`).join('') : '<div class="empty">No documents added yet.</div>'}</div>
    <div class="help">Privacy note: document content stays in your browser. Avoid opening untrusted PDFs in outdated browsers.</div>
    </div><div class="right"><div class="sectiontitle">DOCUMENT PREVIEW <span id="pageinfo"></span></div><div class="preview" id="preview"><div class="placeholder"><div class="page-placeholder">▤</div>Select a PDF to preview</div></div>
    <div class="sectiontitle tools-title">DOCUMENT TOOLS</div><div class="tools">
      <button data-op="merge" ${files.length<2?'disabled':''}><span>⧉</span><strong>Merge all</strong><small>Combine PDFs in list order</small></button>
      <button data-op="split" ${files.length===0?'disabled':''}><span>✂</span><strong>Extract pages</strong><small>Save a page range</small></button>
      <button data-op="rotate" ${files.length===0?'disabled':''}><span>↻</span><strong>Rotate pages</strong><small>90° clockwise</small></button>
      <button data-op="hash" ${files.length===0?'disabled':''}><span>⌁</span><strong>SHA-256 fingerprint</strong><small>Verify exact file bytes</small></button>
    </div><div class="range"><label for="pages">Pages to extract (example: 1-3,5)</label><input id="pages" placeholder="1-3,5" autocomplete="off" /></div><div id="status" class="status" role="status" aria-live="polite"></div>
    </div></section><footer><span>CipherPDF v0.1 · Apache-2.0</span><span>Local by design. No accounts, no tracking.</span></footer></main>`;
  document.querySelector('#fileinput').addEventListener('change', e => addFiles(e.target.files));
  const zone = document.querySelector('#dropzone');
  for (const ev of ['dragenter','dragover']) zone.addEventListener(ev, e => {e.preventDefault(); zone.classList.add('dragging');});
  for (const ev of ['dragleave','drop']) zone.addEventListener(ev, e => {e.preventDefault();zone.classList.remove('dragging');});
  zone.addEventListener('drop', e => addFiles(e.dataTransfer.files));
  document.querySelectorAll('[data-select]').forEach(b=>b.addEventListener('click', e=>{if(e.target.closest('[data-remove]')) return; selected=Number(b.dataset.select);render();}));
  document.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();files.splice(Number(b.dataset.remove),1);selected=Math.max(0,Math.min(selected,files.length-1));render();}));
  document.querySelectorAll('[data-op]').forEach(b=>b.addEventListener('click',()=>run(b.dataset.op)));
  if (files.length) showPreview(files[selected]);
}
async function addFiles(input) {
  const incoming=Array.from(input);
  if (!incoming.length) return;
  setMessage(`Reading ${incoming.length} file(s)…`);
  let failures=[];
  for (const f of incoming) {
    try {
      if (f.size > 100*1024*1024) throw new Error('Exceeds 100MB browser limit');
      const data=new Uint8Array(await f.arrayBuffer());
      const pdf=await PDFDocument.load(data,{ignoreEncryption:false});
      files.push({name:f.name,data,pageCount:pdf.getPageCount()});
    } catch(err) {failures.push(`${f.name}: ${err.message}`);}
  }
  selected=files.length-1;render();
  setMessage(failures.length ? `Could not load: ${failures.join('; ')}` : `${incoming.length} file(s) processed locally.`, !!failures.length);
}
async function showPreview(f) {
  const preview=document.querySelector('#preview');
  if (!preview) return;
  try {
    // Clone the bytes: PDF.js transfers/consumes its Uint8Array buffer in workers.
    const doc=await pdfjsLib.getDocument({data:f.data.slice()}).promise;
    const page=await doc.getPage(1);
    const viewport=page.getViewport({scale:1});
    const scale=Math.min(1.25, 510/viewport.width);
    const canvas=document.createElement('canvas');
    const scaled=page.getViewport({scale});
    canvas.width=Math.floor(scaled.width);canvas.height=Math.floor(scaled.height);
    await page.render({canvasContext:canvas.getContext('2d'),viewport:scaled}).promise;
    if (files[selected]!==f) return;
    preview.replaceChildren(canvas);
    document.querySelector('#pageinfo').textContent=`PAGE 1 / ${doc.numPages}`;
    await doc.destroy();
  } catch(err) { preview.textContent=`Preview unavailable: ${err.message}`; }
}
function parsePages(input,count) {
  if(!input.trim()) throw new Error('Enter a page range, such as 1-3,5');
  const found=[];
  for (const piece of input.split(',')) {
    const m=piece.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if(!m) throw new Error(`Invalid page range: ${piece}`);
    const a=Number(m[1]), b=m[2]?Number(m[2]):a;
    if(a<1||b<a||b>count) throw new Error(`Pages must be between 1 and ${count}`);
    for(let i=a;i<=b;i++) if(!found.includes(i-1)) found.push(i-1);
  }
  return found;
}
async function run(op) {
  if(busy||!files.length) return;busy=true;
  setMessage('Working locally…');
  try {
    const item=files[selected];
    if(op==='hash') {
      const buffer=await crypto.subtle.digest('SHA-256',item.data);
      const hex=Array.from(new Uint8Array(buffer),x=>x.toString(16).padStart(2,'0')).join('');
      await navigator.clipboard?.writeText(hex).catch(()=>{});
      setMessage(`SHA-256 (${item.name}): ${hex} — copy attempted`);
    } else if(op==='merge') {
      if(files.length<2) throw new Error('Add at least two PDFs');
      const output=await PDFDocument.create();
      for(const f of files) { const src=await PDFDocument.load(f.data); const copied=await output.copyPages(src,src.getPageIndices());copied.forEach(p=>output.addPage(p)); }
      save(await output.save(),'cipherpdf-merged.pdf');setMessage(`Merged ${files.length} PDFs successfully.`);
    } else if(op==='split') {
      const src=await PDFDocument.load(item.data);
      const indices=parsePages(document.querySelector('#pages').value,src.getPageCount());
      const output=await PDFDocument.create();
      (await output.copyPages(src,indices)).forEach(p=>output.addPage(p));
      save(await output.save(),`cipherpdf-extracted-${item.name}`);setMessage(`Extracted ${indices.length} page(s).`);
    } else if(op==='rotate') {
      const src=await PDFDocument.load(item.data);
      src.getPages().forEach(p=>p.setRotation(degrees((p.getRotation().angle+90)%360)));
      save(await src.save(),`cipherpdf-rotated-${item.name}`);setMessage('Rotated every page 90° clockwise.');
    }
  } catch(err){setMessage(err.message,true);}finally{busy=false;}
}
render();

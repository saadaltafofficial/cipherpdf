import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const bytes = async file => new Uint8Array(await file.arrayBuffer());
const doc = async file => PDFDocument.load(await bytes(file));
export async function inspect(file) {
  const data = await bytes(file);
  const pdf = await PDFDocument.load(data);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return { pages: pdf.getPageCount(), bytes: data.length, hash: [...new Uint8Array(hash)].map(n => n.toString(16).padStart(2, '0')).join('') };
}
export async function preview(file, pageNumber, canvas) {
  const task = pdfjs.getDocument({ data: await bytes(file), isEvalSupported: false });
  const pdf = await task.promise;
  try {
    const page = await pdf.getPage(pageNumber);
    const v = page.getViewport({scale:1.35});
    const ctx = canvas.getContext('2d');
    canvas.width = v.width; canvas.height = v.height;
    await page.render({canvasContext:ctx,viewport:v}).promise;
  } finally { await pdf.destroy(); }
}
export function pageIndices(value, max) {
  const indices = [];
  for(const segment of value.split(',')) {
    const m = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(segment.trim());
    if(!m) throw new Error('Use a page selection such as 1,3-5');
    const start=Number(m[1]), end=m[2]?Number(m[2]):start;
    if(start<1 || end>max || end<start) throw new Error('Page selection out of range');
    for(let i=start;i<=end;i++) if(!indices.includes(i-1)) indices.push(i-1);
  }
  return indices;
}
export async function extract(file, range) {
  const source = await doc(file), output = await PDFDocument.create();
  const pages = await output.copyPages(source, pageIndices(range,source.getPageCount()));
  pages.forEach(page=>output.addPage(page)); return output.save();
}
export async function rotate(file, range, amount) {
  const pdf = await doc(file);
  pageIndices(range,pdf.getPageCount()).forEach(index=>{
    const page=pdf.getPage(index);
    page.setRotation(degrees((page.getRotation().angle + amount + 360)%360));
  }); return pdf.save();
}
export async function merge(files) {
  if(files.length<2) throw new Error('Select at least two PDF files');
  const output=await PDFDocument.create();
  for(const file of files){const source=await doc(file);(await output.copyPages(source,source.getPageIndices())).forEach(page=>output.addPage(page));}
  return output.save();
}
export async function annotate(file,pageNumber,value,x,y,size) {
  if(!value.trim()) throw new Error('Enter text to add');
  const pdf=await doc(file), page=pdf.getPage(pageNumber-1),font=await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText(value,{x:Number(x),y:Number(y),size:Number(size),font,color:rgb(.1,.17,.3)});
  return pdf.save();
}
export function savePdf(contents,name){const url=URL.createObjectURL(new Blob([contents],{type:'application/pdf'}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}

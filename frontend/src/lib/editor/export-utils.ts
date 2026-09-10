import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { getNodesBounds } from '@xyflow/react';
import type { Diagram } from '@/types';
import { serializeDiagram } from './diagram-utils';

function download(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

export function filenameFor(diagram: Diagram) {
  return diagram.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase() || 'diagram';
}

async function capture(diagram: Diagram, format: 'png' | 'svg', ref?: React.RefObject<HTMLDivElement | null>) {
  const root = ref?.current ?? document.querySelector<HTMLElement>(diagram.type === 'gantt' ? '[data-gantt-export]' : '.react-flow');
  if (!root) throw new Error('Canvas not available.');
  const clone = root.cloneNode(true) as HTMLElement;
  // Export the whole diagram at a readable scale, independent of pan/zoom and
  // the student's screen size. Preserve SVG marker definitions in the root.
  const visible = diagram.nodes.filter(n => !n.hidden && diagram.layers?.find(l => l.id === (n.data.layerId ?? 'default'))?.visible !== false);
  const bounds = visible.length ? getNodesBounds(visible) : { x: 0, y: 0, width: 640, height: 400 };
  const rawWidth = diagram.type === 'gantt' ? root.scrollWidth : bounds.width + 96;
  const rawHeight = diagram.type === 'gantt' ? root.scrollHeight : bounds.height + 96;
  const scale = Math.min(1, 4096 / Math.max(rawWidth, rawHeight));
  const width = Math.ceil(rawWidth * scale), height = Math.ceil(rawHeight * scale);
  Object.assign(clone.style, { position: 'fixed', left: '-100000px', top: '0', width: `${width}px`, height: `${height}px`, overflow: 'hidden', pointerEvents: 'none' });
  clone.setAttribute('aria-hidden', 'true');
  clone.querySelectorAll('.react-flow__panel, .react-flow__background, .react-flow__handle, .react-flow__resize-control, .react-flow__selection, .react-flow__nodesselection').forEach(el => el.remove());
  clone.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
  clone.querySelectorAll<HTMLElement>('.uml-node').forEach(el => { el.style.boxShadow = 'none'; });
  clone.querySelectorAll<HTMLElement>('[data-editor-only]').forEach(el => { el.style.visibility = 'hidden'; });
  const viewport = clone.querySelector<HTMLElement>('.react-flow__viewport');
  if (viewport) viewport.style.transform = `translate(${(48 - bounds.x) * scale}px, ${(48 - bounds.y) * scale}px) scale(${scale})`;
  if (diagram.type === 'gantt') {
    const svg = clone.querySelector('svg');
    if (svg) { svg.setAttribute('width', String(width)); svg.setAttribute('height', String(height)); }
  }
  document.body.append(clone);
  try {
    // html-to-image copies SVG subtrees wholesale. Inline the HTML label
    // styles inside foreignObject so standalone images retain flex centering
    // and typography instead of relying on the app's Tailwind stylesheet.
    clone.querySelectorAll('foreignObject').forEach(object => {
      object.querySelectorAll<HTMLElement>('*').forEach(el => {
        const computed = getComputedStyle(el);
        const properties = Array.from(computed, property => [property, computed.getPropertyValue(property)]);
        properties.forEach(([property, value]) => el.style.setProperty(property, value));
      });
    });
    const options = { width, height, pixelRatio: 2, backgroundColor: diagram.preferences?.canvasBackground ?? '#ffffff', style: { position: 'relative', inset: '0', insetInline: '0', insetBlock: '0' } };
    return { url: await (format === 'png' ? toPng(clone, options) : toSvg(clone, options)), width, height };
  } finally { clone.remove(); }
}

export type ExportFormat = 'png' | 'svg' | 'pdf' | 'json';
export type PreparedExport = { url: string; filename: string; format: ExportFormat; preview?: string };

export async function prepareExport(diagram: Diagram, format: ExportFormat, ref?: React.RefObject<HTMLDivElement | null>): Promise<PreparedExport> {
  const filename = `${filenameFor(diagram)}.${format}`;
  if (format === 'json') {
    const payload = { ...serializeDiagram(diagram), format: 'umlforge', version: 1 };
    return { filename, format, url: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(payload, null, 2))}` };
  }
  const { url, width, height } = await capture(diagram, format === 'svg' ? 'svg' : 'png', ref);
  if (format !== 'pdf') return { url, filename, format, preview: url };
  const pdf = new jsPDF({ orientation: width >= height ? 'landscape' : 'portrait', unit: 'px', format: [width + 32, height + 32] });
  pdf.addImage(url, 'PNG', 16, 16, width, height);
  return { filename, format, url: pdf.output('datauristring'), preview: url };
}

export async function exportPng(diagram: Diagram, ref?: React.RefObject<HTMLDivElement | null>) {
  const file = await prepareExport(diagram, 'png', ref); download(file.url, file.filename);
}
export async function exportSvg(diagram: Diagram, ref?: React.RefObject<HTMLDivElement | null>) {
  const file = await prepareExport(diagram, 'svg', ref); download(file.url, file.filename);
}
export async function exportPdf(diagram: Diagram, ref?: React.RefObject<HTMLDivElement | null>) {
  const file = await prepareExport(diagram, 'pdf', ref); download(file.url, file.filename);
}
export async function exportJson(diagram: Diagram) {
  const file = await prepareExport(diagram, 'json'); download(file.url, file.filename);
}

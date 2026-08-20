import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
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

function rootElement(ref?: React.RefObject<HTMLDivElement | null>) {
  return ref?.current ?? document.querySelector<HTMLElement>('.react-flow');
}

const EXPORT_FILTER = (node: HTMLElement) =>
  !node.classList?.contains('react-flow__minimap') &&
  !node.classList?.contains('react-flow__controls') &&
  !node.classList?.contains('react-flow__attribution');

export async function exportPng(diagram: Diagram, ref?: React.RefObject<HTMLDivElement | null>) {
  const el = rootElement(ref);
  if (!el) throw new Error('Canvas not available.');
  const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: '#fafafa', filter: EXPORT_FILTER });
  download(dataUrl, `${filenameFor(diagram)}.png`);
}

export async function exportSvg(diagram: Diagram, ref?: React.RefObject<HTMLDivElement | null>) {
  const el = rootElement(ref);
  if (!el) throw new Error('Canvas not available.');
  const dataUrl = await toSvg(el, { backgroundColor: '#fafafa', filter: EXPORT_FILTER });
  download(dataUrl, `${filenameFor(diagram)}.svg`);
}

export async function exportPdf(diagram: Diagram, ref?: React.RefObject<HTMLDivElement | null>) {
  const el = rootElement(ref);
  if (!el) throw new Error('Canvas not available.');
  const png = await toPng(el, { pixelRatio: 2, backgroundColor: '#fafafa', filter: EXPORT_FILTER });
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1190, 770] });
  pdf.addImage(png, 'PNG', 8, 8, 1174, 754);
  pdf.save(`${filenameFor(diagram)}.pdf`);
}

export function exportJson(diagram: Diagram) {
  const payload = { ...serializeDiagram(diagram), format: 'umlforge', version: 1 };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  download(url, `${filenameFor(diagram)}.json`);
  URL.revokeObjectURL(url);
}
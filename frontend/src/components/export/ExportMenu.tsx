import { Copy, Download, FileJson, FileText, FileType2, Image, Share2 } from 'lucide-react';
import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import type { RefObject } from 'react';
import type { Diagram } from '@/types';
import { Dropdown, MenuDivider, MenuItem } from '@/components/ui/Dropdown';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const download = (dataUrl: string, filename: string) => {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
};

const filenameFor = (diagram: Diagram) => `${diagram.name.replace(/\s+/g, '-').toLowerCase()}`;

export function ExportMenu({
  diagram,
  elementRef,
  onCopyUml,
}: {
  diagram: Diagram;
  elementRef?: RefObject<HTMLDivElement | null>;
  onCopyUml?: () => void;
}) {
  const toast = useToast();
  const root = () => {
    const el = elementRef?.current as HTMLElement | null;
    return el ?? document.querySelector<HTMLElement>('.react-flow');
  };

  const guarded = async (op: () => Promise<void>, failMsg: string): Promise<boolean> => {
    try {
      await op();
      return true;
    } catch {
      toast('error', failMsg);
      return false;
    }
  };

  const exportPng = async () => {
    await guarded(
      async () => {
        const el = root();
        if (!el) throw new Error('no canvas');
        download(await toPng(el, { pixelRatio: 2, backgroundColor: '#f8fafc' }), `${filenameFor(diagram)}.png`);
        toast('success', 'PNG exported');
      },
      'PNG export failed',
    );
  };

  const exportSvg = async () => {
    await guarded(
      async () => {
        const el = root();
        if (!el) throw new Error('no canvas');
        download(await toSvg(el, { backgroundColor: '#f8fafc' }), `${filenameFor(diagram)}.svg`);
        toast('success', 'SVG exported');
      },
      'SVG export failed',
    );
  };

  const exportPdf = async () => {
    await guarded(
      async () => {
        const el = root();
        if (!el) throw new Error('no canvas');
        const png = await toPng(el, { pixelRatio: 2, backgroundColor: '#f8fafc' });
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1190, 770] });
        pdf.addImage(png, 'PNG', 8, 8, 1174, 754);
        pdf.save(`${filenameFor(diagram)}.pdf`);
        toast('success', 'PDF exported');
      },
      'PDF export failed',
    );
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ name: diagram.name, type: diagram.type, nodes: diagram.nodes, edges: diagram.edges }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    download(url, `${filenameFor(diagram)}.json`);
    URL.revokeObjectURL(url);
    toast('success', 'JSON exported');
  };

  return (
    <Dropdown
      trigger={(open) => (
        <Button variant="outline" size="sm" className={open ? 'bg-slate-50' : undefined}>
          <Download className="h-4 w-4" /> Export
        </Button>
      )}
      align="right"
    >
      {(close) => (
        <>
          <MenuItem icon={<Image className="h-4 w-4" />} label="Export PNG" onClick={() => { close(); void exportPng(); }} />
          <MenuItem icon={<FileType2 className="h-4 w-4" />} label="Export SVG" onClick={() => { close(); void exportSvg(); }} />
          <MenuItem icon={<FileText className="h-4 w-4" />} label="Export PDF" onClick={() => { close(); void exportPdf(); }} />
          <MenuItem icon={<FileJson className="h-4 w-4" />} label="Export JSON" onClick={() => { close(); exportJson(); }} />
          <MenuDivider />
          <MenuItem
            icon={<Copy className="h-4 w-4" />}
            label="Copy UML structure"
            onClick={() => {
              close();
              onCopyUml?.();
              toast('success', 'PlantUML structure copied to clipboard');
            }}
          />
          <MenuDivider />
          <MenuItem icon={<Share2 className="h-4 w-4" />} label="Share diagram" onClick={close} />
        </>
      )}
    </Dropdown>
  );
}
import { Copy, Download, FileJson, FileText, FileType2, Image } from 'lucide-react';
import { useState, type RefObject } from 'react';
import { prepareExport, type ExportFormat, type PreparedExport } from '@/lib/editor/export-utils';
import type { Diagram } from '@/types';
import { Dropdown, MenuDivider, MenuItem } from '@/components/ui/Dropdown';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export function ExportMenu({ diagram, elementRef, onCopyUml }: { diagram: Diagram; elementRef?: RefObject<HTMLDivElement | null>; onCopyUml?: () => void }) {
  const toast = useToast();
  const [file, setFile] = useState<PreparedExport>();
  const [busy, setBusy] = useState(false);
  const prepare = async (format: ExportFormat) => {
    setBusy(true);
    try { setFile(await prepareExport(diagram, format, elementRef)); }
    catch { toast('error', `${format.toUpperCase()} export failed. Please try again.`); }
    finally { setBusy(false); }
  };
  return <>
    <Dropdown align="right" trigger={open => <Button aria-label={busy ? 'Preparing export' : 'Export'} variant="outline" size="sm" disabled={busy} className={open ? 'bg-slate-50' : undefined}><Download className="h-4 w-4" /><span className="hidden sm:inline">{busy ? 'Preparing…' : 'Export'}</span></Button>}>
      {close => <>
        {([{ format: 'png', icon: Image }, { format: 'svg', icon: FileType2 }, { format: 'pdf', icon: FileText }, { format: 'json', icon: FileJson }] as const).map(({ format, icon: Icon }) => <MenuItem key={format} icon={<Icon className="h-4 w-4" />} label={`Export ${format.toUpperCase()}`} onClick={() => { close(); void prepare(format); }} />)}
        {onCopyUml && <><MenuDivider /><MenuItem icon={<Copy className="h-4 w-4" />} label="Copy UML structure" onClick={() => { close(); onCopyUml(); }} /></>}
      </>}
    </Dropdown>
    <Modal open={!!file} onClose={() => setFile(undefined)} title="Your export is ready" description={file?.filename} className="max-w-3xl">
      {file?.preview && <img src={file.preview} alt="Complete diagram export preview" className="mx-auto max-h-[50vh] max-w-full object-contain" />}
      {file?.format === 'json' && <p className="text-sm text-slate-600">Includes the editable diagram, relationships, layers, styles and any project schedule.</p>}
      {file && <div className="mt-4 flex justify-end"><a className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" href={file.url} download={file.filename}><Download className="h-4 w-4" />Download {file.format.toUpperCase()}</a></div>}
    </Modal>
  </>;
}

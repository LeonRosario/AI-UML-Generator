import { useState } from 'react';
import { useEditorStore, THEMES } from '@/store/editor-store';
import type { EditorPreferences } from '@/types';

export function DiagramTools() {
  const state = useEditorStore();
  const [percent, setPercent] = useState(120);
  const selected = state.nodes.some(n => n.selected);
  return <div className="space-y-3 border-b p-3 text-xs">
    <div className="flex flex-wrap gap-2">
      <button disabled={!selected} onClick={state.copySelected}>Copy</button>
      <button onClick={state.paste}>Paste</button>
      <button disabled={!selected} onClick={state.duplicateSelected}>Duplicate</button>
      <button disabled={!selected} onClick={() => state.groupSelected()}>Group</button>
      <button disabled={!selected} onClick={() => state.groupSelected(true)}>Ungroup</button>
    </div>
    {selected && <label className="flex items-center gap-2">Resize selection <input aria-label="Resize selection percent" type="number" min="10" max="500" value={percent} onChange={e => setPercent(Number(e.target.value))} className="w-14 rounded border p-1" />%<button onClick={() => state.resizeSelected(percent / 100)}>Apply</button></label>}
    <label className="flex items-center justify-between">Diagram theme<select aria-label="Diagram theme" value={state.theme} onChange={e => state.applyTheme(e.target.value as EditorPreferences['theme'])}>{Object.keys(THEMES).map(t => <option key={t} value={t}>{t}</option>)}</select></label>
    <label className="flex items-center justify-between">New connector routing<select aria-label="Connector routing" value={state.routing} onChange={e => state.setPrefs({ routing: e.target.value as EditorPreferences['routing'] })}><option value="elbow">Elbow</option><option value="straight">Straight</option><option value="curved">Curved</option></select></label>
    <label className="flex items-center justify-between">Smart alignment guides<input type="checkbox" checked={state.smartGuides} onChange={e => state.setPrefs({ smartGuides: e.target.checked })} /></label>
    <details open><summary className="cursor-pointer font-semibold">Layers</summary>
      <div className="mt-2 space-y-2">{state.layers.map(layer => <div key={layer.id} className="flex items-center gap-2">
        <input aria-label={`Layer name ${layer.name}`} className="min-w-0 flex-1 rounded border p-1" value={layer.name} onChange={e => state.setLayers(state.layers.map(l => l.id === layer.id ? { ...l, name: e.target.value } : l))} />
        <label title="Show layer"><input aria-label={`Show ${layer.name}`} type="checkbox" checked={layer.visible} onChange={e => state.setLayers(state.layers.map(l => l.id === layer.id ? { ...l, visible: e.target.checked } : l))} /> Show</label>
        <label title="Lock layer"><input aria-label={`Lock ${layer.name}`} type="checkbox" checked={layer.locked} onChange={e => state.setLayers(state.layers.map(l => l.id === layer.id ? { ...l, locked: e.target.checked } : l))} /> Lock</label>
      </div>)}</div>
      <button className="mt-2 text-indigo-600" onClick={() => state.setLayers([...state.layers, { id: crypto.randomUUID(), name: `Layer ${state.layers.length + 1}`, visible: true, locked: false }])}>+ Layer</button>
      {selected && <label className="mt-2 block">Move selection to <select aria-label="Move selection to layer" value="" onChange={e => state.assignLayer(e.target.value)}><option value="" disabled>Choose layer</option>{state.layers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>}
    </details>
    <details><summary className="cursor-pointer">Keyboard shortcuts</summary><p className="mt-2 leading-5">Ctrl/⌘: C copy, V paste, D duplicate, A select all, G group, Shift+G ungroup, Z undo, Shift+Z or Y redo, S save. Delete/Backspace deletes. +/− zoom, 0 fit. Shift selects multiple; Space+drag pans. Gantt: focus a bar and use ←/→ to shift a day; Shift+←/→ changes duration.</p></details>
  </div>;
}

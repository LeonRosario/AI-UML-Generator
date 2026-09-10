// Development-only visual fixture. No authentication, network writes or user diagrams.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../src/index.css';
import { EditorCanvas } from '../src/components/editor/canvas';
import { GanttEditor } from '../src/components/editor/gantt-editor';
import { DiagramTools } from '../src/components/editor/diagram-tools';
import { PropertiesPanel } from '../src/components/editor/properties-panel';
import { useEditorStore } from '../src/store/editor-store';
import { normalizeDiagram, createBlankDiagram } from '../src/lib/editor/diagram-utils';
import { EXTENDED_TEMPLATES } from '../src/data/extended-templates';
import { SEMANTIC_TYPES } from '../src/components/editor/nodes/semantic-symbol';
import { createUmlNode } from '../src/lib/editor/node-types';

useEditorStore.getState().loadDiagram(normalizeDiagram(EXTENDED_TEMPLATES[0].diagram));
function Fixture() {
  const state = useEditorStore();
  return <ReactFlowProvider><div className="flex h-screen flex-col"><nav className="flex flex-wrap gap-4 border-b bg-white p-3 text-xs">
    <button onClick={() => state.applyDiagram(normalizeDiagram(EXTENDED_TEMPLATES[0].diagram))}>Flowchart fixture</button>
    <button onClick={() => state.applyDiagram(normalizeDiagram(EXTENDED_TEMPLATES[6].diagram))}>Gantt fixture</button>
    <button onClick={() => state.applyDiagram({ ...createBlankDiagram(), nodes: [...SEMANTIC_TYPES].map((type, i) => createUmlNode(type, { x: i % 4 * 230, y: Math.floor(i / 4) * 160 })) })}>Shape gallery</button>
    <button onClick={state.selectAll}>Select all</button><button onClick={state.undo}>Undo</button><button onClick={state.redo}>Redo</button><button onClick={state.deleteSelected}>Delete selection</button>
    <span>{state.nodes.length} nodes / {state.edges.length} edges / {state.nodes.filter(n => n.selected).length} selected / {state.gantt?.tasks.length ?? 0} tasks</span>
  </nav><div className="flex min-h-0 flex-1"><main className="min-w-0 flex-1">{state.type === 'gantt' ? <GanttEditor /> : <EditorCanvas />}</main>{state.type !== 'gantt' && <aside className="w-80 overflow-auto border-l bg-white"><DiagramTools /><PropertiesPanel /></aside>}</div></div></ReactFlowProvider>;
}
const root = createRoot(document.getElementById('root')!);
root.render(<Fixture />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());

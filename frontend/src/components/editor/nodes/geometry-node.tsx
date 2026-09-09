import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { DiagramNodeData } from '@/types';
import { useEditorStore } from '@/store/editor-store';
import { InlineLabel, NodeHandles, nodeStyle } from './shared';
import { ActorFigure } from './actor-node';

const diamond = new Set(['flowDecisionNode','erRelationshipNode','activityDecisionNode','stateChoiceNode']);
const ellipse = new Set(['erAttributeNode','sequenceEntityNode']);
const cylinder = new Set(['flowDatabaseNode','erDatabaseNode','erTableNode','archServerNode','cloudStorageNode','networkServerNode']);
const circle = new Set(['flowConnectorNode','activityInitialNode','stateInitialNode']);
const final = new Set(['activityFinalNode','stateFinalNode']);
const pill = new Set(['flowTerminatorNode','activityActionNode','stateNode']);
const para = new Set(['flowInputOutputNode']);
const documentShape = new Set(['flowDocumentNode','artifactNode']);
const cloud = new Set(['networkCloudNode','archCloudNode','cloudNetworkNode']);
const actor = new Set(['sequenceActorNode','networkClientNode','archClientNode']);

function GeometryNodeComponent({ id, data, selected }: NodeProps<Node<DiagramNodeData>>) {
  const update = useEditorStore((s) => s.updateNodeData);
  const type = String(data.nodeType ?? ''); const label = String(data.label ?? 'Element');
  const style = nodeStyle(data); const color = String(data.borderColor ?? '#334155');
  const labelEl = <foreignObject x="14" y="35" width="132" height="48"><div className="flex h-full items-center justify-center px-2 text-center text-[12px] font-medium break-words" style={{ color: String(data.textColor ?? '#0f172a') }}><InlineLabel value={label} onRename={(value) => update(id, { label: value })} /></div></foreignObject>;
  if (actor.has(type)) return <div className="uml-node flex w-[100px] flex-col items-center gap-1 rounded-lg p-2" style={style}><NodeHandles /><ActorFigure className="h-11 w-11" color={String(data.textColor ?? '#334155')} /><InlineLabel value={label} onRename={(value) => update(id,{label:value})} /></div>;
  if (type === 'sequenceLifelineNode') return <div className="uml-node relative w-[130px]" style={style}><NodeHandles /><div className="border-b px-2 py-1.5 text-center text-xs">{label}</div><div className="mx-auto h-28 border-l border-dashed" style={{borderColor:color}} /></div>;
  if (type === 'activityForkNode') return <div className="uml-node h-3 w-36" style={{background:color}}><NodeHandles /></div>;
  if (final.has(type)) return <div className="uml-node flex h-10 w-10 items-center justify-center rounded-full border-2" style={{borderColor:color}}><NodeHandles /><span className="h-5 w-5 rounded-full" style={{background:color}} /></div>;
  if (circle.has(type)) return <div className="uml-node h-8 w-8 rounded-full" style={{background:color}}><NodeHandles /></div>;
  if (type === 'sequenceFragmentNode' || type === 'swimlaneNode') return <div className="uml-node min-h-32 min-w-56 border-2 border-dashed p-2" style={style}><NodeHandles /><InlineLabel value={label} onRename={(value) => update(id,{label:value})} /></div>;
  if (type === 'networkRouterNode' || type === 'networkSwitchNode' || type === 'networkFirewallNode') return <div className="uml-node flex h-20 w-36 flex-col items-center justify-center gap-1 rounded-lg border-2" style={style}><NodeHandles /><div className="text-xl">{type === 'networkFirewallNode' ? '▦' : '⇄'}</div><InlineLabel value={label} onRename={(value)=>update(id,{label:value})} /></div>;
  return <div className={`uml-node relative h-[92px] w-[160px] ${selected ? 'ring-2 ring-indigo-400' : ''}`}><NodeHandles />
    <svg viewBox="0 0 160 92" className="h-full w-full overflow-visible">
      {diamond.has(type) && <polygon points="80,2 158,46 80,90 2,46" fill={String(data.fill ?? '#fff')} stroke={color} strokeWidth="2" />}
      {ellipse.has(type) && <ellipse cx="80" cy="46" rx="77" ry="40" fill={String(data.fill ?? '#fff')} stroke={color} strokeWidth="2" />}
      {para.has(type) && <polygon points="20,2 158,2 140,90 2,90" fill={String(data.fill ?? '#fff')} stroke={color} strokeWidth="2" />}
      {pill.has(type) && <rect x="2" y="12" width="156" height="68" rx="34" fill={String(data.fill ?? '#fff')} stroke={color} strokeWidth="2" />}
      {documentShape.has(type) && <path d="M3 2h154v68c-25-13-51 13-77 0C54 57 28 83 3 70z" fill={String(data.fill ?? '#fff')} stroke={color} strokeWidth="2" />}
      {cylinder.has(type) && <><path d="M3 14c0-16 154-16 154 0v62c0 16-154 16-154 0z" fill={String(data.fill ?? '#fff')} stroke={color} strokeWidth="2" /><ellipse cx="80" cy="14" rx="77" ry="12" fill={String(data.fill ?? '#fff')} stroke={color} strokeWidth="2" /></>}
      {cloud.has(type) && <path d="M35 76h86a26 26 0 0 0 2-52A37 37 0 0 0 53 31 25 25 0 0 0 35 76z" fill={String(data.fill ?? '#fff')} stroke={color} strokeWidth="2" />}
      {!diamond.has(type)&&!ellipse.has(type)&&!para.has(type)&&!pill.has(type)&&!documentShape.has(type)&&!cylinder.has(type)&&!cloud.has(type) && <rect x="2" y="2" width="156" height="88" rx={type === 'flowProcessNode' ? 0 : 8} fill={String(data.fill ?? '#fff')} stroke={color} strokeWidth="2" />}
      {labelEl}
    </svg></div>;
}
export const GeometryNode = memo(GeometryNodeComponent);

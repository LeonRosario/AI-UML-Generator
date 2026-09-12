import { SemanticSymbol, SEMANTIC_TYPES } from './nodes/semantic-symbol';
import { ActorFigure } from './nodes/actor-node';

type ShapePreviewProps = { type: string; className?: string };
const diamonds = new Set(['flowDecisionNode', 'erRelationshipNode', 'activityDecisionNode', 'stateChoiceNode', 'decisionNode']);
const ellipses = new Set(['useCaseNode', 'erAttributeNode', 'sequenceEntityNode', 'userNode']);
const cylinders = new Set(['databaseNode', 'flowDatabaseNode', 'erDatabaseNode', 'erTableNode', 'archServerNode', 'cloudStorageNode', 'networkServerNode', 'dataStoreNode']);
const pills = new Set(['flowTerminatorNode', 'activityActionNode', 'stateNode', 'messageNode', 'returnMessageNode']);
const documents = new Set(['flowDocumentNode', 'artifactNode', 'commentNode', 'noteNode']);
const clouds = new Set(['networkCloudNode', 'archCloudNode', 'cloudNetworkNode']);
const actors = new Set(['actorNode', 'sequenceActorNode', 'networkClientNode', 'archClientNode', 'externalEntityNode']);
const packages = new Set(['packageNode', 'componentNode', 'interactionNode', 'processNode', 'dfdProcessNode']);

/** A compact rendering of the same semantic geometry presented on the canvas. */
export function ShapePreview({ type, className = '' }: ShapePreviewProps) {
  const stroke = '#475569';
  if (SEMANTIC_TYPES.has(type)) return <div className={className}><SemanticSymbol type={type} color={stroke} /></div>;
  if (actors.has(type)) return <ActorFigure aria-hidden="true" className={`h-11 w-11 ${className}`} color={stroke} />;
  if (type === 'sequenceLifelineNode') return <svg aria-hidden="true" viewBox="0 0 96 52" className={className}><rect x="25" y="3" width="46" height="14" rx="2" fill="white" stroke={stroke} strokeWidth="2" /><path d="M48 17v32" stroke={stroke} strokeWidth="2" strokeDasharray="4 3" /></svg>;
  if (type === 'activityInitialNode' || type === 'stateInitialNode' || type === 'flowConnectorNode' || type === 'activityForkNode') return <svg aria-hidden="true" viewBox="0 0 96 52" className={className}><circle cx="48" cy="26" r="13" fill={stroke} /></svg>;
  if (type === 'activityFinalNode' || type === 'stateFinalNode') return <svg aria-hidden="true" viewBox="0 0 96 52" className={className}><circle cx="48" cy="26" r="15" fill="white" stroke={stroke} strokeWidth="3" /><circle cx="48" cy="26" r="8" fill={stroke} /></svg>;
  if (type === 'classNode' || type === 'interfaceNode' || type === 'abstractClassNode' || type === 'objectNode' || type === 'entityNode' || type === 'erEntityNode' || type === 'erWeakEntityNode') return <svg aria-hidden="true" viewBox="0 0 96 52" className={className}><rect x="15" y="3" width="66" height="46" rx="1" fill="white" stroke={stroke} strokeWidth="2" /><path d="M15 18h66M15 34h66" stroke={stroke} strokeWidth="2" /></svg>;
  if (type === 'boundaryNode' || type === 'systemBoundaryNode' || type === 'sequenceBoundaryNode' || type === 'deploymentEnvironmentNode') return <svg aria-hidden="true" viewBox="0 0 96 52" className={className}><rect x="8" y="4" width="80" height="44" rx="2" fill="white" stroke={stroke} strokeWidth="2" strokeDasharray="5 3" /></svg>;
  if (type === 'messageNode' || type === 'returnMessageNode' || type === 'createMessageNode' || type === 'destroyMessageNode' || type === 'dataFlowNode') return <svg aria-hidden="true" viewBox="0 0 96 52" className={className}><path d="M10 26H66" stroke={stroke} strokeWidth="2" /><path d="m58 19 12 7-12 7" fill="white" stroke={stroke} strokeWidth="2" /></svg>;
  if (type.startsWith('rel:')) return <svg aria-hidden="true" viewBox="0 0 96 52" className={className}><path d="M13 26h66" stroke={stroke} strokeWidth="2" /><path d="m70 19 12 7-12 7" fill="white" stroke={stroke} strokeWidth="2" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 96 52" className={className}>
    {diamonds.has(type) && <polygon points="48,3 88,26 48,49 8,26" fill="white" stroke={stroke} strokeWidth="2" />}
    {ellipses.has(type) && <ellipse cx="48" cy="26" rx="41" ry="20" fill="white" stroke={stroke} strokeWidth="2" />}
    {type === 'flowInputOutputNode' && <polygon points="18,3 88,3 78,49 8,49" fill="white" stroke={stroke} strokeWidth="2" />}
    {pills.has(type) && <rect x="7" y="10" width="82" height="32" rx="16" fill="white" stroke={stroke} strokeWidth="2" />}
    {documents.has(type) && <path d="M8 3h80v34c-13-7-27 7-40 0-13-7-27 7-40 0z" fill="white" stroke={stroke} strokeWidth="2" />}
    {cylinders.has(type) && <><path d="M9 11c0-11 78-11 78 0v29c0 11-78 11-78 0z" fill="white" stroke={stroke} strokeWidth="2" /><ellipse cx="48" cy="11" rx="39" ry="8" fill="white" stroke={stroke} strokeWidth="2" /></>}
    {clouds.has(type) && <path d="M22 42h52a15 15 0 0 0 1-30 22 22 0 0 0-42 5 14 14 0 0 0-11 25z" fill="white" stroke={stroke} strokeWidth="2" />}
    {packages.has(type) && <><path d="M16 17V10h64l10 7v30H16z" fill="white" stroke={stroke} strokeWidth="2" /><path d="M16 17h74l-10-7" fill="none" stroke={stroke} strokeWidth="2" /></>}
    {type === 'activityForkNode' && <rect x="8" y="22" width="80" height="7" rx="1" fill={stroke} />}
    {!diamonds.has(type) && !ellipses.has(type) && type !== 'flowInputOutputNode' && !pills.has(type) && !documents.has(type) && !cylinders.has(type) && !clouds.has(type) && !packages.has(type) && type !== 'activityForkNode' && <rect x="8" y="5" width="80" height="42" rx={type === 'flowProcessNode' ? 0 : 4} fill="white" stroke={stroke} strokeWidth="2" />}
  </svg>;
}

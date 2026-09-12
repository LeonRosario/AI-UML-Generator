import { createElement, memo } from 'react';
import type { NodeProps, NodeTypes } from '@xyflow/react';
import { ActorNode } from './actor-node';
import { ClassNode } from './class-node';
import { ComponentNode } from './component-node';
import { DatabaseNode } from './database-node';
import { GenericNode } from './generic-node';
import { NoteNode } from './note-node';
import { PackageNode } from './package-node';
import { UseCaseNode } from './use-case-node';
import { GeometryNode } from './geometry-node';

const BASE_NODE_TYPES: NodeTypes = {
  classNode: ClassNode,
  interfaceNode: ClassNode,
  abstractClassNode: ClassNode,
  objectNode: ClassNode,
  actorNode: ActorNode,
  useCaseNode: UseCaseNode,
  packageNode: PackageNode,
  systemBoundaryNode: PackageNode,
  componentNode: ComponentNode,
  umlNode: GenericNode,
  noteNode: NoteNode,
  databaseNode: DatabaseNode,
  rectangleNode: GenericNode,
  circleNode: GenericNode,
  textNode: GenericNode,
  imageNode: GenericNode,
  interfaceSymbolNode: GenericNode,
  /* legacy types kept for existing templates / saved diagrams */
  entityNode: DatabaseNode,
  genericNode: GenericNode,
  ...Object.fromEntries([
    'flowProcessNode','flowDecisionNode','flowTerminatorNode','flowInputOutputNode','flowDocumentNode','flowDatabaseNode','flowConnectorNode','flowOffPageNode',
    'erEntityNode','erWeakEntityNode','erAttributeNode','erRelationshipNode','erDatabaseNode','erTableNode',
    'sequenceActorNode','sequenceLifelineNode','sequenceBoundaryNode','sequenceControlNode','sequenceEntityNode','sequenceFragmentNode',
    'activityInitialNode','activityActionNode','activityDecisionNode','activityForkNode','activityFinalNode','swimlaneNode',
    'stateInitialNode','stateNode','stateChoiceNode','stateFinalNode','deploymentDeviceNode','deploymentNode','deploymentEnvironmentNode','artifactNode',
    'networkRouterNode','networkSwitchNode','networkFirewallNode','networkServerNode','networkClientNode','networkCloudNode',
    'archServerNode','archClientNode','archApiNode','archCacheNode','archQueueNode','archServiceNode','archGatewayNode','archCloudNode',
    'cloudComputeNode','cloudStorageNode','cloudNetworkNode','cloudMonitoringNode',
    'enumerationNode','boundaryNode','controlNode','dataStoreNode','messageNode','returnMessageNode','selfMessageNode','createMessageNode','destroyMessageNode',
    'commentNode','constraintNode','stereotypeNode','interactionNode','signalNode','portNode','processNode','externalEntityNode','dfdProcessNode','dataFlowNode',
  ].map((type) => [type, GeometryNode])),
};

// Scaling the inner layout scales labels and notation together while React Flow
// retains the actual measured bounding box for connectors and hit testing.
export const EDITOR_NODE_TYPES: NodeTypes = Object.fromEntries(Object.entries(BASE_NODE_TYPES).map(([type, Component]) => [type, memo(function ScaledNode(props: NodeProps) {
  const scale = Number(props.data.scale ?? 1);
  if (scale === 1) return createElement(Component, props);
  return createElement('div', { className: 'scaled-node', style: { zoom: scale, width: props.width ? props.width / scale : undefined, height: props.height ? props.height / scale : undefined } }, createElement(Component, props));
})]));

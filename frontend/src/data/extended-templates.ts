import type { DiagramType, Template } from '@/types';
import { projectPreset, dateDay, dayDate, today } from '@/lib/editor/gantt';

function graph(id: string, name: string, type: DiagramType, category: string, shapes: [string, string][], links: [number, number, string][]): Template {
  return { id, name, description: `${name}: an editable ${category.toLowerCase()} starting point.`, category, diagramType: type, uses: 0,
    diagram: { id, name, type, createdAt: '', updatedAt: '', nodes: shapes.map(([shape, label], i) => ({ type: shape, position: { x: (i % 3) * 270, y: Math.floor(i / 3) * 190 }, data: { label, nodeType: shape, type }, id: `${id}-${i}` })), edges: links.map(([a, b, label], i) => ({ id: `${id}-e${i}`, source: `${id}-${a}`, target: `${id}-${b}`, type: 'uml-edge', label, data: { relationship: 'directed-association', routing: 'elbow' } })) } };
}
export const EXTENDED_TEMPLATES: Template[] = [
  graph('tpl-approval-flow', 'Purchase approval', 'flowchart', 'Flowchart', [['flowTerminatorNode', 'Start'], ['flowInputOutputNode', 'Submit request'], ['flowDecisionNode', 'Approved?'], ['flowProcessNode', 'Revise request'], ['flowDocumentNode', 'Issue purchase order'], ['flowTerminatorNode', 'Done']], [[0, 1, ''], [1, 2, ''], [2, 3, 'No'], [3, 1, 'Retry'], [2, 4, 'Yes'], [4, 5, '']]),
  graph('tpl-support-flow', 'Support triage', 'flowchart', 'Flowchart', [['flowTerminatorNode', 'New ticket'], ['flowDecisionNode', 'Known issue?'], ['flowProcessNode', 'Send solution'], ['flowOffPageNode', 'Escalate'], ['flowTerminatorNode', 'Resolved']], [[0, 1, ''], [1, 2, 'Yes'], [1, 3, 'No'], [2, 4, '']]),
  graph('tpl-office-network', 'Secure office network', 'network', 'Network', [['networkCloudNode', 'Internet'], ['networkFirewallNode', 'Firewall'], ['networkRouterNode', 'Router'], ['networkSwitchNode', 'Office switch'], ['networkServerNode', 'File server'], ['networkClientNode', 'Workstations']], [[0, 1, 'WAN'], [1, 2, 'Trusted'], [2, 3, 'LAN'], [3, 4, 'SMB'], [3, 5, 'Ethernet']]),
  graph('tpl-network-dmz', 'Public service DMZ', 'network', 'Network', [['networkCloudNode', 'Internet'], ['networkFirewallNode', 'Perimeter firewall'], ['networkServerNode', 'Web server / DMZ'], ['networkFirewallNode', 'Internal firewall'], ['networkServerNode', 'Application server']], [[0, 1, 'HTTPS'], [1, 2, 'HTTPS'], [2, 3, 'API'], [3, 4, 'API']]),
  graph('tpl-cloud-system', 'Cloud service platform', 'architecture', 'Architecture', [['archGatewayNode', 'API gateway'], ['archServiceNode', 'Order service'], ['archCacheNode', 'Session cache'], ['archQueueNode', 'Event queue'], ['cloudComputeNode', 'Worker pool'], ['cloudMonitoringNode', 'Observability']], [[0, 1, 'REST'], [1, 2, 'Lookup'], [1, 3, 'Events'], [3, 4, 'Consume'], [4, 5, 'Metrics']]),
  graph('tpl-web-system', 'Web application architecture', 'architecture', 'Architecture', [['archClientNode', 'Browser'], ['archApiNode', 'Public API'], ['archServiceNode', 'Application'], ['cloudStorageNode', 'Object storage'], ['archCacheNode', 'Cache']], [[0, 1, 'HTTPS'], [1, 2, 'Calls'], [2, 3, 'Read / write'], [2, 4, 'Cache']]),
  { id: 'tpl-gantt-launch', name: 'Product launch schedule', description: 'Design, build, test and launch with team lanes and dependencies.', category: 'Gantt', diagramType: 'gantt', uses: 0,
    diagram: { id: 'gantt-launch', name: 'Product launch schedule', type: 'gantt', nodes: [], edges: [], gantt: projectPreset(), createdAt: '', updatedAt: '' } },
  { id: 'tpl-gantt-event', name: 'Event planning schedule', description: 'Parallel venue and promotion work leading to an event milestone.', category: 'Gantt', diagramType: 'gantt', uses: 0,
    diagram: { id: 'gantt-event', name: 'Event planning schedule', type: 'gantt', nodes: [], edges: [], createdAt: '', updatedAt: '', gantt: { tasks: [
      { id: 'venue', name: 'Book venue', start: today(), duration: 5, assignee: 'Operations', progress: 0, milestone: false, dependencies: [] },
      { id: 'promote', name: 'Promote event', start: today(), duration: 14, assignee: 'Marketing', progress: 0, milestone: false, dependencies: [] },
      { id: 'prepare', name: 'Prepare venue', start: dayDate(dateDay(today()) + 5), duration: 9, assignee: 'Operations', progress: 0, milestone: false, dependencies: ['venue'] },
      { id: 'event', name: 'Event day', start: dayDate(dateDay(today()) + 14), duration: 0, assignee: 'Operations', progress: 0, milestone: true, dependencies: ['prepare', 'promote'] },
    ] } } },
];

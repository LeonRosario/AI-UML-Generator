import type { Diagram, DiagramType } from '@/types';
import { DIAGRAMS_BY_TYPE } from '@/data/diagrams';
import { uid } from '@/data/diagrams';

export type GenerationStage = {
  label: string;
  progress: number;
};

export const GENERATION_STAGES: GenerationStage[] = [
  { label: 'Analyzing requirements…', progress: 15 },
  { label: 'Identifying entities…', progress: 40 },
  { label: 'Building relationships…', progress: 70 },
  { label: 'Generating UML…', progress: 95 },
];

const TYPE_NAMES: Record<DiagramType, string> = {
  'use-case': 'Use Case',
  class: 'Class',
  sequence: 'Sequence',
  activity: 'Activity',
  er: 'ER Diagram',
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deriveName(requirements: string, type: DiagramType): string {
  const firstLine = requirements.split(/[\n.]/)[0].trim().replace(/\.$/, '');
  const slug = firstLine.length > 34 ? firstLine.slice(0, 34).trim() + '…' : firstLine;
  return `${slug} — ${TYPE_NAMES[type]}`;
}

function jitter(diagram: Diagram): Diagram {
  return {
    ...diagram,
    id: uid('diag'),
    name: diagram.name,
    nodes: diagram.nodes.map((n) => ({ ...n, id: uid('node'), position: { x: n.position.x, y: n.position.y } })),
    edges: diagram.edges.map((e) => ({ ...e, id: uid('edge') })),
  };
}

/**
 * Simulated AI generation. Replace the internals with a real backend call
 * (POST /api/generate) once the API is available — the signature stays the same.
 * 
 * @throws Error if diagram type is not found or generation fails
 */
export async function generateDiagram(
  requirements: string,
  type: DiagramType,
  onStage?: (stage: GenerationStage) => void,
): Promise<Diagram> {
  try {
    for (const stage of GENERATION_STAGES) {
      onStage?.(stage);
      await delay(stage.progress > 70 ? 650 : 450);
    }
    const base = DIAGRAMS_BY_TYPE[type];
    if (!base) {
      throw new Error(`Unknown diagram type: ${type}`);
    }
    return {
      ...jitter(base),
      name: deriveName(requirements, type),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    // Log error for debugging (replace with proper logging service in production)
    console.error('Failed to generate diagram:', error);
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/*  AI chat                                                            */
/* ------------------------------------------------------------------ */

export type ChatReply = {
  message: string;
  applied?: string[];
};

const REPLY_TEMPLATES: Array<(message: string) => string> = [
  (m) =>
    `Done. I analyzed your request and updated the diagram${m.toLowerCase().includes('actor') ? ': added the actor and connected it to the relevant use cases.' : '.'}`,
  (m) => `I've applied that change to the current diagram. The affected elements are now updated and connected.`,
  (m) => `Understood. I refined the diagram structure to reflect "${m.slice(0, 48)}". Review the updated elements on the canvas.`,
];

export async function sendChatMessage(_message: string, _diagram: Diagram): Promise<ChatReply> {
  await delay(900);
  const tpl = REPLY_TEMPLATES[Math.floor(Math.random() * REPLY_TEMPLATES.length)];
  const applied = ['Updated nodes', 'Recalculated relationships'];
  return { message: tpl(_message), applied };
}

export async function explainDiagram(_diagram: Diagram): Promise<string> {
  await delay(700);
  return (
    'This diagram models the main actors and entities of your system. Solid edges represent structural ' +
    'relationships such as association and composition. In a class diagram, attributes define state and ' +
    'methods define behavior. Try asking me to add a relationship or rename a class.'
  );
}

export async function findIssues(_diagram: Diagram): Promise<string> {
  await delay(800);
  return (
    'I scanned the diagram and found 2 minor issues:\n\n' +
    '• Some classes have no methods, which may indicate missing behavior.\n' +
    '• A few relationships lack multiplicity labels.\n\n' +
    'Ask me to "fix issues" and I will apply the corrections.'
  );
}

export async function improveDiagram(_diagram: Diagram): Promise<string> {
  await delay(1000);
  return 'Done. I normalized the naming convention, aligned the layout on the grid, and added multiplicity labels where they were missing.';
}

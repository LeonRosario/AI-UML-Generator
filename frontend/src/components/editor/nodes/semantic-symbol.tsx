import type { ReactNode } from 'react';

/** Original, provider-neutral symbols shared by the palette and canvas. */
export const SEMANTIC_TYPES = new Set(['networkFirewallNode', 'archApiNode', 'archCacheNode', 'archQueueNode', 'archServiceNode', 'archGatewayNode', 'cloudComputeNode', 'cloudMonitoringNode', 'deploymentDeviceNode', 'deploymentEnvironmentNode', 'erWeakEntityNode', 'flowOffPageNode', 'sequenceBoundaryNode', 'sequenceControlNode']);

export function SemanticSymbol({ type, color = '#334155', fill = '#ffffff', strokeWidth = 2, children }: { type: string; color?: string; fill?: string; strokeWidth?: number; children?: ReactNode }) {
  const shapeOnly = ['erWeakEntityNode', 'flowOffPageNode', 'sequenceBoundaryNode', 'sequenceControlNode', 'deploymentDeviceNode', 'deploymentEnvironmentNode'].includes(type);
  return <svg viewBox="0 0 160 92" className="h-full w-full overflow-visible" aria-label={type.replace(/Node$/, '')}>
    <g stroke={color} strokeWidth={strokeWidth} fill={fill} strokeLinejoin="round" strokeLinecap="round">
      {!shapeOnly && <rect x="2" y="2" width="156" height="88" rx="5" />}
      {type === 'erWeakEntityNode' && <><rect x="2" y="2" width="156" height="88" /><rect x="8" y="8" width="144" height="76" /></>}
      {type === 'flowOffPageNode' && <polygon points="3,3 157,3 157,61 80,89 3,61" />}
      {type === 'sequenceBoundaryNode' && <><circle cx="86" cy="23" r="16" /><path d="M52 7v32M52 23h18" fill="none" /></>}
      {type === 'sequenceControlNode' && <><circle cx="80" cy="25" r="16" /><path d="m80 3-8 6 8 6" fill="none" /></>}
      {type === 'deploymentDeviceNode' && <><path d="M3 17 20 3h137v71l-17 15H3Z" /><path d="M3 17h137v72M140 17l17-14" fill="none" /><text x="70" y="32" stroke="none" fill={color} textAnchor="middle" fontSize="10">«device»</text></>}
      {type === 'deploymentEnvironmentNode' && <><rect x="3" y="3" width="154" height="86" /><rect x="10" y="10" width="140" height="72" strokeDasharray="5 3" /><text x="80" y="28" stroke="none" fill={color} textAnchor="middle" fontSize="9">«executionEnvironment»</text></>}
      <g fill="none">
        {type === 'networkFirewallNode' && <><path d="M49 36V13h62v23ZM49 21h62M49 29h62M65 13v8m30-8v8M78 21v8M62 29v7m32-7v7" /><path d="M81 34c-10-8 1-12 0-19 10 8 11 14 5 19" fill={fill} /></>}
        {type === 'archApiNode' && <><path d="m64 13-12 11 12 11m32-22 12 11-12 11M86 10 74 38" /><circle cx="41" cy="24" r="3" /><circle cx="119" cy="24" r="3" /></>}
        {type === 'archCacheNode' && <><path d="M55 14h48M55 24h48M55 34h48" /><path d="m82 8-12 19h12l-5 15 17-23H82Z" fill={fill} /></>}
        {type === 'archQueueNode' && <><path d="M40 25h12m56 0h13m-6-5 6 5-6 5" /><rect x="55" y="14" width="13" height="22" /><rect x="73" y="14" width="13" height="22" /><rect x="91" y="14" width="13" height="22" /></>}
        {type === 'archServiceNode' && <><path d="m80 7 6 5 8-1 2 8 6 5-6 6-2 8-8-1-6 5-6-5-8 1-2-8-6-6 6-5 2-8 8 1Z" /><circle cx="80" cy="24" r="7" /></>}
        {type === 'archGatewayNode' && <><path d="M66 38V12h28v26M66 17h28M41 25h23m-7-6 7 6-7 6M96 25h23m-7-6 7 6-7 6" /><path d="M75 22h10v16" /></>}
        {type === 'cloudComputeNode' && <><rect x="65" y="10" width="30" height="30" rx="3" /><rect x="72" y="17" width="16" height="16" /><path d="M71 5v5m9-5v5m9-5v5M71 40v5m9-5v5m9-5v5M60 16h5m-5 9h5m-5 9h5M95 16h5m-5 9h5m-5 9h5" /></>}
        {type === 'cloudMonitoringNode' && <><rect x="51" y="8" width="58" height="31" rx="3" /><path d="M70 44h20M80 39v5M56 26h9l7-12 10 19 8-12h13" /></>}
      </g>
    </g>
    {children}
  </svg>;
}

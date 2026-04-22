import { useEffect, useRef } from 'react';
import { Terminal, Circle } from 'lucide-react';

interface Props {
  lines: string[];
}

const AGENT_COLORS: Record<string, string> = {
  planner: 'text-purple-400',
  plan_approval: 'text-yellow-400',
  searcher: 'text-cyan-400',
  reader: 'text-orange-400',
  writer: 'text-emerald-400',
};

const AGENT_DOT_COLORS: Record<string, string> = {
  planner: 'text-purple-500',
  plan_approval: 'text-yellow-500',
  searcher: 'text-cyan-500',
  reader: 'text-orange-500',
  writer: 'text-emerald-500',
};

export default function LiveOutput({ lines }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  return (
    <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/50 border-b border-gray-700/30">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/50" />
        </div>
        <Terminal className="h-3.5 w-3.5 text-gray-500 ml-2" />
        <span className="text-xs font-medium text-gray-500">Live Output</span>
        <span className="text-xs text-gray-700 ml-auto font-mono">{lines.length} events</span>
      </div>
      <div className="p-4 h-80 overflow-y-auto font-mono text-xs leading-relaxed">
        {lines.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
              <p className="text-gray-600">Waiting for agent activity...</p>
            </div>
          </div>
        ) : (
          lines.map((line, i) => {
            const agentMatch = line.match(/^\[(\w+)\]/);
            const agentName = agentMatch ? agentMatch[1] : '';

            return (
              <div key={i} className="py-0.5 flex items-start gap-2 hover:bg-white/[0.02] px-1 rounded">
                <span className="text-gray-700 select-none w-6 text-right flex-shrink-0">{i + 1}</span>
                {agentName ? (
                  <>
                    <Circle className={`h-2 w-2 mt-1.5 flex-shrink-0 fill-current ${AGENT_DOT_COLORS[agentName] || 'text-gray-500'}`} />
                    <span>
                      <span className={AGENT_COLORS[agentName] || 'text-gray-400'}>{agentName}</span>
                      <span className="text-gray-400">{line.slice(line.indexOf(']') + 1)}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <Circle className="h-2 w-2 mt-1.5 flex-shrink-0 text-gray-700 fill-current" />
                    <span className="text-gray-400">{line}</span>
                  </>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

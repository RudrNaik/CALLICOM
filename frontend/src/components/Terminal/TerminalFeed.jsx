import { useEffect, useRef } from "react";

const TerminalFeed = ({ logs }) => {
  const feedRef = useRef(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      ref={feedRef}
      className="h-full w-full bg-neutral-900/80 text-gray-300 text-sm font-mono border border-gray-400 p-3 overflow-hidden"
    >
      {logs.map((log, i) => (
        <div key={i} className="whitespace-pre-wrap">
          &gt;&gt; {log}
        </div>
      ))}
    </div>
  );
};

export default TerminalFeed;

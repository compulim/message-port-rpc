import { messagePortRPC } from 'message-port-rpc';
import React, { useCallback, useEffect, useRef, useState } from 'react';

type Fn = (x: number, y: number) => Promise<number>;

const App = () => {
  const [result, setResult] = useState<number>(NaN);
  const rpcRef = useRef<Fn | null>(null);

  const handleClick = useCallback(() => {
    rpcRef.current?.(1, 2).then(setResult);
  }, [rpcRef]);

  useEffect(() => {
    const worker = new Worker('./static/worker/js/main.js');

    const { port1, port2 } = new MessageChannel();

    worker.postMessage(undefined, [port2]);

    rpcRef.current = messagePortRPC<Fn>(port1);

    return () => {
      port1.close();
      port2.close();
      worker.terminate();
    };
  }, []);

  return (
    <div>
      <h1>Hello, World!</h1>
      <button onClick={handleClick} type="button">
        Call
      </button>
      &nbsp;
      {!isNaN(result) && <span>Result is {result}</span>}
    </div>
  );
};

export default App;

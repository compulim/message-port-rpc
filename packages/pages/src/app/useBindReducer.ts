import { messagePortRPC } from 'message-port-rpc';
import { useMemo } from 'react';

import type { Dispatch, Reducer, ReducerAction, ReducerState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function useBindReducer<R extends Reducer<any, any>>(
  state: ReducerState<R>,
  dispatch: Dispatch<ReducerAction<R>>,
  port?: MessagePort
): void {
  const sendState = useMemo<((state: ReducerState<R>) => Promise<void>) | undefined>(
    () => port && messagePortRPC<(state: ReducerState<R>) => void, (action: ReducerAction<R>) => void>(port, dispatch),
    [dispatch, port]
  );

  // TODO: For `port`, consider either:
  //       - a `ports` array;
  //       - the `port` cannot be optional.

  useMemo(() => sendState?.(state), [sendState, state]);
}

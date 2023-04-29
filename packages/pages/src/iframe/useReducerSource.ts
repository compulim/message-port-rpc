import { messagePortRPC } from 'message-port-rpc';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Dispatch, Reducer, ReducerAction, ReducerState } from 'react';

// TODO: Add overloaded types to support:
// - Reducer vs. ReducerStateWithoutAction
// - initializer vs. no initializer

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function useReducerSource<R extends Reducer<any, any>, I>(
  port: MessagePort,
  initializerArg: I,
  initializer?: (arg: I) => ReducerState<R>
): readonly [ReducerState<R>, Dispatch<ReducerAction<R>>] | readonly [ReducerState<R>] {
  const dispatchRef = useRef<ReturnType<typeof messagePortRPC<(action: ReducerAction<R>) => void>>>();
  const [state, setState] = useState<ReducerState<R>>(
    () => (initializer?.(initializerArg) || initializerArg || {}) as ReducerState<R>
  );

  useMemo(() => {
    dispatchRef.current =
      port && messagePortRPC<(action: ReducerAction<R>) => void, (state: ReducerState<R>) => void>(port, setState);
  }, [dispatchRef, port, setState]);

  useEffect(() => {
    const { current } = dispatchRef;

    return current && (() => current.detach());
  }, [dispatchRef]);

  // The "dispatch" callback must not change over the lifetime of the hosting component.
  // Same as `useReducer` hook, when the reducer function change, its dispatch function would not change.
  const dispatch = useCallback<(action: ReducerAction<R>) => void>(
    action => dispatchRef.current?.(action),
    [dispatchRef]
  );

  return useMemo(() => Object.freeze([state, dispatch]), [dispatch, state]);
}

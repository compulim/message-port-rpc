import { messagePortRPC } from 'message-port-rpc';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type Reducer,
  type ReducerAction,
  type ReducerState
} from 'react';

// TODO: Add overloaded types to support:
// - Reducer vs. ReducerStateWithoutAction
// - initializer vs. no initializer

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function useReducerSource<R extends Reducer<any, any>, I>(
  port: MessagePort,
  initializerArg: I,
  initializer?: (arg: I) => ReducerState<R>
): readonly [ReducerState<R>, Dispatch<ReducerAction<R>>] {
  type DispatchStub = (action: ReducerAction<R>) => void;
  type SetStateStub = (state: ReducerState<R>) => void;

  const dispatchRef = useRef<ReturnType<typeof messagePortRPC<(action: ReducerAction<R>) => void>>>();
  const [state, setState] = useState<ReducerState<R>>(
    () => (initializer?.(initializerArg) || initializerArg || {}) as ReducerState<R>
  );

  // We are using `useMemo()` to make sure the `dispatch` function returned will be operational as soon as possible.
  const session = useMemo<[AbortController, MessageChannel]>(() => {
    const abortController = new AbortController();
    const messageChannel = new MessageChannel();
    const { port1, port2 } = messageChannel;

    messagePortRPC<(port: MessagePort) => void>(port)
      .withOptions({
        signal: abortController.signal,
        transfer: [port1]
      })(port1)
      .catch(() => {
        // Ignore intentional rejection.
      });

    dispatchRef.current = messagePortRPC<DispatchStub, SetStateStub>(port2, setState);

    return [abortController, messageChannel];
  }, [port, setState]);

  useEffect(
    () => () => {
      const [abortController, messageChannel] = session;

      // Calling abort() will unsubscribe from state change.
      abortController.abort();

      // Close all ports, so `setState` will never be called.
      messageChannel.port1.close();
      messageChannel.port2.close();
    },
    [session]
  );

  // The `dispatch` callback must not change over the lifetime of the hosting component.
  // Same as `useReducer` hook, when the reducer function change, its dispatch function would not change.
  const dispatch = useCallback<(action: ReducerAction<R>) => void>(
    action => dispatchRef.current?.(action),
    [dispatchRef]
  );

  return useMemo(() => Object.freeze([state, dispatch]), [dispatch, state]);
}

import { messagePortRPC } from 'message-port-rpc';
import { useEffect, useMemo, useRef, type Dispatch, type Reducer, type ReducerAction, type ReducerState } from 'react';
import { useRefFrom } from 'use-ref-from';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function useBindReducer<R extends Reducer<any, any>>(
  state: ReducerState<R>,
  dispatch: Dispatch<ReducerAction<R>>
): MessagePort {
  type DispatchStub = (action: ReducerAction<R>) => void;
  type SetStateStub = (state: ReducerState<R>) => void;

  const dispatchRef = useRefFrom(dispatch);
  const setStateStubsRef = useRef<Set<SetStateStub>>(new Set());
  const stateRef = useRefFrom(state);

  const messageChannel = useMemo<MessageChannel>(() => {
    const messageChannel = new MessageChannel();

    // The first layer of RPC is to accept new `useReducerSource` subscriber.
    messagePortRPC<(port: MessagePort) => Promise<never>>(messageChannel.port1, function (port) {
      const { signal } = this;

      // This Promise is intentionally never resolve/reject.
      // When client dismount, we need a signal to stop calling `setState`. However, `MessagePort` has no `end` event.
      // Thus, we are using `AbortSignal` from client to tell the server to unsubscribe.
      // So this Promise will never resolve/reject, it will be aborted by the client on unmount.
      return new Promise<never>(() => {
        // The second layer of RPC is the actual [state, dispatch].
        const setStateStub = messagePortRPC<SetStateStub, DispatchStub>(port, dispatchRef.current);

        // Subscribe to state change.
        setStateStubsRef.current.add(setStateStub);

        // Send the initial state.
        setStateStub(stateRef.current);

        // Unsubscribe from state change.
        signal.addEventListener('abort', () => setStateStubsRef.current.delete(setStateStub));
      });
    });

    return messageChannel;
  }, [dispatchRef, setStateStubsRef, stateRef]);

  useEffect(
    () => () => {
      messageChannel.port1.close();
      messageChannel.port2.close();
    },
    [messageChannel]
  );

  useMemo(() => setStateStubsRef.current.forEach(sendStateStub => sendStateStub(state)), [setStateStubsRef, state]);

  return messageChannel.port2;
}

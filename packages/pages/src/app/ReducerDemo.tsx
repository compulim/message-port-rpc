import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import TextBox from '../common/TextBox';
import useBindReducer from './useBindReducer';

import type { Reducer } from '../common/types';
import type { ReducerAction, ReducerState } from 'react';

const ReducerDemo = () => {
  const [messageChannel, setMessageChannel] = useState<MessageChannel>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const reducer = useCallback((state: ReducerState<Reducer>, action: ReducerAction<Reducer>) => {
    if (action.type === 'SET_TEXT_VALUE') {
      state = { ...state, textValue: action.payload.value };
    }

    return state;
  }, []);

  const [state, dispatch] = useReducer<Reducer, ReducerState<Reducer>>(reducer, { textValue: '' }, init => init);

  useEffect(() => {
    const { current: iframe } = iframeRef;

    if (!iframe) {
      return;
    }

    const handleLoad = () => setMessageChannel(new MessageChannel());

    iframe.addEventListener('load', handleLoad);

    return () => iframe.removeEventListener('load', handleLoad);
  }, []);

  useMemo(
    // TODO: Fix security.
    () => messageChannel && iframeRef.current?.contentWindow?.postMessage(undefined, '*', [messageChannel?.port1]),
    [iframeRef, messageChannel]
  );

  useBindReducer<Reducer>(state, dispatch, messageChannel?.port2);

  return (
    <div>
      <h1>Reducer demo</h1>
      <div>
        <p>The text box is connected to a reducer.</p>
        <TextBox dispatch={dispatch} state={state} />
      </div>
      <br />
      <iframe ref={iframeRef} src="./iframe.html" title="inner frame"></iframe>
    </div>
  );
};

export default ReducerDemo;

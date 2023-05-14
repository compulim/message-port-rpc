import React, { FormEventHandler, useCallback, useMemo, useReducer, useRef, useState } from 'react';

import TextBox from '../common/TextBox';
import useBindReducer from './useBindReducer';

import type { Reducer } from '../common/types';
import type { ReactEventHandler, ReducerAction, ReducerState } from 'react';

const ReducerDemo = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const reducer = useCallback((state: ReducerState<Reducer>, action: ReducerAction<Reducer>) => {
    if (action.type === 'SET_TEXT_VALUE') {
      state = { ...state, textValue: action.payload.value };
    }

    return state;
  }, []);

  const [state1, dispatch1] = useReducer<Reducer, ReducerState<Reducer>>(reducer, { textValue: 'Hello' }, init => init);
  const [state2, dispatch2] = useReducer<Reducer, ReducerState<Reducer>>(reducer, { textValue: 'World' }, init => init);

  const port1 = useBindReducer<Reducer>(state1, dispatch1);
  const port2 = useBindReducer<Reducer>(state2, dispatch2);

  const handleIFrameLoad = useCallback<ReactEventHandler<HTMLIFrameElement>>(
    ({ currentTarget }) => currentTarget.contentWindow?.postMessage(undefined, '*', [port1, port2]),
    [port1, port2]
  );

  return (
    <div>
      <h1>Reducer demo</h1>
      <div>
        <p>These text boxes are connected to separate reducer.</p>
        <p>
          <label>
            First text box:{' '}
            <TextBox autoFocus={true} dispatch={dispatch1} state={state1} />
          </label>
        </p>
        <p>
          <label>
            Second text box:{' '}
            <TextBox dispatch={dispatch2} state={state2} />
          </label>
        </p>
      </div>
      <br />
      <iframe
        onLoad={handleIFrameLoad}
        ref={iframeRef}
        src="./iframe.html"
        style={{ height: 400 }}
        title="inner frame"
      ></iframe>
    </div>
  );
};

export default ReducerDemo;

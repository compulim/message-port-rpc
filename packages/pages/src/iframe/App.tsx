import React, { type ReducerState } from 'react';

import TextBox from '../common/TextBox';
import useReducerSource from './useReducerSource';

import type { Reducer } from '../common/types';

type Props = {
  port: MessagePort;
};

const App = ({ port }: Props) => {
  const [state, dispatch] = useReducerSource<Reducer, ReducerState<Reducer>>(port, { textValue: 'Not connected' });

  return (
    <div>
      <p>This is an IFRAME with reducer (dispatch and state) from parent window.</p>
      {dispatch && <TextBox dispatch={dispatch} state={state} />}
    </div>
  );
};

export default App;

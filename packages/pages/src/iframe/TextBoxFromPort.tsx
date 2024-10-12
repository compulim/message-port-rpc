import React, { type ReducerState } from 'react';

import TextBox from '../common/TextBox.tsx';
import useReducerSource from './useReducerSource.ts';
import { type Reducer } from '../common/types.ts';

type Props = {
  port: MessagePort;
};

const TextBoxFromPort = ({ port }: Props) => {
  const [state, dispatch] = useReducerSource<Reducer, ReducerState<Reducer>>(port, { textValue: '' });

  return dispatch && <TextBox dispatch={dispatch} state={state} />;
};

export default TextBoxFromPort;

import { type ReducerState } from 'react';

import TextBox from '../common/TextBox';
import useReducerSource from './useReducerSource';

import type { Reducer } from '../common/types';

type Props = {
  port: MessagePort;
};

const TextBoxFromPort = ({ port }: Props) => {
  const [state, dispatch] = useReducerSource<Reducer, ReducerState<Reducer>>(port, { textValue: '' });

  return dispatch && <TextBox dispatch={dispatch} state={state} />;
};

export default TextBoxFromPort;

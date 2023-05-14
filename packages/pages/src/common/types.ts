import type { Reducer as ReactReducer, ReducerAction } from 'react';

type Action = {
  payload: { value: string };
  type: 'SET_TEXT_VALUE';
};

type State = {
  textValue: string;
};

export type Reducer = ReactReducer<State, Action>;

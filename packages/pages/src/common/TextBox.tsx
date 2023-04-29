import React, { useCallback } from 'react';

import type { Dispatch, FormEventHandler, ReducerAction, ReducerState } from 'react';
import type { Reducer } from './types';

type Props = {
  dispatch: Dispatch<ReducerAction<Reducer>>;
  state: ReducerState<Reducer>;
};

const TextBox = ({ dispatch, state }: Props) => {
  const handleInput = useCallback<FormEventHandler<HTMLInputElement>>(
    ({ currentTarget: { value } }) =>
      dispatch({
        payload: { value },
        type: 'SET_TEXT_VALUE'
      }),
    [dispatch]
  );

  return <input autoFocus={true} onInput={handleInput} value={state.textValue} />;
};

export default TextBox;

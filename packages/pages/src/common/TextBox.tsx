import React, { useCallback, type Dispatch, type FormEventHandler, type ReducerAction, type ReducerState } from 'react';

import { type Reducer } from './types.ts';

type Props = {
  autoFocus?: boolean;
  dispatch: Dispatch<ReducerAction<Reducer>>;
  state: ReducerState<Reducer>;
};

const TextBox = ({ autoFocus, dispatch, state }: Props) => {
  const handleInput = useCallback<FormEventHandler<HTMLInputElement>>(
    ({ currentTarget: { value } }) =>
      dispatch({
        payload: { value },
        type: 'SET_TEXT_VALUE'
      }),
    [dispatch]
  );

  return <input autoFocus={autoFocus} onInput={handleInput} value={state.textValue} />;
};

export default TextBox;

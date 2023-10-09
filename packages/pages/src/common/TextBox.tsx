import { useCallback } from 'react';

import type { Dispatch, FormEventHandler, ReducerAction, ReducerState } from 'react';
import type { Reducer } from './types';

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

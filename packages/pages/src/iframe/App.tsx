import { FormEventHandler, useCallback, useState } from 'react';

import TextBoxFromPort from './TextBoxFromPort';

type Props = {
  ports: readonly [MessagePort, MessagePort];
};

const App = ({ ports }: Props) => {
  const [portSelection, setPortSelection] = useState<0 | 1>(0);
  const [entries, setEntries] = useState<number[]>(() => [1]);
  const [_, setNextSequenceNumber] = useState(2);

  const handleAddTextBoxClick = useCallback(() => {
    setNextSequenceNumber(sequenceNumber => {
      setEntries(entries => [...entries, sequenceNumber]);

      return sequenceNumber + 1;
    });
  }, [setEntries]);

  const handlePortSelectionChange = useCallback<FormEventHandler<HTMLSelectElement>>(
    ({ currentTarget }) => setPortSelection(currentTarget.value === '1' ? 1 : 0),
    [setPortSelection]
  );

  const handleRemoveTextBoxClick = useCallback(() => {
    setEntries(([_, ...entries]) => entries);
  }, [setEntries]);

  return (
    <div>
      <p>This is an IFRAME with dispatch and state from parent window.</p>
      <p>
        Multiple sources can connect to a single MessagePort. And any source can switch their connected{' '}
        <code>MessagePort</code> on-the-fly.
      </p>
      <p>
        Select which port to connect to:
        <select onInput={handlePortSelectionChange}>
          <option value="0">First text box</option>
          <option value="1">Second text box</option>
        </select>
      </p>
      <p>
        <button onClick={handleAddTextBoxClick} type="button">
          Add a text box
        </button>{' '}
        <button onClick={handleRemoveTextBoxClick} type="button">
          Remove a text box
        </button>
      </p>
      {entries.map(key => (
        <p key={key}>
          {key}: <TextBoxFromPort port={ports[portSelection]} />
        </p>
      ))}
    </div>
  );
};

export default App;

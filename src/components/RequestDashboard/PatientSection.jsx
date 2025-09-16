import { memo, useContext } from 'react';

import RequestBuilder from '../../containers/RequestBuilder';
import { SettingsContext } from '../../containers/ContextProvider/SettingsProvider';

const PatientSection = props => {
  const [state, dispatch] = useContext(SettingsContext);
  return (
    <div>
      {state.startup ? (
        <RequestBuilder
          globalState={state}
          dispatch={dispatch}
          client={props.client}
          userId={props.userId}
        />
      ) : (
        <>Loading...</>
      )}
    </div>
  );
};

export default memo(PatientSection);

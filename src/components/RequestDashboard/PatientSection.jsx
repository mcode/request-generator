import React, { memo } from 'react';

import useStyles from './styles';
import RequestBuilder from '../../containers/RequestBuilder';
import { SettingsContext } from '../../containers/ContextProvider/SettingsProvider';

const PatientSection = props => {
  const classes = useStyles();
  const [state, dispatch] = React.useContext(SettingsContext);
  // TODO: Make request builder use react-hooks so
  // we can get rid of this hacky shim
  return (
    <div>
      {state.startup ? 
        <RequestBuilder globalState={state} dispatch={dispatch} client={props.client} /> :
        <>Loading...</>}
    </div>
  );
};

export default memo(PatientSection);

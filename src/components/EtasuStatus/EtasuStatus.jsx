import { useState, useEffect, useContext } from 'react';
import { SettingsContext } from '../../containers/ContextProvider/SettingsProvider.jsx';
import { EtasuStatusComponent } from './EtasuStatusComponent.jsx';
import { standardsBasedGetEtasu, getMedicationSpecificEtasuUrl } from '../../util/util.js';
import { createMedicationFromMedicationRequest } from '../../util/fhir.js';

// converts code into etasu for the component to render
// simplifies usage for applications that only know the code, not the case they want to display
export const EtasuStatus = props => {
  const [globalState] = useContext(SettingsContext);

  const { code, request } = props;
  const [remsAdminResponse, setRemsAdminResponse] = useState({});
  const [etasuData, setEtasuData] = useState({});
  const [medication, setMedication] = useState({});
  const [display, setDisplay] = useState('');

  useEffect(() => {
    const medication = createMedicationFromMedicationRequest(request);
    getEtasuStatus(medication);
  }, [code]);

  const getEtasuStatus = medication => {
    const body = makeBody(medication);
    setEtasuData(body);
    setMedication(medication);
    const display = body.parameter[1]?.resource.code?.coding[0].display;
    setDisplay(display);
    const standardEtasuUrl = getMedicationSpecificEtasuUrl(medication?.code, globalState);
    standardsBasedGetEtasu(standardEtasuUrl, body, setRemsAdminResponse);
  };

  const makeBody = medication => {
    console.log('patient -- > ', globalState.patient);
    return {
      resourceType: 'Parameters',
      parameter: [
        {
          name: 'patient',
          resource: globalState.patient
        },
        {
          name: 'medication',
          resource: medication
        }
      ]
    };
  };

  return (
    <>
      {remsAdminResponse?.contained ? (
        <EtasuStatusComponent
          remsAdminResponseInit={remsAdminResponse}
          data={etasuData}
          display={display}
          medication={medication}
        />
      ) : (
        ''
      )}
    </>
  );
};

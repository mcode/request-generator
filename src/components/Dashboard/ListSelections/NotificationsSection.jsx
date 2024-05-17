import React, { memo, useContext, useEffect, useState } from 'react';
import useStyles from '../styles';
import { SettingsContext } from '../../../containers/ContextProvider/SettingsProvider';
import { EtasuStatusComponent } from '../../EtasuStatus/EtasuStatusComponent';
import axios from 'axios';
import { createMedicationFromMedicationRequest } from '../../../util/fhir';
import { standardsBasedGetEtasu } from '../../../util/util';

const NotificationsSection = () => {
  const [globalState, _] = useContext(SettingsContext);
  const classes = useStyles();
  const [etasu, setEtasu] = useState([]);
  const [medications, setMedications] = useState([]);
  useEffect(() => {
    setEtasu([]);
    getMedicationRequest();
  }, []);

  useEffect(() => {
    getAllEtasu();
  }, [medications]);

  const getMedicationRequest = () => {
    const patientsMedications = [];
    axios({
      method: 'get',
      url: `${globalState.baseUrl}/MedicationRequest?subject=Patient/${globalState.patient.id}`
    }).then(
      result => {
        result?.data.entry.forEach(m => {
          const medication = createMedicationFromMedicationRequest(m.resource);
          patientsMedications.push(medication);
        });
        setMedications(patientsMedications);
      },
      error => {
        console.error(error);
      }
    );
  };

  const compileResponses = (newRequest, body) => {
    if (newRequest.contained) {
      newRequest.body = body;
      setEtasu(prevState => [...prevState, newRequest]);
    }
  };

  const getAllEtasu = () => {
    medications.forEach(medication => {
      const body = makeBody(medication);
      const standardEtasuUrl = `${globalState.remsAdminServer}/4_0_0/GuidanceResponse/$rems-etasu`;
      standardsBasedGetEtasu(standardEtasuUrl, body, compileResponses);
    });
  };

  const makeBody = medication => {
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
    <div className={classes.dashboardArea}>
      <h2 className={classes.elementHeader}>Notifications</h2>
      {etasu.map(remsCase => {
        const display = remsCase.body.parameter[1]?.resource.code.coding[0].display;
        return (
          <EtasuStatusComponent
            key={display}
            display={display}
            remsAdminResponseInit={remsCase}
            data={remsCase.body}
          />
        );
      })}
    </div>
  );
};

export default memo(NotificationsSection);

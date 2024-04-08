import { Button, ButtonGroup, Grid } from '@mui/material';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import buildNewRxRequest from '../../util/buildScript.2017071.js';
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { shortNameMap } from '../../util/data.js';
import { getAge, createMedicationDispenseFromMedicationRequest } from '../../util/fhir.js';
import { retrieveLaunchContext } from '../../util/util.js';
import './request.css';

const RequestBox = props => {
  const [state, setState] = useState({
    gatherCount: 0,
    response: {},
    submittedRx: false
  });

  const {
    prefetchedResources,
    submitInfo,
    patient,
    request,
    loading,
    code,
    codeSystem,
    display,
    defaultUser,
    smartAppUrl,
    client,
    pimsUrl,
    getRemsAdminUrl
  } = props;
  const emptyField = <span className="empty-field">empty</span>;

  const prepPrefetch = () => {
    const preppedResources = new Map();
    Object.keys(prefetchedResources).forEach(resourceKey => {
      let resourceList = [];
      if (Array.isArray(prefetchedResources[resourceKey])) {
        resourceList = prefetchedResources[resourceKey].map(resource => {
          return resource;
        });
      } else {
        resourceList = prefetchedResources[resourceKey];
      }

      preppedResources.set(resourceKey, resourceList);
    });
    return preppedResources;
  };

  const submitPatientView = () => {
    submitInfo(prepPrefetch(), null, patient, 'patient-view');
  };

  const _submitOrderSelect = () => {
    if (!_.isEmpty(request)) {
      submitInfo(prepPrefetch(), request, patient, 'order-select');
    }
  };

  const submitOrderSign = request => {
    if (!_.isEmpty(request)) {
      submitInfo(prepPrefetch(), request, patient, 'order-sign');
    }
  };

  useEffect(() => {
    // if prefetch completed
    if (state.prefetchCompleted) {
      // if the prefetch contains a medicationRequests bundle
      if (prefetchedResources.medicationRequests) {
        submitPatientView();
      }
    }
  }, [state.prefetchCompleted]);

  const renderPatientInfo = () => {
    if (Object.keys(patient).length === 0) {
      return <div className="demographics"></div>;
    }
    let name;
    if (patient.name) {
      name = <span> {`${patient.name[0].given[0]} ${patient.name[0].family}`} </span>;
    } else {
      name = emptyField;
    }
    return (
      <div className="demographics">
        <div className="lower-border">
          <span style={{ fontWeight: 'bold' }}>Demographics</span>
        </div>
        <div className="info lower-border">Name: {name}</div>
        <div className="info lower-border">
          Age: {patient.birthDate ? getAge(patient.birthDate) : emptyField}
        </div>
        <div className="info lower-border">
          Gender: {patient.gender ? patient.gender : emptyField}
        </div>
        <div className="info lower-border">
          State: {state.patientState ? state.patientState : emptyField}
        </div>
        {renderOtherInfo()}
      </div>
    );
  };

  const renderOtherInfo = () => {
    return (
      <div className="other-info">
        <div className="lower-border">
          <span style={{ fontWeight: 'bold' }}>Coding</span>
        </div>
        <div className="info lower-border">Code: {code ? code : emptyField}</div>
        <div className="info lower-border">
          System: {codeSystem ? shortNameMap[codeSystem] : emptyField}
        </div>
        <div className="info lower-border">Display: {display ? display : emptyField}</div>
      </div>
    );
  };

  const renderPrefetchedResources = () => {
    const prefetchMap = new Map(Object.entries(prefetchedResources));
    if (prefetchMap.size > 0) {
      return renderRequestResources(prefetchMap);
    }
    return <div className="prefetched" />;
  };

  const renderRequestResources = requestResources => {
    const renderedPrefetches = new Map();
    requestResources.forEach((resourceList, resourceKey) => {
      const renderedList = [];
      if (Array.isArray(resourceList)) {
        resourceList.forEach(resource => {
          console.log('Request resources:' + JSON.stringify(requestResources));
          console.log('Request key:' + resourceKey);
          renderedList.push(renderResource(resource));
        });
      } else {
        renderedList.push(renderResource(resourceList));
      }

      renderedPrefetches.set(resourceKey, renderedList);
    });

    return (
      <div className="prefetched">
        <div className="prefetch-header">Prefetched</div>
        {Array.from(renderedPrefetches.keys()).map(resourceKey => {
          const currentRenderedPrefetch = renderedPrefetches.get(resourceKey);
          return (
            <div key={resourceKey}>
              <div className="prefetch-subheader">{resourceKey + ' Resources'}</div>
              {currentRenderedPrefetch}
            </div>
          );
        })}
      </div>
    );
  };

  const renderResource = resource => {
    let value = <div>N/A</div>;
    if (!resource.id) {
      resource = resource.resource;
    }
    if (resource.id) {
      var resourceId = resource.id;
      var resourceType = resource.resourceType;
      value = (
        <div key={resourceId}>
          <span style={{ textTransform: 'capitalize' }}>{resourceType}</span>: {resourceType}/
          {resourceId} .....<span className="checkmark glyphicon glyphicon-ok"></span>
        </div>
      );
    } else {
      value = (
        <div key={'UNKNOWN'}>
          <span style={{ textTransform: 'capitalize' }}>{'UNKNOWN'}</span> .....
          <span className="remove glyphicon glyphicon-remove"></span>
        </div>
      );
    }
    return value;
  };

  const launchSmartOnFhirApp = () => {
    console.log('Launch SMART on FHIR App');

    let userId = prefetchedResources?.practitioner?.id;
    if (!userId) {
      console.log(
        'Practitioner not populated from prefetch, using default from config: ' + defaultUser
      );
      userId = defaultUser;
    }

    let link = {
      appContext: 'user=' + userId + '&patient=' + patient.id,
      type: 'smart',
      url: smartAppUrl
    };

    retrieveLaunchContext(link, patient.id, client.state).then(result => {
      link = result;
      console.log(link);
      // launch the application in a new window
      window.open(link.url, '_blank');
    });
  };

  /**
   * Send NewRx for new Medication to the Pharmacy Information System (PIMS)
   */
  const sendRx = () => {
    console.log('Sending NewRx to: ' + pimsUrl);

    // build the NewRx Message
    var newRx = buildNewRxRequest(
      prefetchedResources.patient,
      prefetchedResources.practitioner,
      request
    );

    console.log('Prepared NewRx:');
    console.log(newRx);

    const serializer = new XMLSerializer();

    // Sending NewRx to the Pharmacy
    fetch(pimsUrl, {
      method: 'POST',
      //mode: 'no-cors',
      headers: {
        Accept: 'application/xml',
        'Content-Type': 'application/xml'
      },
      body: serializer.serializeToString(newRx)
    })
      .then(() => {
        console.log('Successfully sent NewRx to PIMS');

        // create the MedicationDispense
        var medicationDispense = createMedicationDispenseFromMedicationRequest(request);
        console.log('Create MedicationDispense:');
        console.log(medicationDispense);

        // store the MedicationDispense in the EHR
        console.log(medicationDispense);
        client.update(medicationDispense).then(result => {
          console.log('Update MedicationDispense result:');
          console.log(result);
        });

        handleRxResponse();
      })
      .catch(error => {
        console.log('sendRx Error - unable to send NewRx to PIMS: ');
        console.log(error);
      });
  };

  const isOrderNotSelected = () => {
    return Object.keys(request).length === 0;
  };

  const isPatientNotSelected = () => {
    return Object.keys(patient).length === 0;
  };

  // SnackBar
  const handleRxResponse = () => setState(prevState => ({ ...prevState, submittedRx: true }));

  const handleClose = () => setState(prevState => ({ ...prevState, submittedRx: false }));

  const disableSendToCRD = isOrderNotSelected() || loading;
  const disableSendRx = isOrderNotSelected() || loading;
  const disableLaunchSmartOnFhir = isPatientNotSelected();
  const orderSignRemsAdmin = getRemsAdminUrl(request, 'order-sign');

  return (
    <>
      <div className="request">
        <div>
          <div className="request-header">
            <span>Patient ID: {patient.id}</span>
          </div>
          <div className="patient-info">
            <Grid container>
              <Grid item xs={6}>
                {renderPatientInfo()}
              </Grid>
              <Grid item xs={6}>
                {renderPrefetchedResources()}
              </Grid>
            </Grid>
          </div>
        </div>
        <div className="action-btns">
          <ButtonGroup variant="outlined" aria-label="outlined button group">
            <Button onClick={launchSmartOnFhirApp} disabled={disableLaunchSmartOnFhir}>
              Launch SMART on FHIR App
            </Button>
            <Button onClick={sendRx} disabled={disableSendRx}>
              Send Rx to Pharmacy
            </Button>
            <Button onClick={() => submitOrderSign(request)} disabled={disableSendToCRD}>
              Sign Order
            </Button>
          </ButtonGroup>
        </div>
      </div>
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        open={state.submittedRx}
        onClose={handleClose}
        autoHideDuration={6000}
      >
        <MuiAlert onClose={handleClose} severity="success" elevation={6} variant="filled">
          Success! NewRx Received By Pharmacy
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default RequestBox;

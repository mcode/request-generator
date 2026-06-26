import { Button, ButtonGroup, Checkbox, FormControlLabel, Grid } from '@mui/material';
import _ from 'lodash';
import { SettingsContext } from '../../containers/ContextProvider/SettingsProvider.jsx';
import { useEffect, useRef, useState, useContext } from 'react';
import buildNewRxRequest from '../../util/buildScript.2017071.js';
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { shortNameMap, ORDER_SIGN, PATIENT_VIEW } from '../../util/data.js';
import {
  getAge,
  createMedicationDispenseFromMedicationRequest,
  createMedicationFromMedicationRequest,
  getDrugCodeableConceptFromMedicationRequest
} from '../../util/fhir.js';
import {
  retrieveLaunchContext,
  prepPrefetch,
  getMedicationSpecificEtasuUrl,
  getPatientFirstAndLastName
} from '../../util/util.js';
import {
  applySelectedProductToMedicationRequest,
  buildPpaRequest,
  getNdcCoding,
  getSelectedProductFromPpaResponse,
  getMedicationDisplay
} from '../../util/buildPpa.js';
import {
  getEquivalentPpaCandidates,
  getPpaProductConfigByNdc
} from '../../util/ppaProductEquivalents.js';
import './request.css';
import axios from 'axios';

const initialPpaState = {
  checking: false,
  results: [],
  selectedProduct: null,
  selectedPharmacy: null,
  message: ''
};

const RequestBox = props => {
  const [state, setState] = useState({
    gatherCount: 0,
    response: {},
    submittedRx: false
  });
  const [ppaState, setPpaState] = useState(initialPpaState);
  const [globalState, , updateSetting] = useContext(SettingsContext);

  const {
    prefetchedResources,
    submitInfo,
    patient,
    request,
    loading,
    code,
    codeSystem,
    display,
    user,
    smartAppUrl,
    client,
    pimsUrl,
    prefetchCompleted,
    selectRequestResource
  } = props;
  const emptyField = <span className="empty-field">empty</span>;
  const lastRequestId = useRef(request?.id || '');

  const getPrefetchObject = () => {
    if (prefetchedResources instanceof Map) {
      return Object.fromEntries(prefetchedResources);
    }
    return { ...(prefetchedResources || {}) };
  };

  const getPrefetchForRequest = selectedRequest =>
    prepPrefetch({
      ...getPrefetchObject(),
      request: selectedRequest
    });

  const submitPatientView = () => {
    submitInfo(prepPrefetch(getPrefetchObject()), null, patient, PATIENT_VIEW);
  };

  const submitOrderSign = async () => {
    const requestForSign = await getRequestForSelectedProduct();
    if (!_.isEmpty(requestForSign)) {
      submitInfo(getPrefetchForRequest(requestForSign), requestForSign, patient, ORDER_SIGN);
    }
  };

  useEffect(() => {
    // if prefetch completed
    if (prefetchCompleted) {
      // if the prefetch contains a medicationRequests bundle
      if (prefetchedResources.medicationRequests) {
        submitPatientView();
      }
    }
  }, [prefetchCompleted]);

  const renderPatientInfo = () => {
    if (Object.keys(patient).length === 0) {
      return <div className="demographics"></div>;
    }
    let name;
    if (patient.name) {
      name = <span>{getPatientFirstAndLastName(patient)}</span>;
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
      console.log('Practitioner not populated from prefetch, using user: ' + user);
      userId = user;
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

  const makeBody = medication => {
    return {
      resourceType: 'Parameters',
      parameter: [
        {
          name: 'patient',
          resource: patient
        },
        {
          name: 'medication',
          resource: medication
        }
      ]
    };
  };

  const parseJsonSetting = (value, fallback) => {
    try {
      const parsed = JSON.parse(value || '');
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  const getConfiguredPharmacies = () => {
    const fallback = [
      {
        id: 'Pharmacy123',
        name: 'PIMS Pharmacy A',
        url: 'http://localhost:5051/ncpdp/script',
        scriptUrl: 'http://localhost:5051/ncpdp/script'
      }
    ];

    const configured = Array.isArray(globalState.ppaPharmacyEndpoints)
      ? globalState.ppaPharmacyEndpoints
      : parseJsonSetting(globalState.ppaEndpointList, fallback);

    return configured.filter(pharmacy => pharmacy.enabled !== false && pharmacy.id && pharmacy.url);
  };

  const getPpaCandidates = () => {
    const ndcCoding = getNdcCoding(request);
    const baseProduct = {
      ndc: ndcCoding?.code,
      display: ndcCoding?.display || getMedicationDisplay(request)
    };
    if (!globalState.ppaSubstitutionAllowed) {
      return baseProduct.ndc ? [baseProduct] : [];
    }

    const genericCandidates = getEquivalentPpaCandidates(baseProduct.ndc);

    return [baseProduct, ...genericCandidates].filter(candidate => candidate.ndc);
  };

  const getAvailabilityResultLabel = result => {
    const requested = result.requestedProduct?.display || 'Requested product';
    const selected = result.selectedProduct?.display;
    const product =
      selected && selected !== requested ? `${requested} -> ${selected}` : requested;

    return `${result.pharmacy?.name}: ${product} - ${result.reasonCode}`;
  };

  const getSelectedPharmacyScriptEndpoint = () => {
    if (!ppaState.selectedPharmacy?.url) {
      return pimsUrl;
    }

    return (
      ppaState.selectedPharmacy.scriptUrl ||
      ppaState.selectedPharmacy.ncpdpScriptUrl ||
      ppaState.selectedPharmacy.url
    );
  };

  const getPharmacyPpaEndpoint = pharmacy =>
    pharmacy?.scriptUrl || pharmacy?.ncpdpScriptUrl || pharmacy?.url || pimsUrl;

  const buildMedicationRequestIdFromTemplate = template =>
    template?.replace('{patientId}', patient?.id || '');

  const getSelectedMedicationRequestId = selectedProduct => {
    const productConfig = getPpaProductConfigByNdc(selectedProduct?.ndc);
    return (
      selectedProduct?.medicationRequestId ||
      productConfig?.medicationRequestId ||
      buildMedicationRequestIdFromTemplate(
        selectedProduct?.medicationRequestIdTemplate ||
          productConfig?.medicationRequestIdTemplate
      )
    );
  };

  useEffect(() => {
    const currentRequestId = request?.id || '';
    if (lastRequestId.current && lastRequestId.current !== currentRequestId) {
      const selectedRequestId = getSelectedMedicationRequestId(ppaState.selectedProduct);
      if (!selectedRequestId || selectedRequestId !== currentRequestId) {
        setPpaState(initialPpaState);
      }
    }
    lastRequestId.current = currentRequestId;
  }, [request?.id]);

  const getRequestForProduct = async selectedProduct => {
    if (!selectedProduct?.ndc) {
      return request;
    }

    const selectedMedicationRequestId = getSelectedMedicationRequestId(selectedProduct);
    if (selectedMedicationRequestId && selectedMedicationRequestId === request?.id) {
      return request;
    }

    if (selectedMedicationRequestId && client) {
      try {
        return await client.request(`MedicationRequest/${selectedMedicationRequestId}`);
      } catch (error) {
        console.log(
          `Unable to load selected MedicationRequest/${selectedMedicationRequestId}; keeping current request`,
          error
        );
        return request;
      }
    }

    if (selectedMedicationRequestId) {
      return request;
    }

    return applySelectedProductToMedicationRequest(request, selectedProduct);
  };

  const getRequestForSelectedProduct = () => getRequestForProduct(ppaState.selectedProduct);

  const selectRequestForProduct = async selectedProduct => {
    const selectedRequest = await getRequestForProduct(selectedProduct);
    if (selectedRequest?.id && selectedRequest.id !== request?.id) {
      selectRequestResource?.(selectedRequest);
    }
    return selectedRequest;
  };

  const getPatientPreferenceState = () =>
    patient?.address?.find(address => address?.state)?.state || globalState.ppaDefaultState || 'MA';

  const getPatientPreferencePostalCode = () =>
    patient?.address?.find(address => address?.postalCode)?.postalCode ||
    globalState.ppaDefaultPostalCode ||
    undefined;

  const checkAvailability = async () => {
    setPpaState({
      ...initialPpaState,
      checking: true
    });

    const pharmacies = globalState.ppaLocatorMode
      ? getConfiguredPharmacies()
      : getConfiguredPharmacies().slice(0, 1);
    const candidates = getPpaCandidates();
    const results = [];
    const substitutionAllowed = Boolean(globalState.ppaSubstitutionAllowed);

    for (const pharmacy of pharmacies) {
      for (const candidate of candidates) {
        const endpoint = globalState.usePharmacyIntermediary
          ? globalState.pharmacyIntermediaryUrl
          : getPharmacyPpaEndpoint(pharmacy);
        const ppaRequest = buildPpaRequest({
          patient,
          practitioner: getPrefetchObject().practitioner,
          medicationRequest: request,
          pharmacy,
          substitutionAllowed,
          patientPreferenceState: getPatientPreferenceState(),
          patientPreferencePostalCode: getPatientPreferencePostalCode(),
          overrideProduct: candidate
        });

        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(ppaRequest)
          });
          const responseJson = await response.json().catch(() => null);
          if (!response.ok || !responseJson) {
            throw new Error(`PPA lookup failed with HTTP ${response.status}`);
          }
          const result = getSelectedProductFromPpaResponse(responseJson, {
            ...candidate,
            pharmacyId: pharmacy.id,
            pharmacyName: pharmacy.name
          });
          const resultWithContext = {
            ...result,
            pharmacy,
            requestedProduct: candidate,
            endpoint,
            httpStatus: response.status
          };
          results.push(resultWithContext);

          if (result.approved) {
            await selectRequestForProduct(result.selectedProduct);
            setPpaState(prev => ({
              ...prev,
              checking: false,
              results,
              selectedProduct: result.selectedProduct,
              selectedPharmacy: pharmacy,
              message: `${result.reasonCode}: ${result.selectedProduct.display || candidate.display} available at ${pharmacy.name}`
            }));
            return;
          }
        } catch (error) {
          results.push({
            approved: false,
            reasonCode: 'ERROR',
            pharmacy,
            requestedProduct: candidate,
            endpoint,
            error: error.message
          });
        }
      }
    }

    setPpaState(prev => ({
      ...prev,
      checking: false,
      results,
      selectedProduct: null,
      selectedPharmacy: null,
      message: 'No configured pharmacy returned an approved availability response'
    }));
  };

  /**
   * Send NewRx for new Medication to the Pharmacy Information System (PIMS)
   */
  const sendRx = async () => {
    // Use intermediary or direct based on toggle
    const ncpdpEndpoint = globalState.usePharmacyIntermediary 
      ? globalState.pharmacyIntermediaryUrl 
      : getSelectedPharmacyScriptEndpoint();
    
    console.log('Sending NewRx to: ' + ncpdpEndpoint);
    console.log('Getting case number');
    const requestForDispense = await getRequestForSelectedProduct();
    const medication = createMedicationFromMedicationRequest(requestForDispense);
    const body = makeBody(medication);
    const standardEtasuUrl = getMedicationSpecificEtasuUrl(
      getDrugCodeableConceptFromMedicationRequest(requestForDispense),
      globalState
    );
    let caseNumber = '';
    await axios({
      method: 'post',
      url: standardEtasuUrl,
      data: body
    }).then(response => {
      if (
        response.data.parameter?.[0].resource &&
        response.data.parameter?.[0].resource.contained
      ) {
        response.data.parameter?.[0].resource?.contained[0]?.parameter.map(metRequirements => {
          if (metRequirements.name === 'case_number') {
            caseNumber = metRequirements.valueString;
          }
        });
      }
    });

    // build the NewRx Message
    var newRx = buildNewRxRequest(
      getPrefetchObject().patient,
      getPrefetchObject().practitioner,
      requestForDispense,
      caseNumber,
      ppaState.selectedPharmacy?.id || 'Pharmacy 123'
    );

    console.log('Prepared NewRx:');
    console.log(newRx);

    const serializer = new XMLSerializer();

    // Sending NewRx to the Pharmacy
    fetch(ncpdpEndpoint, {
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
        var medicationDispense = createMedicationDispenseFromMedicationRequest(requestForDispense);
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
  const disableCheckAvailability = isOrderNotSelected() || loading || ppaState.checking;
  const disableLaunchSmartOnFhir = isPatientNotSelected();

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
            <Button onClick={checkAvailability} disabled={disableCheckAvailability}>
              {ppaState.checking ? 'Checking Availability' : 'Check Availability'}
            </Button>
            <Button
              onClick={submitOrderSign}
              disabled={disableSendToCRD}
            >
              Sign Order
            </Button>
          </ButtonGroup>
          <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(globalState.ppaSubstitutionAllowed)}
                  onChange={event => updateSetting('ppaSubstitutionAllowed', event.target.checked)}
                />
              }
              label="Allow substitutions"
            />
            {ppaState.message && <span>{ppaState.message}</span>}
          </div>
          {ppaState.results.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              {ppaState.results.map((result, index) => (
                <div key={`${result.pharmacy?.id}-${result.requestedProduct?.ndc}-${index}`}>
                  {getAvailabilityResultLabel(result)}
                </div>
              ))}
            </div>
          )}
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

import axios from 'axios';
import { getDrugCodeableConceptFromMedicationRequest } from './fhir';
import {
  ORDER_SIGN,
  ORDER_SELECT,
  PATIENT_VIEW,
  ENCOUNTER_START,
  serviceEndpoints,
  REMS_ETASU
} from './data';

/**
 * Retrieves a SMART launch context from an endpoint to append as a "launch" query parameter to a SMART app launch URL (see SMART docs for more about launch context).
 * This applies mainly if a SMART app link on a card is to be launched. The link needs a "launch" query param with some opaque value from the SMART server entity.
 * This function generates the launch context (for HSPC Sandboxes only) for a SMART application by pinging a specific endpoint on the FHIR base URL and returns
 * a Promise to resolve the newly modified link.
 * @param {*} link - The SMART app launch URL
 * @param {*} accessToken - The access token provided to the CDS Hooks Sandbox by the FHIR server
 * @param {*} patientId - The identifier of the patient in context
 * @param {*} fhirBaseUrl - The base URL of the FHIR server in context
 */
function retrieveLaunchContext(link, patientId, clientState) {
  return new Promise((resolve, reject) => {
    const headers = clientState.tokenResponse
      ? {
          Accept: 'application/json',
          Authorization: `Bearer ${clientState.tokenResponse.access_token}`
        }
      : {
          Accept: 'application/json'
        };
    const launchParameters = {
      patient: patientId
    };

    if (link.appContext) {
      launchParameters.appContext = link.appContext;
    }

    // May change when the launch context creation endpoint becomes a standard endpoint for all EHR providers
    axios({
      method: 'post',
      url: `${clientState.serverUrl}/_services/smart/Launch`,
      headers,
      data: {
        launchUrl: link.url,
        parameters: launchParameters
      }
    })
      .then(result => {
        if (result.data && Object.prototype.hasOwnProperty.call(result.data, 'launch_id')) {
          if (link.url.indexOf('?') < 0) {
            link.url += '?';
          } else {
            link.url += '&';
          }
          link.url += `launch=${result.data.launch_id}`;
          link.url += `&iss=${clientState.serverUrl}`;
          return resolve(link);
        }
        console.error(
          'FHIR server endpoint did not return a launch_id to launch the SMART app. See network calls to the Launch endpoint for more details'
        );
        link.error = true;
        return reject(link);
      })
      .catch(err => {
        console.error(
          'Cannot grab launch context from the FHIR server endpoint to launch the SMART app. See network calls to the Launch endpoint for more details',
          err
        );
        link.error = true;
        return reject(link);
      });
  });
}

function standardsBasedGetEtasu(etasuUrl, body, responseCallback) {
  axios({
    method: 'post',
    url: etasuUrl,
    data: body
  }).then(
    response => {
      // Sorting an array mutates the data in place.
      const remsMetRes = response.data;
      if (remsMetRes?.parameter?.[0]?.resource?.contained) {
        remsMetRes.parameter?.[0].resource.contained[0].parameter.sort((first, second) => {
          // Keep the other forms unsorted.
          if (second.name.includes('Patient Status Update')) {
            // Sort the Patient Status Update forms in descending order of timestamp.
            return second.name.localeCompare(first.name);
          }
          return 0;
        });
      }
      responseCallback(response.data.parameter?.[0].resource, body);
    },
    error => {
      console.log('error -- > ', error);
    }
  );
}

const getMedicationSpecificRemsAdminUrl = (codeableConcept, globalState, endpointType) => {
  var serverUrl = null;
  if (globalState.useIntermediary) {
    serverUrl = `${globalState.intermediaryUrl}/${serviceEndpoints[endpointType]}`;
  } else {
    const display = codeableConcept?.coding?.[0]?.display;
    const rxnorm = codeableConcept?.coding?.[0]?.code;

    if (!rxnorm) {
      console.log("ERROR: unknown MedicationRequest code: '", rxnorm);
      return undefined;
    }

    // This function never gets called with the PATIENT_VIEW hook, however.
    if (
      !(
        endpointType === PATIENT_VIEW ||
        endpointType === ORDER_SIGN ||
        endpointType === ORDER_SELECT ||
        endpointType === ENCOUNTER_START ||
        endpointType === REMS_ETASU
      )
    ) {
      console.log(`ERROR: unknown hook/endpoint type: ${endpointType}`);
      return undefined;
    }

    serverUrl = Object.values(globalState.medicationRequestToRemsAdmins).find(
      value => Number(value.rxnorm) === Number(rxnorm) && value.endpointType === endpointType
    )?.remsAdmin;

    if (!serverUrl) {
      console.log(`Medication ${display} is not a REMS medication`);
      return undefined;
    }
  }
  return serverUrl;
};

const getMedicationSpecificEtasuUrl = (codeableConcept, globalState) => {
  var serverUrl = getMedicationSpecificRemsAdminUrl(codeableConcept, globalState, REMS_ETASU);
  if (serverUrl != undefined) {
    return serverUrl;
  } else {
    return undefined;
  }
};

const getMedicationSpecificCdsHooksUrl = (request, globalState, hook) => {
  // if empty request, just return
  if (Object.keys(request).length === 0) {
    return undefined;
  }

  const codeableConcept = getDrugCodeableConceptFromMedicationRequest(request);
  var serverUrl = getMedicationSpecificRemsAdminUrl(codeableConcept, globalState, hook);
  if (serverUrl != undefined) {
    return serverUrl;
  } else {
    return undefined;
  }
};

const prepPrefetch = prefetchedResources => {
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

// FHIR R4 Patient
export const getPatientFirstAndLastName = patient => {
  return `${patient.name[0].given[0]} ${patient.name[0].family}`;
};

// FHIR R4 Patient
export const getPatientFullName = patient => {
  return `${patient.name[0].given.join(' ')} ${patient.name[0].family}`;
};

export {
  retrieveLaunchContext,
  standardsBasedGetEtasu,
  getMedicationSpecificEtasuUrl,
  getMedicationSpecificCdsHooksUrl,
  prepPrefetch
};

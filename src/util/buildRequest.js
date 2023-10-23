
export default function buildRequest(request, user, patient, ehrUrl, token, prefetch, includePrefetch, hook, hookConfig) {

    // Use the provided user if there is no request for this hook
    let userId = 'Practitioner/' + user;
    if (request) {
        userId = request.requester.reference;
    }

    const r4json = {
        'hookInstance': 'd1577c69-dfbe-44ad-ba6d-3e05e953b2ea',
        'fhirServer': ehrUrl,
        'hook': hook,
        'fhirAuthorization': {
            'access_token': token.access_token,
            'token_type': 'Bearer',
            'expires_in': 300,
            'scope': 'patient/Patient.read patient/Observation.read',
            'subject': 'cds-service4'
        },
        'context': {
            'userId': userId,
            'patientId': patient.id,
            'encounterId': 'enc89284'
        }
    };

    // add the extension containing the hook configuration
    if (hookConfig.includeConfig) {
        const extension = {
            'davinci-crd.configuration': {
                'alt-drug': hookConfig.alternativeTherapy
            }
        };
        r4json.extension = extension;
    }

    if (hook === 'order-select') {
        r4json.context.draftOrders = {
            'resourceType': 'Bundle',
            'entry': [
                {
                    'resource': request
                }
            ]
        };
        r4json.context.selections = [
            request.resourceType + '/' + request.id
        ];
    } else if (hook === 'order-sign') {
        r4json.context.draftOrders = {
            'resourceType': 'Bundle',
            'entry': [
                {
                    'resource': request
                }
            ]
        };
    //} else if (hook === "patient-view") {
    }

    if(includePrefetch){
      r4json.prefetch = {};
      prefetch.forEach((resource, key) => {
        r4json.prefetch[key] = resource;
      });
    }

    console.log(r4json);
    console.log('--------- r4');
    return r4json;
}

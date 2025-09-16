import env from 'env-var';

const headerDefinitions = {
  includePharmacyInPreFetch: {
    display: 'Include Pharmacy in Prefetch',
    type: 'check',
    default: env.get('VITE_USE_PHARMACY_IN_PREFETCH').asBool()
  },
  useIntermediary: {
    display: 'Use Intermediary',
    type: 'check',
    default: env.get('VITE_USE_INTERMEDIARY').asBool()
  },
  alternativeTherapy: {
    display: 'Alternative Therapy Cards Allowed',
    type: 'check',
    default: env.get('VITE_ALT_DRUG').asBool()
  },
  baseUrl: {
    display: 'Base Server',
    type: 'input',
    default: env.get('VITE_EHR_BASE').asString()
  },
  cdsUrl: {
    display: 'REMS Admin Reset Url',
    type: 'input',
    default: env.get('VITE_CDS_SERVICE').asString()
  },
  defaultUser: {
    display: 'Default User',
    type: 'input',
    default: env.get('VITE_DEFAULT_USER').asString()
  },
  useDefaultUser: {
    display: 'Use Default User',
    type: 'check',
    default: env.get('VITE_USE_DEFAULT_USER').asBool()
  },
  ehrUrl: {
    display: 'EHR Server',
    type: 'input',
    default: env.get('VITE_EHR_SERVER').asString()
  },
  ehrUrlSentToRemsAdminForPreFetch: {
    display: 'EHR Server Sent to REMS Admin for Prefetch',
    type: 'input',
    default: env.get('VITE_EHR_SERVER_TO_BE_SENT_TO_REMS_ADMIN_FOR_PREFETCH').asString()
  },
  generateJsonToken: {
    display: 'Generate JSON Web Token',
    type: 'check',
    default: env.get('VITE_GENERATE_JWT').asBool()
  },
  includeConfig: {
    display: 'Include Configuration in CRD Request',
    type: 'check',
    default: true
  },
  launchUrl: {
    display: 'DTR Launch URL (QuestionnaireForm)',
    type: 'input',
    default: env.get('VITE_LAUNCH_URL').asString()
  },
  patientFhirQuery: {
    display: 'Patient FHIR Query',
    type: 'input',
    default: env.get('VITE_PATIENT_FHIR_QUERY').asString()
  },
  pimsUrl: {
    display: 'PIMS Server',
    type: 'input',
    default: env.get('VITE_PIMS_SERVER').asString()
  },
  responseExpirationDays: {
    display: 'In Progress Form Expiration Days',
    type: 'input',
    default: env.get('VITE_RESPONSE_EXPIRATION_DAYS').asInt()
  },
  sendPrefetch: {
    display: 'Send Prefetch',
    type: 'check',
    default: true
  },
  smartAppUrl: {
    display: 'SMART App',
    type: 'input',
    default: env.get('VITE_SMART_LAUNCH_URL').asString()
  },
  intermediaryUrl: {
    display: 'REMS Intermediary URL',
    type: 'input',
    default: env.get('VITE_INTERMEDIARY').asString()
  },
  disableMedicationStatus: {
    display: 'Disable Medication Status',
    type: 'check',
    default: false
  },

  hookToSend: {
    display: 'Send hook on patient select',
    type: 'dropdown',
    default: env.get('VITE_HOOK_TO_SEND').asString()
  }
};

const ORDER_SIGN = 'order-sign';
const ORDER_SELECT = 'order-select';
const PATIENT_VIEW = 'patient-view';
const ENCOUNTER_START = 'encounter-start';
const REMS_ETASU = '$rems-etasu';

const CDS_SERVICE = 'cds-services';
const ETASU_ENDPOINT = 'GuidanceResponse/$rems-etasu';

const serviceEndpoints = {
  'order-sign': CDS_SERVICE + '/rems-' + ORDER_SIGN,
  'order-select': CDS_SERVICE + '/rems-' + ORDER_SELECT,
  'patient-view': CDS_SERVICE + '/rems-' + PATIENT_VIEW,
  'encounter-start': CDS_SERVICE + '/rems-' + ENCOUNTER_START,
  '$rems-etasu': '4_0_0/' + ETASU_ENDPOINT
};

const medicationRequestToRemsAdmins = Object.freeze([
  {
    rxnorm: 2183126,
    display: 'Turalio 200 MG Oral Capsule',
    endpoints: [
      { endpointType: ORDER_SIGN, remsAdmin: 'http://localhost:8090/cds-services/rems-order-sign' },
      {
        endpointType: ORDER_SELECT,
        remsAdmin: 'http://localhost:8090/cds-services/rems-order-select'
      },
      {
        endpointType: PATIENT_VIEW,
        remsAdmin: 'http://localhost:8090/cds-services/rems-patient-view'
      },
      {
        endpointType: ENCOUNTER_START,
        remsAdmin: 'http://localhost:8090/cds-services/rems-encounter-start'
      },
      { endpointType: REMS_ETASU, remsAdmin: 'http://localhost:8090/4_0_0/' + ETASU_ENDPOINT }
    ]
  },
  {
    rxnorm: 6064,
    display: 'Isotretinoin 20 MG Oral Capsule',
    endpoints: [
      { endpointType: ORDER_SIGN, remsAdmin: 'http://localhost:8090/cds-services/rems-order-sign' },
      {
        endpointType: ORDER_SELECT,
        remsAdmin: 'http://localhost:8090/cds-services/rems-order-select'
      },
      {
        endpointType: PATIENT_VIEW,
        remsAdmin: 'http://localhost:8090/cds-services/rems-patient-view'
      },
      {
        endpointType: ENCOUNTER_START,
        remsAdmin: 'http://localhost:8090/cds-services/rems-encounter-start'
      },
      { endpointType: REMS_ETASU, remsAdmin: 'http://localhost:8090/4_0_0/' + ETASU_ENDPOINT }
    ]
  },
  {
    rxnorm: 1237051,
    display: 'TIRF 200 UG Oral Transmucosal Lozenge',
    endpoints: [
      { endpointType: ORDER_SIGN, remsAdmin: 'http://localhost:8090/cds-services/rems-order-sign' },
      {
        endpointType: ORDER_SELECT,
        remsAdmin: 'http://localhost:8090/cds-services/rems-order-select'
      },
      {
        endpointType: PATIENT_VIEW,
        remsAdmin: 'http://localhost:8090/cds-services/rems-patient-view'
      },
      {
        endpointType: ENCOUNTER_START,
        remsAdmin: 'http://localhost:8090/cds-services/rems-encounter-start'
      },
      { endpointType: REMS_ETASU, remsAdmin: 'http://localhost:8090/4_0_0/' + ETASU_ENDPOINT }
    ]
  },
  {
    rxnorm: 1666386,
    display: 'Addyi 100 MG Oral Tablet',
    endpoints: [
      { endpointType: ORDER_SIGN, remsAdmin: 'http://localhost:8090/cds-services/rems-order-sign' },
      {
        endpointType: ORDER_SELECT,
        remsAdmin: 'http://localhost:8090/cds-services/rems-order-select'
      },
      {
        endpointType: PATIENT_VIEW,
        remsAdmin: 'http://localhost:8090/cds-services/rems-patient-view'
      },
      {
        endpointType: ENCOUNTER_START,
        remsAdmin: 'http://localhost:8090/cds-services/rems-encounter-start'
      },
      { endpointType: REMS_ETASU, remsAdmin: 'http://localhost:8090/4_0_0/' + ETASU_ENDPOINT }
    ]
  }
]);

const types = {
  error: 'errorClass',
  info: 'infoClass',
  debug: 'debugClass',
  warning: 'warningClass'
};

const genderOptions = {
  option1: {
    text: 'Male',
    value: 'male'
  },
  option2: {
    text: 'Female',
    value: 'female'
  }
};

const stateOptions = [
  { key: 'AL', value: 'AL', text: 'Alabama' },
  { key: 'AK', value: 'AK', text: 'Alaska' },
  { key: 'AZ', value: 'AZ', text: 'Arizona' },
  { key: 'AR', value: 'AR', text: 'Arkansas' },
  { key: 'CA', value: 'CA', text: 'California' },
  { key: 'CO', value: 'CO', text: 'Colorado' },
  { key: 'CT', value: 'CT', text: 'Connecticut' },
  { key: 'DE', value: 'DE', text: 'Delaware' },
  { key: 'DC', value: 'DC', text: 'District Of Columbia' },
  { key: 'FL', value: 'FL', text: 'Florida' },
  { key: 'GA', value: 'GA', text: 'Georgia' },
  { key: 'HI', value: 'HI', text: 'Hawaii' },
  { key: 'ID', value: 'ID', text: 'Idaho' },
  { key: 'IL', value: 'IL', text: 'Illinois' },
  { key: 'IN', value: 'IN', text: 'Indiana' },
  { key: 'IA', value: 'IA', text: 'Iowa' },
  { key: 'KS', value: 'KS', text: 'Kansas' },
  { key: 'KY', value: 'KY', text: 'Kentucky' },
  { key: 'LA', value: 'LA', text: 'Louisiana' },
  { key: 'ME', value: 'ME', text: 'Maine' },
  { key: 'MD', value: 'MD', text: 'Maryland' },
  { key: 'MA', value: 'MA', text: 'Massachusetts' },
  { key: 'MI', value: 'MI', text: 'Michigan' },
  { key: 'MN', value: 'MN', text: 'Minnesota' },
  { key: 'MS', value: 'MS', text: 'Mississippi' },
  { key: 'MO', value: 'MO', text: 'Missouri' },
  { key: 'MT', value: 'MT', text: 'Montana' },
  { key: 'NE', value: 'NE', text: 'Nebraska' },
  { key: 'NV', value: 'NV', text: 'Nevada' },
  { key: 'NH', value: 'NH', text: 'New Hampshire' },
  { key: 'NJ', value: 'NJ', text: 'New Jersey' },
  { key: 'NM', value: 'NM', text: 'New Mexico' },
  { key: 'NY', value: 'NY', text: 'New York' },
  { key: 'NC', value: 'NC', text: 'North Carolina' },
  { key: 'ND', value: 'ND', text: 'North Dakota' },
  { key: 'OH', value: 'OH', text: 'Ohio' },
  { key: 'OK', value: 'OK', text: 'Oklahoma' },
  { key: 'OR', value: 'OR', text: 'Oregon' },
  { key: 'PA', value: 'PA', text: 'Pennsylvania' },
  { key: 'RI', value: 'RI', text: 'Rhode Island' },
  { key: 'SC', value: 'SC', text: 'South Carolina' },
  { key: 'SD', value: 'SD', text: 'South Dakota' },
  { key: 'TN', value: 'TN', text: 'Tennessee' },
  { key: 'TX', value: 'TX', text: 'Texas' },
  { key: 'UT', value: 'UT', text: 'Utah' },
  { key: 'VT', value: 'VT', text: 'Vermont' },
  { key: 'VA', value: 'VA', text: 'Virginia' },
  { key: 'WA', value: 'WA', text: 'Washington' },
  { key: 'WV', value: 'WV', text: 'West Virginia' },
  { key: 'WI', value: 'WI', text: 'Wisconsin' },
  { key: 'WY', value: 'WY', text: 'Wyoming' }
];

const defaultValues = [
  {
    key: 'CPAP',
    text: 'E0601',
    value: 'E0601',
    codeSystem: 'https://bluebutton.cms.gov/resources/codesystem/hcpcs'
  },
  {
    key: 'Wheelchair',
    text: '97542',
    value: '97542',
    codeSystem: 'http://www.ama-assn.org/go/cpt'
  },
  {
    key: 'Crutches',
    text: 'E0110',
    value: 'E0110',
    codeSystem: 'https://bluebutton.cms.gov/resources/codesystem/hcpcs'
  },
  {
    key: 'Hospital Bed',
    text: 'E0250',
    value: 'E0250',
    codeSystem: 'https://bluebutton.cms.gov/resources/codesystem/hcpcs'
  },
  {
    key: 'Continuous Glucose Monitoring',
    text: '95250',
    value: '95250',
    codeSystem: 'http://www.ama-assn.org/go/cpt'
  },
  { key: 'Nebulizer', text: '94640', value: '94640', codeSystem: 'http://www.ama-assn.org/go/cpt' },
  {
    key: 'Glucose Test Strip',
    text: '82947',
    value: '82947',
    codeSystem: 'http://www.ama-assn.org/go/cpt'
  },
  {
    key: 'Oxygen Therapy',
    text: 'E0424',
    value: 'E0424',
    codeSystem: 'https://bluebutton.cms.gov/resources/codesystem/hcpcs'
  }
];

const shortNameMap = {
  'http://www.ama-assn.org/go/cpt': 'CPT',
  'https://bluebutton.cms.gov/resources/codesystem/hcpcs': 'HCPCS',
  'http://www.nlm.nih.gov/research/umls/rxnorm': 'RxNorm',
  'http://hl7.org/fhir/sid/ndc': 'NDC'
};

export {
  defaultValues,
  genderOptions,
  headerDefinitions,
  shortNameMap,
  stateOptions,
  types,
  medicationRequestToRemsAdmins,
  ORDER_SIGN,
  ORDER_SELECT,
  PATIENT_VIEW,
  ENCOUNTER_START,
  REMS_ETASU,
  CDS_SERVICE,
  serviceEndpoints
};

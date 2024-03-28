import { headerDefinitions, medicationRequestToRemsAdmins } from '../../util/data';
export const actionTypes = Object.freeze({
  updatePatient: 'update_patient', // {type, value}
  updateSetting: 'update_setting', // {type, settingId, value}
  flagStartup: 'flag_startup' // {type}
});
// todo: add an enum that defines possible settings
export const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.updateSetting:
      return {
        ...state,
        [action.settingId]: action.value
      };
    case actionTypes.updatePatient:
      return {
        ...state,
        patient: action.value
      };
    case actionTypes.flagStartup:
      return {
        ...state,
        startup: true
      };
    default:
      return state;
  }
};

const initialState = {
  patient: null,
  startup: false,
  redirect: ''
};

Object.keys(headerDefinitions).forEach(e => {
  initialState[e] = headerDefinitions[e].default; // fill default settings values
});

medicationRequestToRemsAdmins.forEach(row => {
  const { rxnorm, hookEndpoints } = row;
  hookEndpoints.forEach(endpoint => {
    const { hook, remsAdmin } = endpoint;
    const key = `${rxnorm}_${hook}`;
    initialState[key] = remsAdmin;
  });
});

export { initialState };

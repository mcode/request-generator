import { headerDefinitions, medicationRequestToRemsAdmins } from '../../util/data';
export const actionTypes = Object.freeze({
  updatePatient: 'update_patient', // {type, value}
  updateSetting: 'update_setting', // {type, settingId, value}
  flagStartup: 'flag_startup', // {type}
  deleteCdsHookSetting: 'DELETE_CDS_HOOK_SETTING'
});
// todo: add an enum that defines possible settings
export const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.deleteCdsHookSetting:
      return Object.keys(state).reduce((previousState, currentKey) => {
        const newState = { ...previousState };
        if (currentKey !== action.settingId) {
          newState[currentKey] = state[currentKey];
        }
        return newState;
      }, {});
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
  const { rxnorm, display, hookEndpoints } = row;
  hookEndpoints.forEach(({ hook, remsAdmin }) => {
    const key = `${rxnorm}_${hook}`;
    initialState[key] = { rxnorm, display, hook, remsAdmin };
  });
});

export { initialState };

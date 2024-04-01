import { headerDefinitions, medicationRequestToRemsAdmins } from '../../util/data';
import { v4 as uuidv4 } from 'uuid';

export const actionTypes = Object.freeze({
  updatePatient: 'update_patient', // {type, value}
  updateSetting: 'update_setting', // {type, settingId, value}
  flagStartup: 'flag_startup', // {type}
  deleteCdsHookSetting: 'DELETE_CDS_HOOK_SETTING', // {type, settingId}
  addCdsHookSetting: 'ADD_CDS_HOOK_SETTING', // {type}
  updateCdsHookSetting: 'UPDATE_CDS_HOOK_SETTING', // {type, settingId, value}
  resetSettings: 'RESET_SETTINGS' // {type}
});

const getNewStateWithoutCdsHookSetting = (state, settingId) => {
  const newState = { ...state, medicationRequestToRemsAdmins: {} };
  for (const key of Object.keys(state.medicationRequestToRemsAdmins)) {
    if (key !== settingId) {
      newState.medicationRequestToRemsAdmins[key] = state.medicationRequestToRemsAdmins[key];
    }
  }
  return newState;
};

// todo: add an enum that defines possible settings
export const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.deleteCdsHookSetting:
      return getNewStateWithoutCdsHookSetting(state, action.settingId);
    case actionTypes.addCdsHookSetting:
      return {
        ...state,
        medicationRequestToRemsAdmins: {
          ...state.medicationRequestToRemsAdmins,
          [uuidv4()]: {
            rxnorm: 'Fill out Medication RxNorm Code',
            display: 'Fill out Medication Display Name',
            hook: 'order-sign',
            remsAdmin: 'REMS Admin URL for CDS Hook'
          }
        }
      };
    case actionTypes.updateCdsHookSetting:
      return {
        ...state,
        medicationRequestToRemsAdmins: {
          ...state.medicationRequestToRemsAdmins,
          [action.settingId]: {
            ...state.medicationRequestToRemsAdmins[action.settingId],
            ...action.value
          }
        }
      };
    case actionTypes.resetSettings:
      return { ...initialState, startup: true };
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

export const initialState = (() => {
  let state = {
    patient: null,
    startup: false,
    redirect: '',
    medicationRequestToRemsAdmins: {}
  };

  Object.keys(headerDefinitions).forEach(key => {
    state[key] = headerDefinitions[key].default;
  });

  medicationRequestToRemsAdmins.forEach(row => {
    const { rxnorm, display, hookEndpoints } = row;
    hookEndpoints.forEach(({ hook, remsAdmin }) => {
      const key = `${rxnorm}_${hook}`;
      state.medicationRequestToRemsAdmins[key] = { rxnorm, display, hook, remsAdmin };
    });
  });
  return state;
})();

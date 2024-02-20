import { headerDefinitions } from '../../util/data';
export const stateActions = Object.freeze({
  updatePatient: 'update_patient',
  updateSetting: 'update_setting', // {type, settingId, value}
  flagStartup: 'flag_startup'
});
// todo: add an enum that defines possible settings
export const reducer = (state, action) => {
  switch (action.type) {
    case stateActions.updateSetting:
      return {
        ...state,
        [action.settingId]: action.value
      };
    case stateActions.updatePatient:
      return {
        ...state,
        patient: action.value
      };
    case stateActions.flagStartup:
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
  startup: false
};
Object.keys(headerDefinitions).forEach(e => {
  initialState[e] = headerDefinitions[e].default; // fill default settings values
});

export { initialState };

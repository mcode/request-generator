import React, { memo } from 'react';
import { retrieveLaunchContext } from '../../util/util';
import { Paper } from '@mui/material';
import useStyles from './styles.jsx';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIcon from '@mui/icons-material/Assignment';
import env from 'env-var';

const FormElement = props => {
  const classes = useStyles();
  const resource = props.resource;
  const clientState = props.client.state;
  const status = props.status;
  const date = new Date(resource.meta.lastUpdated).toUTCString();
  const [questionnaireId] = resource.questionnaire.split('/').slice(-1);
  const splitCamelCaseWithAbbreviations = s => {
    return s.split(/([A-Z][a-z]+)/).filter(function (e) {
      return e;
    });
  };

  const relaunch = () => {
    const link = {
      appContext: encodeURIComponent(`response=QuestionnaireResponse/${resource.id}`),
      type: 'smart',
      url: env.get('REACT_APP_LAUNCH_URL').asString()
    };
    retrieveLaunchContext(link, clientState.tokenResponse.patient, clientState).then(e => {
      window.open(e.url, '_blank');
    });
  };
  const renderStatus = () => {
    let bColor = {};
    if (status === 'in-progress') {
      bColor = { backgroundColor: '#fdbe14' };
    } else if (status === 'completed') {
      bColor = { backgroundColor: '#20c997' };
    }
    return <div style={bColor} className={classes.progressBubble}></div>;
  };
  return (
    <div onClick={relaunch}>
      <Paper className={classes.dashboardElement}>
        {renderStatus()}
        <div>
          <CalendarTodayIcon className={classes.elementIcon} /> <strong>Last Updated</strong>:{' '}
          <span> {date}</span>
        </div>
        <div>
          <AssignmentIcon className={classes.elementIcon} /> <strong> Questionnaire</strong>:{' '}
          {splitCamelCaseWithAbbreviations(questionnaireId).join(' ')}
        </div>
      </Paper>
    </div>
  );
};

export default memo(FormElement);

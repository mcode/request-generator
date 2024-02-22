import React, { memo, useState } from 'react';
import { Button, Grid, Tooltip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings';

import useStyles from './styles';
import PatientSection from './PatientSection';
import { SettingsContext } from '../../containers/ContextProvider/SettingsProvider';
import SettingsSection from './SettingsSection';
import TasksSection from './TasksSection';

const Home = props => {
  const classes = useStyles();
  const patientButton = 'Select a Patient';
  const taskButton = 'View Tasks';
  const settingsButton = 'Settings';
  const [section, setSection] = useState('');
  const [state, dispatch] = React.useContext(SettingsContext);

  const openSection = buttonId => {
    setSection(buttonId);
  };

  // renders top menu tab buttons
  const renderMainButton = (buttonId, icon) => {
    let buttonClass = `${classes.mainButton} ${classes.mainButtonView}`;
    let gridWidth = 2;
    let tooltip = '';
    if (section) {
      // section active, switch button view
      buttonClass = `${classes.mainButton} ${classes.tabButtonView}`;
      if (buttonId === section) {
        buttonClass += ` ${classes.selectedTabView}`;
      }
      gridWidth = 0;
      tooltip = <h5>{buttonId}</h5>;
    }
    return (
      <Grid item xs={gridWidth} align="center">
        <Tooltip enterDelay={600} title={tooltip}>
          <Button
            className={buttonClass}
            variant="contained"
            startIcon={icon}
            onClick={() => {
              openSection(buttonId);
            }}
          >
            {section ? '' : buttonId}
          </Button>
        </Tooltip>
      </Grid>
    );
  };
  // render view depending on which tab button is selected
  const renderMainView = () => {
    let gridClass = `${classes.mainDiv} ${classes.mainDivView}`;
    if (section) {
      gridClass = `${classes.mainDiv} ${classes.tabDivView}`;
    }
    return (
      <Grid className={gridClass} item container justifyContent={'center'} alignItems={'center'}>
        {section ? '' : <Grid item xs={3}></Grid>} {/* spacer */}
        {renderMainButton(patientButton, <PersonIcon className={classes.mainIcon} />)}
        {renderMainButton(taskButton, <AssignmentIcon className={classes.mainIcon} />)}
        {renderMainButton(settingsButton, <SettingsIcon className={classes.mainIcon} />)}
        {section ? (
          <Grid className={classes.spacer} item xs={0}>
            <div></div>
          </Grid>
        ) : (
          <Grid item xs={3}></Grid>
        )}
        {/* spacer */}
      </Grid>
    );
  };

  // render content of each view, makes other content invisible so it doesn't rerender every time
  const renderSectionView = () => {
    let renderSection = <div>Loading...</div>;

    if (section) {
      let patientRenderClass = section === patientButton ? '' : classes.disappear;
      let taskRenderClass = section === taskButton ? '' : classes.disappear;
      let settingsRenderClass = section === settingsButton ? '' : classes.disappear;

      return (
        <div className={classes.mainSectionView}>
          <div className={patientRenderClass}>
            <PatientSection client={props.client} />
          </div>
          <div className={taskRenderClass}>
            <TasksSection client={props.client} />
          </div>
          <div className={settingsRenderClass}>
            <SettingsSection client={props.client} />
          </div>
        </div>
      );
    } else {
      return '';
    }
  };

  return (
    <div>
      {renderMainView()}
      {renderSectionView()}
    </div>
  );
};

export default memo(Home);

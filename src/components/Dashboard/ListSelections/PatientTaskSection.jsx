import { memo } from 'react';
import useStyles from '../styles';
import TasksSection from '../../RequestDashboard/TasksSection';

const PatientTaskSection = props => {
  const classes = useStyles();

  return (
    <div className={classes.dashboardArea}>
      <h2 className={classes.elementHeader}>Tasks</h2>
      <TasksSection client={props.client} portalView={true} />
    </div>
  );
};

export default memo(PatientTaskSection);

import React, { memo } from 'react';
import useStyles from '../styles';

const EmptySection = () => {
  const classes = useStyles();
  return (
    <div className={classes.dashboardArea}>
      <h2 className={classes.elementHeader}>Not available</h2>
    </div>
  );
};

export default memo(EmptySection);

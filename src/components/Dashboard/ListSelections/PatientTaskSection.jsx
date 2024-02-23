import React, { memo, useState, useEffect, Fragment } from 'react';
import useStyles from '../styles';
import { Button, Grid, Stack, Modal, Box } from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { Info, Refresh } from '@mui/icons-material';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteIcon from '@mui/icons-material/Delete';

const PatientTaskSection = props => {

  const classes = useStyles();
  const [tasks, setTasks] = useState([]);
  const [taskToDelete, setTaskToDelete] = useState('');
  const [open, setOpen] = useState(false);
  const currUser = props.client.patient.id;

  const tryDelete = task => {
    setTaskToDelete(task);
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const fetchTasks = () => {
    let identifier = 'Task';
    if (props.client.patient && props.client.patient.id) {
      identifier = `Task?patient=${props.client.patient.id}`;
    }
    props.client.request(identifier, { resolveReferences: ['for', 'owner'] }).then(request => {
      console.log(request);
      if (request && request.entry) {
        const allTasks = request.entry.map(e => e.resource);
        const myTasks = allTasks.filter(t => t.owner?.id === currUser);
        setTasks(myTasks);
      } else {
        setTasks([]);
      }
    });
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const deleteTask = () => {
    if (taskToDelete) {
      props.client.delete(`${taskToDelete.resourceType}/${taskToDelete.id}`).then(e => {
        console.log('Deleted Task');
        fetchTasks();
      });
      setOpen(false);
      setTaskToDelete('');
    }
  };

  const renderTasks = taskSubset => {
    if (taskSubset.length > 0) {
      return (
        <Grid spacing={2} container>
          {taskSubset.map(t => renderTask(t))}
        </Grid>
      );
    } else {
      return <p className={classes.noTasks}>No Tasks Found</p>;
    }
  };

  const renderTask = task => {
    let statusColor = '#555';
    if (task.status.toLowerCase() === 'ready') {
      statusColor = '#198754';
    }

    let taskForName = 'N/A';
    let taskOwnerName = 'N/A';
    if (task.for.resourceType.toLowerCase() === 'patient') {
      const patient = task.for;
      if (patient.name) {
        taskForName = `${patient.name[0].given[0]} ${patient.name[0].family}`;
      }
    }
    if (task.owner && task.owner.resourceType.toLowerCase() === 'patient') {
      const patient = task.owner;
      if (patient.name) {
        taskOwnerName = `${patient.name[0].given[0]} ${patient.name[0].family}`;
      } else {
        taskOwnerName = task.owner.id;
      }
    }
    let ownerText = (
      <Stack direction="row" alignItems="center" gap={1}>
        <AssignmentLateIcon />
        Unassigned
      </Stack>
    );
    if (task.owner) {
      ownerText = (
        <Stack sx={{ color: '#333' }} direction="row" alignItems="center" gap={1}>
          <AssignmentTurnedInIcon />
          {`Assigned to ${taskOwnerName}`}
        </Stack>
      );
    }
    return (
      <Fragment key={task.id}>
        <Grid item xs={12}>
          <Grid className={classes.taskTabMain} item container xs={12}>
            <Grid className={classes.taskTabHeader} item xs={2}>
              {`Task ID: ${task.id}`}
            </Grid>
            <Grid className={classes.taskTabHeader} item xs={4}>
              {`Timestamp: ${task.authoredOn}`}
            </Grid>
            <Grid className={classes.taskTabHeader} item xs={4}>
              {`Beneficiary: ${task.for ? task.for.id : 'None'}`}
            </Grid>
            <Grid sx={{ color: statusColor }} className={classes.taskTabHeader} item xs={2}>
              {`STATUS: ${task.status.toUpperCase()}`}
            </Grid>
            <Grid className={classes.taskTabDescription} item xs={12}>
              {task.description}
            </Grid>
            <Grid className={classes.taskTabPatient} item xs={4}>
              <Stack direction="row" alignItems="center" gap={1}>
                <AssignmentIndIcon /> {taskForName}
              </Stack>
            </Grid>
            <Grid className={classes.taskTabOwner} item xs={6}>
              {ownerText}
            </Grid>
            <Grid className={classes.taskTabButton} item xs={3}>
              <Button variant="outlined" startIcon={<Info />}>
                View Resource
              </Button>
            </Grid>
            <Grid item xs={1}>
              {/*spacer*/}
            </Grid>
            <Grid className={classes.taskTabButton} item xs={2}>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  tryDelete(task);
                }}
              >
                Delete
              </Button>
            </Grid>
            <Grid className={classes.taskTabButton} item xs={3}>
              <Button variant="contained" endIcon={<ArrowForwardIcon />}>
                Process Task
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Fragment>
    );
  };

  return (
    <div className={classes.dashboardArea}>
        <h2 className={classes.elementHeader}>Tasks</h2>
        {renderTasks(tasks)}
        <Modal open={open} onClose={handleClose}>
          <Box className={classes.taskDeleteModal}>
            <Grid container>
              <Grid className={classes.taskDeleteHeader} item xs={12}>
                {taskToDelete ? `Are you sure you want to delete Task ${taskToDelete.id}` : ''}
              </Grid>
              <Grid item xs={7}>
                {/*spacer*/}
              </Grid>
              <Grid item xs={3}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  No
                </Button>
              </Grid>
              <Grid item xs={2}>
                <Button
                  variant="contained"
                  onClick={() => {
                    deleteTask();
                  }}
                >
                  Yes
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Modal>
    </div>
  );

};

export default memo(PatientTaskSection);
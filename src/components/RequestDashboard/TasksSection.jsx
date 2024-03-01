import React, { memo, useState, useEffect, Fragment } from 'react';
import {
  Button,
  Box,
  Modal,
  Grid,
  Tabs,
  Tab,
  Stack,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  Menu
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import useStyles from './styles';
import { SettingsContext } from '../../containers/ContextProvider/SettingsProvider';
import { MemoizedTabPanel } from './TabPanel';
import { Info, Refresh } from '@mui/icons-material';
import { retrieveLaunchContext } from '../../util/util';

const taskStatus = Object.freeze({
  inProgress: 'in-progress',
  completed: 'completed',
  ready: 'ready',
  cancelled: 'cancelled',
  onHold: 'on-hold',
});
const TasksSection = props => {
  const classes = useStyles();
  const [tasks, setTasks] = useState([]);
  const [state, dispatch] = React.useContext(SettingsContext);
  const [value, setValue] = useState(0);
  const [open, setOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState('');
  const [anchorStatus, setAnchorStatus] = useState(null);
  const [anchorAssign, setAnchorAssign] = useState(null);

  const menuOpen = Boolean(anchorStatus);
  const assignMenuOpen = Boolean(anchorAssign);

  const handleMenuClick = (event, task) => {
    setAnchorStatus({
      anchor: event.currentTarget,
      task: task
    });
  };
  const handleMenuClose = () => {
    setAnchorStatus(null);
  };
  const handleTaskStatusOptionSelect = (task, status) => {
    updateTaskStatus(task, status);
    handleMenuClose();
  };
  const handleChangeAssign = (task, val) => {
    const taskClone = structuredClone(task);
    if (val === 'me') {
      assignTaskToMe(taskClone);
    } else {
      assignTaskToPatient(taskClone);
    }
    handleAssignMenuClose();
  };
const handleAssignMenuClick = (event, task) => {
  setAnchorAssign({
    anchor: event.currentTarget,
    task: task
  });
};
const handleAssignMenuClose = () => {
  setAnchorAssign(null);
};
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const tryDelete = task => {
    setTaskToDelete(task);
    setOpen(true);
  };
  const washTask = task => {
    if (task.owner && task.owner.id) {
      task.owner = {
        reference: `${task.owner.resourceType}/${task.owner.id}`
      };
    }
    if (task.for && task.for.id) {
      task.for = {
        reference: `${task.for.resourceType}/${task.for.id}`
      };
    }
    return task;
  };
  const assignTaskToMe = task => {
    if (task) {
      task = washTask(task);
      let user = props.client.user.id;
      if (!user) {
        user = `Practitioner/${state.defaultUser}`;
      }
      task.owner = {
        reference: user
      };

      props.client.update(task).then(e => {
        fetchTasks();
      });
    }
  };
  const assignTaskToPatient = task => {
    if (task) {
      task = washTask(task);
      task.owner = {
        reference: task.for.reference
      };
      props.client.update(task).then(e => {
        fetchTasks();
      });
    }
  };
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
  const fetchTasks = () => {
    let identifier = 'Task';
    if (state.patient && state.patient.id) {
      identifier = `Task?patient=${state.patient.id}`;
    }
    props.client.request(identifier, { resolveReferences: ['for', 'owner'] }).then(request => {
      console.log(request);
      if (request && request.entry) {
        setTasks(request.entry.map(e => e.resource));
      } else {
        setTasks([]);
      }
    });
  };
  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [state.patient]);

  const updateTaskStatus = (task, status) => {
    task.status = status;
    const updatedTask = structuredClone(task); // structured clone may not work on older browsers
    props.client.update(washTask(updatedTask)).then(e => {
      fetchTasks();
    });
  };
  const launchTask = lTask => {
    let link = '';
    let appContext = '';
    lTask.input.forEach((input) => {
      const code = input?.type?.coding?.[0]?.code;
      if (code && code.toLowerCase() === 'smartonfhir-application') {
        link = input.valueUrl;
      } else if (code && code.toLowerCase() === 'smartonfhir-appcontext') {
        appContext = input.valueString;
      }
    });
    const smartLink = {
      appContext: encodeURIComponent(appContext),
      type: 'smart',
      url: link
    };
    const patient = lTask.for.id;
    retrieveLaunchContext(smartLink, patient, props.client.state).then((result) => {
      updateTaskStatus(lTask, 'in-progress');
      lTask.status = 'in-progress';
      props.client.update(washTask(lTask)).then(e => {
        fetchTasks();
      });
      window.open(result.url, '_blank');
    });
  };
  const renderStatusMenu = () => {
    return (<Menu
      anchorEl={anchorStatus?.anchor}
      open={menuOpen}
      onClose={handleMenuClose}
    >
      {Object.keys(taskStatus).map((op) => {
        return(
          <MenuItem key = {op} onClick={() => {handleTaskStatusOptionSelect(anchorStatus.task, taskStatus[op]);}}>{taskStatus[op]}</MenuItem>
        );
      })}
    </Menu>);
  };
  const renderAssignMenu = () => {
    const assignOptions = ['me', 'patient'];
    return (<Menu
      anchorEl={anchorAssign?.anchor}
      open={assignMenuOpen}
      onClose={handleAssignMenuClose}
    >
      {assignOptions.map((op) => {
        return(
          <MenuItem key = {op} onClick={() => {handleChangeAssign(anchorAssign?.task, op);}}>{`Assign to ${op}`}</MenuItem>
        );
      })}
    </Menu>);
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
    const tStatus = task.status.toLowerCase();
    if (tStatus === taskStatus.ready) {
      statusColor = '#198754';
    } else if (tStatus === taskStatus.inProgress) {
      statusColor = '#fd7e14';
    } else if(tStatus === taskStatus.completed){
      statusColor = '#0d6efd';
    }

    let taskForName = 'N/A';
    let taskOwnerName = 'N/A';
    if (task.for?.resourceType?.toLowerCase() === 'patient') {
      const patient = task.for;
      if (patient.name) {
        taskForName = `${patient.name[0].given[0]} ${patient.name[0].family}`;
      }
    }
    if (task.owner && task.owner?.resourceType?.toLowerCase() === 'practitioner') {
      const practitioner = task.owner;
      if (practitioner.name) {
        taskOwnerName = `${practitioner.name[0].given[0]} ${practitioner.name[0].family}`;
      } else {
        taskOwnerName = task.owner.id;
      }
    }
    if (task.owner && task.owner?.resourceType?.toLowerCase() === 'patient') {
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
        <Grid item xs={12} lg={6}>
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
            <Grid className={classes.taskTabPatient} item xs={6}>
              <Stack direction="row" alignItems="center" gap={1}>
                <AssignmentIndIcon /> {taskForName}
              </Stack>
            </Grid>
            <Grid className={classes.taskTabOwner} item xs={6}>
              {ownerText}
            </Grid>
            <Grid className={classes.taskTabButton} item xs={3}>
              <Button variant="outlined" onClick = {(event) => {handleMenuClick(event, task);}} endIcon={<ExpandMoreIcon />}>
                Status
              </Button>
            </Grid>
            <Grid className={classes.taskTabButton} item xs={3}>
              <Button variant = "outlined" onClick = {(event) => {handleAssignMenuClick(event, task);}} endIcon={<ExpandMoreIcon />}>
                Assign
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
              <Button variant="contained" onClick={() => { launchTask(task); }} endIcon={<ArrowForwardIcon />}>
                Process Task
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Fragment>
    );
  };

  const unassignedTasks = tasks.filter(t => !t.owner);
  const assignedTasks = tasks.filter(t => t.owner?.id === state.defaultUser); // should check current user, not default
  return (
    <>
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
      {renderStatusMenu()}
      {renderAssignMenu()}
      <div>
        <Grid container>
          <Grid item xs={10}>
            <Tabs className={classes.taskHeaderTabs} value={value} onChange={handleChange}>
              <Tab icon={<AssignmentIcon />} label={`ALL TASKS (${tasks.length})`} />
              <Tab icon={<PersonIcon />} label={`MY TASKS (${assignedTasks.length})`} />
              <Tab icon={<EditNoteIcon />} label={`UNASSIGNED TASKS (${unassignedTasks.length})`} />
            </Tabs>
          </Grid>
          <Grid className={classes.taskRefreshButton} item xs={2}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={() => {
                fetchTasks();
              }}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
        <MemoizedTabPanel value={value} index={0}>
          {/* all tasks */}
          {renderTasks(tasks)}
        </MemoizedTabPanel>
        <MemoizedTabPanel value={value} index={1}>
          {/* my tasks */}
          {renderTasks(assignedTasks)}
        </MemoizedTabPanel>
        <MemoizedTabPanel value={value} index={2}>
          {/* unassigned tasks */}
          {renderTasks(unassignedTasks)}
        </MemoizedTabPanel>
      </div>
    </>
  );
};

export default memo(TasksSection);

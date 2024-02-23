import React, { memo, useState, useEffect } from 'react';
import useStyles from './styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import MedicationIcon from '@mui/icons-material/Medication';
import BiotechIcon from '@mui/icons-material/Biotech';
import LogoutIcon from '@mui/icons-material/Logout';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AlarmIcon from '@mui/icons-material/Alarm';
import SettingsIcon from '@mui/icons-material/Settings';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import FormsSection from './ListSelections/FormsSection';
import EmptySection from './ListSelections/EmptySection';
import PatientTaskSection from './ListSelections/PatientTaskSection';

const Dashboard = props => {
  const classes = useStyles();
  const [selectedIndex, setSelectedIndex] = useState(3);

  const handleListItemClick = (event, index) => {
    setSelectedIndex(index);
  };
  
  const drawerWidth = '340px';

  const createIcons = () => {
    const icons = [];
    const style = { fontSize: '40px' };
    const itemStyle = { height: '80px' };
    icons.push(['Notifications', <NotificationsIcon sx={style} />, itemStyle]);
    icons.push(['Appointments', <AlarmIcon sx={style} />, itemStyle]);
    icons.push(['Tasks', <AssignmentIcon sx={style} />, itemStyle]);
    icons.push(['Questionnaire Forms', <ListAltIcon sx={style} />, itemStyle]);
    icons.push(['Health Data', <MedicalInformationIcon sx={style} />, itemStyle]);
    icons.push(['Medications', <MedicationIcon sx={style} />, itemStyle]);
    icons.push(['Tests and Results', <BiotechIcon sx={style} />, itemStyle]);
    icons.push(['Settings', <SettingsIcon sx={style} />, itemStyle]);
    icons.push(['Logout', <LogoutIcon sx={style} />, itemStyle]);

    return icons;
  };

  useEffect(() => {
    if (selectedIndex === 8) {
      // logout - set client to null to display login page
      props.logout();
    }
  }, [selectedIndex]);

  const renderBody = () => {
    switch(selectedIndex) {
      case 2:
        return (<PatientTaskSection client={props.client} />);
      case 3:
        return (<FormsSection client={props.client} />);
      default: 
        return (<EmptySection />);
    }
  };

  return (
    <div>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <div className={classes.spacer}></div>

        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            ['& .MuiDrawer-paper']: { width: drawerWidth, boxSizing: 'border-box' }
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto', marginTop: '31px' }}>
            <List>
              {createIcons().map((option, index) => (
                <div key={`icon-${index}`}>
                  <ListItem key={option[0]} style={option[2]} selected={selectedIndex === index} disablePadding>
                    <ListItemButton onClick={(event) => handleListItemClick(event, index)}>
                      <ListItemIcon>{option[1]}</ListItemIcon>
                      <ListItemText
                        primaryTypographyProps={{ fontSize: '18px' }}
                        primary={option[0]}
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider />
                </div>
              ))}
            </List>
          </Box>
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          { renderBody() }
        </Box>
      </Box>
    </div>
  );
};

export default memo(Dashboard);

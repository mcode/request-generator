import React, { useState, useEffect, useContext } from 'react';

import { styled, useTheme } from '@mui/material/styles';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';

import { Box, Tab, Tabs, Button } from '@mui/material';
import { Container } from '@mui/system';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import { StyledAppBarAlt, StyledStack } from './styles';
import SettingsSection from '../../components/RequestDashboard/SettingsSection';
import TasksSection from '../../components/RequestDashboard/TasksSection';
import { SettingsContext } from '../ContextProvider/SettingsProvider';
import SimplePatientSelect from './SimplePatientSelect';
import SimplePatientDetails from './SimplePatientDetails';
import BackOfficeHome from './BackOfficeHome';

function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`
    };
  }

export default function Dashboard(props) {
    const { client } = props;
    const [headerStyle, setHeaderStyle] = useState(undefined);
    const [globalState, dispatch] = useContext(SettingsContext);
    console.log('global state patient -- > ',  globalState.patient);

    const [glossaryOpen, setGlossaryOpen] = useState(false);


    useEffect(() => {
        retrieveInProgress();
        const updateScrollState = () => {
            var threshold = 10;
            if (window.scrollY > threshold) {
                setHeaderStyle("true");
            } else {
                setHeaderStyle(undefined);
            }
        }
        document.addEventListener("scroll", updateScrollState);
        return () => document.removeEventListener("scroll", updateScrollState);
    }, []);

    const handleDrawerOpen = () => {
        setGlossaryOpen(true);
    };

    const handleDrawerClose = () => {
        setGlossaryOpen(false);
    };

    const retrieveInProgress = () => {
    
        let updateDate = new Date();
        updateDate.setDate(updateDate.getDate() - globalState.responseExpirationDays);
        const searchParameters = [
            `_lastUpdated=gt${updateDate.toISOString().split('T')[0]}`,
            'status=in-progress',
            '_sort=-authored'
        ];
        client
            .request(`QuestionnaireResponse?${searchParameters.join('&')}`, {
            resolveReferences: ['subject'],
            graph: false,
            flat: true
            })
            .then(result => {
                console.log(result);
            });
    }

    const [tabIndex, setValue] = useState(0);

    const handleChange = (event, newValue) => {
      setValue(newValue);
    };

    return (

        <div>
            <Container maxWidth="xl">
                <Button variant="outlined" onClick={handleDrawerOpen}>View Patient</Button>
                <Box
                    sx={{
                    width: '100%',
                    border: 1,
                    borderRadius: '5px',
                    borderWidth: 4,
                    borderColor: '#F1F3F4',
                    backgroundColor: '#E7EBEF'
                    }}
                >
                    <Box sx={{ backgroundColor: '#F1F3F4', borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabIndex} onChange={handleChange} aria-label="basic tabs example" centered>
                        <Tab label="Home" {...a11yProps(0)} />
                        <Tab label="Select Patients" {...a11yProps(1)} />
                        <Tab label="View Tasks" {...a11yProps(2)} />
                        <Tab label="Settings" {...a11yProps(3)} />
                    </Tabs>
                    </Box>

                    <Box>
                    <Box sx={{ padding: 2 }}>
                        {tabIndex === 0 && (
                        <Box>
                            <BackOfficeHome client={client}></BackOfficeHome>
                        </Box>
                        )}
                        {tabIndex === 1 && (
                        <Box>
                            <SimplePatientSelect client={client}></SimplePatientSelect>
                        </Box>
                        )}
                        {tabIndex === 2 && (
                        <Box>
                            <TasksSection client={client}></TasksSection>
                        </Box>
                        )}
                        {tabIndex === 3 && (
                        <Box>
                            <SettingsSection client={client}></SettingsSection>
                        </Box>
                        )}
                    </Box>
                    </Box>
                </Box>
                <Dialog
                    open={glossaryOpen}
                    onClose={handleDrawerClose}
                    fullWidth={true}
                    maxWidth='md'
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                    >
                        <div><SimplePatientDetails client={client}></SimplePatientDetails></div>
                </Dialog>
            </Container>
        </div>
    );
}
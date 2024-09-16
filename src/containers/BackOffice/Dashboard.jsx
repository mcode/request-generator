import React, { useState, useEffect, useContext } from 'react';
import CssBaseline from '@mui/material/CssBaseline';

import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';

import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HomeIcon from '@mui/icons-material/Home';
import { StyledAppBarAlt, StyledStack } from './styles';
import SettingsSection from '../../components/RequestDashboard/SettingsSection';
import TasksSection from '../../components/RequestDashboard/TasksSection';
import { SettingsContext } from '../ContextProvider/SettingsProvider';
import SimplePatientSelect from './SimplePatientSelect';
import SimplePatientDetails from './SimplePatientDetails';
import BackOfficeHome from './BackOfficeHome';
import { Person, Settings } from '@mui/icons-material';


const drawerWidth = 400;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        flexGrow: 1,
        padding: theme.spacing(3),
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        marginRight: -drawerWidth,
        ...(open && {
            transition: theme.transitions.create('margin', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
            }),
            marginRight: 0,
        }),
        position: 'relative',
    }),
);


const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-start',
}));

export default function Dashboard(props) {
    const { client } = props;
    const [headerStyle, setHeaderStyle] = useState(undefined);
    const [globalState, dispatch] = useContext(SettingsContext);
    console.log(globalState.patient);
    const tabs = {
        homeTab: {
            id: 'home',
            label: 'Home',
            icon: <HomeIcon />,
            content: <div key={"home"}><BackOfficeHome client = {client}></BackOfficeHome></div>
        },
        selectTab: {
            id: 'select',
            label: 'Select Patients',
            icon: <Person />,
            content: <div key={"select"}><SimplePatientSelect client = {client}></SimplePatientSelect></div>
        },
        tasksTab: {
            id: 'task',
            label: 'View Tasks',
            icon: <LibraryBooksIcon />,
            content: <div key={"tasks"}><TasksSection client = {client}></TasksSection></div>
        },
        settingsTab: {
            id: 'settings',
            label: 'Settings',
            icon: <Settings />,
            content: <div key={"settings"}><SettingsSection client = {client} ></SettingsSection></div>
        }
    };
    const [selected, setSelected] = useState(tabs.homeTab);
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

    const theme = useTheme();

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
    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <Box position="fixed" sx={{width: '100%', height: '60px', zIndex:2, backgroundColor: '#f2f2f2'}}>

            </Box>
            <StyledAppBarAlt position="fixed" isscrolled={headerStyle} open={glossaryOpen} drawerwidth={drawerWidth}>
            <Toolbar>
                {Object.values(tabs).map((tab) => {
                    return (<StyledStack onClick={() => setSelected(tab)}
                                         isscrolled={headerStyle}
                                         direction="row"
                                         alignItems="center"
                                         gap={2}
                                         key={tab.id}
                                         selected={selected?.id === tab.id}
                                         >
                                {tab.icon}
                                <Typography variant="p" noWrap>
                                    {tab.label}
                                </Typography>
                            </StyledStack>)
                })}
            <StyledStack onClick={handleDrawerOpen} isscrolled={headerStyle} direction="row" alignItems="center" gap={2} sx={{ ...(glossaryOpen && { display: 'none' }), marginLeft: 'auto', border: '1px solid black' }}>
                <LibraryBooksIcon />                  
                <Typography variant="p" noWrap>
                    View Patient
                </Typography>
                  
            </StyledStack>
            </Toolbar>
            </StyledAppBarAlt>
            <Main open={glossaryOpen}>
                <DrawerHeader />
                {Object.values(tabs).map((tab) => {
                    if(tab.id === selected?.id){
                        return tab.content;
                    }
                })}
            </Main>
            <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                    },
                }}
                variant="persistent"
                anchor="right"
                open={glossaryOpen}
            >
                <DrawerHeader>
                    <IconButton onClick={handleDrawerClose}>
                        {theme.direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                    </IconButton>
                </DrawerHeader>
                <Divider />
                <div><SimplePatientDetails client = {client}></SimplePatientDetails></div>
            </Drawer>
        </Box>
    );
}
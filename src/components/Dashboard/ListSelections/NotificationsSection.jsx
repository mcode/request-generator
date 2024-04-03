import React, { memo, useContext, useEffect, useState } from 'react';
import useStyles from '../styles';
import { SettingsContext } from '../../../containers/ContextProvider/SettingsProvider';
import { EtasuStatusComponent } from '../../EtasuStatus/EtasuStatusComponent';
import axios from 'axios';

const NotificationsSection = () => {
    const [globalState, _] = useContext(SettingsContext);
    const classes = useStyles();
    const [etasu, setEtasu] = useState([]);
    useEffect(() => {
        const patientFirstName = globalState.patient?.name?.at(0)?.given?.at(0);
        const patientLastName = globalState.patient?.name?.at(0)?.family;
        const patientDOB = globalState.patient?.birthDate;

        const etasuUrl = `${globalState.remsAdminServer}/etasu/met/patient/${patientFirstName}/${patientLastName}/${patientDOB}`;
        axios({
            method: 'get',
            url: etasuUrl
        }).then((response) => {
            setEtasu(response.data);
        }, (error) =>{
            console.error(error);
        })
    }, []);
    return (
        <div className={classes.dashboardArea}>
            <h2 className={classes.elementHeader}>Notifications</h2>
            {etasu.map((remsCase) => {
                return <EtasuStatusComponent key = {remsCase.case_number} remsAdminResponseInit={remsCase} />
            })}
        </div>
    );
};

export default memo(NotificationsSection);

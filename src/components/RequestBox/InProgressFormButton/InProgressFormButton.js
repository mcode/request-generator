import { Box, Button, Paper, Typography, ButtonGroup } from '@mui/material';
import React from 'react';
import './InProgressFormButtonStyle.css';

export default function InProgressFormButton(props) {
    return (
        <Paper variant='elevation' className='inprogress-container' sx={{ bgcolor: '#F3F6F9' }}>
            {props.qrResponse.questionnaire ? (
                <Box>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        In Progress Form
                    </Typography>
                    <Typography variant="subtitle1">
                        <Typography color="text.secondary">  Author: </Typography>{props.qrResponse.author ? props.qrResponse.author.reference : 'empty'}
                    </Typography>
                    <Typography variant="subtitle1" >
                        <Typography color="text.secondary">  Last Edited: </Typography> {props.qrResponse.authored ? props.qrResponse.authored : 'empty'}
                    </Typography>
                    <Typography sx={{ mb: 4 }} variant="subtitle1">
                        <Typography color="text.secondary">  Form Link: </Typography>{props.qrResponse.questionnaire ? props.qrResponse.questionnaire : 'empty'}
                    </Typography>
                    <ButtonGroup variant="contained" aria-label="button group">
                        <Button onClick={props.relaunch} color='secondary' varient='contained'>
                            Open In-Progress Form
                        </Button>
                    </ButtonGroup>
                </Box>
            ) : <h4>Error: No in progress forn found</h4>
            }
        </Paper>
    );
}
import { makeStyles } from '@mui/styles';
export default makeStyles(
  theme => ({
    adminBar: {
      height: '95px',
      backgroundColor: theme.palette.common.purple,
      width: '100%',
      textAlign: 'center',
      lineHeight: '95px'
    },
    formFont: {
      fontFamily: '"Gill Sans", sans-serif'
    },
    dashboardArea: {
      backgroundColor: '#fdfdfd',
      margin: '80px 60px 0px 60px',
      padding: '20px',
      overflowY: 'auto',
      overflowX: 'hidden',
      height: '75vh'
    },
    dashboardElement: {
      height: '100px',
      width: '100%',
      padding: '10px',
      margin: '5px',
      fontSize: '18px',
      cursor: 'pointer',
      '&:hover': {
        boxShadow:
          '0px 2px 1px 1px rgb(0 0 0 / 40%), 0px 1px 1px 0px rgb(0 0 0 / 28%), 0px 1px 3px 0px rgb(0 0 0 / 24%)'
      }
    },
    elementHeader: {
      marginLeft: '5px',
      display: 'inline-block'
    },
    elementIcon: {
      verticalAlign: 'middle'
    },
    listItemText: {
      fontSize: '4.2em' //Insert your required size
    },
    progressBubble: {
      height: '12px',
      width: '12px',
      borderRadius: '12px',
      float: 'right'
    },
    spacer: {},
    taskDeleteHeader: {
      padding: '15px 0 15px 0'
    },
    taskDeleteModal: {
      border: '1px solid black',
      width: '400px',

      backgroundColor: 'white',
      position: 'fixed',
      top: '50%',
      left: '50%',
      padding: '15px',
      transform: 'translate(-50%, -50%)',
      overflowY: 'auto',
      fontSize: '18px',
      boxShadow: '10px 10px 20px black'
    },
    tabDivView: {
      '&.MuiGrid-root': {
        // padding: '0 15px 0 15px',
        marginTop: '0vh',
        alignItems: 'flex-start',
        justifyContent: 'flex-start'
      }
    },
    taskHeaderTabs: {
      margin: '15px 15px 5px 15px',
      backgroundColor: '#F5F5F7'
    },
    taskRefreshButton: {
      padding: '35px 0 0 0'
    },
    taskTabButton: {
      padding: '10px 0px 5px 0px'
    },
    taskTabMain: {
      border: '0px solid black',
      boxShadow: '2px 2px',
      borderRadius: '5px',
      padding: '8px',
      background: 'linear-gradient(to right bottom, #F5F5F7, #eaeaef)',
      '&:hover': {
        background: 'linear-gradient(to right bottom, #FFFFFF, #efefff)'
      }
    },
    taskTabHeader: {
      fontSize: '8px',
      color: '#777',
      borderBottom: '1px solid #e3e3ef'
    },
    taskTabDescription: {
      fontSize: '18px',
      padding: '8px 0px 10px 2px'
    },
    taskTabOwner: {
      color: '#777'
    }
  }),

  { name: 'Dashboard', index: 1 }
);

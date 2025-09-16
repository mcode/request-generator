import { makeStyles } from '@mui/styles';
export default makeStyles(
  () => ({
    disappear: {
      display: 'none'
    },
    spacer: {
      height: '50px', // must be same as buttons
      borderBottom: '1px solid black',
      flexGrow: 1,
      backgroundColor: '#005B94'
    },
    mainButtonView: {
      '&.MuiButtonBase-root': {
        width: '600px',
        maxWidth: '90%',
        height: '150px',
        backgroundColor: '#0d6efd',
        opacity: '75%',
        color: '#fcfcfc',
        fontSize: '1.5rem'
      }
    },
    mainDiv: {},
    mainDivView: {
      '&.MuiGrid-root': {
        padding: '0 50px 0 50px',
        marginTop: '35vh'
      }
    },
    mainIcon: {
      '&.MuiSvgIcon-root': {
        '&.MuiSvgIcon-fontSizeMedium': {
          fontSize: '3rem'
        }
      }
    },
    mainSectionView: {
      width: 'auto',
      height: 'auto',
      borderLeft: '1px solid black',
      borderRight: '1px solid black'
    },
    noTasks: {
      backgroundColor: '#e4e4e4',
      padding: '10px',
      fontSize: '18px'
    },
    // DO NOT ALPHABETIZE
    // if you must alphabetize this file to have classes
    // sorted, rename tabButtonView and selectedTabView such
    // that tabButtonView occurs earlier in the list.
    // Otherwise, the styles will override incorrectly.
    tabButtonView: {
      '&.MuiButtonBase-root': {
        width: '75px',
        height: '50px',
        opacity: '75%',
        fontSize: '1.5rem',
        border: '1px solid black',
        boxShadow: 'none',
        borderRadius: '0'
      },
      '& > *': {
        // generic child selector
        '&.MuiButton-iconSizeMedium': {
          // specificity
          marginRight: 0
        }
      }
    },
    selectedTabView: {
      '&.MuiButtonBase-root': {
        color: 'black',
        borderBottom: 'none',
        backgroundColor: '#F5F5F7',
        '&:hover': {
          backgroundColor: '#F5F5F7',
          boxShadow: 'none'
        }
      }
    },
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
      boxShadow: '-2px -2px 3px 1px',
      borderRadius: '5px',
      padding: '8px',
      background: 'linear-gradient(to right bottom, #F5F5F7, #eaeaef)',
      '&:hover': {
        background: 'linear-gradient(to right bottom, #FFFFFF, #efefff)'
      }
    },
    taskTabHeader: {
      fontSize: '9px',
      color: '#777',
      borderBottom: '1px solid #e3e3ef'
    },
    taskTabDescription: {
      fontSize: '18px',
      padding: '8px 0px 10px 2px'
    },
    taskTabOwner: {
      color: '#777'
    },
    titleIcon: {
      color: 'white',
      fontSize: '19px',
      fontFamily: 'Verdana',
      float: 'left',
      marginLeft: '20px',
      verticalAlign: 'middle'
    },
    loginIcon: {
      color: 'white',
      fontSize: '19px',
      marginLeft: 'auto',
      fontFamily: 'Verdana',
      float: 'right',
      marginRight: '20px',
      verticalAlign: 'middle'
    },
    whiteButton: {
      color: 'white !important',
      borderColor: 'white !important',
      marginRight: '5px !important',
      marginLeft: '20px !important'
    }
  }),

  { name: 'RequestDashboard', index: 1 }
);

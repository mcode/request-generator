import { makeStyles } from '@mui/styles';
export default makeStyles(
  theme => ({
    '@global': {
      body: {
        backgroundColor: '#fafafa'
      }
    },
    gatewayDiv: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '50px',
      margin: '10% auto 0 auto',
      width: '60%',
      backgroundColor: '#fff'
    },
    gatewayHeader: {
      marginBottom: '25px'
    },
    gatewayInput: {
      padding: '50px'
    }
  }),

  { name: 'Gateway', index: 1 }
);

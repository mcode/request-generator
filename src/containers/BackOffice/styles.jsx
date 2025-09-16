import { styled } from '@mui/system';
import { AppBar, Stack } from '@mui/material';
import { makeStyles } from '@mui/styles';

export default makeStyles(theme => ({
  loginIcon: {
    color: theme.palette.common.white,
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
  },
  patientButton: {
    padding: '10px',
    'padding-left': '20px',
    'padding-right': '20px'
  }
}));

export const StyledStack = styled(Stack)(
  ({ theme, selected, disabled, isscrolled, highlight }) => ({
    position: 'relative',
    // width: '200px',
    margin: '0 5px',
    padding: '8px 20px 8px 20px',
    fontSize: '16px',
    borderRadius: '8px',
    cursor: disabled ? 'default' : 'pointer',
    color: disabled ? theme.palette.text.gray : theme.palette.text.primary,
    backgroundColor: highlight
      ? theme.palette.background.primary
      : selected && !isscrolled
        ? theme.palette.common.offWhite
        : 'inherit',
    transition: 'border 0.5s ease',
    border: '1px solid transparent',
    borderBottomColor: selected && isscrolled ? theme.palette.primary.main : 'transparent',
    boxShadow: selected && !isscrolled ? 'rgba(0,0,0,0.2) 8px -2px 12px 2px' : 'none',
    '&:hover': {
      border: disabled ? '' : `1px solid ${theme.palette.common.gray}`
    }
  })
);

export const GlossaryDiv = styled('div')(({ theme, isscrolled }) => ({
  backgroundColor: 'white',
  zIndex: 1200,
  padding: '30px'
}));

export const StyledAppBarAlt = styled(AppBar, {
  shouldForwardProp: prop => prop !== 'open'
})(({ theme, open, isscrolled, drawerwidth }) => {
  console.log(theme);
  console.log(theme.palette);
  return {
    marginTop: '15px',
    marginBottom: '15px',
    marginLeft: '2%',
    marginRight: '2%',
    width: '96%',
    left: 0,
    backgroundColor: isscrolled ? theme.palette.common.white : theme.palette.common.offWhite,
    opacity: isscrolled ? 0.99 : 1,
    color: theme.palette.common.black,
    boxShadow: isscrolled ? 'rgba(0,0,0,0.2)' : 'none',
    borderRadius: '8px',
    border: isscrolled ? '1px solid #c1c1c1' : 'none',
    ...(open && {
      marginRight: `calc(2% + ${drawerwidth})`,
      width: `calc(96% - ${drawerwidth}px)`
    })
  };
});

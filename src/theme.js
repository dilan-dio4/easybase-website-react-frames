import { red } from '@material-ui/core/colors';
import { createMuiTheme } from '@material-ui/core/styles';

// A custom theme for this app
const theme = createMuiTheme({
    palette: {
        primary: {
            main: '#556cd6',
            light: '#8b9aff',
            dark: '#0c42a4'
        },
        secondary: {
            main: '#ff9e22',
            light: '#ffcf57',
            dark: '#c66f00'
        },
        error: {
            main: red.A400,
        },
        info : {
            main: '#eceff1'
        },
        success: {
            main: '#00C851'
        },
        background: {
            default: '#fff',
        },
        grey: {
            main: '#757575'
        }
    },
    typography: {
    },
});

/*

    Elevation (dp)      Component
    12	                FAB (pressed state)
    8	                Raised button (presssed state)
    6	                FAB (resting state)
    2	                Raised button (resting state)

*/

/**
 * Selected light-blue Color #dbe2ff
 */

export default theme;
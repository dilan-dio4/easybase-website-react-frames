import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles, lighten } from '@material-ui/core/styles';

export const useInfoStyles = makeStyles(theme => ({
    header: {
        height: 100,
        backgroundColor: 'white',
        padding: '0px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
    },
    largeAccordionRoot: {
        border: '1px solid rgba(0, 0, 0, .125)',
        '&:not(:last-child)': {
            borderBottom: 0,
        },
        '&:before': {
            display: 'none',
        },
        '&$expanded': {
            margin: 'auto',
        },
    },
    largeAccordionSummaryRoot: {
        cursor: "default !important",
        marginBottom: -1,
        minHeight: '60px !important',
        '&$expanded': {
            minHeight: '60px !important',
        },
    },
    largeAccordionSummaryContent: {
        '&$expanded': {
            margin: '12px 0',
        },
        justifyContent: "space-between !important",
        alignItems: 'center !important'
    },
    firstHeaderRoot: {
        display: 'inline-flex',
        minWidth: 0,
        flexBasis: '25%',
    },
    firstHeader: {
        fontSize: theme.typography.pxToRem(15),
        whiteSpace: 'nowrap',
        fontWeight: '500',
    },
    firstHeaderSecondary: {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        color: theme.palette.grey.main,
        fontWeight: '400',
    },
    secondHeaderRoot: {
        display: 'inline-flex',
        minWidth: 0,
        flexBasis: '50%',
        justifyContent: 'center'
    },
    thirdHeaderRoot: {
        display: 'inline-flex',
        minWidth: 0,
        flexBasis: '25%',
        justifyContent: 'flex-end'
    },
    clearButtonRoot: {
        color: lighten('#757575', 0.55),
        borderRadius: 4,
        display: 'flex',
        cursor: 'pointer',
        marginRight: 8,
        transition: theme.transitions.create(['background-color'], {
            duration: theme.transitions.duration.shortest,
        }),
        '&:hover': {
            backgroundColor: theme.palette.error.main,
            color: '#ffffff'
        }
    },
    deleteButton: {
        backgroundColor: theme.palette.error.main,
        color: 'white',
        '&:hover': {
            backgroundColor: theme.palette.error.dark,
        }
    },
    inverseDeleteButton: {
        backgroundColor: theme.palette.grey[300],
        color: 'black',
        '&:hover': {
            backgroundColor: theme.palette.error.main,
            color: 'white'
        }
    },
    headerCost: {
        fontSize: 27,
        fontWeight: "500"
    },
    costColor: {
        color: theme.palette.success.main,
    },
    tabsList: {
        height: 37,
        display: 'flex',
        margin: 0,
        marginTop: 25,
        padding: 0,
        justifyContent: 'center'
    },
    tabRoot: {
        fontSize: '0.75rem !important',
        minWidth: '90px !important',
        minHeight: `${37}px !important`
    },
    tabsScroller: {
        height: `${37}px !important`
    },
    bottomAccordianContainer: {
        position: 'absolute',
        bottom: 0,
        width: 600
    },
    inverseTextStyle: {
        color: "white",
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        padding: "3px 12px",
        borderRadius: "6px 0px 6px 0px",
        fontWeight: 700,
        display: "inline-block",
        border: "1px rgba(0, 0, 0, 0.95) solid"
    }
}));


export const InfoPage = ({ children, style={} }) => {
    return (
        <div className="d-flex">
            <div className="infoPageCardRoot" style={style}>
                {children}
            </div>
        </div>
    )
}

export const LoadingOverlay = () => {
    return (
        <div className="d-flex h-100 w-100 justify-content-center align-items-center">
            <CircularProgress color="secondary" />
        </div>
    );
}
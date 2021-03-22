import './bootstrap.css';
import Functions from './Functions';
import theme from './theme';
import { ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

function App() {
  return (
    <div style={{ height: 850 }}>
      <ThemeProvider theme={theme}>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
        <CssBaseline />
        <Functions />
      </ThemeProvider>
    </div>
  );
}

export default App;

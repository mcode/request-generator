import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App';
import { SettingsProvider } from './containers/ContextProvider/SettingsProvider';

ReactDOM.render(
  <SettingsProvider>
    <App />
  </SettingsProvider>,
  document.getElementById('root')
);

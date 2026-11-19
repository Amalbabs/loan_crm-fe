import { createRoot } from 'react-dom/client';
import './assets/styles/main.scss';
import App from './App.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

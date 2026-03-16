import React from 'react';
import ReactDOM from 'react-dom/client';
import 'github-markdown-css/github-markdown-dark.css';
import './styles/markdown.css';
import './styles/theme.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

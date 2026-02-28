import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { AuthProvider } from './context/AuthContext';
import App from './App.tsx';

const theme = createTheme({
  primaryColor: 'pink',
  defaultRadius: 'md',
  fontFamily: 'system-ui, -apple-system, sans-serif',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Notifications position="top-right" />
      <AuthProvider>
        <App />
      </AuthProvider>
    </MantineProvider>
  </StrictMode>
);

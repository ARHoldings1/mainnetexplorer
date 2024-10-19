import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './components/Header';
import FaucetForm from './components/FaucetForm';
import Footer from './components/Footer';
import './App.css'; // Add this line

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FFD700', // Gold color
    },
    secondary: {
      main: '#FFA500', // Orange color for contrast
    },
    background: {
      default: '#000000', // Black background
      paper: '#121212', // Slightly lighter black for paper elements
    },
    text: {
      primary: '#FFD700', // Gold text
      secondary: '#FFA500', // Orange text for secondary elements
    },
  },
  typography: {
    allVariants: {
      color: '#FFD700', // Gold text for all typography elements
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <Header />
        <FaucetForm />
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;
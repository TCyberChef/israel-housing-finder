import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

// Import components (to be created)
const Navbar = () => (
  <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
    Israel Housing Finder
  </Box>
);

// Placeholder pages
const Home = () => (
  <Container>
    <h1>Welcome to Israel Housing Finder</h1>
    <p>Find your perfect home in Israel with our interactive search tools.</p>
  </Container>
);

const Search = () => (
  <Container>
    <h1>Search Properties</h1>
    <p>Search functionality coming soon...</p>
  </Container>
);

const About = () => (
  <Container>
    <h1>About Us</h1>
    <p>We help you find the perfect property in Israel.</p>
  </Container>
);

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename="/israel-housing-finder">
        <Navbar />
        <Box sx={{ mt: 2 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
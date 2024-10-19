import React from 'react';
import { Typography, Link, Box, styled } from '@mui/material';

const StyledFooter = styled(Box)({
  marginTop: 'auto',
  padding: '20px',
  backgroundColor: '#121212', // Slightly lighter black
});

const Footer = () => {
  return (
    <StyledFooter>
      <Typography variant="body2" align="center">
        © {new Date().getFullYear()} The DOT Protocol. All rights reserved.
        <Link color="inherit" href="https://thedotprotocol.com/" style={{ marginLeft: '10px' }}>
          Visit our website
        </Link>
      </Typography>
    </StyledFooter>
  );
};

export default Footer;
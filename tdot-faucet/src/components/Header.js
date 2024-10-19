import React from 'react';
import { AppBar, Toolbar, Typography, styled } from '@mui/material';

const StyledAppBar = styled(AppBar)({
  backgroundColor: '#121212', // Slightly lighter black
});

const Logo = styled('img')({
  height: '40px',
  marginRight: '20px',
});

const Header = () => {
  return (
    <StyledAppBar position="static">
      <Toolbar>
        <Logo src="/logo.png" alt="The DOT Protocol Logo" />
        <Typography variant="h6" style={{ color: '#FFD700' }}>
          The Chennai Testnet Faucet : The official faucet of the Dot Protocol chain
        </Typography>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Header;
import React, { useState } from 'react';
import { Button, TextField, Typography, Container, Box, styled, Paper } from '@mui/material';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import { TDOT_FAUCET_ADDRESS, CHAIN_ID, RPC_URL } from '../config';

const StyledContainer = styled(Container)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'calc(100vh - 128px)', // Adjust based on your header and footer height
});

const StyledButton = styled(Button)({
  margin: '10px 0',
});

const StyledPaper = styled(Paper)({
  padding: '20px',
  marginTop: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.05)', // Slightly transparent white
});

const faucetABI = [
  "function requestTokens() external",
  "function cooldownPeriod() view returns (uint256)",
  "function lastRequestTime(address) view returns (uint256)"
];

const FaucetForm = () => {
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('');

  const connectWallet = async () => {
    try {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setAddress(address);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setStatus('Failed to connect wallet. Please try again.');
    }
  };

  const requestTokens = async () => {
    try {
      setStatus('Requesting tokens...');
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      
      const network = await provider.getNetwork();
      if (network.chainId !== CHAIN_ID) {
        throw new Error(`Please connect to the correct network. Expected chain ID: ${CHAIN_ID}`);
      }

      const faucet = new ethers.Contract(TDOT_FAUCET_ADDRESS, faucetABI, signer);
      
      const tx = await faucet.requestTokens();
      await tx.wait();
      
      setStatus('Tokens sent successfully!');
    } catch (error) {
      console.error("Failed to request tokens:", error);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <StyledContainer maxWidth="sm">
      <Typography variant="h4" component="h1" gutterBottom>
        Request TDOT Tokens
      </Typography>
      <StyledButton variant="contained" color="primary" onClick={connectWallet}>
        Connect Wallet
      </StyledButton>
      <TextField
        fullWidth
        margin="normal"
        label="Wallet Address"
        variant="outlined"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <StyledButton
        fullWidth
        variant="contained"
        color="secondary"
        onClick={requestTokens}
        disabled={!address}
      >
        Request Tokens
      </StyledButton>
      {status && (
        <Typography variant="body1" style={{ marginTop: '1rem' }}>
          {status}
        </Typography>
      )}
      <StyledPaper>
        <Typography variant="body1" paragraph>
          To support development and testing in the Dot Protocol ecosystem, our faucet provides Testnet TDOT tokens to users. This tool is essential for developers and enthusiasts who want to explore and build on the Dot Protocol.
        </Typography>
        <Typography variant="h6" gutterBottom>
          How It Works
        </Typography>
        <Typography variant="body1" component="ol">
          <li>Enter Your Wallet Address: Provide your wallet address (0x...) in the field above.</li>
          <li>Receive TDOT Tokens: Click "Request Tokens" to receive tokens directly into your wallet.</li>
        </Typography>
        <Typography variant="h6" gutterBottom>
          Requirements
        </Typography>
        <Typography variant="body1" paragraph>
          Minimum Balance: To prevent bots and abuse, this faucet requires a minimum mainnet balance of 0.001 ETH in the wallet address being used.
        </Typography>
        <Typography variant="h6" gutterBottom>
          Easy Access
        </Typography>
        <Typography variant="body1" paragraph>
          No Account? No Problem: Simply <a href="#" style={{ color: '#FFD700' }}>Signup or Login</a> with TDOT to request TDOT. It's free and only takes a minute!
        </Typography>
        <Typography variant="body2" style={{ fontStyle: 'italic' }}>
          Note: The Dot Protocol faucet is intended for testing and development purposes. Please use this service responsibly.
        </Typography>
      </StyledPaper>
    </StyledContainer>
  );
};

export default FaucetForm;
import { Box, Typography } from '@material-ui/core';
import { styled } from '@material-ui/styles';
import React from 'react';
import Logo from 'assets/images/orbs-logo.svg';

function Powered() {
  return (
    <StyledContainer>
      <Typography>Powered by Orbs</Typography>
      <StyledLink href='https://www.orbs.com/' target='_blank' rel='noreferrer'>
        <img src={Logo} />
      </StyledLink>
    </StyledContainer>
  );
}

export default Powered;

const StyledLink = styled('a')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const StyledContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  gap: 10,
  '& p': {
    fontSize: 15,
  },
  '& img': {
    width: 24,
  },
});

import { Box, Typography } from '@material-ui/core';
import { styled } from '@material-ui/styles';
import { ToggleSwitch } from 'components';
import React from 'react';

interface Props {
  isAccepted: boolean;
  toggle: (value: boolean) => void;
}

function Accept({ isAccepted, toggle }: Props) {
  const onToggle = () => {
    toggle(!isAccepted);
  };
  return (
    <StyledContainer>
      <Typography>Accept Disclaimer</Typography>
      <ToggleSwitch toggled={isAccepted} onToggle={onToggle} />
    </StyledContainer>
  );
}

export default Accept;

const StyledContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  '& p': {
    fontSize: 14,
  },
});

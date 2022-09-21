import { CustomTooltip } from 'components';
import React, { ReactNode } from 'react';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { Box, styled } from '@material-ui/core';

interface Props {
  text: string | ReactNode;
  children: ReactNode;
}

function InfoTooltip({ text, children }: Props) {
  if (!text) {
    return null;
  }
  return (
    <StyledContainer>
      <CustomTooltip title={text} placement='right'>
        <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {children}
          <HelpOutlineIcon style={{ width: 15 }} />
        </span>
      </CustomTooltip>
    </StyledContainer>
  );
}

export default InfoTooltip;

const StyledContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
});

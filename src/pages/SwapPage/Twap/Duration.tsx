import { Box, styled } from '@material-ui/core';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTwapActionHandlers, useTwapState } from 'state/twap/hooks';
import TimeSelect from './TimeSelect';

function Duration() {
  const { onDuration } = useTwapActionHandlers();
  const duration = useTwapState().duration;
  const { t } = useTranslation();

  return (
    <StyledContainer className={`swapBox bg-secondary2`}>
      <TimeSelect
        onUpdate={onDuration}
        selected={duration}
        title='Max Duration'
        tooltip={t('durationInput')}
      />
    </StyledContainer>
  );
}

export default Duration;

const StyledContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

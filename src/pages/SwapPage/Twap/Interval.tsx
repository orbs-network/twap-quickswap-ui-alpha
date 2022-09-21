import { Box, IconButton, styled, Typography } from '@material-ui/core';
import React, { useEffect } from 'react';
import { useTwapActionHandlers, useTwapState } from 'state/twap/hooks';
import TimeSelect from './TimeSelect';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import { useDispatch } from 'react-redux';
import { setSelfEdit } from 'state/twap/actions';
import { usePartialFillWarning } from './useValidation';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import { useTranslation } from 'react-i18next';
import { getFormatTypeFromMilliseconds, millisecondsToTime } from './utils';
function Duration() {
  const { onInterval } = useTwapActionHandlers();
  const interval = useTwapState().interval;
  const duration = useTwapState().duration;

  const selfEdit = useTwapState().selfEdit;
  const { t } = useTranslation();

  const partialFillWarning = usePartialFillWarning();

  const dispatch = useDispatch();

  const onEdit = () => {
    dispatch(setSelfEdit(true));
  };

  useEffect(() => {
    if (
      duration.milliseconds &&
      interval.milliseconds &&
      interval.milliseconds > duration.milliseconds
    ) {
      const type = getFormatTypeFromMilliseconds(duration.milliseconds);
      onInterval({
        milliseconds: duration.milliseconds,
        type,
        displayValue: millisecondsToTime(type, duration.milliseconds),
      });
    }
  }, [interval, duration, onInterval]);

  return (
    <StyledContainer className={`swapBox bg-secondary2`}>
      <StyledCard>
        <TimeSelect
          tooltip={t('tradeInterval')}
          disabled={!selfEdit}
          onUpdate={onInterval}
          selected={interval}
          title='Trade Interval'
        />
        {!selfEdit && (
          <IconButton onClick={onEdit}>
            <EditOutlinedIcon color='primary' />
          </IconButton>
        )}
      </StyledCard>
      {partialFillWarning && (
        <StyledWarning>
          <ErrorOutlineIcon color='error' />
          <Typography color='error'>Partial fill warning</Typography>
        </StyledWarning>
      )}
    </StyledContainer>
  );
}

export default Duration;

const StyledCard = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const StyledContainer = styled(Box)({});

const StyledWarning = styled(Box)({
  marginTop: 15,
  fontWeight: 500,
  display: 'flex',
  gap: 10,
  opacity: 0.7,
});

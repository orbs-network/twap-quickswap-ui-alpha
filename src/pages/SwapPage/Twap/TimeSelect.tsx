import { Box, MenuItem, Select, Theme, Typography } from '@material-ui/core';
import { styled } from '@material-ui/styles';
import { NumericalInput } from 'components';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { TimeSelectFormat, TwapTimeSelect } from 'state/twap/reducer';
import InfoTooltip from './InfoTooltip';
import {
  getFormatTypeFromMilliseconds,
  millisecondsToTime,
  timeToMilliseconds,
} from './utils';

interface Props {
  selected: TwapTimeSelect;
  title: string;
  disabled?: boolean;
  tooltip: string | ReactNode;

  onUpdate: ({
    type,
    displayValue,
    milliseconds,
  }: {
    type: TimeSelectFormat;
    displayValue?: string;
    milliseconds?: number;
  }) => void;
}

function TimeSelect({ selected, title, onUpdate, disabled, tooltip }: Props) {
  const onChange = (value: string) => {
    const milliseconds = timeToMilliseconds(selected.type, value) || 0;
    let displayValue = value;

    if (!milliseconds) {
      onUpdate({
        type: selected.type,
        displayValue,
        milliseconds,
      });
      return;
    }

    const format = getFormatTypeFromMilliseconds(milliseconds || 0);

    if (format !== selected.type) {
      displayValue = millisecondsToTime(format, milliseconds) || '';
      console.log(displayValue, milliseconds);
    }
    onUpdate({
      type: format,
      displayValue,
      milliseconds,
    });
  };

  const onSelect = (event: any) => {
    onUpdate({
      type: event.target.value,
    });
  };
  return (
    <>
      <InfoTooltip text={tooltip}>
        <StyledTitle style={{ margin: 0 }}>{title}</StyledTitle>
      </InfoTooltip>

      <StyledRight>
        <NumericalInput
          disabled={disabled}
          value={selected.displayValue || ''}
          align='right'
          placeholder='0'
          onUserInput={(val) => {
            if (val !== '0' && val !== '.') {
              onChange(val);
            }
          }}
        />
        <StyledSelect
          disabled={disabled}
          value={selected.type}
          onChange={onSelect}
          color='primary'
          style={{
            opacity: disabled ? 0.7 : 1,
          }}
        >
          <MenuItem value={TimeSelectFormat.DAYS}>Days</MenuItem>
          <MenuItem value={TimeSelectFormat.HOURS}>Hours</MenuItem>
          <MenuItem value={TimeSelectFormat.MINUTES}>Minutes</MenuItem>
        </StyledSelect>
      </StyledRight>
    </>
  );
}

export default TimeSelect;

const StyledSelect = styled(Select)(({ theme }: { theme: Theme }) => ({
  color: 'white!important',
  '&:before': {
    borderBottom: `1px solid ${theme.palette.primary.main}`,
  },
  '&:after': {
    borderBottom: `1px solid ${theme.palette.primary.main}`,
  },
  '& svg': {
    color: theme.palette.primary.main,
  },
}));

const StyledRight = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 20,
  '& .styledInput': {},
});

const StyledTitle = styled(Typography)({
  marginRight: 10,
  whiteSpace: 'nowrap',
});

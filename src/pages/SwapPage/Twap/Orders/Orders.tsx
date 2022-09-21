import React, { useState } from 'react';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { styled } from '@material-ui/styles';
import { createTxData, emptyOrdersText, mapTxData } from '../utils';
import OrderTx from './OrderTx';
import { TxStatus } from '../types';
import CachedIcon from '@material-ui/icons/Cached';
import { IconButton } from '@material-ui/core';
interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`scrollable-auto-tabpanel-${index}`}
      aria-labelledby={`scrollable-auto-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `scrollable-auto-tab-${index}`,
    'aria-controls': `scrollable-auto-tabpanel-${index}`,
  };
}
const data = createTxData();
const mappedData = mapTxData(data);

export default function Orders() {
  const [value, setValue] = useState(0);

  const handleChange = (_event: any, newValue: number) => {
    setValue(newValue);
  };
  const length = Object.keys(mappedData).length;

  return (
    <StyledContainer>
      <StyledTabsContainer>
        <Tabs
          className='tabs'
          value={value}
          onChange={handleChange}
          textColor='primary'
          variant='scrollable'
          scrollButtons='auto'
        >
          {Object.keys(mappedData).map((key, index) => {
            return (
              <StyledTab
                style={{
                  width: `calc(100% / ${length})`,
                }}
                label={key}
                {...a11yProps(index)}
                key={index}
              />
            );
          })}
        </Tabs>
        <IconButton className='refresh' color='secondary'>
          <CachedIcon />
        </IconButton>
      </StyledTabsContainer>
      {Object.keys(mappedData).map((key, index) => {
        const isEmpty = !mappedData[key].length;
        return (
          <StyledTabPanel value={value} index={index} key={index}>
            {isEmpty ? (
              <StyledEmptyListText>
                {emptyOrdersText[key as TxStatus]}
              </StyledEmptyListText>
            ) : (
              <StyledOrdersList>
                {mappedData[key].map((tx, index) => {
                  return (
                    <OrderTx tx={tx} key={index} status={key as TxStatus} />
                  );
                })}
              </StyledOrdersList>
            )}
          </StyledTabPanel>
        );
      })}
    </StyledContainer>
  );
}

const StyledContainer = styled(Box)({
  width: '100%',
  marginTop: 20,
  borderRadius: 10,
  paddingTop: 10,
});

const StyledTabsContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  '& .tabs': {
    flex: 1,
    paddingRight: 50,
  },
});

const StyledTabPanel = styled(TabPanel)({
  paddingTop: 20,
});

const StyledEmptyListText = styled(Typography)({
  width: '100%',
  textAlign: 'center',
  marginTop: 20,
});

const StyledOrdersList = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 30,
  padding: 0,
  overflow: 'auto',
  maxHeight: 500,
});

const StyledTab = styled(Tab)({
  minWidth: 'unset',
  span: {
    fontSize: 20,
  },
});

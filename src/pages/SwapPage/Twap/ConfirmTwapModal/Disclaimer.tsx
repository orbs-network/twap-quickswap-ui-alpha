import { Box, Typography } from '@material-ui/core';
import { styled } from '@material-ui/styles';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useTwapState } from 'state/twap/hooks';

function Disclaimer() {
  const { t } = useTranslation();
  const allowLimitPrice = useTwapState().allowLimitPrice;

  return (
    <StyledContainer className='swapBox bg-secondary2'>
      <Typography>{t('disclaimer_p1')}</Typography>
      {allowLimitPrice ? (
        <Typography>{t('disclaimer_p2LimitOrderSelected')}</Typography>
      ) : (
        <Typography>{t('disclaimer_p2LimitOrderNotSelected')}</Typography>
      )}
      <Typography>{t('disclaimer_p3')}</Typography>
      <Typography>{t('disclaimer_p4')}</Typography>
      <Typography>{t('disclaimer_p5')}</Typography>
      <Trans
        i18nKey='disclaimer_p6'
        components={{
          Link: (
            <a
              target='_blank'
              rel='noreferrer 
          noopener'
              href='https://www.orbs.com/'
            >
              link
            </a>
          ),
        }}
      />
      <Typography>
        <Trans
          i18nKey='disclaimer_p7'
          components={{
            Link: (
              <a
                target='_blank'
                rel='noreferrer 
          noopener'
                href='https://www.orbs.com/'
              >
                link
              </a>
            ),
          }}
        />
      </Typography>
    </StyledContainer>
  );
}

export default Disclaimer;

const StyledContainer = styled(Box)({
  marginTop: 15,
  '& h2': {
    fontSize: 20,
    marginBottom: 20,
  },
  '& a': {
    color: 'white',
  },
});

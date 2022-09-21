import { Snackbar } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { useDispatch } from 'react-redux';
import { setError } from 'state/twap/actions';
import { useTwapState } from 'state/twap/hooks';
import React from 'react';

function ErrorNotification() {
  const { error } = useTwapState();
  const dispatch = useDispatch();

  const handleClose = () => {
    setTimeout(() => {
      dispatch(setError(undefined));
    }, 400);
  };

  return (
    <Snackbar open={!!error} autoHideDuration={6000} onClose={handleClose}>
      <Alert onClose={handleClose} severity='error' variant='filled'>
        {error}
      </Alert>
    </Snackbar>
  );
}

export default ErrorNotification;

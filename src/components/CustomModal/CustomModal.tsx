import React, { CSSProperties } from 'react';
import { Modal, Box, Backdrop, Fade } from '@material-ui/core';
import 'components/styles/CustomModal.scss';

interface CustomModalProps {
  open: boolean;
  onClose: () => void;
  children: any;
  background?: string;
  overflow?: string;
  style?: CSSProperties;
}

const CustomModal: React.FC<CustomModalProps> = ({
  open,
  onClose,
  children,
  background,
  overflow,
  style,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500 }}
    >
      <Fade in={open}>
        <Box
          style={style}
          className='modalWrapper'
          bgcolor={background}
          overflow={overflow}
        >
          {children}
        </Box>
      </Fade>
    </Modal>
  );
};

export default CustomModal;

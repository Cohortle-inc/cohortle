import { ReactNode } from 'react';

export type ModalProps = {
  children: ReactNode;
  isVisible: any;
  onBackdropPress: () => void;
};

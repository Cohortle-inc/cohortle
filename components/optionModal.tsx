import { ReactNode } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Text, View } from 'react-native';
import Modal from 'react-native-modal';

type ModalProps = {
  children: ReactNode;
  isVisible: any;
  onBackdropPress: () => void;
};
export const OptionModal = ({
  children,
  isVisible,
  onBackdropPress,
}: ModalProps) => {
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onBackdropPress}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={styles.modal}
    >
      {children}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
    backgroundColor: 'transparent',
    height: '100%',
  },
});

import React from 'react';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';
import { View, Dimensions, StyleSheet, Text, Modal } from 'react-native';

import Button from './Button';
import { setIncompleteModalVisible } from '../modules/AppState';

import { colors } from '../styles';

const { height, width } = Dimensions.get('window');
export const screenHeight = height;
export const screenWidth = width;

const ManagerModal = props => (
  <Modal animationType="fade" transparent visible>
    <View style={styles.modalContainer}>
      <View style={styles.background} />
      <View style={styles.modalForm}>
        <Text style={styles.modalTitle}>Work Order Incomplete</Text>
        <Text style={styles.modalText}>
          All required Installer Questions must be answered and submitted using the 'Submit' button before you can access this section. Please review and be
          sure all required information and photos have been provided.
        </Text>
        <View style={styles.buttonRow}>
          <Button
            bgColor={colors.green}
            style={{ width: '100%' }}
            onPress={() => {
              props.setModalVisible(false);
              props.navigation.navigate('Questions');
              props.close();
            }}
            textColor={colors.white}
            caption="OK"
            textStyle={{ fontSize: 20 }}
          />
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalContainer: {
    top: 0,
    left: 0,
    position: 'absolute',
    height: screenHeight,
    width: screenWidth,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: screenHeight,
    width: screenWidth,
    backgroundColor: colors.black,
    opacity: 0.5
  },
  modalForm: {
    width: screenWidth * 0.9,
    minHeight: screenWidth * 0.6,
    backgroundColor: colors.white,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 28
  },
  modalText: {
    fontSize: 16,
    paddingTop: 32
  },
  buttonRow: {
    width: '100%',
    flexDirection: 'row',
    paddingTop: 32
  }
});

export default compose(
  connect(
    state => ({
      isModalVisible: state.app.isIncompleteModal
    }),
    dispatch => ({
      setModalVisible: payload => dispatch(setIncompleteModalVisible(payload))
    })
  )
)(withNavigation(ManagerModal));

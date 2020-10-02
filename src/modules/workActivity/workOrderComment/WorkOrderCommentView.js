import React, { useState } from 'react';
import { StyleSheet, View, StatusBar, Text, TextInput, ScrollView, Alert, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import ImagePicker from 'react-native-image-picker';
import IO from 'react-native-vector-icons/Ionicons';
import RNFetchBlob from 'rn-fetch-blob';

import { colors } from '../../../styles';
import { Header, ActivityInfoSection, ActivityStatus, ActivityTitle, Button } from '../../../components';
import setChangesInOffline from '../../../core/setChanges';
import { apiGet, apiPostImage, apiPostComment, apiGetJson } from '../../../core/api';
import moment from 'moment';

const options = {
  quality: 1.0,
  maxWidth: 500,
  maxHeight: 500,
  storageOptions: {
    skipBackup: true
  }
};

export default function WorkOrderCommentView(props) {
  const [isLocading, setisLocading] = useState(false);
  const renderPhoto = (photo, index) => {
    const photosCopy = props.photos.slice();
    return (
      <View style={{ position: 'relative' }} key={index}>
        <TouchableOpacity
          style={styles.delPhoto}
          onPress={async () => {
            await photosCopy.splice(index, 1);
            props.addPhoto(photosCopy);
          }}
        >
          <View style={styles.whiteBackground} />
          <IO style={styles.delIcon} name="md-close-circle" />
        </TouchableOpacity>
        <Image source={{ uri: photo }} style={styles.photoBlock} />
      </View>
    );
  };

  if (props.isLoading === true) {
    return (
      <View style={styles.backgroundActivity}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.lightGray} />
      <Header connectionStatus={props.connectionStatus} navigation={props.navigation} sideBar />
      <ScrollView style={{ width: '100%' }}>
        <ActivityInfoSection navigation={props.navigation} activityData={props.activityData} />
        <ActivityStatus status={props.activityData.status} />
        <View style={{ width: '100%', height: 24, backgroundColor: colors.white }} />
        <ActivityTitle title="Messages" />
        <View
          style={{
            backgroundColor: colors.lightGray,
            paddingVertical: 24,
            width: '100%'
          }}
        >
          <View style={styles.scrollContainer}>
            <TextInput
              multiline
              placeholder="Add Comment..."
              style={[styles.inputStyle, { height: 160 }]}
              onChangeText={text => {
                const regex = /(<([^>]+)>)/gi;
                const result = text.replace(regex, '');
                props.setComment(result);
              }}
              value={props.comment}
            />
            <View style={{ marginTop: 24 }}>
              <Button
                bgColor={colors.blue}
                onPress={() => {
                  Alert.alert(
                    'Add photo',
                    '',
                    [
                      {
                        text: 'Choose from gallery',
                        onPress: () => {
                          ImagePicker.launchImageLibrary(options, response => {
                            const { photos } = props;
                            if (!response.didCancel) {
                              photos.push(response.uri);
                              props.addPhoto(photos);
                              props.setNumOfChanges(props.numOfChanges);
                            }
                          });
                        }
                      },
                      {
                        text: 'Take a photo',
                        onPress: () => {
                          ImagePicker.launchCamera(options, response => {
                            const { photos } = props;
                            if (!response.didCancel) {
                              photos.push(response.uri);
                              props.addPhoto(photos);
                              props.setNumOfChanges(props.numOfChanges);
                            }
                          });
                        }
                      },
                      {
                        text: 'Cancel',
                        style: 'cancel'
                      }
                    ],
                    { cancelable: true }
                  );
                }}
                textColor={colors.white}
                textStyle={{ fontSize: 20 }}
                caption="Add Photo(s)"
              />
            </View>
            <View style={styles.photoSection}>{props.photos.map((photo, index) => renderPhoto(photo, index))}</View>
            <View style={{ marginTop: 24 }}>
              <Button
                bgColor={props.photos.length === 0 && props.comment === '' ? '#b1cec1' : colors.green}
                disabled={props.photos.length === 0 && props.comment === ''}
                onPress={async () => {
                  setisLocading(true);
                  if (!props.connectionStatus) {
                    setChangesInOffline(
                      props.changes,
                      props.setChanges,
                      props.setNumOfChanges,
                      props.comment,
                      props.activityId,
                      props.accountId,
                      props.photos,
                      null
                    );
                    await props.addPhoto([]);
                    await props.setComment('');
                  } else {
                    const data = `text=${props.comment}&user_ids=%5B${props.accountId}%5D&channel=installer`;
                    await apiPostComment(`spectrum/activities/${props.activityId}/comments`, data, props.token)
                      .then(resPostText => {
                        if (props.photos.length > 0) {
                          props.photos.forEach(item => {
                            apiGet('aws-s3-presigned-urls', props.token).then(res => {
                              RNFetchBlob.fetch(
                                'PUT',
                                res.data.url,
                                {
                                  'security-token': props.token,
                                  'Content-Type': 'image/jpeg'
                                },
                                RNFetchBlob.wrap(item.replace('file://', ''))
                              )
                                .then(() => {
                                  RNFetchBlob.fs.stat(item.replace('file://', '')).then(stats => {
                                    const formData = new FormData();
                                    formData.append('file_type', 'image/jpeg');
                                    formData.append('name', stats.filename);
                                    formData.append('s3_location', res.data.file_name.replace('uploads/', ''));
                                    formData.append('size', stats.size);
                                    apiPostImage(`activities/${props.activityId}/comments/${resPostText.data.id}/files`, formData, props.token).then(
                                      postRes => {
                                        setisLocading(false);
                                      }
                                    );
                                  });
                                })
                                .catch(err => {
                                  console.log(err);
                                  setisLocading(false);
                                });
                            });
                          });
                        } else {
                          setisLocading(false);
                        }
                      })
                      .catch(err => {
                        setisLocading(false);
                      });
                    await props.addPhoto([]);
                    await props.setComment('');
                  }
                }}
                textColor={colors.white}
                textStyle={{ fontSize: 20 }}
                caption="Submit"
                isLoading={isLocading}
              />
            </View>
            {!props.connectionStatus && <Text>Cant load comments. There is no connection</Text>}
            {props.connectionStatus &&
              props.data.map((item, i) => (
                <View
                  key={i}
                  style={{
                    width: '100%',
                    marginTop: 32,
                    padding: 16,
                    backgroundColor: 'white'
                  }}
                >
                  {item.text !== '' && <Text>{item.text}</Text>}
                  <Text style={{ flexDirection: 'row', marginTop: 8, color: 'blue' }}>{item.users[0].first_name + ' ' + item.users[0].last_name}</Text>
                  <Text style={{ flexDirection: 'row', marginTop: 8, color: 'blue' }}>{moment(item.created_at).format('M/D/YY - hh:mmA')}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    {item.files.map((photo, j) => {
                      if (photo.file_type === 'image/jpeg' || photo.file_type === 'image/png') {
                        return (
                          <Image
                            key={j}
                            source={{ uri: photo.s3_location }}
                            style={{
                              width: 50,
                              height: 50,
                              marginRight: 16,
                              resizeMode: 'cover'
                            }}
                          />
                        );
                      }
                      if (photo.file_type === 'pdf' || photo.file_type === 'application/pdf') {
                        return (
                          <TouchableOpacity
                            onPress={() => {
                              // props.navigation.navigate('PdfDoc', { uri: photo.s3_location });
                              props.navigation.navigate('PdfDoc', { uri: photo.s3_location, name: photo.name, type: photo.file_type });
                            }}
                          >
                            <Image
                              source={require('../../../../assets/images/pdf.png')}
                              style={{
                                width: 50,
                                height: 50,
                                marginRight: 16,
                                resizeMode: 'cover'
                              }}
                            />
                            <Text>{photo.name}</Text>
                          </TouchableOpacity>
                        );
                      }
                      return null;
                    })}
                  </View>
                </View>
              ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: colors.lightGray
  },
  scrollContainer: {
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: 48
  },
  inputStyle: {
    fontSize: 14,
    backgroundColor: colors.white,
    color: colors.black,
    paddingVertical: 12,
    paddingHorizontal: 12,
    textAlignVertical: 'top'
  },
  photoBlock: {
    width: '100%',
    height: 400,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20
  },
  delPhoto: {
    position: 'absolute',
    top: 28,
    right: 16,
    zIndex: 10,
    alignItems: 'center'
  },
  delIcon: {
    color: colors.red,
    fontSize: 48
  },
  whiteBackground: {
    position: 'absolute',
    width: 32,
    height: 32,
    top: 10,
    borderRadius: 16,
    backgroundColor: 'white'
  },
  backgroundActivity: {
    backgroundColor: 'white',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

import CheckPhoto from './CheckPhotoPage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState, useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Entypo from '@expo/vector-icons/Entypo';
import { BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function Scan() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, planId, category, date, type } = route.params;
  const parsedDate = date ? new Date(date) : new Date();
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const cameraRef = useRef(null);

  // กดปุ่ม ย้อนกลับ ให้กลับไปหน้า PlanPage
    useEffect(() => {
      const backAction = () => {
        navigation.navigate('PreScan', { userId, planId, category, date, type });
        return true;
      };
  
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );
  
      return () => backHandler.remove();
    }, [navigation, userId, planId, category, date, type]);
  

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      const options = {
        quality: 1,
        base64: true,
        exif: false,
      };
      const takedPhoto = await cameraRef.current.takePictureAsync(options);
      setPhoto(takedPhoto);
    }
  };

  const handleRetakePhoto = () => setPhoto(null);

  if (photo) {
    return <CheckPhoto
      photo={photo}
      handleRetakePhoto={handleRetakePhoto}
      category={category}
      date={date}
      type={type}
      userId={userId}
      planId={planId}
    />;
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef}>
        <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
              <Entypo name="circle" size={68} color="white" />
            </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    left: '37%',
    alignSelf: 'flex-end',
    alignItems: 'center',
    borderRadius: 10,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});

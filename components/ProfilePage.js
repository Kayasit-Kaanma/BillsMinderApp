import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import BASE_URL from '../config/config';
import { use } from 'react';

export default function Profile({ route }) {
  const navigation = useNavigation();
  const { userId } = route.params;
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // กดปุ่ม ย้อนกลับ ให้กลับไปหน้า PlanPage
useEffect(() => {
  const backAction = () => {
      navigation.navigate('Home', { userId, username });
      return true;
  };

  const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
  );

  return () => backHandler.remove();
}, [navigation, userId, username]);

  // ฟังก์ชันดึงข้อมูลชื่อผู้ใช้จาก Server
  useFocusEffect(
    React.useCallback(() => {
      const fetchUserData = async () => {
        setLoading(true);
        try {
          const response = await fetch(`${BASE_URL}/user/get-username/${userId}`);
          if (!response.ok) {
            throw new Error(`ข้อผิดพลาด: ${response.status}`);
          }
          const data = await response.json();
          setUsername(data.username);
        } catch (error) {
          Alert.alert('ข้อผิดพลาด', error.message || 'ไม่สามารถดึงข้อมูลผู้ใช้');
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }, [userId])
  );

  // ฟังก์ชันอัปเดตชื่อผู้ใช้
  const updateUsername = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/user/${userId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('สำเร็จ', 'เปลี่ยนชื่อผู้ใช้สำเร็จ');
        navigation.navigate('Home', {
            userId,
            refresh: true,
        });
      } else {
        Alert.alert('ข้อผิดพลาด', data.error || 'เปลี่ยนชื่อผู้ใช้ไม่สำเร็จ');
      }
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเปลี่ยนชื่อผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันอัปเดตรหัสผ่าน
  const updatePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      Alert.alert('ข้อผิดพลาด', 'รหัสผ่านไม่ตรงกัน');
      return;
    }
    if (newPassword.length < 3 || newPassword.length > 12) {
      Alert.alert('ข้อผิดพลาด', 'รหัสผ่านต้องมีความยาว 3-12 ตัว');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/user/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('สำเร็จ', 'เปลี่ยนรหัสผ่านสำเร็จ');
        setNewPassword('');
        setConfirmNewPassword('');
        navigation.navigate('Login');
      } else {
        Alert.alert('ข้อผิดพลาด', data.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
      }
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.usernameText}>{loading ? 'กำลังโหลด...' : username}</Text>
      </View>
      <Text style={styles.label}>เปลี่ยนชื่อผู้ใช้</Text>
      <TextInput
        style={styles.input}
        onChangeText={setUsername}
        placeholder="เปลี่ยนชื่อผู้ใช้"
        placeholderTextColor="#bbb"
        editable={!loading} />

      <Text style={styles.label}>เปลี่ยนรหัสผ่าน</Text>
      <TextInput
        style={styles.input}
        placeholder="กรอกรหัสผ่านใหม่"
        placeholderTextColor="#bbb"
        secureTextEntry={true}
        value={newPassword}
        onChangeText={setNewPassword}/>

      <TextInput
        style={styles.input}
        placeholder="ยืนยันรหัสผ่าน"
        placeholderTextColor="#bbb"
        secureTextEntry={true}
        value={confirmNewPassword}
        onChangeText={setConfirmNewPassword}/>

      {loading ? (
        <ActivityIndicator size="large" color="#0072C6" />
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={updateUsername}>
            <Text style={styles.buttonText}>เปลี่ยนชื่อผู้ใช้</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={updatePassword}>
            <Text style={styles.buttonText}>เปลี่ยนรหัสผ่าน</Text>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0072C6',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    marginTop: 50,
  },
  usernameText: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'IBMPlexSansThai-Regular',
  },
  label: {
    color: '#fff',
    fontFamily: 'IBMPlexSansThai-Regular',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 16,
    backgroundColor: '#5287b6',
    fontFamily: 'IBMPlexSansThai-Regular',
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#003B73',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'IBMPlexSansThai-Regular',
  },
});

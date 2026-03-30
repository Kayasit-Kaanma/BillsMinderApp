import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BASE_URL from '../config/config';

export default function Register({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAccepted, setIsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('ข้อผิดพลาด', 'กรุณาใส่ข้อมูลให้ครบถ้วน');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('ข้อผิดพลาด', 'รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (password.length < 3 || password.length > 12) {
      Alert.alert('ข้อผิดพลาด', 'รหัสผ่านต้องมีความยาว 3-12 ตัว');
      return;
    }

    if (!isAccepted) {
      Alert.alert('ข้อผิดพลาด', 'กรุณายอมรับเงื่อนไข');
      return;
    }

    setLoading(true); // สถานะโหลด
    try {
      const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.status === 201) {
        Alert.alert('สําเร็จ', 'ลงทะเบียนสําเร็จ');
        navigation.navigate('Login');
      } else {
        Alert.alert('ข้อผิดพลาด', 'ลงทะเบียนไม่สําเร็จ');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  const handleButtonPress = () => {
    setIsAccepted(!isAccepted);
  };

  return (
    <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
      <Text style={styles.title}>ลงทะเบียน</Text>

      <TextInput
        style={styles.input}
        placeholder="ชื่อผู้ใช้"
        placeholderTextColor="#ccc"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="อีเมล"
        placeholderTextColor="#ccc"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="รหัสผ่าน"
        placeholderTextColor="#ccc"
        secureTextEntry={true}
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="ยืนยันรหัสผ่าน"
        placeholderTextColor="#ccc"
        secureTextEntry={true}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.circleButton,]}
          onPress={() => {
            handleButtonPress();  // เปลี่ยนสถานะของ isAccepted
            navigation.navigate('Condition');  // นำทางไปหน้า Condition
          }} 
        >
          <Text style={styles.circleButtonText}>{isAccepted ? '☑' : '☒'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Condition')}>
          <Text style={styles.settingsButton}>
            ยอมรับเงื่อนไข ข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0072C6" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>ลงทะเบียน</Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    fontFamily: 'IBMPlexSansThai-Regular', // ใช้ฟอนต์ทั่วทั้งแอป
  },
  title: {
    fontSize: 26,
    marginTop: 90,
    marginBottom: 21,
    color: 'white',
    fontFamily: 'IBMPlexSansThai-Regular', // ฟอนต์สำหรับ Title
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 16,
    backgroundColor: '#5287b6',
    color: '#fff',
    fontFamily: 'IBMPlexSansThai-Regular', // ฟอนต์สำหรับ TextInput
  },
  settingsButton: {
    fontSize: 12,
    textDecorationLine: 'underline',
    marginBottom: 16,
    color: '#fff',
    fontFamily: 'IBMPlexSansThai-Regular', // ฟอนต์สำหรับปุ่มเงื่อนไข
  },
  circleButton: {
    width: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  circleButtonText: {
    fontSize: 28,
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: 15,
  },
  button: {
    backgroundColor: '#003B73',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'IBMPlexSansThai-Regular', // ฟอนต์สำหรับปุ่ม
  },
});

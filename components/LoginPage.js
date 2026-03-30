import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Font from 'expo-font';
import BASE_URL from '../config/config';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'IBMPlexSansThai-Regular': require('../assets/fonts/IBMPlexSansThai-Regular.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.status === 200) {
        Alert.alert('สําเร็จ', 'เข้าสู่ระบบสำเร็จ')
        navigation.navigate('Home', { userId: data.userId, userEmail: data.email });
      } else {
        Alert.alert('ข้อผิดพลาด', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
      <Text style={styles.title}>เข้าสู่ระบบ</Text>
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
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0072C6" />
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>ลงทะเบียน</Text>
          </TouchableOpacity>
        </>
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
    fontFamily: 'IBMPlexSansThai-Regular',
    color: '#fff',
  },
  title: {
    top: 50,
    fontSize: 26,
    marginBottom: 26,
    color: 'white',
    fontFamily: 'IBMPlexSansThai-Regular',
  },
  input: {
    top: 50,
    width: '100%',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    backgroundColor: '#5287b6',
    fontFamily: 'IBMPlexSansThai-Regular',
    color: '#fff',
  },
  button: {
    top: 70,
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
    fontFamily: 'IBMPlexSansThai-Regular'
  },
});
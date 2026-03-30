import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { db, collection, getDocs, query, where } from '../config/firebaseConfig';
import BASE_URL from '../config/config';
import { BackHandler } from 'react-native';

export default function SelectChatMode({ route }) {
  const navigation = useNavigation();
  const { userId, planId, planName } = route.params;
  const [ragAvailable, setRagAvailable] = useState(true);

  // กดปุ่ม ย้อนกลับ ให้กลับไปหน้า PlanPage
  useEffect(() => {
    const backAction = () => {
      navigation.navigate('PlanPage', { userId, planId });
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation, userId, planId]);

  useEffect(() => {
    if (planId) {
      fetchPlanNameFromBackend(planId);
    }
  }, [planId]);

  const fetchPlanNameFromBackend = async (planId) => {
    try {
      const response = await fetch(`${BASE_URL}/plan-name/${planId}`);
      const data = await response.json();
      const name = data.planName;

      if (!name) {
        // console.warn('ไม่ได้รับชื่อแผนที่ถูกต้องจาก backend'); // log ข้อผิดพลาด
        return;
      }
      // console.log('ชื่อแผนที่ได้จาก backend:', name); // log ข้อผิดพลาด

      const q = query(collection(db, 'finance_knowledge'), where('title', '==', name));
      const snapshot = await getDocs(q);
      const available = !snapshot.empty;
      setRagAvailable(available);
      // console.log('ragAvailable:', available); // log ค่าของ ragAvailable ไว้ตรวจสอบ

    } catch (error) {
      // console.log('โหลดชื่อแผนจาก backend ผิดพลาด:', error); // log ข้อผิดพลาด
      setRagAvailable(false);
    }
  };

  return (
    <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
      <Text style={styles.title}>ต้องการใช้งานแชทบอทโหมดใด?</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('ChatBot', { userId, planId })}
      >
        <Text style={styles.buttonText}>ผู้ช่วยการเงินทั่วไป</Text>
        <Text style={styles.subText}>แชทเพื่อถามตอบเรื่องการเงินทั่วไป</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.greenButton, !ragAvailable && { opacity: 0.5 }]}
        onPress={() => {
          if (ragAvailable) {
            navigation.navigate('RAGChatBot', { userId, planId, planName });
          } else {
            Alert.alert('แผนนี้ไม่รองรับการวิเคราะห์ RAG กรุณาเลือกแผนที่มีข้อมูล RAG');
          }
        }}
        disabled={!ragAvailable}
      >
        <Text style={styles.buttonText}>วิเคราะห์แผนการเงิน (RAG)</Text>
        <Text style={styles.subText}>
          {ragAvailable ? 'เปรียบเทียบแผนการเงินของคุณกับแนวทางที่ควรจะเป็นโดย AI' : 'แผนนี้ไม่รองรับการวิเคราะห์ RAG กรุณาเลือกแผนที่มีข้อมูล RAG'}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    color: '#fff',
    marginBottom: 30,
    fontFamily: 'IBMPlexSansThai-Regular',
  },
  button: {
    backgroundColor: '#4a90e2',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  greenButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'IBMPlexSansThai-Regular',
    textAlign: 'center',
    marginBottom: 6,
  },
  subText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'IBMPlexSansThai-Regular',
  },
});

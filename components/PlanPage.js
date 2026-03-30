import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import BASE_URL from '../config/config';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BackHandler } from 'react-native';

export default function PlanPage({ navigation, route }) {
  const { userId, planId, planName } = route.params;
  const [plan, setPlan] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // กดปุ่ม ย้อนกลับ ให้กลับไปหน้า Home
  useEffect(() => {
    const backAction = () => {
      navigation.navigate('Home', { userId });
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation, userId]);

  const calculateCountdown = (endDate) => {
    const now = new Date();
    const target = new Date(endDate);
    const diff = target - now;
    if (diff <= 0) return 'ครบกำหนดแล้ว';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${days} วัน ${hours} ชม. ${minutes} นาที`;
  };

  const fetchPlanDetails = async () => {
    try {
      const response = await fetch(`${BASE_URL}/user/${userId}/plans/${planId}`);
      const data = await response.json();

      if (response.ok) {
        setPlan(data);
      } else {
        Alert.alert('Error', data.error || 'ไม่สามารถดึงข้อมูลแผนได้');
      }
    } catch (error) {
      Alert.alert('Error', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanSummary = async () => {
    try {
      const response = await fetch(`${BASE_URL}/user/${userId}/plans/${planId}/summary`);
      const data = await response.json();

      if (response.ok) {
        setSummary(data);
      } else {
        Alert.alert('Error', data.error || 'ไม่สามารถดึงข้อมูลสรุปยอดได้');
      }
    } catch (error) {
      Alert.alert('Error', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await fetchPlanDetails();
    await fetchPlanSummary();
  };

  useFocusEffect(
    useCallback(() => {
      refreshData();        // โหลดข้อมูลแผน
      fetchUnreadCount();   // โหลด badge ทุกครั้งที่กลับมา
    }, [userId, planId,])
  );

  const analyzePlanWithAI = async () => {
    try {
      const response = await fetch(`${BASE_URL}/ai/notify-smart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planId }),
      });

      const data = await response.json();
      console.log("AI แจ้งเตือน:", data.message); // จะไม่แสดง alert แต่สามารถแสดงบนหน้าอื่นได้
    } catch (error) {
      console.warn("ไม่สามารถวิเคราะห์แผนด้วย AI ได้", error.message);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`${BASE_URL}/notifications/${userId}/${planId}`);
      const data = await res.json();

      // นับเฉพาะที่ยังไม่อ่าน และของแผนแต่ละแผนเท่านั้น
      const count = data.filter(n => !n.seen).length;
      setUnreadCount(count);
    } catch (error) {
      console.warn("ไม่สามารถดึงจำนวนแจ้งเตือนได้", error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      refreshData();        // โหลด plan + summary
      fetchUnreadCount();   // โหลด badge
    }, [userId, planId])
  );

  useEffect(() => {
    analyzePlanWithAI(); // วิเคราะห์แผนด้วย AI
  }, [userId, planId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0072C6" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>ไม่พบข้อมูลแผน</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{plan.name}</Text>

        {plan.details && (
          <>
            <Text style={styles.bodyText}>รายละเอียด</Text>
            <Text style={styles.details}>{plan.details}</Text>
          </>
        )}

        {plan.goal && (
          <>
            <Text style={styles.bodyText}>เป้าหมาย</Text>
            <Text style={styles.details}>{plan.goal}</Text>
          </>
        )}

        {(plan.name.includes('แผนการผ่อนบ้าน') || plan.name.includes('แผนการผ่อนรถ')) && (
          <>
            {plan.salary && (
              <>
                <Text style={styles.bodyText}>เงินเดือน</Text>
                <Text style={styles.details}>{plan.salary.toLocaleString()} บาท</Text>
              </>
            )}
            {plan.itemPrice && (
              <>
                <Text style={styles.bodyText}>
                  {plan.name.includes('บ้าน') ? 'ราคาบ้าน' : 'ราคารถ'}
                </Text>
                <Text style={styles.details}>{plan.itemPrice.toLocaleString()} บาท</Text>
              </>
            )}
            {plan.installmentPeriod && (
              <>
                <Text style={styles.bodyText}>ระยะเวลาผ่อน</Text>
                <Text style={styles.details}>
                  {Math.floor(plan.installmentPeriod / 12)} ปี
                </Text>
              </>
            )}
          </>
        )}

        {plan.targetAmount > 0 && (
          <>
            <Text style={styles.bodyText}>จำนวนเงินเป้าหมาย</Text>
            <Text style={styles.details}>{plan.targetAmount.toLocaleString()} บาท</Text>
          </>
        )}

        {plan.targetDate && (
          <>
            <Text style={styles.bodyText}>วันครบกำหนด</Text>
            <Text style={styles.details}>
              {new Date(plan.targetDate).toLocaleDateString('th-TH')}
            </Text>
            <Text style={styles.bodyText}>เวลาที่เหลือ</Text>
            <Text style={styles.details}>{calculateCountdown(plan.targetDate)}</Text>
          </>
        )}

        {summary?.totalIncome > 0 && (
          <>
            <Text style={styles.bodyText}>รายรับทั้งหมด</Text>
            <Text style={styles.details}>{summary.totalIncome.toLocaleString()} บาท</Text>
          </>
        )}

        {summary?.totalExpense > 0 && (
          <>
            <Text style={styles.bodyText}>รายจ่ายทั้งหมด</Text>
            <Text style={styles.details}>{summary.totalExpense.toLocaleString()} บาท</Text>
          </>
        )}

        {plan.remainingBalance !== undefined && (
          <>
            <Text style={styles.bodyText}>ยอดเงินล่าสุด</Text>
            <Text style={styles.details}>{plan.remainingBalance.toLocaleString()} บาท</Text>
          </>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.navigate('InputData', {
              userId,
              planId,
              refreshCallback: refreshData,
            })
          }>
          <Text style={styles.buttonText}>กรอกข้อมูล</Text>
          <Image
            source={require('../assets/images/Icon/input-text.png')}
            style={styles.inputIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.navigate('PreScan', {
              userId,
              planId,
              refreshCallback: refreshData,
            })
          }>
          <Text style={styles.buttonText}>สแกน</Text>
          <Image
            source={require('../assets/images/Icon/scanner.png')}
            style={styles.scannerIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Summary', { userId, planId })}>
          <Text style={styles.buttonText}>สรุปผลทั้งหมด</Text>
          <Image
            source={require('../assets/images/Icon/accounting.png')}
            style={styles.accountingIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SelectChatMode', { userId, planId, planName })}>
          <Text style={styles.buttonText}>คำแนะนำ</Text>
          <Image source={require('../assets/images/Icon/robotics.png')} style={styles.roboticsIcon} />
        </TouchableOpacity>

        <View style={styles.floatingButton}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notification', { userId, planId })}
            style={styles.bellButton}
          >
            <Image
              source={require('../assets/images/Icon/bell.png')}
              style={{ width: 28, height: 28, marginRight: 1, marginLeft: 1 }}
            />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginTop: -160,
    marginBottom: 10,
    backgroundColor: '#5287b6',
    padding: 20,
    borderRadius: 10,
    width: '100%',
  },
  headerText: {
    fontSize: 22,
    fontFamily: 'IBMPlexSansThai-Regular',
    color: '#fff',
  },
  bodyText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSansThai-Regular',
    color: '#fff',
    left: 24,
    marginBottom: -25,
  },
  details: {
    fontSize: 14,
    fontFamily: 'IBMPlexSansThai-Regular',
    color: '#fff',
    textAlign: 'right',
    bottom: 22.5,
    top: 2.5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#0072C6',
    fontFamily: 'IBMPlexSansThai-Regular',
  },
  errorText: {
    fontSize: 18,
    color: '#ff4d4f',
    textAlign: 'center',
    fontFamily: 'IBMPlexSansThai-Regular',
  },
  buttonContainer: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#5287b6',
    padding: 15,
    borderRadius: 10,
    margin: 10,
    alignItems: 'center',
    width: 150,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'IBMPlexSansThai-Regular',
  },
  inputIcon: {
    width: 66,
    height: 66,
    marginRight: 8,
  },
  scannerIcon: {
    width: 62,
    height: 62,
    top: 2,
  },
  accountingIcon: {
    width: 66,
    height: 66,
    top: 2,
  },
  roboticsIcon: {
    width: 68,
    height: 68,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 10,
  },
  bellButton: {
    bottom: -80,
    borderRadius: 30,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
  },
});

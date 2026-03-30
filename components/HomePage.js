import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import BASE_URL from '../config/config';
import { BackHandler } from 'react-native';

export default function Home({ navigation, route }) {
  const { userId } = route.params;
  const [plans, setPlans] = useState([]);
  const [username, setUsername] = useState('');

  // ดึงข้อมูลชื่อผู้ใช้จาก server
  useFocusEffect(
    React.useCallback(() => {
      const fetchUserData = async () => {
        try {
          const response = await fetch(`${BASE_URL}/user/get-username/${userId}`);
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }
          const data = await response.json();
          setUsername(data.username); // เก็บชื่อผู้ใช้ที่ได้จากเซิร์ฟเวอร์
        } catch (error) {
          Alert.alert('ข้อผิดพลาด', error.message || 'ไม่สามารถดึงข้อมูลผู้ใช้');
        }
      };

      fetchUserData();
    }, [userId])
  );

  useEffect(() => {
    const backAction = () => {
      BackHandler.exitApp(); // ออกจากแอป
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove(); // ล้างเมื่อออกจากหน้า
  }, []);


  // ดึงแผนมาแสดง
  useFocusEffect(
    React.useCallback(() => {
      const fetchPlans = async () => {
        try {
          const response = await fetch(`${BASE_URL}/user/${userId}/plans`);
          const data = await response.json();
          if (response.ok) {
            setPlans(data); // ใช้ข้อมูลจากเซิร์ฟเวอร์
          } else {
            Alert.alert('ข้อผิดพลาด', data.error || 'ไม่สามารถดึงข้อมูลแผนได้');
          }
        } catch (error) {
          Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        }
      };

      fetchPlans();
    }, [userId])
  );

  // ฟังก์ชันสำหรับเพิ่มแผน
  const handleAddPlan = (newPlan) => {
    setPlans((prevPlans) => [...prevPlans, newPlan]);
  };

  // ฟังก์ชันสำหรับลบแผน
  const handleDeletePlan = async (planId) => {
    Alert.alert(
      "ยืนยันการลบ",
      "คุณต้องการลบแผนนี้หรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบ",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${BASE_URL}/user/${userId}/plans/${planId}`, {
                method: 'DELETE',
              });

              if (response.ok) {
                setPlans((prevPlans) => prevPlans.filter((plan) => plan.planId !== planId));
                Alert.alert('สําเร็จ', 'ลบแผนเรียบร้อย');
              } else {
                const data = await response.json();
                Alert.alert('ข้อผิดพลาด', data.error || 'ไม่สามารถลบแผนได้');
              }
            } catch (error) {
              Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
            }
          },
        },
      ]
    );
  };

  const fetchUnreadCounts = async (plansList) => {
    const counts = {};
    try {
      await Promise.all(plansList.map(async (plan) => {
        const response = await fetch(`${BASE_URL}/notifications/${userId}/${plan.planId}`);
        const data = await response.json();
        counts[plan.planId] = data.filter(n => !n.seen).length;
      }));
    } catch (error) {
      console.warn("ดึงจำนวนแจ้งเตือนไม่ได้", error.message);
    }
    return counts;
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${BASE_URL}/user/${userId}/plans`);
      const data = await response.json();
      if (response.ok) {
        const unreadCounts = await fetchUnreadCounts(data);
        const plansWithCounts = data.map(plan => ({
          ...plan,
          unreadCount: unreadCounts[plan.planId] || 0,
        }));
        setPlans(plansWithCounts);
      } else {
        Alert.alert('ข้อผิดพลาด', data.error || 'ไม่สามารถดึงข้อมูลแผนได้');
      }
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchPlans(); // เรียก fetchPlans ตัวที่มี unreadCount จริง
    }, [userId])
  );

  const renderItem = ({ item }) => (
    <View style={styles.planItem}>
      <View style={{ position: 'relative' }}>
        <TouchableOpacity
          style={styles.planButton}
          onPress={() => navigation.navigate('PlanPage', { userId, planId: item.planId })}
        >
          <Text style={styles.planText}>{item.name}</Text>
        </TouchableOpacity>

        {item.unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeletePlan(item.planId)}
      >
        <Text style={styles.deleteButtonText}>ลบ</Text>
      </TouchableOpacity>
    </View>
  );

  // ฟังก์ชันเปิด/ปิด modal
  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };
  return (
    <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.usernameText}>{username ? username : "กำลังโหลด..."}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId })}>
          <Text style={styles.settingsButton}>ตั้งค่า</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.headerText}>แผนของฉัน</Text>
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddPlan', { userId })}>
        <Text style={styles.addButtonText}>เพิ่มแผน</Text>
      </TouchableOpacity>
      <FlatList
        data={plans}
        keyExtractor={(item) => item.planId}
        renderItem={({ item }) => (
          <View style={styles.planItem}>
            <View style={{ flex: 1, position: 'relative' }}>
              {/* ปุ่มแผนจริง */}
              <TouchableOpacity
                style={styles.planButton}
                onPress={() => navigation.navigate('PlanPage', { userId, planId: item.planId })}
              >
                <Text style={styles.planText}>{item.name}</Text>
              </TouchableOpacity>

              {/* Badge อยู่ข้างนอก planButton */}
              {item.unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePlan(item.planId)}
            >
              <Text style={styles.deleteButtonText}>ลบ</Text>
            </TouchableOpacity>
          </View>

        )}
      />
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
    fontSize: 20,
    color: '#fff',
    fontFamily: 'IBMPlexSansThai-Regular',
  },
  settingsButton: {
    fontSize: 16,
    color: '#fff',
    textDecorationLine: 'underline',
    fontFamily: 'IBMPlexSansThai-Regular',
  },
  headerText: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
    fontFamily: 'IBMPlexSansThai-Regular',
  },
  addButton: {
    backgroundColor: '#5287b6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'IBMPlexSansThai-Regular',
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5287b6',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  planButton: {
    paddingTop: 1,
    paddingLeft: 1,
    paddingRight: 1,
    paddingBottom: 1,
    backgroundColor: '#5287b6',
    borderRadius: 10,
  },
  planText: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'IBMPlexSansThai-Regular',
  },
  deleteButton: {
    backgroundColor: '#ff4d4f',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'IBMPlexSansThai-Regular',
  },
  badge: {
    position: 'absolute',
    top: -17,
    left: -13,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'IBMPlexSansThai-Regular',
  },
});
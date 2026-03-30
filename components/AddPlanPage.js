import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import BASE_URL from '../config/config';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import { MaterialIcons } from '@expo/vector-icons';

export default function AddPlan({ route, navigation }) {

  const [planName, setPlanName] = useState('');
  const [planDetails, setPlanDetails] = useState('');
  const [CustomPlanName, setCustomPlanName] = useState('');
  const [financialType, setFinancialType] = useState('');
  const [goal, setGoal] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const { userId } = route.params;
  const [openPlanName, setOpenPlanName] = useState(false);
  const [openFinancialType, setOpenFinancialType] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState();
  const [openAlertThreshold, setOpenAlertThreshold] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [salary, setSalary] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [installmentPeriod, setInstallmentPeriod] = useState('');
  const [installmentYears, setInstallmentYears] = useState('');


  // กดปุ่ม ย้อนกลับ ให้กลับไปหน้า PlanPage
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

  const handleDateChange = (event, selected) => {
    setShowDatePicker(false);
    if (selected) {
      const formatted = selected.toISOString().split('T')[0];
      setSelectedDate(selected);
      setTargetDate(formatted);
    }
  };

  const handleStartDateChange = (event, selected) => {
    setShowStartDatePicker(false);
    if (selected) {
      const formatted = selected.toISOString().split('T')[0];
      setSelectedStartDate(selected);
      setStartDate(formatted);
    }
  };

  const handleCreatePlan = async () => {
    const selectedPlanName = planName === 'กำหนดเอง' ? CustomPlanName.trim() : planName;

    if (!selectedPlanName.trim()) {
      Alert.alert('ข้อผิดพลาด', 'ชื่อแผนห้ามเว้นว่าง');
      return;
    }

    if (planName.length < 3) {
      Alert.alert('ข้อผิดพลาด', 'ชื่อแผนต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }

    if ((planName === 'แผนการผ่อนบ้าน' || planName === 'แผนการผ่อนรถ') && totalMonths === 0) {
      Alert.alert('ข้อผิดพลาด', 'กรุณาระบุจำนวนปีในการผ่อนอย่างน้อย 1 ปี');
      return;
    }

    const totalMonths = (Number(installmentYears) || 0) * 12;

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/user/${userId}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedPlanName,
          category: financialType,
          salary: Number(salary.replace(/,/g, '')) || null,
          itemPrice: Number(itemPrice.replace(/,/g, '')) || null,
          installmentPeriod: totalMonths || null,
          details: planDetails,
          goal,
          targetAmount: Number(targetAmount.replace(/,/g, '')),
          startDate,
          targetDate,
          alertThreshold,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('สําเร็จ', 'สร้างแผนเรียบร้อย');
        const addPlanCallback = navigation.getParent()?.getOptions()?.addPlanCallback;
        if (addPlanCallback) {
          addPlanCallback(data.plan);
        }
        navigation.goBack();
      } else {
        Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการสร้างแผน');
      }
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultFinancialType = (planName) => {
    switch (planName) {
      case 'รายรับและรายจ่ายทั้งหมด':
        return 'รายรับ-รายจ่าย';
      case 'รายจ่ายทั้งหมด':
        return 'รายจ่าย';
      case 'รายรับทั้งหมด':
        return 'รายรับ';
      case 'การออมเพื่อความมั่นคง':
        return 'รายรับ';
      case 'การออมตามเป้าหมาย':
        return 'รายรับ';
      case 'การลงทุนเพื่อผลตอบแทน':
        return 'รายรับ';
      case 'แผนการผ่อนบ้าน':
        return 'รายรับ-รายจ่าย';
      case 'แผนการผ่อนรถ':
        return 'รายรับ-รายจ่าย';
      default:
        return 'รายรับ-รายจ่าย';
    }
  };

  return (
    <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.headerText}>เพิ่มแผน</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <MaterialIcons name="drive-file-rename-outline" size={22} color="#fff" style={{ marginRight: 6, marginTop: -2 }} />
          <Text style={styles.label}>ชื่อแผน *จำเป็น</Text>
        </View>
        <DropDownPicker
          open={openPlanName}
          value={planName}
          items={[
            { label: 'รายรับและรายจ่ายทั้งหมด', value: 'รายรับและรายจ่ายทั้งหมด' },
            { label: 'รายจ่ายทั้งหมด', value: 'รายจ่ายทั้งหมด' },
            { label: 'รายรับทั้งหมด', value: 'รายรับทั้งหมด' },
            { label: 'การออมเพื่อความมั่นคง (วิเคราะห์แผนการเงิน-RAG)', value: 'การออมเพื่อความมั่นคง' },
            { label: 'การออมตามเป้าหมาย (วิเคราะห์แผนการเงิน-RAG)', value: 'การออมตามเป้าหมาย' },
            { label: 'การลงทุนเพื่อผลตอบแทน (วิเคราะห์แผนการเงิน-RAG)', value: 'การลงทุนเพื่อผลตอบแทน' },
            { label: 'แผนการผ่อนบ้าน (วิเคราะห์แผนการเงิน-RAG)', value: 'แผนการผ่อนบ้าน' },
            { label: 'แผนการผ่อนรถ (วิเคราะห์แผนการเงิน-RAG)', value: 'แผนการผ่อนรถ' },
            { label: 'กำหนดเอง', value: 'กำหนดเอง' },
          ]}
          setOpen={setOpenPlanName}
          setValue={(callback) => {
            const value = callback(planName);
            setPlanName(value);
            const type = getDefaultFinancialType(value);
            if (type) setFinancialType(type);
          }}
          setItems={() => { }}
          placeholder="เลือกชื่อแผน"
          style={{
            backgroundColor: '#5287b6', // สีพื้นหลังก่อนกด
            borderColor: '#5287b6',
            borderRadius: 10,
            marginBottom: 20
          }}
          dropDownContainerStyle={{
            backgroundColor: '#5287b6', // สีพื้นหลังตอน Dropdown เปิด
            borderColor: '#5287b6'
          }}
          textStyle={{
            fontFamily: 'IBMPlexSansThai-Regular',
            fontSize: 14,
            color: '#fff',                 // สีข้อความ
          }}
          placeholderStyle={{
            fontFamily: 'IBMPlexSansThai-Regular',
            fontSize: 14,
            color: '#ccc',                 // สีข้อความ Placeholder
          }}
          listMode="SCROLLVIEW"
          zIndex={3000}
          zIndexInverse={1000}
        />

        {planName === 'กำหนดเอง' && (
          <TextInput
            style={styles.input}
            placeholder="ชื่อแผน"
            placeholderTextColor="#ccc"
            value={CustomPlanName}
            onChangeText={setCustomPlanName}
          />
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <MaterialIcons name="category" size={22} color="#fff" style={{ marginRight: 6, marginTop: -2 }} />
          <Text style={styles.label}>ประเภท *จำเป็น</Text>
        </View>
        <DropDownPicker
          open={openFinancialType}
          value={financialType}
          items={[
            { label: 'รายรับ-รายจ่าย', value: 'รายรับ-รายจ่าย' },
            { label: 'รายรับ', value: 'รายรับ' },
            { label: 'รายจ่าย', value: 'รายจ่าย' },
          ]}
          setOpen={setOpenFinancialType}
          setValue={(callback) => {
            const value = callback(financialType);
            setFinancialType(value);
          }}
          setItems={() => { }}
          placeholder="เลือกประเภท"
          style={{
            backgroundColor: '#5287b6', // สีพื้นหลังก่อนกด
            borderColor: '#5287b6',
            borderRadius: 10,
            marginBottom: 20
          }}
          dropDownContainerStyle={{
            backgroundColor: '#5287b6', // สีพื้นหลังตอน Dropdown เปิด
            borderColor: '#5287b6'
          }}
          textStyle={{
            fontFamily: 'IBMPlexSansThai-Regular',
            fontSize: 14,
            color: '#fff',                 // สีข้อความ
          }}
          placeholderStyle={{
            fontFamily: 'IBMPlexSansThai-Regular',
            fontSize: 14,
            color: '#ccc',                 // สีข้อความ Placeholder
          }}
          listMode="SCROLLVIEW"
          zIndex={2000}
          zIndexInverse={2000}
        />

        {(planName === 'แผนการผ่อนบ้าน' || planName === 'แผนการผ่อนรถ') && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <MaterialIcons name="payments" size={22} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.label}>เงินเดือน</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="กรอกเงินเดือน"
              placeholderTextColor="#ccc"
              value={salary}
              onChangeText={(text) => {
                const numericText = text.replace(/,/g, '').replace(/[^0-9]/g, '');
                const formatted = numericText.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                setSalary(formatted);
              }}
              keyboardType="numeric"
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <MaterialIcons name="house" size={22} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.label}>{planName === 'แผนการผ่อนบ้าน' ? 'ราคาบ้าน' : 'ราคารถ'}</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder={`กรอก${planName === 'แผนการผ่อนบ้าน' ? 'ราคาบ้าน' : 'ราคารถ'}`}
              placeholderTextColor="#ccc"
              value={itemPrice}
              onChangeText={(text) => {
                const numericText = text.replace(/,/g, '').replace(/[^0-9]/g, '');
                const formatted = numericText.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                setItemPrice(formatted);
              }}
              keyboardType="numeric"
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <MaterialIcons name="schedule" size={22} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.label}>ระยะเวลาในการผ่อน (ปี)</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="กรอกจำนวนปี เช่น 3"
              placeholderTextColor="#ccc"
              value={installmentYears}
              onChangeText={(text) => setInstallmentYears(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />
          </>
        )}


        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <MaterialIcons name="description" size={22} color="#fff" style={{ marginRight: 6, marginTop: -2 }} />
          <Text style={styles.label}>รายละเอียดแผน</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="เป้าหมาย, รายละเอียดแผน"
          placeholderTextColor="#ccc"
          value={planDetails}
          onChangeText={setPlanDetails}
          multiline
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <MaterialIcons name="notifications-active" size={22} color="#fff" style={{ marginRight: 6, marginTop: -2 }} />
          <Text style={styles.label}>การแจ้งเตือนค่าใช้จ่ายเกินกำหนด</Text>
        </View>
        <DropDownPicker
          open={openAlertThreshold}
          value={alertThreshold}
          items={[
            { label: 'ไม่แจ้งเตือน', value: 0 },
            { label: '10%', value: 10 },
            { label: '20%', value: 20 },
            { label: '30%', value: 30 },
            { label: '40%', value: 40 },
            { label: '50%', value: 50 },
            { label: '60%', value: 60 },
            { label: '70%', value: 70 },
            { label: '80%', value: 80 },
            { label: '90%', value: 90 },
          ]}
          setOpen={setOpenAlertThreshold}
          setValue={setAlertThreshold}
          setItems={() => { }}
          placeholder="เลือกเปอร์เซ็นต์ที่ต้องการแจ้งเตือน"
          style={{
            backgroundColor: '#5287b6', // สีพื้นหลังก่อนกด
            borderColor: '#5287b6',
            borderRadius: 10,
            marginBottom: 20
          }}
          dropDownContainerStyle={{
            backgroundColor: '#5287b6', // สีพื้นหลังตอน Dropdown เปิด
            borderColor: '#5287b6'
          }}
          textStyle={{
            fontFamily: 'IBMPlexSansThai-Regular',
            fontSize: 14,
            color: '#fff',                 // สีข้อความ
          }}
          placeholderStyle={{
            fontFamily: 'IBMPlexSansThai-Regular',
            fontSize: 14,
            color: '#ccc',                 // สีข้อความ Placeholder
          }}
          listMode="SCROLLVIEW"
          zIndex={2000}
          zIndexInverse={2000}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <MaterialIcons name="track-changes" size={22} color="#fff" style={{ marginRight: 6, marginTop: -2 }} />
          <Text style={styles.label}>เป้าหมาย</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="ออมเงิน, ปลดหนี้, ฯลฯ"
          placeholderTextColor="#ccc"
          value={goal}
          onChangeText={setGoal}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <MaterialIcons name="attach-money" size={24} color="#fff" style={{ marginRight: 1, marginTop: -2 }} />
          <Text style={styles.label}>จำนวนเงินเป้าหมาย</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="เช่น 10,000"
          placeholderTextColor="#ccc"
          value={targetAmount}
          onChangeText={(text) => {
            const numericText = text.replace(/,/g, '').replace(/[^0-9]/g, '');
            const formatted = numericText.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            setTargetAmount(formatted);
          }}
          keyboardType="numeric"
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginLeft: 4 }}>
          <MaterialIcons name="calendar-today" size={18} color="#fff" style={{ marginRight: 6, marginTop: -2 }} />
          <Text style={styles.label}>วันเริ่มต้น</Text>
        </View>
        <TouchableOpacity style={styles.input} onPress={() => setShowStartDatePicker(true)}>
          <Text style={[styles.dateText, { color: startDate ? '#fff' : '#ccc' }]}>
            {startDate || 'เลือกวันเริ่มต้น'}
          </Text>
        </TouchableOpacity>

        {showStartDatePicker && (
          <DateTimePicker
            value={selectedStartDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartDateChange}
            maximumDate={selectedDate || undefined}
          />
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginLeft: 4 }}>
          <MaterialIcons name="event" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.label}>วันครบกำหนด</Text>
        </View>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={[styles.dateText, { color: targetDate ? '#fff' : '#ccc' }]}>
            {targetDate || 'เลือกวันที่ครบกำหนด'}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <TouchableOpacity style={styles.createButton} onPress={handleCreatePlan}>
            <Text style={styles.createButtonText}>สร้างแผน</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0072C6',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 10,
    marginTop: 60,
    textAlign: 'center',
    fontFamily: 'IBMPlexSansThai-Regular',
  },
  label: {
    fontSize: 16,
    color: '#fff',
    // marginBottom: 10,
    fontFamily: 'IBMPlexSansThai-Regular',
  },
  input: {
    backgroundColor: '#5287b6',
    padding: 15,
    borderRadius: 10,
    fontSize: 14,
    color: '#fff',
    marginBottom: 20,
    fontFamily: 'IBMPlexSansThai-Regular',
  },
  picker: {
    backgroundColor: '#5287b6',
    borderRadius: 10,
    fontFamily: 'IBMPlexSansThai-Regular',
    color: '#ccc',
  },
  pickerContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#5287b6',
    marginBottom: 20,
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'IBMPlexSansThai-Regular',
  },
  createButton: {
    backgroundColor: '#003B73',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'IBMPlexSansThai-Regular',
  },
  scrollContainer: {
    paddingBottom: 30,
    paddingHorizontal: 20,
  },

});

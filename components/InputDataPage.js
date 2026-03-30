import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from '@react-navigation/native';
import BASE_URL from '../config/config';
import { LinearGradient } from 'expo-linear-gradient';
import { BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function InputData({ route }) {
    const navigation = useNavigation();
    const { userId, planId } = route.params;
    const [category, setCategory] = useState('');
    const [customCategory, setCustomCategory] = useState(''); // เพิ่มตัวแปรสำหรับหมวดหมู่กำหนดเอง
    const [itemName, setItemName] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date());
    const [isIncome, setIsIncome] = useState(true);
    const [showPicker, setShowPicker] = useState(false);
    const [openCategory, setOpenCategory] = useState(false);

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

    const handleSubmit = async () => {
        if (!itemName.trim() || !amount.trim()) {
            Alert.alert('ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        const selectedCategory = category === 'กำหนดเอง' ? customCategory.trim() : category;

        if (!selectedCategory) {
            Alert.alert('ข้อผิดพลาด', 'กรุณากรอกชื่อหมวดหมู่');
            return;
        }

        const newEntry = {
            planId,
            category: selectedCategory,
            itemName,
            amount: parseFloat(amount.replace(/,/g, '')),
            date,
            type: isIncome ? 'รายรับ' : 'รายจ่าย',
        };

        try {
            const response = await fetch(`${BASE_URL}/user/${userId}/entries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEntry),
            });

            if (response.ok) {
                Alert.alert('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย');
                navigation.navigate('PlanPage', { userId, planId, refresh: true });
            } else {
                Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
            }
        } catch (error) {
            Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        }
    };

    return (
        <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
            <Text style={styles.headerText}>บันทึกข้อมูล</Text>

            {/* หมวดหมู่ */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2, alignSelf: 'flex-start' }}>
                <MaterialIcons name="category" size={22} color="#fff" style={{ marginRight: 4 , marginTop: -4 }} />
                <Text style={styles.label}>หมวดหมู่</Text>
            </View>
            <DropDownPicker
                open={openCategory}
                value={category}
                items={[
                    { label: 'รายรับ', value: 'รายรับ' },
                    { label: 'อาหาร', value: 'อาหาร' },
                    { label: 'เดินทาง', value: 'เดินทาง' },
                    { label: 'ของใช้', value: 'ของใช้' },
                    { label: 'กำหนดเอง', value: 'กำหนดเอง' },
                ]}
                setOpen={setOpenCategory}
                setValue={(callback) => {
                    const selected = callback(category);
                    setCategory(selected);
                }}
                setItems={() => { }}
                placeholder="เลือกหมวดหมู่"
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
            />

            {category === 'กำหนดเอง' && (
                <TextInput
                    style={styles.input}
                    placeholder="กรอกชื่อหมวดหมู่"
                    placeholderTextColor="#bbb"
                    value={customCategory}
                    onChangeText={setCustomCategory}
                />
            )}

            {/* ชื่อรายการ */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2, alignSelf: 'flex-start' }}>
                <MaterialIcons name="list" size={22} color="#fff" style={{ marginRight: 4 , marginTop: -4 }} />
                <Text style={styles.label}>ชื่อรายการ</Text>
            </View>
            <TextInput
                style={styles.input}
                placeholder="ป้อนชื่อรายการ"
                placeholderTextColor="#bbb"
                value={itemName}
                onChangeText={setItemName}
            />

            {/* จำนวนเงิน */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2, alignSelf: 'flex-start' }}>
                <MaterialIcons name="attach-money" size={24} color="#fff" style={{ marginRight: -2 , marginTop: -6 }} />
                <Text style={styles.label}>จำนวนเงิน</Text>
            </View>
            <TextInput
                style={styles.input}
                placeholder="ป้อนจำนวนเงิน"
                placeholderTextColor="#bbb"
                keyboardType="numeric"
                value={amount}
                onChangeText={(text) => {
                    const numericText = text.replace(/,/g, '').replace(/[^0-9]/g, '');
                    const formatted = numericText.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    setAmount(formatted);
                }}
            />

            {/* วันที่ */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2, alignSelf: 'flex-start' }}>
                <MaterialIcons name="calendar-today" size={20} color="#fff" style={{ marginRight: 4 , marginTop: -6 , marginLeft: 5}} />
                <Text style={styles.label}>วันที่</Text>
            </View>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
                <Text style={styles.dateButtonText}>
                    {date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
            </TouchableOpacity>
            {showPicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowPicker(false);
                        if (selectedDate) setDate(selectedDate);
                    }}
                />
            )}

            {/* ปุ่มสลับ รายรับ - รายจ่าย */}
            <View style={styles.switchContainer}>
                <TouchableOpacity
                    style={[styles.switchButton, isIncome && styles.activeSwitchButton]}
                    onPress={() => setIsIncome(true)}>
                    <Text style={styles.switchText}>รายรับ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.switchButton, !isIncome && styles.activeSwitchButton]}
                    onPress={() => setIsIncome(false)}>
                    <Text style={styles.switchText}>รายจ่าย</Text>
                </TouchableOpacity>
            </View>

            {/* ปุ่มบันทึก */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>บันทึก</Text>
            </TouchableOpacity>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        fontFamily: 'IBMPlexSansThai-Regular',
    },
    headerText: {
        fontSize: 24,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
        alignSelf: 'flex-start',
        marginBottom: 5,
    },
    pickerContainer: {
        backgroundColor: '#5287b6',
        borderRadius: 8,
        width: '100%',
        marginBottom: 15,
        fontFamily: 'IBMPlexSansThai-Regular',
    },
    picker: {
        height: 50,
        color: '#fff',
        fontFamily: 'IBMPlexSansThai-Regular',
    },
    input: {
        width: '100%',
        height: 50,
        borderRadius: 8,
        backgroundColor: '#5287b6',
        paddingHorizontal: 10,
        marginBottom: 15,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
    },
    dateButton: {
        backgroundColor: '#5287b6',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
        marginBottom: 15,
    },
    dateButtonText: {
        fontSize: 16,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    switchButton: {
        flex: 1,
        padding: 12,
        backgroundColor: '#626567',
        borderRadius: 8,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    activeSwitchButton: {
        backgroundColor: '#003B73',
    },
    switchText: {
        color: '#fff',
        fontFamily: 'IBMPlexSansThai-Regular',
    },
    submitButton: {
        backgroundColor: '#003B73',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
    },
    submitButtonText: {
        fontSize: 16,
        color: '#fff',
        fontFamily: 'IBMPlexSansThai-Regular',
    },
});

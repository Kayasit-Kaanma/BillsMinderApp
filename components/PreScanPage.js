import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function PreScan({ route }) {
    const navigation = useNavigation();
    const { userId, planId } = route.params;
    const [category, setCategory] = useState('อาหาร');
    const [customCategory, setCustomCategory] = useState('');
    const [date, setDate] = useState(new Date());
    const [isIncome, setIsIncome] = useState(true);
    const [showDatePicker, setShowDatePicker] = useState(false);
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

        return () => backHandler.remove(); // ล้างเมื่อ unmount
    }, [navigation, userId, planId]);

    return (
        <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
            <Text style={styles.headerText}>กำหนดข้อมูล</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2, alignSelf: 'flex-start' }}>
                <MaterialIcons name="category" size={22} color="#fff" style={{ marginRight: 4 , marginTop: -4 }} />
                <Text style={styles.label}>หมวดหมู่</Text>
            </View>
            <DropDownPicker
                open={openCategory}
                value={category}
                items={[
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
                    placeholderTextColor="#aaa"
                    value={customCategory}
                    onChangeText={setCustomCategory}
                />
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2, alignSelf: 'flex-start' }}>
                <MaterialIcons name="calendar-today" size={20} color="#fff" style={{ marginRight: 4 , marginTop: -6 , marginLeft: 5}} />
                <Text style={styles.label}>วันที่</Text>
            </View>
            <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
            >
                <Text style={styles.dateButtonText}>
                    {date.toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </Text>
            </TouchableOpacity>

            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) setDate(selectedDate);
                    }}
                />
            )}

            <Text style={styles.label}>ประเภท</Text>
            <View style={styles.switchContainer}>
                <TouchableOpacity
                    style={[styles.switchButton, isIncome && styles.activeSwitchButton]}
                    onPress={() => setIsIncome(true)}
                >
                    <Text style={styles.switchText}>รายรับ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.switchButton, !isIncome && styles.activeSwitchButton]}
                    onPress={() => setIsIncome(false)}
                >
                    <Text style={styles.switchText}>รายจ่าย</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.submitButton}
                onPress={() => {
                    const selectedCategory = category === 'กำหนดเอง' ? customCategory.trim() : category;
                    if (!selectedCategory) {
                        Alert.alert('ข้อผิดพลาด', 'กรุณากรอกชื่อหมวดหมู่');
                        return;
                    }

                    navigation.navigate('Scan', {
                        userId,
                        planId,
                        category: selectedCategory,
                        date: date.toISOString(),
                        type: isIncome ? 'รายรับ' : 'รายจ่าย'
                    });
                }}
            >
                <Text style={styles.submitButtonText}>ไปยังหน้าสแกน</Text>
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
        marginBottom: 5,
    },
    pickerContainer: {
        width: '100%',
        backgroundColor: '#5287b6',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 20,
    },
    picker: {
        height: 50,
        width: '100%',
        color: '#fff',
    },
    input: {
        width: '100%',
        height: 50,
        borderRadius: 8,
        marginBottom: 20,
        paddingHorizontal: 10,
        backgroundColor: '#5287b6',
        fontFamily: 'IBMPlexSansThai-Regular',
        color: 'white',
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
        marginBottom: 20,
        width: '100%',
        justifyContent: 'center',
    },
    switchButton: {
        flex: 1,
        padding: 15,
        backgroundColor: '#626567',
        borderRadius: 10,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    activeSwitchButton: {
        backgroundColor: '#003B73',
    },
    switchText: {
        fontSize: 16,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
    },
    submitButton: {
        backgroundColor: '#003B73',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    submitButtonText: {
        fontSize: 16,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
    },
});

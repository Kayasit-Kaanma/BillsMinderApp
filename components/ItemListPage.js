import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import BASE_URL from '../config/config';

const ItemList = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { userId, planId, ocrData, category, date, type } = route.params || {};
    const [items, setItems] = useState([]);
    const [customCategories, setCustomCategories] = useState({});
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (ocrData && ocrData.items) {
            setItems(ocrData.items.map(item => ({
                itemName: item.name,
                amount: item.total,
                category: category || '', // ใส่ category เริ่มต้นที่มาจาก ScanPage
            })));
        }
    }, [ocrData]);

    const deleteItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index, newName, newAmount) => {
        setItems(items.map((item, i) =>
            i === index ? { itemName: newName, amount: parseFloat(newAmount) || 0 } : item
        ));
        setEditingItem(null);
    };

    const saveToDatabase = async () => {
        try {
            setLoading(true);
            console.log('เริ่มบันทึกข้อมูล...');

            for (let index = 0; index < items.length; index++) {
                const item = items[index];

                // ดึงหมวดหมู่ที่แท้จริง (เผื่อกรณีกำหนดเอง)
                const categoryToSave = item.category === 'กำหนดเอง'
                    ? (customCategories[index]?.trim() || '')
                    : item.category;

                if (!categoryToSave) {
                    setLoading(false);
                    Alert.alert('ข้อผิดพลาด', `กรุณากรอกหมวดหมู่สำหรับรายการที่ ${index + 1}`);
                    return;
                }

                const newEntry = {
                    planId,
                    category: categoryToSave,
                    itemName: item.itemName,
                    amount: parseFloat(item.amount),
                    date: new Date(date).toISOString(),
                    type,
                };

                const response = await fetch(`${BASE_URL}/user/${userId}/entries`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newEntry),
                });

                if (!response.ok) {
                    throw new Error('ไม่สามารถบันทึกรายการได้');
                }
            }

            setLoading(false);
            Alert.alert('สำเร็จ', 'บันทึกรายการทั้งหมดเรียบร้อยแล้ว');
            navigation.goBack();

        } catch (error) {
            setLoading(false);
            console.error('Error saving items:', error);
            Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกรายการได้');
        }
    };

    return (
        <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
            <Text style={styles.header}>รายการสินค้า</Text>
            <FlatList
                data={items}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <View style={styles.itemContainer}>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={item.category}
                                onValueChange={(value) => {
                                    const updatedItems = [...items];
                                    updatedItems[index].category = value;
                                    setItems(updatedItems);

                                    // ถ้าเลือก 'กำหนดเอง' แต่ยังไม่มีค่า สร้างค่าเริ่มต้น
                                    if (value === 'กำหนดเอง') {
                                        setCustomCategories(prev => ({ ...prev, [index]: '' }));
                                    }
                                }}
                                style={styles.picker}
                                dropdownIconColor="#fff"
                            >
                                <Picker.Item label="อาหาร" value="อาหาร" />
                                <Picker.Item label="เดินทาง" value="เดินทาง" />
                                <Picker.Item label="ของใช้" value="ของใช้" />
                                <Picker.Item label="กำหนดเอง" value="กำหนดเอง" />
                            </Picker>

                            {item.category === 'กำหนดเอง' && (
                                <TextInput
                                    style={styles.input}
                                    placeholder="กรอกชื่อหมวดหมู่"
                                    placeholderTextColor="#aaa"
                                    value={customCategories[index] || ''}
                                    onChangeText={(text) => {
                                        setCustomCategories(prev => ({ ...prev, [index]: text }));
                                    }}
                                />
                            )}
                        </View>

                        {editingItem === index ? (

                            <View>
                                <TextInput
                                    style={styles.input}
                                    value={item.itemName}
                                    onChangeText={(text) => {
                                        setItems(items.map((i, idx) => idx === index ? { ...i, itemName: text } : i));
                                    }}
                                />
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={item.amount?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                    onChangeText={(text) => {
                                        const numericText = text.replace(/,/g, '').replace(/[^0-9]/g, '');
                                        const formatted = numericText.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                                        setItems(items.map((i, idx) => idx === index ? { ...i, amount: numericText } : i));
                                    }}
                                />
                                <TouchableOpacity style={styles.saveButton} onPress={() => updateItem(index, item.itemName, item.amount)}>
                                    <Text style={styles.saveButtonText}>บันทึก</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View>
                                <Text style={styles.itemName}>{item.itemName}</Text>
                                <Text style={styles.itemTotal}>ราคา {item.amount} บาท</Text>
                                <View style={styles.buttonGroup}>
                                    <TouchableOpacity style={styles.editButton} onPress={() => setEditingItem(index)}>
                                        <AntDesign name="edit" size={20} color="white" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.deleteButton} onPress={() => deleteItem(index)}>
                                        <AntDesign name="delete" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                )}
            />
            <TouchableOpacity style={styles.saveAllButton} onPress={saveToDatabase}>
                <AntDesign name="save" size={20} color="white" />
                <Text style={styles.saveButtonText}>บันทึก</Text>
            </TouchableOpacity>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 50,
    },
    itemContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    itemName: {
        fontSize: 16,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
    },
    itemTotal: {
        fontSize: 18,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
    },
    input: {
        padding: 10,
        borderRadius: 10,
        fontSize: 14,
        color: '#fff',
        marginBottom: 6,
        fontFamily: 'IBMPlexSansThai-Regular',
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: -45,
    },
    editButton: {
        backgroundColor: '#FFD700',
        padding: 8,
        borderRadius: 6,
        marginRight: 5,
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
        padding: 8,
        borderRadius: 6,
    },
    pickerContainer: {
        backgroundColor: '#5287b6',
        borderRadius: 10,
        marginBottom: 10,
    },
    picker: {
        color: '#fff',
    },
    saveAllButton: {
        backgroundColor: '#28A745',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: 'white',
        marginLeft: 5,
        backgroundColor: '#28A745',
        padding: 5,
        borderRadius: 10,
        textAlign: 'center',
    },
    scrollContainer: {
        paddingBottom: 20,
    },
});

export default ItemList;
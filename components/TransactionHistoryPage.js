import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import BASE_URL from '../config/config';
import { BackHandler } from 'react-native';

export default function TransactionHistory() {
    const navigation = useNavigation();
    const route = useRoute();
    const { userId, planId } = route.params;

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // กดปุ่ม ย้อนกลับ ให้กลับไปหน้า PlanPage
    useEffect(() => {
        const backAction = () => {
            navigation.navigate('Summary', { userId, planId });
            return true; 
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, [navigation, userId, planId]);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await fetch(`${BASE_URL}/user/${userId}/plans/${planId}/transactions`);
                const data = await response.json();

                console.log("Data from API:", data);

                if (response.ok && Array.isArray(data)) {
                    setTransactions(data);
                } else {
                    alert('ไม่พบข้อมูลธุรกรรม');
                }
            } catch (error) {
                alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [userId, planId]);

    if (loading) {
        return (
            <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
            </LinearGradient>
        );
    }

    if (transactions.length === 0) {
        return (
            <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
                <Text style={styles.errorText}>ไม่พบข้อมูลธุรกรรม</Text>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
            <Text style={styles.headerText}>ประวัติค่าใช้จ่าย</Text>

            <FlatList
                data={transactions}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <View style={[styles.transactionBox, item.type === 'รายรับ' ? styles.incomeBox : styles.expenseBox]}>
                        <Text style={styles.transactionType}>{item.type}</Text>
                        <Text style={styles.transactionDate}>
                            {new Date(item.date).toLocaleDateString('th-TH')} - {new Date(item.date).toLocaleTimeString('th-TH')}
                        </Text>
                        <Text style={styles.transactionName}>{item.itemName}</Text>
                        <Text style={styles.transactionAmount}>
                            {item.type === 'รายรับ' ? '+' : '-'}{item.amount} บาท
                        </Text>
                    </View>
                )}
            />

            {/* ปุ่มย้อนกลับ */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>ย้อนกลับ</Text>
            </TouchableOpacity>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 24,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
        marginBottom: 10,
        marginTop: 60,
    },
    loadingText: {
        fontSize: 18,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
        marginTop: 10,
    },
    errorText: {
        fontSize: 18,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
    },
    transactionBox: {
        width: '100%',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        paddingHorizontal: 80,
        alignItems: 'right',
    },
    incomeBox: {
        backgroundColor: 'rgba(72, 201, 176, 0.8)', // สีเขียวโปร่งใส
    },
    expenseBox: {
        backgroundColor: 'rgba(235, 87, 87, 0.8)', // สีแดงโปร่งใส
    },
    transactionType: {
        fontSize: 16,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',

    },
    transactionDate: {
        fontSize: 14,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#f1f1f1',
    },
    transactionName: {
        fontSize: 16,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
    },
    transactionAmount: {
        fontSize: 18,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
    },
    backButton: {
        backgroundColor: '#003B73',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    backButtonText: {
        fontSize: 16,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
    },
});

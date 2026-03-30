import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import BASE_URL from '../config/config';
import { BackHandler } from 'react-native';

export default function Summary() {
    const navigation = useNavigation();
    const route = useRoute();
    const { userId, planId } = route.params;
    const [summary, setSummary] = useState(null);
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timePeriod, setTimePeriod] = useState('week');
    const timePeriods = ['week', 'month', 'year'];
    const [aiInsight, setAiInsight] = useState(null);
    const [aiInsightLoading, setAiInsightLoading] = useState(false);
    const [aiInsightFull, setAiInsightFull] = useState('');
    const [showFullInsight, setShowFullInsight] = useState(false);

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

    // const fetchAIInsight = async () => {
    //     if (!summary || !summary.categories || summary.categories.length === 0) return;
    //     setAiInsightLoading(true);

    //     try {
    //         const response = await fetch(`${BASE_URL}/ai/insight-direct`, {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ summary, period: timePeriod })
    //         });

    //         const data = await response.json();
    //         const fullText = (data.message || data.response || '').trim();
    //         const lines = fullText.split('\n').filter(line => line.trim() !== '');
    //         const limitedLines = lines.slice(0, 3).join('\n');
    //         const limitedText = limitedLines.length > 300 ? limitedLines.slice(0, 300) + '...' : limitedLines;

    //         setAiInsightFull(fullText);
    //         setAiInsight(limitedText || 'ไม่สามารถวิเคราะห์ข้อมูลได้ในขณะนี้');

    //         if (response.ok && (data.message || data.response)) {

    //         } else {
    //             setAiInsight("ไม่สามารถวิเคราะห์ข้อมูลได้ในขณะนี้");
    //         }
    //     } catch (err) {
    //         console.error("AI Insight error", err);
    //         setAiInsight("ไม่สามารถเชื่อมต่อกับ AI ได้");
    //     } finally {
    //         setAiInsightLoading(false);
    //     }
    // };

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await fetch(`${BASE_URL}/user/${userId}/plans/${planId}/summary?period=${timePeriod}`);
                const data = await response.json();

                if (response.ok) {
                    setSummary(data?.categories ? data : { ...data, categories: [] });
                } else {
                    alert('ไม่มีข้อมูลสรุป');
                }
            } catch (error) {
                alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
            } finally {
                setLoading(false);
            }
        };

        const fetchPlan = async () => {
            try {
                const response = await fetch(`${BASE_URL}/user/${userId}/plans/${planId}`);
                const data = await response.json();
                if (response.ok) {
                    setPlan(data);
                }
            } catch (error) {
                console.error('Failed to fetch plan details:', error);
            }
        };

        fetchPlan();
        fetchSummary();
    }, [userId, planId, timePeriod]);

    useEffect(() => {
        if (summary && summary.categories && summary.categories.length > 0) {
            // fetchAIInsight();
        }
    }, [summary, timePeriod]);

    if (loading) {
        return (
            <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
            </LinearGradient>
        );
    }

    if (!summary) {
        return (
            <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
                <Text style={styles.errorText}>ไม่พบข้อมูลสรุป</Text>
            </LinearGradient>
        );
    }

    const chartData = (summary?.categories || []).map((item) => ({
        name: `${item.category}`,
        population: isNaN(Number(item.percentage)) ? 0 : Number(item.percentage),
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        legendFontColor: "#fff",
        legendFontSize: 14
    }));

    const incomeExpenseChart = [
        {
            name: 'รายรับ',
            population: summary.totalIncome,
            color: '#4CAF50',
            legendFontColor: '#fff',
            legendFontSize: 14
        },
        {
            name: 'รายจ่าย',
            population: summary.totalExpense,
            color: '#FF5722',
            legendFontColor: '#fff',
            legendFontSize: 14
        }
    ];

    return (
        <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* ปุ่มสลับช่วงเวลา */}
                <View style={styles.toggleContainer}>
                    {timePeriods.map((period) => (
                        <TouchableOpacity
                            key={period}
                            style={[styles.toggleButton, timePeriod === period && styles.activeToggleButton]}
                            onPress={() => setTimePeriod(period)}
                        >
                            <Text style={styles.toggleText}>
                                {period === 'week' ? 'สัปดาห์' : period === 'month' ? 'เดือน' : 'ปี'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Header Box */}
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryHeader}>ค่ากินของ{timePeriod === 'week' ? 'สัปดาห์' : timePeriod === 'month' ? 'เดือน' : 'ปี'}นี้</Text>

                    <Text style={styles.summaryText}>เป้าหมาย</Text>
                    <Text style={styles.amountText}>{plan?.goal || 'ไม่ระบุ'}</Text>

                    <Text style={styles.summaryText}>จำนวนเงินเป้าหมาย</Text>
                    <Text style={styles.amountText}>
                        {plan?.targetAmount ? plan.targetAmount.toLocaleString() + ' บาท' : 'ไม่ระบุ'}
                    </Text>

                    {plan?.targetAmount > 0 && (
                        <>
                            <Text style={styles.summaryText}>ความคืบหน้าของเป้าหมาย</Text>
                            <Text style={styles.amountText}>
                                {Math.min(100, ((summary.remainingBalance / plan.targetAmount) * 100).toFixed(2))}%
                            </Text>
                        </>
                    )}

                    <Text style={styles.summaryText}>วันครบกำหนด</Text>
                    <Text style={styles.amountText}>
                        {plan?.targetDate ? new Date(plan.targetDate).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                    </Text>

                    {plan?.targetDate && (
                        <>
                            <Text style={styles.summaryText}>ระยะเวลาที่เหลือ</Text>
                            <Text style={styles.amountText}>
                                {Math.max(0, Math.ceil((new Date(plan.targetDate) - new Date()) / (1000 * 60 * 60 * 24)))} วัน
                            </Text>
                        </>
                    )}

                    <Text style={styles.summaryText}>รายรับทั้งหมด</Text>
                    <Text style={styles.amountText}>{summary.totalIncome} บาท</Text>

                    <Text style={styles.summaryText}>รายจ่ายทั้งหมด</Text>
                    <Text style={styles.amountText}>{summary.totalExpense} บาท</Text>

                    <Text style={styles.summaryText}>ยอดเงินที่เหลืออยู่ทั้งหมด</Text>
                    <Text style={styles.amountText}>{summary.remainingBalance} บาท</Text>
                </View>

                {/* {aiInsightLoading ? (
                    <View style={styles.aiInsightBox}>
                        <Text style={styles.summaryHeader}>💡 ข้อแนะนำจาก AI</Text>
                        <Text style={styles.summaryAiInsightLoading}>กำลังวิเคราะห์ข้อมูล...</Text>
                    </View>
                ) : aiInsight && (
                    <View style={styles.aiInsightBox}>
                        <Text style={styles.summaryHeader}>💡 ข้อแนะนำจาก AI</Text>
                        <Text style={styles.summaryAiInsight}>
                            {showFullInsight ? aiInsightFull : aiInsight}
                        </Text>

                        {aiInsightFull !== aiInsight && (
                            <TouchableOpacity onPress={() => setShowFullInsight(!showFullInsight)}>
                                <Text style={[styles.toggleText1, { marginTop: 10, textAlign: 'right' }]}>
                                    {showFullInsight ? 'แสดงสั้นลง' : 'อ่านเพิ่มเติม'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )} */}


                {/* Pie Chart */}
                <Text style={[styles.summaryHeader, { marginTop: 10 }]}>สัดส่วนรายรับ-รายจ่าย</Text>
                <PieChart
                    data={incomeExpenseChart}
                    width={300}
                    height={200}
                    chartConfig={{
                        backgroundColor: '#ffffff',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 2,
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                />

                {/* รายละเอียดหมวดหมู่ */}
                <View style={styles.detailsContainer}>
                    <View style={styles.detailRowHeader}>
                        <Text style={[styles.detailText]}>หมวดหมู่</Text>
                        <Text style={[styles.detailProgress]}>    %</Text>
                        <Text style={[styles.detailText]}>จำนวน</Text>
                    </View>

                    {summary.categories.map((item, index) => (
                        <View key={index} style={styles.detailRow}>
                            <Text style={styles.detailText}>{item.category}</Text>
                            <Text style={styles.detailProgress}>{item.percentage}%</Text>
                            <Text style={styles.detailText}>{item.amount.toLocaleString()} บาท</Text>
                        </View>
                    ))}
                </View>

                {/* ปุ่มไปที่ประวัติการใช้จ่าย */}
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={() => navigation.navigate('TransactionHistory', { userId, planId })}
                >
                    <Text style={styles.submitButtonText}>ประวัติค่าใช้จ่าย</Text>
                </TouchableOpacity>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    toggleContainer: {
        flexDirection: 'row',
        marginBottom: 15,
        marginTop: 60,
    },
    toggleButton: {
        backgroundColor: '#5B8BB5',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginHorizontal: 5,
    },
    activeToggleButton: {
        backgroundColor: '#003B73',
    },
    toggleText: {
        fontSize: 16,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
    },
    summaryBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        width: '100%',
    },
    summaryHeader: {
        fontSize: 18,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
        marginBottom: 2,
    },
    summaryText: {
        fontSize: 14,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
        marginLeft: 12,
        textAlign: 'left',
        marginBottom: -25,
    },
    amountText: {
        color: '#fff',
        textAlign: 'right',
        fontSize: 14,
        fontFamily: 'IBMPlexSansThai-Regular',
        bottom: 22.5,
        top: 2.5,
    },
    aiInsightBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        padding: 15,
        borderRadius: 10,
        marginTop: 15,
        marginBottom: 15,
    },
    summaryAiInsightLoading: {
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
        textAlign: 'center',
    },
    summaryAiInsight: {
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
    },
    detailsContainer: {
        width: '100%',
        marginTop: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 15,
        borderRadius: 10,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    detailRowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.6)',
        paddingBottom: 5,
        marginBottom: 10,
        fontFamily: 'IBMPlexSansThai-Regular',
    },
    detailText: {
        fontSize: 14,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
        flex: 1,
        left: '5%',
    },
    detailProgress: {
        fontSize: 14,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
        flex: 1,
        left: '10%',
    },
    submitButton: {
        backgroundColor: '#003B73',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        width: '80%',
        marginTop: 20,
    },
    submitButtonText: {
        fontSize: 16,
        color: '#fff',
        fontFamily: 'IBMPlexSansThai-Regular',
    },
    scrollContainer: {
        padding: 35,
        alignItems: 'center',
    },
    toggleText1: {
        fontSize: 14,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
        textDecorationLine: 'underline',
    }
});

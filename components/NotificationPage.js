import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BackHandler } from 'react-native';
import BASE_URL from '../config/config';

const Notification = ({ route, navigation }) => {
    const { userId, planId } = route.params;
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    // กดปุ่ม ย้อนกลับ ให้กลับไปหน้า Home
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

    const fetchNotifications = async () => {
        try {
            const url = planId
                ? `${BASE_URL}/notifications/${userId}/${planId}`
                : `${BASE_URL}/notifications/${userId}`;

            const response = await fetch(url);
            const data = await response.json();
            setNotifications(data);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsSeen = async (id) => {
        try {
            await fetch(`${BASE_URL}/notifications/${id}/seen`, {
                method: 'PUT',
            });
            fetchNotifications();
        } catch (err) {
            console.warn("Mark as seen error:", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.card, !item.seen && styles.unread]}
            onPress={() => markAsSeen(item._id)}
        >
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
        </TouchableOpacity>
    );

    return (
        <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
            <Text style={styles.title}>🔔 การแจ้งเตือนจาก AI</Text>
            <View style={styles.container}>
                {loading ? (
                    <ActivityIndicator size="large" color="#2e86de" />
                ) : notifications.length === 0 ? (
                    <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>
                        ไม่มีการแจ้งเตือนสำหรับแผนนี้
                    </Text>
                ) : (
                    <FlatList
                        data={notifications}
                        keyExtractor={(item) => item._id}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </View>
        </LinearGradient>
    );
};

export default Notification;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 10,
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontFamily: 'IBMPlexSansThai-Regular',
        marginBottom: 20,
        color: '#fff',
        marginTop: 80,
    },
    card: {
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    unread: {
        backgroundColor: '#ffe9e9',
        borderLeftWidth: 4,
        borderLeftColor: '#ff4d4d',

    },
    message: {
        fontSize: 16,
        marginBottom: 6,
        color: '#333',
        fontFamily: 'IBMPlexSansThai-Regular',
    },
    timestamp: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
});

import React, { useRef, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, SafeAreaView, Image, StyleSheet, View, Alert, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AntDesign from '@expo/vector-icons/AntDesign';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { processReceipt } from '../api/ocrapi';
import * as ImageManipulator from 'expo-image-manipulator';
import { useNavigation } from '@react-navigation/native';

const CheckPhoto = ({ photo, handleRetakePhoto, category, date, type, userId, planId }) => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);

    const resizeImage = async (uri) => {
        try {
            const manipResult = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 3000, height: 2000 } }], 
                { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
            );
            return manipResult.uri;
        } catch (error) {
            console.error('Error resizing image:', error);
            throw error;
        }
    };

    const handleUploadPhoto = async () => {
        try {
            setLoading(true);
            const compressedUri = await resizeImage(photo.uri);
            const result = await processReceipt(compressedUri);
            setLoading(false);
            Alert.alert(
                'อัปโหลดสำเร็จ',
                'ใบเสร็จถูกประมวลผลเรียบร้อย!',
                [{ text: "ตกลง", onPress: () => navigation.navigate('ItemList', { 
                    ocrData: result, userId, planId, category, date, type 
                }) }]
            );
        } catch (error) {
            console.error('Upload failed:', error);
            Alert.alert('อัปโหลดล้มเหลว', 'เกิดข้อผิดพลาดในการอัปโหลดใบเสร็จ');
        }
    };

    return (
        <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
            <View style={styles.box}>
                <Image
                    style={styles.previewContainer}
                    source={{ uri: 'data:image/jpg;base64,' + photo.base64 }}
                />
            </View>

            <View style={styles.buttonContainer}>
                
                <TouchableOpacity style={styles.trashButton} onPress={handleRetakePhoto}>
                    <EvilIcons name="trash" size={54} color="#fff" />
                    <Text style={styles.buttonText}>ถ่ายใหม่</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPhoto} disabled={loading}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="white" />
                            <Text style={styles.loadingText}>กำลังประมวลผล...</Text>
                        </View>
                    ) : (
                        <>
                            <AntDesign name="right" size={38} color="#fff" />
                            <Text style={styles.buttonText}>ประมวลผล</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    box: {
        borderRadius: 15,
        padding: 10,
        width: '95%',
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // เปลี่ยนพื้นหลังให้โปร่งแสง
        justifyContent: 'center',
        alignItems: "center",
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    previewContainer: {
        width: '100%',
        height: '80%',
        borderRadius: 15,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: "space-between",
        width: '100%',
        paddingHorizontal: 60,
        marginTop: 20,
    },
    trashButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF3B30', // สีแดงสำหรับปุ่มถ่ายใหม่
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    uploadButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0078FE', // สีฟ้าสำหรับปุ่มอัปโหลด
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        minWidth: 110
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 5,
    },
    loadingText: {
        fontSize: 12,
        color: 'white',
        marginLeft: 5,
        fontFamily: 'IBMPlexSansThai-Regular',
    },
    buttonText: {
        fontSize: 16,
        fontFamily: 'IBMPlexSansThai-Regular',
        color: '#fff',
        marginTop: 5,
    },
});

export default CheckPhoto;

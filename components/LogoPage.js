import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Font from 'expo-font';
import { useFocusEffect } from '@react-navigation/native';

export default function LogoPage({ navigation }) {
    const [fontsLoaded, setFontsLoaded] = useState(false);

    useEffect(() => {
        async function loadFonts() {
            await Font.loadAsync({
                'IBMPlexSansThai-Regular': require('../assets/fonts/IBMPlexSansThai-Regular.ttf'),
            });
            setFontsLoaded(true);
        }
        loadFonts();
    }, []);

    useFocusEffect(
        useCallback(() => {
            const refreshPage = () => { };
            refreshPage();

            return () => { };
        }, [])
    );

    const handlePress = () => {
        navigation.navigate('Login');
    };

    return (
        <TouchableWithoutFeedback onPress={handlePress}>
            <LinearGradient
                colors={['#2E7194', '#5B8BB5']}
                style={styles.container}
            >
                <Image
                    source={require('../assets/images/logo.png')}
                    style={styles.logo}
                />
                <Text style={styles.text}>แตะเพื่อเข้าสู่ระบบ</Text>
            </LinearGradient>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 150,
        height: 150,
    },
    text: {
        top: 150,
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
        fontFamily: 'IBMPlexSansThai-Regular',
    },
});
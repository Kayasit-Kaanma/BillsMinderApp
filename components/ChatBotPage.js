import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db, collection, getDocs, query, orderBy, startAt, endAt } from "../config/firebaseConfig";
import { API_OLLAMA } from '../config/config';
import BASE_URL from '../config/config';
import { BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function ChatBot({ route }) {
  const navigation = useNavigation();
  const { userId, planId } = route.params;
  const [chatBotData, setChatBotData] = useState([]);
  const scrollViewRef = useRef();
  const [isLoading, setIsLoading] = useState(false);

  // กดปุ่ม ย้อนกลับ ให้กลับไปหน้า PlanPage
  useEffect(() => {
    const backAction = () => {
      navigation.navigate('SelectChatMode', { userId, planId });
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation, userId, planId]);

  const questions = [
    "ช่วยวิเคราะห์ค่าใช้จ่ายของแผนนี้ในสัปดาห์นี้",
    "ช่วยวิเคราะห์ค่าใช้จ่ายของแผนนี้ในเดือนนี้",
    "ช่วยวิเคราะห์ค่าใช้จ่ายของแผนนี้ในปีนี้",
  ];

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`${BASE_URL}/chat/history/${userId}/${planId}`);
      const history = await response.json();

      if (Array.isArray(history)) {
        const sorted = history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const formattedChat = sorted.flatMap(chat => {
          const messages = [{ text: chat.question, sender: 'user' }];
          if (chat.answer && chat.answer !== "...") {
            messages.push({ text: chat.answer, sender: 'bot' });
          }
          return messages;
        });

        setChatBotData(formattedChat);
      }
    } catch (error) {
      console.error("loadChatHistory error:", error.message);
    }
  }

  useEffect(() => {
    console.log("ChatBotPage loaded, calling loadChatHistory...");
    loadChatHistory();
  }, [userId, planId]);

  async function getSpecificQuestion(question) {
    try {
      console.log(`ค้นหา Firestore สำหรับ: "${question}"`);

      const q = query(
        collection(db, "finance_knowledge"),
        orderBy("title"),
        startAt(question),
        endAt(question + "\uf8ff")
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        console.log("พบข้อมูลใน Firestore:", docData);
        return docData.content;
      } else {
        console.log("ไม่พบข้อมูลใน Firestore");
        return "ไม่พบข้อมูลใน Firestore";
      }
    } catch (error) {
      console.error("ไม่สามารถดึงข้อมูลจาก Firestore:", error);
      return "ไม่สามารถดึงข้อมูลจาก Firestore";
    }
  }

  async function fetchPlanDetails() {
    try {
      const response = await fetch(`${BASE_URL}/user/${userId}/plans/${planId}`);
      const data = await response.json();

      if (response.ok) {
        return {
          details: data.details || "ไม่มีรายละเอียด",
          category: data.category || "ไม่มีหมวดหมู่"
        };
      } else {
        console.error("Failed to fetch plan details:", data.error);
        return { details: "ไม่มีรายละเอียด", category: "ไม่มีหมวดหมู่" };
      }
    } catch (error) {
      console.error("Error fetching plan details:", error);
      return { details: "ไม่มีรายละเอียด", category: "ไม่มีหมวดหมู่" };
    }
  }


  const retrieveRelevantInfo = async (question) => {
    try {
      const response = await fetch(`${BASE_URL}/user/${userId}/plans/${planId}/summary?period=month`);
      const summary = await response.json();

      const { totalIncome, totalExpense, remainingBalance, categories } = summary;

      const categoryList = categories.map(item =>
        `• ${item.category}: ${item.amount} บาท (${item.percentage}%)`
      ).join('\n');

      const prompt = `
คุณเป็นที่ปรึกษาการเงินส่วนตัวที่มีความเป็นมิตรและชาญฉลาด

ต่อไปนี้คือข้อมูลทางการเงินของผู้ใช้:
- รายรับรวม: ${totalIncome} บาท
- รายจ่ายรวม: ${totalExpense} บาท
- เงินคงเหลือ: ${remainingBalance} บาท
- รายจ่ายแยกตามหมวดหมู่:
${categoryList}

ให้คุณวิเคราะห์เฉพาะเชิงคุณภาพ:
- ไม่ต้องระบุจำนวนเงินหรือเปอร์เซ็นต์
- วิเคราะห์ว่าแต่ละหมวดใช้จ่ายเหมาะสมหรือไม่
- หลีกเลี่ยงการบอกว่าหมวดไหน “ใช้จ่ายสูงมาก” หากเป็นสัดส่วนเล็ก
- อย่าตีความผิด เช่น หากรายจ่ายในหมวดไหนมีน้อย ไม่ควรบอกว่าสูง

**ตัวอย่างการวิเคราะห์ที่ดี:**
- หมวดนี้ยังอยู่ในเกณฑ์ที่เหมาะสม
- หมวดนี้อาจพิจารณาปรับลด
- หมวดนี้ดูสมเหตุสมผลดี

**หลังจากวิเคราะห์แล้ว ให้ถามกลับผู้ใช้ด้วยคำถามที่สุภาพ เช่น:**
- "คุณอยากให้ฉันช่วยลดรายจ่ายในหมวดนี้ไหม?"
- "คุณต้องการให้ฉันช่วยแนะนำวิธีตั้งงบประมาณไหม?"

**ต้องจบด้วยคำถามเสมอ** เพื่อให้ผู้ใช้สามารถตอบว่า “ใช่” หรือ “ไม่”
ห้ามตอบโดยไม่มีคำถามกลับ

คำถามผู้ใช้:
"${question}"
`.trim();

      return prompt;

    } catch (error) {
      console.error("retrieveRelevantInfo error:", error.message);
      return `ข้อมูลสรุปไม่พร้อมในขณะนี้ คำถาม: ${question}`;
    }
  }

  async function saveChatToDB(userId, planId, question, answer) {
    console.log("Sending chat to server:", { userId, planId, question, answer });

    try {
      const response = await fetch(`${BASE_URL}/chat/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planId, question, answer })
      });

      const result = await response.json();
      console.log("Server response:", result);

      if (!response.ok) {
        console.error("Failed to save chat:", result);
      }
    } catch (error) {
      console.error("Failed to save chat:", error);
    }
  }


  const sendMessage = async (question) => {
    if (!question.trim()) return;

    setIsLoading(true);

    setChatBotData(prev => [
      ...prev,
      { text: question, sender: 'user' },
      { text: 'กำลังโหลด...', sender: 'bot' }
    ]);

    const retrievedInfo = await retrieveRelevantInfo(question);

    try {
      // console.log("Prompt ที่ส่งเข้า AI:\n", retrievedInfo); // log ดู prompt ที่ส่งเข้า llama

      const response = await fetch(`${API_OLLAMA}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "llama3.1:8b",
          prompt: retrievedInfo,
          stream: false
        })
      });

      const data = await response.json();
      console.log("AI Response:", data);
      const message = data?.response?.trim?.() || "";

      if (message) {
        const isFollowUp =
          message.includes("คุณต้องการ") ||
          message.includes("ต้องการให้ฉัน") ||
          message.includes("อยากให้ฉันช่วย") ||
          message.includes("ควรลด");

        if (isFollowUp) {
          setChatBotData(prev => [
            ...prev.filter(msg => msg.text !== "กำลังโหลด..."),
            { text: message, sender: 'bot' },
            { type: 'options', options: ["ใช่", "ไม่"] }
          ]);
        } else {
          setChatBotData(prev => [
            ...prev.filter(msg => msg.text !== "กำลังโหลด..."),
            { text: message, sender: 'bot' }
          ]);
        }

        await saveChatToDB(userId, planId, question, message); // บันทึกแชท

      } else {
        const fallback = "ขออภัย ไม่สามารถตอบคำถามได้ในขณะนี้";

        setChatBotData(prev => [
          ...prev.filter(msg => msg.text !== "กำลังโหลด..."),
          { text: fallback, sender: 'bot' }
        ]);
        await saveChatToDB(userId, planId, question, fallback); // บันทึก fallback
      }

    } catch (err) {
      console.error('Chat error', err);
      setChatBotData(prev => [
        ...prev.filter(msg => msg.text !== "กำลังโหลด..."),
        { text: "เกิดข้อผิดพลาดในการเชื่อมต่อ AI", sender: 'bot' }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [chatBotData]);

  return (
    <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>เลือกคำถามเพื่อถามการเรื่องการเงินทั่วไป</Text>
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContentContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {chatBotData.map((chat, index) => {
          if (chat.type === 'options') {
            return (
              <View key={index} style={{ flexDirection: 'row', marginBottom: 10, flexWrap: 'wrap' }}>
                {chat.options.map((option, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.questionButton, { backgroundColor: '#F57C00', marginRight: 8 }]}
                    onPress={() => {
                      if (option === "ไม่") {
                        setChatBotData(prev => [
                          ...prev,
                          { text: "ไม่", sender: 'user' },
                          { text: "เข้าใจแล้วครับ หากต้องการความช่วยเหลือเพิ่มเติมสามารถเลือกคำถามด้านล่างได้เลยนะครับ", sender: 'bot' }
                        ]);
                      } else {
                        sendMessage(option);
                      }
                    }}
                  >
                    <Text style={styles.questionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          }

          return (
            <View key={index} style={[styles.chatBubble, chat.sender === 'user' ? styles.userBubble : styles.botBubble]}>
              <Text style={styles.chatText}>{chat.text}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.questionContainer}>
        <ScrollView
          horizontal={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.questionScrollView}
        >
          {questions.map((question, index) => (
            <TouchableOpacity key={index} style={styles.questionButton} onPress={() => sendMessage(question)}>
              <Text style={styles.questionText}>{question}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerText: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'IBMPlexSansThai-Regular',
    marginBottom: 10,
    marginTop: 55,
  },
  chatContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  chatContentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  chatBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0078FE',
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#4CAF50',
  },
  chatText: {
    fontSize: 16,
    fontFamily: 'IBMPlexSansThai-Regular',
    color: '#fff',
  },
  questionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 20,
    marginHorizontal: 15,
  },
  questionScrollView: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  questionButton: {
    backgroundColor: '#003B73',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 6,
    marginVertical: 5,
    minWidth: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  questionText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'IBMPlexSansThai-Regular',
    textAlign: 'center',
  },
});
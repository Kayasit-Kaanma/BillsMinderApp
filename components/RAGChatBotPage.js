import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs, query, where } from '../config/firebaseConfig';
import { db } from '../config/firebaseConfig';
import { API_OLLAMA } from '../config/config';
import BASE_URL from '../config/config';
import { BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function RAGChatBot({ route }) {
  const navigation = useNavigation();
  const { userId, planId } = route.params;
  const scrollViewRef = useRef();
  const [chatData, setChatData] = useState([]);
  const [planContent, setPlanContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedQuestions, setRecommendedQuestions] = useState([]);
  const [planIdName, setPlanIdName] = useState('');
  const [retrievedInfo, setRetrievedInfo] = useState('');

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

  useEffect(() => {
    if (planId) {
      fetchPlanNameFromBackend(planId);
    }
  }, [planId]);

  const fetchPlanNameFromBackend = async (planId) => {
    try {
      const response = await fetch(`${BASE_URL}/plan-name/${planId}`);
      const data = await response.json();
      const name = data.planName;

      if (!name) {
        // console.warn('ไม่ได้รับชื่อแผนที่ถูกต้องจาก backend'); // log ข้อผิดพลาด
        return;
      }
      // console.log('ชื่อแผนที่ได้จาก backend:', name); // log ข้อผิดพลาด
      setPlanIdName(name);
      fetchRAGData(name);
    } catch (error) {
      // console.log('โหลดชื่อแผนจาก backend ผิดพลาด:', error); // log ข้อผิดพลาด
    }
  };


  const fetchRAGData = async (planName) => {
    try {
      const q = query(collection(db, 'finance_knowledge'), where('title', '==', planName));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        setRetrievedInfo(data.content);
        if (Array.isArray(data.recommendedQuestions)) {
          setRecommendedQuestions(data.recommendedQuestions);
        }
      });
    } catch (error) {
      // console.log('โหลดข้อมูลแผนผิดพลาด:', error); // log ข้อผิดพลาด
    }
  };

  function isIncomeSufficient(totalIncome, itemPrice, installmentPeriod) {
    if (!itemPrice || !installmentPeriod || installmentPeriod === 0) return true;
    const monthlyInstallment = itemPrice / installmentPeriod;
    return totalIncome >= monthlyInstallment;
  }

  function getSimilarityScore(text, query) {
    return text.includes(query) ? 1 : 0; // ปรับให้แม่นขึ้นตามต้องการ หรือใช้ string-similarity
  }

  function findMostRelevantChunk(chunks, question, recommendedQuestions = []) {
    const lowerQ = question.toLowerCase();

    // หา question ที่มี ragTopicId
    const matched = recommendedQuestions.find(
      (q) => q.question.toLowerCase() === lowerQ && q.ragTopicId
    );

    if (matched) {
      const topicIndex = matched.ragTopicId - 1;
      if (chunks[topicIndex]) {
        return chunks[topicIndex];
      }
    }

    return "RAG ไม่มีเนื้อหาที่เกี่ยวข้องกับคำถาม ให้ตอบว่า ไม่พบข้อมูลใน RAG ที่เกี่ยวข้องกับคำถามนี้";
  }
  const retrieveRelevantInfo = async (question, recommendedQuestions = []) => {

    const lowerQ = question?.toLowerCase?.() || '';

    const chunks = retrievedInfo.split(/หัวข้อที่ \d+ - /).filter(Boolean);

    const selectedChunk = findMostRelevantChunk(chunks, question, recommendedQuestions);

    // console.log("🟨 DEBUG: retrievedInfo =", retrievedInfo?.slice(0, 200), "...");
    // console.log("🟨 DEBUG: chunks =", chunks.length);
    // console.log("🟨 DEBUG: selectedChunk =", selectedChunk?.slice(0, 200), "...");

    try {
      const response = await fetch(`${BASE_URL}/user/${userId}/plans/${planId}/summary?period=month`);
      const summary = await response.json();
      const planRes = await fetch(`${BASE_URL}/user/${userId}/plans/${planId}`);
      const planData = await planRes.json();
      const isValidIncome = isIncomeSufficient(totalIncome, itemPrice, installmentPeriod);

      const { totalIncome, totalExpense, remainingBalance, categories } = summary;
      const { itemPrice, installmentPeriod, salary } = planData;

      const categoryList = categories.map(item =>
        `• ${item.category}: ${item.amount} บาท (${item.percentage}%)`
      ).join('\n');

      let warningMessage = '';
      // console.log("✅ DEBUG: planIdName =", planIdName);
      // console.log("✅ DEBUG: totalIncome =", totalIncome);
      // console.log("✅ DEBUG: Valid Income =", isIncomeValidForPlan(planIdName, totalIncome));
      if (!isValidIncome) {
        warningMessage = `⚠️ รายรับของคุณ (${totalIncome} บาท) อาจไม่เพียงพอสำหรับการผ่อนเดือนละ ${(itemPrice / installmentPeriod).toFixed(0)} บาท ในแผน "${planIdName}"`;
      }

      const prompt = `
  คุณคือผู้ช่วยด้านการวางแผนการเงิน โดยมีหน้าที่วิเคราะห์ข้อมูลทางการเงินของผู้ใช้ร่วมกับเนื้อหาจาก RAG ด้านล่างนี้เพื่อให้คำแนะนำที่เหมาะสม

  ข้อกำหนด:
  - วิเคราะห์ข้อมูลแผนของผู้ใช้ ได้แก่ รายได้ ราคาสินทรัพย์ และระยะเวลาผ่อนร่วมกับเนื้อหา RAG
  - ต้องอ้างอิงข้อความจาก RAG อย่างน้อย 1 ประโยค โดยใส่ใน "เครื่องหมายคำพูด"
  - ห้ามแต่งข้อมูลเองเกินจากเนื้อหา RAG
  - หาก RAG ไม่มีเนื้อหาที่เกี่ยวข้องกับคำถาม ให้ตอบว่า "ไม่พบข้อมูลใน RAG ที่เกี่ยวข้องกับคำถามนี้"
  
  ข้อมูล RAG : 
  "${selectedChunk}"
  
  ข้อมูลการเงินของผู้ใช้:
  - รายได้ตามโปรไฟล์แผน: ${salary?.toLocaleString() || 'ไม่ระบุ'} บาท
  - ราคาสินทรัพย์ที่ผ่อน: ${itemPrice?.toLocaleString() || 'ไม่ระบุ'} บาท
  - ระยะเวลาผ่อน: ${installmentPeriod ? `${Math.floor(installmentPeriod / 12)} ปี` : 'ไม่ระบุ'}
 
  ${warningMessage ? `\n${warningMessage}\n` : ''}
  
  โปรดวิเคราะห์ข้อมูลทั้งหมดอย่างระมัดระวังและให้คำแนะนำเชิงลึก
  "${question}"
  `.trim();

      return { prompt, warningMessage };
    } catch (error) {
      console.error("retrieveRelevantInfo error:", error.message);
      return { prompt: '', warningMessage: '' };
    }
  };

  const sendMessage = async (questionText) => {
    if (!questionText.trim()) return;

    const newMessage = { text: questionText, sender: 'user' };
    setChatData((prev) => [...prev, newMessage, { text: 'กำลังโหลด...', sender: 'bot' }]);
    setIsLoading(true);

    try {
      const { prompt, warningMessage } = await retrieveRelevantInfo(questionText, recommendedQuestions);

      console.log("PROMPT ที่ส่งไปยัง Llama3.2:\n", prompt);


      if (warningMessage) {
        setChatData((prev) => [
          ...prev.filter(msg => msg.text !== 'กำลังโหลด...'),
          { text: warningMessage, sender: 'bot' },
        ]);
        await saveChatToDB(userId, planId, questionText, warningMessage);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_OLLAMA}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama3.1:8b', prompt, stream: false }),
      });

      const data = await response.json();
      const botMessage = { text: data.response, sender: 'bot' };

      // ลบ 'กำลังโหลด...' แล้วเพิ่มข้อความจริง
      setChatData((prev) => [
        ...prev.filter(msg => msg.text !== 'กำลังโหลด...'),
        botMessage,
      ]);

      await saveChatToDB(userId, planId, questionText, data.response);

    } catch (error) {
      console.error("Analyze Plan Error:", error);
      setChatData((prev) => [
        ...prev.filter(msg => msg.text !== 'กำลังโหลด...'),
        { text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ AI', sender: 'bot' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  async function saveChatToDB(userId, planId, question, answer) {
    if (!userId || !planId || !question || !answer) {
      console.warn("⚠️ Skipping saveChatToDB due to missing fields", { userId, planId, question, answer });
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/rag-chat/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planId, question, answer }),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error("Failed to save RAG chat:", result);
      }
    } catch (error) {
      console.error("Failed to save RAG chat:", error);
    }
  }

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`${BASE_URL}/rag-chat/history/${userId}/${planId}`);
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

        setChatData(formattedChat);
      }
    } catch (error) {
      console.error("loadChatHistory error:", error.message);
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, [userId, planId]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [chatData]);

  return (
    <LinearGradient colors={['#2E7194', '#5B8BB5']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>เลือกคำถามเพื่อวิเคราะห์แผนการออมเพื่อความมั่นคง</Text>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.chatContainer} contentContainerStyle={styles.chatContentContainer}>
        {chatData.map((chat, index) => (
          <View key={index} style={[styles.chatBubble, chat.sender === 'user' ? styles.userBubble : styles.botBubble]}>
            <Text style={styles.chatText}>{chat.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.questionContainer}>
        <ScrollView contentContainerStyle={styles.questionScrollView}>
          {recommendedQuestions.map((q, i) => (
            <TouchableOpacity key={i} style={styles.questionButton} onPress={() => sendMessage(q.question)}>
              <Text style={styles.questionText}>{q.question}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', marginTop: 20 },
  headerText: {
    fontSize: 18, color: '#fff', marginBottom: 10, marginTop: 55,
    fontFamily: 'IBMPlexSansThai-Regular'
  },
  chatContainer: { flexGrow: 1, paddingHorizontal: 20 },
  chatContentContainer: { flexGrow: 1, justifyContent: 'flex-end' },
  chatBubble: {
    maxWidth: '80%', padding: 12, borderRadius: 20,
    marginBottom: 10, marginHorizontal: 5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3
  },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#0078FE' },
  botBubble: { alignSelf: 'flex-start', backgroundColor: '#4CAF50' },
  chatText: { fontSize: 16, color: '#fff', fontFamily: 'IBMPlexSansThai-Regular' },
  questionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 15,
    height: 180, alignItems: 'center', justifyContent: 'center',
    marginTop: 15, marginBottom: 20, marginHorizontal: 15
  },
  questionScrollView: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingVertical: 10
  },
  questionButton: {
    backgroundColor: '#003B73', padding: 10, borderRadius: 12,
    margin: 6, minWidth: '40%', alignItems: 'center'
  },
  questionText: {
    fontSize: 14, color: '#fff', textAlign: 'center',
    fontFamily: 'IBMPlexSansThai-Regular'
  },
});

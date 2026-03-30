const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const Notification = require('../models/Notification');
const { type } = require('os');

const API_OLLAMA = process.env.API_OLLAMA || 'http://localhost:11434';
const BASE_URL = process.env.BASE_URL || 'http://localhost:8081';
const MODEL_NAME = 'llama3.1:8b'; 

const router = express.Router();

const normalizeSummary = (summary) => {
  const normalized = {
    totalIncome: Math.round(summary.totalIncome),
    totalExpense: Math.round(summary.totalExpense),
    remainingBalance: Math.round(summary.remainingBalance),
    categories: summary.categories
      .map(c => ({
        category: c.category,
        amount: Math.round(c.amount),
        percentage: parseFloat(c.percentage).toFixed(1),
        type: c.type || 'expense',
      }))
      .sort((a, b) => a.category.localeCompare(b.category)),
  };
  return normalized;
};

const hashSummary = (summary) => {
  return crypto.createHash('md5').update(JSON.stringify(summary)).digest('hex');
};

router.post('/notify-smart', async (req, res) => {
  const { userId, planId } = req.body;

  if (!userId || !planId) {
    return res.status(400).json({ error: "userId and planId are required." });
  }

  try {
    const summaryRes = await axios.get(`${BASE_URL}/user/${userId}/plans/${planId}/summary?period=month`);
    const summary = summaryRes.data;
    const normalizedSummary = normalizeSummary(summary);
    const summaryHash = hashSummary(normalizedSummary);
    const planRes = await axios.get(`${BASE_URL}/user/${userId}/plans/${planId}`);
    const plan = planRes.data;
    const alertThreshold = plan.alertThreshold || 0;
    //console.log("🚨 Alert Threshold:", alertThreshold); // log ดูค่า Alert Threshold
    

    const latest = await Notification.findOne({ userId, planId }).sort({ timestamp: -1 });
    if (latest && latest.summaryHash === summaryHash) {
      return res.status(200).json({ message: "ข้อมูลเหมือนเดิม ไม่ต้องแจ้งเตือนซ้ำ" });
    }
    if (alertThreshold === 0) {
      console.log("แผนนี้ตั้งค่าไม่ให้แจ้งเตือน (threshold <= 0)");
      return res.status(200).json({ message: "แผนนี้ตั้งค่าไม่ให้แจ้งเตือน" });
    }

    const { totalIncome, totalExpense, remainingBalance, categories } = summary;

    // กรองเฉพาะหมวดรายจ่าย 
    const isExpense = (type) => type === 'expense' || type === 'รายจ่าย';
    console.log("🧾 categories ทั้งหมดแบบเต็ม:", JSON.stringify(summary.categories, null, 2)); // log ดู categories ทั้งหมดแบบเต็ม
    const expenseCategories = categories.filter(cat => isExpense(cat.type));

    // หาเฉพาะหมวดรายจ่ายที่เกิน alertThreshold
    const criticalCategory = expenseCategories.find(
      cat => parseFloat(cat.percentage) >= alertThreshold
    );

    if (!criticalCategory) {
      return res.status(200).json({ message: "ไม่มีหมวดรายจ่ายไหนเกินเปอร์เซ็นต์ที่ตั้ง ไม่ต้องแจ้งเตือน" });
    }

    const categoryList = expenseCategories.map(cat =>
      `- ${cat.category}: ${cat.amount} บาท (${cat.percentage}%)`
    ).join('\n');

    const prompt = `
คุณเป็นผู้ช่วยวางแผนการเงินที่ชาญฉลาด

ข้อมูลทางการเงินของผู้ใช้รายนี้:
- รายรับ: ${totalIncome} บาท
- รายจ่ายรวม: ${totalExpense} บาท
- เงินคงเหลือ: ${remainingBalance} บาท
- รายจ่ายแยกตามหมวดหมู่:
${categoryList}

**ข้อสังเกต:** พบว่าหมวด "${criticalCategory.category}" ใช้ไปถึง ${criticalCategory.percentage}% ของรายรับรวม
กรุณาสรุปปัญหาและข้อเสนอแนะใน 1-2 ประโยค ไม่เกิน 3 บรรทัด
ข้อความต้องสั้น กระชับ ตรงประเด็น และเข้าใจง่าย
**ห้ามตอบทั่วไป ต้องอิงจากข้อมูลจริง**
`.trim();

    const aiRes = await axios.post(`${API_OLLAMA}/api/generate`, {
      model: MODEL_NAME,
      prompt,
      stream: false
    });

    let message = "ไม่สามารถวิเคราะห์ข้อมูลได้ในขณะนี้";
    if (aiRes.data && typeof aiRes.data.response === 'string') {
      message = aiRes.data.response.trim();
    }

    await Notification.create({ userId, planId, message, summaryHash });

    return res.status(200).json({ message });

  } catch (error) {
    console.error("AI Notify Error:", error.message);
    return res.status(500).json({ error: "ไม่สามารถสร้างข้อความแจ้งเตือนได้" });
  }
});

module.exports = router;

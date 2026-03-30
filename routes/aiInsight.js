const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

// ตั้งค่า Ollama
const OLLAMA_API_URL = `${process.env.API_OLLAMA || 'http://localhost:11434'}/api/generate`;
const BASE_URL = process.env.BASE_URL || 'http://localhost:8081';
const MODEL_NAME = 'llama3.1:8b';

// ดึงข้อมูล summary (แทนที่ด้วยฐานข้อมูลจริงในอนาคต)
async function getSummaryData(userId, planId, period) {
    try {
        const url = `${BASE_URL}/user/${userId}/plans/${planId}/summary?period=${period}`;
        const response = await axios.get(url);

        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error("ไม่สามารถดึง summary จาก API");
        }
    } catch (error) {
        console.error("getSummaryData API error:", error.message);
        throw error;
    }
}

// Endpoint: GET /ai/insight/:userId/:planId
router.get('/insight/:userId/:planId', async (req, res) => {
    const { userId, planId } = req.params;

    // ตรวจสอบ period
    const rawPeriod = req.query.period;
    const period = typeof rawPeriod === 'string' && ['week', 'month', 'year'].includes(rawPeriod.toLowerCase())
        ? rawPeriod.toLowerCase()
        : 'month';

    console.log(`AI Insight for user=${userId}, plan=${planId}, period=${period}`);

    try {
        const summary = await getSummaryData(userId, planId, period);

        const prompt = `
ข้อมูลการเงินของผู้ใช้ช่วง ${period}:
- รายรับทั้งหมด: ${summary.totalIncome} บาท
- รายจ่ายทั้งหมด: ${summary.totalExpense} บาท
- ยอดเงินคงเหลือ: ${summary.remainingBalance} บาท
- เป้าหมาย คือ : ${summary.goal}
- จำนวนเงินที่ตั้งเป้า : ${summary.targetAmount} บาท
- ความคืบหน้า ณ ตอนนี้ : ${summary.progress}%
- รายจ่ายรายหมวดหมู่ (แสดง % ด้วย):
${summary.categories.map(item => `• ${item.category}: ${item.amount} บาท (${item.percentage}%)`).join('\n')}
กรุณาวิเคราะห์ข้อมูลข้างต้นให้เข้าใจง่าย พร้อมคำแนะนำการใช้จ่ายถ้ามี เช่น หมวดใดควรลดลง หรือแนวโน้มที่น่าสนใจ
        `.trim();

        const response = await axios.post(OLLAMA_API_URL, {
            model: MODEL_NAME,
            prompt,
            stream: false
        });

        if (response.data && response.data.response) {
            return res.json({ message: response.data.response.trim() });
        } else {
            return res.status(500).json({ error: 'Ollama ไม่ได้ส่งคำตอบกลับ' });
        }

    } catch (error) {
        console.error("AI Insight error:", error.message);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล' });
    }
});

// Route: POST /ai/insight-direct
router.post('/insight-direct', async (req, res) => {
    const { summary, period = 'month' } = req.body;

    if (!summary || typeof summary !== 'object') {
        return res.status(400).json({ error: 'Missing or invalid summary data' });
    }

    try {
        const prompt = `
ข้อมูลการเงินของผู้ใช้ช่วง ${period}:
- รายรับทั้งหมด: ${summary.totalIncome} บาท
- รายจ่ายทั้งหมด: ${summary.totalExpense} บาท
- ยอดเงินคงเหลือ: ${summary.remainingBalance} บาท
- เป้าหมาย คือ : ${summary.goal}
- จำนวนเงินที่ตั้งเป้า : ${summary.targetAmount} บาท
- ความคืบหน้า ณ ตอนนี้ : ${summary.progress}%
- รายจ่ายรายหมวดหมู่:
${summary.categories.map(item => `• ${item.category}: ${item.amount} บาท (${item.percentage}%)`).join('\n')}

กรุณาวิเคราะห์ข้อมูลข้างต้นให้เข้าใจง่าย พร้อมคำแนะนำการใช้จ่ายถ้ามี เช่น หมวดใดควรลดลง หรือแนวโน้มที่น่าสนใจ
        `.trim();

        const response = await axios.post(OLLAMA_API_URL, {
            model: MODEL_NAME,
            prompt,
            stream: false
        });

        if (response.data && response.data.response) {
            return res.json({ message: response.data.response.trim() });
        } else {
            return res.status(500).json({ error: 'Ollama ไม่ได้ส่งคำตอบกลับ' });
        }

    } catch (error) {
        console.error("AI Insight Error (/insight-direct):", error.message);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล' });
    }
});

module.exports = router;
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { types } = require('@babel/core');
const app = express();
const aiInsightRoute = require('../routes/aiInsight');
const aiNotifyRoute = require('../routes/aiNotify');
const notificationSchema = require('../models/Notification');

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// เชื่อมต่อฐานข้อมูล MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bmapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
});



// สร้าง Schema และ Model
const userSchema = new mongoose.Schema({
    userId: { type: String, default: uuidv4 },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    registeredAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

const planSchema = new mongoose.Schema({
    planId: { type: String, default: uuidv4 },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    details: { type: String, default: '' },
    goal: { type: String, default: '' },
    targetAmount: { type: Number, default: 0 },
    startDate: { type: Date },
    targetDate: { type: Date },
    createdAt: { type: Date, default: Date.now },
    remainingBalance: { type: Number, default: 0 },
    alertThreshold: { type: Number, default: 0 },
    salary: { type: Number, default: null },
    itemPrice: { type: Number, default: null },
    installmentPeriod: { type: Number, default: null },
});

const Plan = mongoose.model('Plan', planSchema);

const entrySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    planId: { type: String, required: true },
    category: { type: String, required: true },
    itemName: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ['รายรับ', 'รายจ่าย'], required: true },
});

const Entry = mongoose.model('Entry', entrySchema);

const chatSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    planId: { type: String, required: true, index: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);

const ragChatSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    planId: { type: String, required: true, index: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

const RAGChat = mongoose.model('RAGChat', ragChatSchema);

// เพิ่มรายการและอัปเดตยอดเงินในแผน
app.post('/user/:userId/entries', async (req, res) => {
    const { userId } = req.params;
    const { planId, category, itemName, amount, date, type } = req.body;

    try {
        const plan = await Plan.findOne({ userId, planId });
        if (!plan) {
            return res.status(404).send({ error: 'Plan not found' });
        }

        const newEntry = new Entry({ userId, planId, category, itemName, amount, date, type });
        await newEntry.save();

        // คำนวณยอดเงินใหม่
        const currentBalance = plan.remainingBalance || 0;
        const updatedBalance = type === 'รายรับ' ? currentBalance + amount : currentBalance - amount;

        // อัปเดตยอดเงินในแผน
        plan.remainingBalance = updatedBalance;
        await plan.save();

        res.status(201).send({ message: 'Entry saved successfully', entry: newEntry });
    } catch (error) {
        res.status(500).send({ error: 'Failed to save entry' });
    }
});

// ดึงสรุปยอดของแผน พร้อมหมวดหมู่
app.get('/user/:userId/plans/:planId/summary', async (req, res) => {
    const { userId, planId } = req.params;

    try {
        const plan = await Plan.findOne({ userId, planId });
        if (!plan) {
            return res.status(404).send({ error: 'Plan not found' });
        }

        // คำนวณรายจ่ายทั้งหมด
        const totalExpenseData = await Entry.aggregate([
            { $match: { userId, planId, type: 'รายจ่าย' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalExpense = totalExpenseData.length > 0 ? totalExpenseData[0].total : 0;

        // คำนวณรายรับทั้งหมด
        const totalIncomeData = await Entry.aggregate([
            { $match: { userId, planId, type: 'รายรับ' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalIncome = totalIncomeData.length > 0 ? totalIncomeData[0].total : 0;

        // คำนวณค่าใช้จ่ายตามหมวดหมู่
        const categoryExpenses = await Entry.aggregate([
            { $match: { userId, planId, type: 'รายจ่าย' } },
            { $group: { _id: "$category", amount: { $sum: "$amount" } } }
        ]);

        const totalExpenseForPercentage = totalExpense || 1; // ป้องกันหารศูนย์

        const categories = categoryExpenses.map(item => ({
            category: item._id,
            amount: item.amount,
            percentage: ((item.amount / totalExpenseForPercentage) * 100).toFixed(2),
            type: 'รายจ่าย',
        }));

        res.status(200).send({
            totalIncome,
            totalExpense,
            remainingBalance: totalIncome - totalExpense,
            categories
        });

    } catch (error) {
        console.error("Error fetching summary:", error);
        res.status(500).send({ error: 'Failed to fetch summary' });
    }
});


// เส้นทางสำหรับการลงทะเบียนผู้ใช้
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.status(201).send({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// เส้นทางสำหรับเข้าสู่ระบบ
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        if (user.password !== password) {
            return res.status(400).send({ error: 'Invalid password' });
        }
        res.status(200).send({ message: 'Login successful', userId: user.userId, email: user.email });
    } catch (error) {
        res.status(500).send({ error: 'An error occurred while logging in' });
    }
});

// ดึงข้อมูลแผนเดี่ยว
app.get('/user/:userId/plans/:planId', async (req, res) => {
    const { userId, planId, } = req.params;
    try {
        const plan = await Plan.findOne({ userId, planId });
        if (!plan) {
            return res.status(404).send({ error: 'Plan not found' });
        }
        res.status(200).send(plan);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch plan' });
    }
});

// ดึงข้อมูลแผนด้วย ID ไป RAG
app.get('/plan-name/:planId', async (req, res) => {
    const { planId } = req.params;
    try {
        const plan = await Plan.findOne({ planId });
        if (!plan) return res.status(404).json({ error: 'Plan not found' });
        return res.json({ planName: plan.name });
    } catch (err) {
        console.error('Error fetching plan name:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// ดึงข้อมูลแผนทั้งหมดของผู้ใช้
app.get('/user/:userId/plans', async (req, res) => {
    const { userId } = req.params;

    try {
        const plans = await Plan.find({ userId });
        res.status(200).send(plans.map(plan => ({
            planId: plan.planId,
            name: plan.name,
            details: plan.details,
            createdAt: plan.createdAt,
            remainingBalance: plan.remainingBalance,
            goal: plan.goal,
            targetAmount: plan.targetAmount,
            startDate: plan.startDate,
            targetDate: plan.targetDate,
        })));
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch plans' });
    }
});

// สร้างแผนใหม่
app.post('/user/:userId/plans', async (req, res) => {
    const { userId } = req.params;
    const { name, details, category, goal, targetAmount, targetDate, alertThreshold, startDate, salary, itemPrice, installmentPeriod } = req.body;

    try {
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        const newPlan = new Plan({
            userId,
            name,
            details,
            category,
            goal,
            targetAmount,
            targetDate,
            alertThreshold,
            startDate,
            salary,
            itemPrice,
            installmentPeriod,
        });
        await newPlan.save();

        res.status(201).send({
            message: 'Plan created successfully',
            plan: {
                planId: newPlan.planId,
                name: newPlan.name,
                details: newPlan.details,
                createdAt: newPlan.createdAt,
                remainingBalance: newPlan.remainingBalance,
            },
        });
    } catch (error) {
        res.status(400).send({ error: 'Failed to create plan' });
    }
});

// ดึงข้อมูลธุรกรรม
app.get('/user/:userId/plans/:planId/transactions', async (req, res) => {
    const { userId, planId } = req.params;

    try {
        const transactions = await Entry.find({ userId, planId }).sort({ date: -1 });

        if (!transactions || transactions.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลธุรกรรม' });
        }

        res.json(transactions);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// ลบแผน
app.delete('/user/:userId/plans/:planId', async (req, res) => {
    const { userId, planId } = req.params;

    try {
        const plan = await Plan.findOneAndDelete({ userId, planId });
        if (!plan) {
            return res.status(404).send({ error: 'Plan not found' });
        }
        res.status(200).send({ message: 'Plan deleted successfully' });
    } catch (error) {
        res.status(500).send({ error: 'Failed to delete plan' });
    }
});

// อัปเดตชื่อผู้ใช้
app.put('/user/:userId/update', async (req, res) => {
    const { userId } = req.params;
    const { username } = req.body;

    try {
        const user = await User.findOneAndUpdate({ userId }, { username }, { new: true });
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        res.status(200).send({ message: 'Username updated successfully', user });
    } catch (error) {
        res.status(500).send({ error: 'Failed to update username' });
    }
});

// อัปเดตรหัสผ่าน
app.put('/user/:userId/password', async (req, res) => {
    const { userId } = req.params;
    const { password } = req.body;

    try {
        const user = await User.findOneAndUpdate({ userId }, { password }, { new: true });
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        res.status(200).send({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).send({ error: 'Failed to update password' });
    }
});

app.get('/user/get-username/:userId', async (req, res) => {
    try {
        // ดึง userId จากพารามิเตอร์ใน URL
        const { userId } = req.params;

        // ค้นหาผู้ใช้จาก userId
        const user = await User.findOne({ userId: userId });

        if (!user) {
            // ถ้าผู้ใช้ไม่พบ
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // ส่งข้อมูล username กลับไป
        res.status(200).json({
            message: 'User found',
            username: user.username
        });
    } catch (err) {
        // จัดการข้อผิดพลาด
        res.status(500).json({
            message: 'Error retrieving user',
            error: err.message
        });
    }
});

// บันทึกประวัติการแชท
app.post('/chat/save', async (req, res) => {
    const { userId, planId, question, answer } = req.body;
    console.log("Request received at /chat/save:", { userId, planId, question, answer });

    if (!userId || !planId || !question || !answer) {
        return res.status(400).send({ error: "Missing required fields" });
    }

    try {
        const newChat = new Chat({ userId, planId, question, answer });
        await newChat.save();
        console.log("Chat saved to MongoDB:", newChat);
        res.status(201).send({ message: 'Chat saved successfully' });
    } catch (error) {
        console.error("Failed to save chat:", error);
        res.status(500).send({ error: 'Failed to save chat' });
    }
});

// ดึงประวัติการแชท
app.get('/chat/history/:userId/:planId', async (req, res) => {
    const { userId, planId } = req.params;
    console.log("Fetching chat history for:", { userId, planId });

    try {
        const chatHistory = await Chat.find({ userId, planId }).sort({ timestamp: -1 });

        if (!chatHistory.length) {
            console.log("No chat history found.");
            return res.status(200).send([]);
        }

        res.status(200).send(chatHistory);
    } catch (error) {
        console.error("Failed to fetch chat history:", error);
        res.status(500).send({ error: 'Failed to fetch chat history' });
    }
});

// บันทึกแชท RAG
app.post('/rag-chat/save', async (req, res) => {
    const { userId, planId, question, answer } = req.body;

    if (!userId || !planId || !question || !answer) {
        return res.status(400).send({ error: "Missing required fields" });
    }

    try {
        const newChat = new RAGChat({ userId, planId, question, answer });
        await newChat.save();
        res.status(201).send({ message: 'RAG Chat saved successfully' });
    } catch (error) {
        console.error("Failed to save RAG chat:", error);
        res.status(500).send({ error: 'Failed to save RAG chat' });
    }
});

// โหลดประวัติแชท RAG
app.get('/rag-chat/history/:userId/:planId', async (req, res) => {
    const { userId, planId } = req.params;

    try {
        const chatHistory = await RAGChat.find({ userId, planId }).sort({ timestamp: 1 });

        res.status(200).send(chatHistory);
    } catch (error) {
        console.error("Failed to fetch RAG chat history:", error);
        res.status(500).send({ error: 'Failed to fetch RAG chat history' });
    }
});

// เชื่อม route insight AI สำหรับสรุปอัจฉริยะ
app.use('/ai', aiInsightRoute);

// เชื่อม route insight AI สำหรับแจ้งเตือน
app.use('/ai', aiNotifyRoute);

// ดึงแจ้งเตือนเฉพาะแผน
app.get('/notifications/:userId/:planId', async (req, res) => {
    const { userId, planId } = req.params;
    try {
        const notifications = await Notification.find({ userId, planId }).sort({ timestamp: -1 });
        res.json(notifications);
    } catch (error) {
        console.error("Get plan-specific notifications error:", error.message);
        res.status(500).json({ error: "ไม่สามารถดึงข้อมูลแจ้งเตือนได้" });
    }
});

// ดึงแจ้งเตือนทั้งหมด
app.get('/notifications/:userId', async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.params.userId }).sort({ timestamp: -1 });
        res.json(notifications);
    } catch (error) {
        console.error("Get notifications error:", error.message);
        res.status(500).json({ error: "ไม่สามารถดึงข้อมูลแจ้งเตือนได้" });
    }
});

// อัปเดตสถานะเป็นอ่านแล้ว
app.put('/notifications/:id/seen', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { seen: true });
        res.json({ success: true });
    } catch (error) {
        console.error("Update seen error:", error.message);
        res.status(500).json({ error: "ไม่สามารถอัปเดตสถานะแจ้งเตือนได้" });
    }
});

// เริ่มเซิร์ฟเวอร์
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
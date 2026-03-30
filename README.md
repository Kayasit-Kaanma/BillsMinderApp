# 📱 BillsMinderApp

แอปพลิเคชันจัดการการเงินส่วนบุคคลอัจฉริยะ พร้อม AI วิเคราะห์พฤติกรรมการใช้จ่าย

Smart personal finance management app with AI-powered spending analysis

---

## 📖 Project Overview



BillsMinderApp คือแอปมือถือสำหรับ **วางแผนและจัดการการเงินส่วนบุคคล** พัฒนาด้วย React Native (Expo) ผู้ใช้สามารถสร้างแผนการเงินหลายแผน บันทึกรายรับ-รายจ่ายทั้งกรอกด้วยมือและสแกนใบเสร็จอัตโนมัติ ดูสรุปยอดพร้อมกราฟ และรับคำแนะนำจาก **AI Chatbot (Llama 3.1)** ที่วิเคราะห์ข้อมูลการเงินจริงของตนเอง พร้อมระบบแจ้งเตือนอัจฉริยะที่ตรวจจับพฤติกรรมการใช้จ่ายเกินเกณฑ์โดยอัตโนมัติ



BillsMinderApp is a mobile application for **personal financial planning and management**, built with React Native (Expo). Users can create multiple financial plans, record income and expenses both manually and via automatic receipt scanning, view summaries with charts, and receive advice from an **AI Chatbot (Llama 3.1)** that analyzes their real financial data. It also features a smart notification system that automatically detects overspending behavior.

---

## ✨ Features

### 👤 ระบบสมาชิก / User Authentication
- สมัครสมาชิก / เข้าสู่ระบบ / แก้ไขชื่อผู้ใช้ / เปลี่ยนรหัสผ่าน
- Register / Login / Edit username / Change password

### 📋 แผนการเงิน / Financial Plans
- สร้างแผนการเงินได้หลายแผน — ตั้งชื่อ, หมวดหมู่, เป้าหมาย, จำนวนเงินเป้าหมาย, วันเริ่มต้น-สิ้นสุด, เกณฑ์แจ้งเตือน, เงินเดือน, ราคาสินค้า, จำนวนงวดผ่อน
- Create multiple financial plans — set name, category, goal, target amount, start/end dates, alert threshold, salary, item price, and installment period

### 💰 บันทึกรายรับ-รายจ่าย / Income & Expense Tracking
- **กรอกด้วยมือ** — ระบุหมวดหมู่, รายการ, จำนวนเงิน, วันที่, ประเภท (รายรับ/รายจ่าย)
- **สแกนใบเสร็จ OCR** — ถ่ายรูปใบเสร็จ → ระบบอ่านข้อมูลอัตโนมัติ (รองรับภาษาไทย)
- ยอดเงินคงเหลืออัปเดตอัตโนมัติ
- **Manual input** — specify category, item, amount, date, type (income/expense)
- **Receipt OCR scanning** — take a photo of a receipt → auto-extract data (supports Thai language)
- Remaining balance updates automatically

### 📊 สรุปและวิเคราะห์ / Summary & Analysis
- แสดงรายรับรวม / รายจ่ายรวม / เงินคงเหลือ พร้อมกราฟแยกหมวดหมู่ และประวัติธุรกรรม
- Display total income / total expenses / remaining balance with category charts and transaction history

### 🤖 AI ChatBot (2 โหมด / 2 Modes)
- **โหมดวิเคราะห์ทั่วไป** — AI วิเคราะห์ข้อมูลการเงินจริงของผู้ใช้ ให้คำแนะนำและถามกลับแบบ interactive
- **โหมด RAG** — ดึงความรู้ทางการเงินจาก Knowledge Base (Firestore) มาประกอบการวิเคราะห์ พร้อมตรวจสอบความเพียงพอของรายได้
- **General Analysis Mode** — AI analyzes real user financial data, provides advice and asks interactive follow-up questions
- **RAG Mode** — Retrieves financial knowledge from a Knowledge Base (Firestore) for context-augmented analysis, including income sufficiency checks

### 🔔 แจ้งเตือนอัจฉริยะ / Smart Notifications
- ตรวจจับหมวดรายจ่ายที่เกินเกณฑ์ → AI สร้างข้อความแจ้งเตือนเฉพาะบุคคล พร้อมป้องกันแจ้งเตือนซ้ำ
- Detects expense categories exceeding thresholds → AI generates personalized alert messages with duplicate prevention

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React Native 0.76 + Expo 52 |
| Navigation | React Navigation (Stack Navigator) |
| Backend | Express.js + Node.js |
| Database (Primary) | MongoDB + Mongoose |
| Database (Knowledge) | Firebase Firestore |
| AI / LLM | Ollama — Llama 3.1:8b |
| OCR | Asprise OCR API |
| Camera | expo-camera |
| Charts | react-native-chart-kit |
| UI | expo-linear-gradient, react-native-modal |
| Font | IBMPlexSansThai-Regular |

---

## 📸 Screenshots

> _เพิ่มภาพหน้าจอของแอปที่นี่_
>
> _Add app screenshots here_

| หน้าจอ / Screen | รูป / Image |
|-----------------|-------------|
| Login | ![Login](https://github.com/user-attachments/assets/4be21f7c-2442-4871-81ce-f159b15ea374) |
| Home |  |
| Financial Plan |  |
| Receipt Scan |  |
| Summary |  |
| AI ChatBot |  |
| Notifications |  |

---

## 🚀 How to Run

### ข้อกำหนดเบื้องต้น / Prerequisites

- **Node.js** (v18+)
- **MongoDB** — 🇹🇭 ติดตั้งและรันอยู่ที่ `localhost:27017` / 🇬🇧 installed and running on `localhost:27017`
- **Ollama** — 🇹🇭 ติดตั้งพร้อม model `llama3.1:8b` / 🇬🇧 installed with model `llama3.1:8b`
- **Expo Go** — 🇹🇭 บนมือถือ หรือ Android Emulator / iOS Simulator / 🇬🇧 on mobile device, or Android Emulator / iOS Simulator

### 1. ติดตั้ง Dependencies / Install Dependencies

```bash
npm install
```

### 2. ตั้งค่า Environment Variables / Configure Environment Variables

คัดลอกไฟล์ `.env.example` แล้วแก้ไขค่าให้ตรงกับเครื่องของคุณ:

Copy `.env.example` and update the values to match your setup:

```bash
cp .env.example .env
```

แก้ไฟล์ `.env` — เปลี่ยน IP Address ให้ตรงกับเครื่อง server:

Edit `.env` — update the IP Address to match your server:

```
BASE_URL=http://YOUR_IP_ADDRESS:8081
API_OLLAMA=http://YOUR_IP_ADDRESS:11434
MONGODB_URI=mongodb://127.0.0.1:27017/bmapp
```

แก้ไฟล์ `config/config.js` สำหรับ frontend:

Edit `config/config.js` for frontend:

```js
const IP_ADDRESS = 'YOUR_IP_ADDRESS'; // e.g. 192.168.1.100
```

### 3. เริ่ม MongoDB / Start MongoDB

```bash
mongod
```

### 4. เริ่ม Backend Server / Start Backend Server

```bash
node server/server.js
```

Server จะทำงานที่ port `8081` / Server will run on port `8081`

### 5. เริ่ม Ollama / Start Ollama (for AI features)

```bash
ollama serve
ollama run llama3.1:8b
```

### 6. เริ่ม Expo App / Start Expo App

```bash
npx expo start
```

สแกน QR Code ด้วย **Expo Go** บนมือถือ หรือกด `a` เพื่อเปิดบน Android Emulator

Scan the QR Code with **Expo Go** on your mobile device, or press `a` to open on Android Emulator

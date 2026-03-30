import axios from 'axios';
import FormData from 'form-data';

// ฟังก์ชันสำหรับจัดการผลลัพธ์ OCR
function formatOCRResult(ocrResult) {
    if (ocrResult && ocrResult.receipts && ocrResult.receipts.length > 0) {
        const receipt = ocrResult.receipts[0];
        const items = receipt.items || [];

        // ฟังก์ชันจัดการข้อความ name ให้ไม่มีช่องว่างระหว่างคำ
        const normalizeText = (text) => {
            if (!text || typeof text !== 'string') return 'UnknownItem';

            return text
                .normalize('NFKC')                            // แปลงอักขระให้เป็นฟอร์มปกติ
                .replace(/[0-9]/g, '')                        // ลบตัวเลขทั้งหมด
                .replace(/\s+/g, '')                          // ลบช่องว่างทั้งหมด
                .replace(/[^\u0E00-\u0E7Fa-zA-Z]/g, '')       // ลบทุกอย่างที่ไม่ใช่อักษรไทยหรืออังกฤษ
                .trim();
        };

        // กรอง items ที่มี amount (หรือ total) เท่ากับ 0
        const filteredItems = items.filter(item => item.amount !== 0);

        // จัดรูปแบบ items โดยใช้ filteredItems
        const formattedItems = filteredItems.map((item, index) => ({
            id: index + 1,
            name: normalizeText(item.description || 'Unknown Item'),
            quantity: item.qty || 1,
            price: item.unitPrice || 0,
            total: item.amount || 0,
        }));

        // รวมข้อมูลที่จัดการแล้ว
        return {
            ocr_type: ocrResult.ocr_type,
            request_id: ocrResult.request_id,
            ref_no: ocrResult.ref_no,
            file_name: ocrResult.file_name,
            date: receipt.date,
            time: receipt.time,
            merchant_name: receipt.merchant_name,
            total: receipt.total,
            items: formattedItems
        };
    } else {
        throw new Error('Invalid OCR Result structure or missing receipts.');
    }
}

// ฟังก์ชันสำหรับดึง items จาก ocr_text
function extractItemsFromOCRText(ocrText) {
    const itemLines = ocrText.split('\n').filter(line => {
        // เงื่อนไขการกรองเฉพาะบรรทัดที่ดูเหมือนสินค้า
        return /\d+\s+.+?\s+\d+(\.\d{2})?$/.test(line);
    });

    return itemLines.map((line, index) => {
        const parts = line.trim().split(/\s{2,}/); // แยกด้วยช่องว่างมากกว่า 2
        return {
            id: index + 1,
            name: parts[1] || 'Unknown Item',
            quantity: parseInt(parts[0]) || 1,
            price: parseFloat(parts[2]) || 0,
            total: parseFloat(parts[3]) || 0,
        };
    });
}

// ฟังก์ชันสำหรับส่งคำขอไปยัง Asprise OCR API
async function processReceipt(imageUri) {
    try {
        // สร้าง FormData
        const form = new FormData();
        form.append('api_key', 'TEST'); // ใช้ 'TEST' สำหรับการทดสอบ
        form.append('recognizer', 'auto'); // ให้ API ตรวจสอบประเทศอัตโนมัติ
        form.append('ref_no', 'my_receipt_001'); // รหัสอ้างอิงสำหรับคำขอ
        form.append('file', {
            uri: imageUri,  // ใช้ URI
            type: 'image/jpeg',
            name: 'image.jpg'
        });

        // ส่งคำขอไปยัง API
        const response = await axios.post(
            'https://ocr.asprise.com/api/v1/receipt',
            form,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        if (!response.data.success) {
            throw new Error(`OCR API Error: ${response.data.message}`);
        }

        const result = response.data;
        const receipt = result.receipts[0];

        // ตรวจสอบข้อมูล items
        console.log("Raw items from OCR:", receipt.items);
        console.log("OCR Text:", receipt.ocr_text);

        // หาก `items` ว่าง ลองดึงจาก `ocr_text`
        let items = receipt.items && receipt.items.length > 0
            ? receipt.items
            : extractItemsFromOCRText(receipt.ocr_text || '');

        // กรอง items ที่มี total เท่ากับ 0
        items = items.filter(item => item.total !== 0);

        const formattedResult = formatOCRResult({
            ...result,
            receipts: [{ ...receipt, items }]
        });

        console.log('Formatted OCR Result:', JSON.stringify(formattedResult, null, 2));
        return formattedResult;

    } catch (error) {
        // Log ข้อผิดพลาด
        console.error('Error:', error.response?.data || error.message);
        return null;
    }
}
module.exports = { processReceipt };
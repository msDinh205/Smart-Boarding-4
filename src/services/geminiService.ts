import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Configuration from AI_INSTRUCTIONS.md
const MODELS = [
  { id: "gemini-3-pro-preview", real: "gemini-1.5-pro" },
  { id: "gemini-3-flash-preview", real: "gemini-2.0-flash" }, 
  { id: "gemini-2.5-flash", real: "gemini-1.5-flash" }
];

export async function analyzeDiscipline(
  className: string,
  selectedDate: string,
  dormImagesBase64?: string[],
  uniformImageBase64?: string,
  diningImageBase64?: string,
  cleaningImageBase64?: string,
  attendanceData?: string,
  manualNotes?: {
    classDiscipline: string;
    dorm: string;
    dining: string;
    cleaning: string;
  }
): Promise<AnalysisResult> {
  // Get API key from localStorage (prioritize browser storage)
  const userApiKey = localStorage.getItem('gemini_api_key');
  const apiKey = userApiKey || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : "") || "";

  if (!apiKey) {
    throw new Error("Vui lòng thiết lập API Key trong phần Cài đặt.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const dateObj = new Date(selectedDate);
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
  const dayName = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][dateObj.getDay()];

  const systemInstruction = `Bạn là "Smart Boarding 4.0: Giải pháp Số hóa Nề nếp và Học tập".
Nhiệm vụ: Phân tích dữ liệu nề nếp cho lớp: ${className} vào ${dayName}, ngày: ${selectedDate}.

${isWeekend ? `
QUY TẮC ĐẶC BIỆT CHO THỨ 7 VÀ CHỦ NHẬT:
- Không chấm điểm theo tiêu chí 10đ của ngày thường.
- Chỉ theo dõi và xác định xem có bất kỳ lỗi vi phạm nề nếp nào không (dựa trên các hình ảnh và ghi chú).
- Nếu CÓ vi phạm: Đặt disciplineTotal = 0. Liệt kê chi tiết lỗi trong phần deductions.
- Nếu KHÔNG CÓ vi phạm: Đặt disciplineTotal = 10.
` : `
BẢNG TIÊU CHÍ CHẤM ĐIỂM NỀ NẾP (Max 10đ/ngày):
1. Lớp học + TD + Tự học (Max 3đ): Trừ 2đ nếu vi phạm.
2. Phòng ở (Max 3đ): Theo ghi chú thủ công hoặc trừ 2đ/lỗi.
3. Bàn ăn (Max 2đ): Trừ 2đ nếu vi phạm.
4. Vệ sinh (Max 2đ): Trừ 2đ nếu vi phạm.
`}

Yêu cầu output JSON chính xác. Luôn trả về điểm số ở dạng số thập phân có 3 chữ số.`;

  const parts: any[] = [{ text: `Hãy phân tích dữ liệu cho lớp ${className}:` }];
  if (manualNotes) parts.push({ text: `Ghi chú: ${JSON.stringify(manualNotes)}` });
  
  [
    { data: uniformImageBase64, label: "Lớp học" },
    { data: diningImageBase64, label: "Bàn ăn" },
    { data: cleaningImageBase64, label: "Vệ sinh" }
  ].forEach(img => {
     if (img.data) {
       parts.push({ inlineData: { mimeType: "image/jpeg", data: img.data.split(",")[1] || img.data } });
       parts.push({ text: `Đây là ảnh ${img.label}.` });
     }
  });

  if (dormImagesBase64) {
    dormImagesBase64.forEach((img, idx) => {
      parts.push({ inlineData: { mimeType: "image/jpeg", data: img.split(",")[1] || img } });
      parts.push({ text: `Đây là ảnh phòng ở ${idx + 1}.` });
    });
  }

  // Implementation of Fallback Mechanism
  let lastError: any = null;
  for (const modelRef of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelRef.real,
        contents: [{ parts }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scores: {
                type: Type.OBJECT,
                properties: {
                  classDiscipline: { type: Type.NUMBER },
                  dorm: { type: Type.NUMBER },
                  dining: { type: Type.NUMBER },
                  cleaning: { type: Type.NUMBER },
                  disciplineTotal: { type: Type.NUMBER },
                },
                required: ["classDiscipline", "dorm", "dining", "cleaning", "disciplineTotal"],
              },
              deductions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { category: { type: Type.STRING }, points: { type: Type.NUMBER }, reason: { type: Type.STRING } },
                  required: ["category", "points", "reason"],
                },
              },
              pedagogicalMessage: { type: Type.STRING },
            },
            required: ["scores", "deductions", "pedagogicalMessage"],
          },
        },
      });

      return JSON.parse(response.text || "{}") as AnalysisResult;
    } catch (err: any) {
      console.warn(`Model ${modelRef.id} failed, trying next... Error:`, err.message);
      lastError = err;
      continue;
    }
  }

  throw new Error(`Phân tích thất bại sau khi thử tất cả các model. Lỗi cuối cùng: ${lastError?.message || "Không xác định"}. Vui lòng kiểm tra lại API Key hoặc hạn mức (quota) của bạn.`);
}

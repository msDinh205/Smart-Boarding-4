export const CLASSES = ['6A', '6B', '7A', '7B', '7C', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B', '12A', '12B'] as const;
export type ClassName = typeof CLASSES[number];

export interface DailyRecord {
  day: string;
  violations: Violation[];
  baseScore: number;
  studentCount: number;
}

export interface Violation {
  type: 'classroom' | 'room' | 'dining' | 'hygiene2' | 'hygiene3' | 'heavy5' | 'heavy10';
  description: string;
  count: number;
}

export interface WeeklyData {
  dailyRecords: DailyRecord[]; // Fri, Mon, Tue, Wed, Thu
  weekendViolations: {
    saturday: boolean;
    sunday: boolean;
  };
  goodGradesCount: number;
  classLogScore: number;
  roomCount: number;
  studentCount: number;
}

export const VIOLATION_POINTS: Record<Violation['type'], number> = {
  classroom: 2,
  room: 2,
  dining: 2,
  hygiene2: 2,
  hygiene3: 3,
  heavy5: 5,
  heavy10: 10,
};

export const VIOLATION_LABELS: Record<Violation['type'], string> = {
  classroom: 'Lớp học/Tự học',
  room: 'Phòng ở',
  dining: 'Bàn ăn',
  hygiene2: 'Vệ sinh (-2đ)',
  hygiene3: 'Vệ sinh (-3đ)',
  heavy5: 'Lỗi nặng (Thuốc lá/Điện thoại)',
  heavy10: 'Lỗi nặng (Đánh bài/Gây gổ)',
};

export const EDUCATIONAL_SOLUTIONS: Record<Violation['type'], string> = {
  classroom: 'Tổ chức sinh hoạt lớp để chấn chỉnh kỷ luật. Phân công cán sự lớp theo dõi sát sao, yêu cầu học sinh vi phạm làm bản kiểm điểm và lao động công ích.',
  room: 'Kiểm tra phòng ở đột xuất. Yêu cầu trưởng phòng phân công lại lịch trực phòng rõ ràng. Phạt trực phòng thêm 1 tuần đối với các cá nhân vi phạm.',
  dining: 'Nhắc nhở văn hóa xếp hàng và giữ vệ sinh tại nhà ăn. Phân công học sinh vi phạm ở lại dọn dẹp nhà ăn sau bữa ăn trong 3 ngày.',
  hygiene2: 'Nhắc nhở toàn lớp về ý thức giữ gìn vệ sinh chung. Phân công tổ trực nhật làm lại và kiểm tra chéo giữa các tổ.',
  hygiene3: 'Phê bình nghiêm khắc trước lớp. Yêu cầu học sinh vi phạm tổng vệ sinh khu vực được phân công vào cuối tuần.',
  heavy5: 'Mời phụ huynh lên làm việc khẩn cấp. Tịch thu tang vật (nếu có). Phối hợp với y tế/đoàn trường tư vấn và áp dụng hình thức kỷ luật theo nội quy.',
  heavy10: 'Đình chỉ học tập tạm thời để điều tra. Yêu cầu viết bản tường trình, mời phụ huynh hai bên lên làm việc. Phối hợp với Ban giám hiệu xử lý kỷ luật nặng.'
};

/* ==========================================================================
   友情記憶測驗遊戲 - 資料檔
   包含題目、維度定義等資料
   ========================================================================== */

/* --------------------------------------------------------------------------
   雷達圖維度定義
   -------------------------------------------------------------------------- */
const DIMENSIONS = {
  observation: '觀察力',
  empathy: '同理心',
  memory: '記憶力',
  understanding: '默契度',
  care: '細心度'
};

/* --------------------------------------------------------------------------
   題目類型定義（6種新題型）
   -------------------------------------------------------------------------- */
const QUESTION_TYPES = {
  'context-recall': '情境回憶',
  'detail-observation': '細節觀察',
  'preference-memory': '偏好記憶',
  'opinion-expression': '評價觀點',
  'action-motivation': '行為動機',
  'action-intention': '行為意圖'
};

/* --------------------------------------------------------------------------
   階段定義
   -------------------------------------------------------------------------- */
const STAGES = {
  1: '友情回憶'
};

/* --------------------------------------------------------------------------
   友情類型分析系統
   根據五個維度分數組合判定友情類型
   -------------------------------------------------------------------------- */
const FRIENDSHIP_TYPES = {
  empatheticGuardian: {
    name: '同甘共苦型',
    emoji: '🤝',
    description: '你們是彼此的情緒支柱，總能在對方需要時伸出援手。就像那些深夜談心的時刻，你們彼此理解，互相支撐',
    keywords: ['同理心', '理解力'],
    minScores: { empathy: 70, understanding: 65 }
  },
  memoryKeeper: {
    name: '回憶收藏家',
    emoji: '📸',
    description: '你們珍藏著每個共同時刻，友情像陳年老酒越存越香。那些小細節、小約定，你們都記得一清二楚',
    keywords: ['記憶力', '細心度'],
    minScores: { memory: 70, care: 65 }
  },
  detailOriented: {
    name: '細心守護型',
    emoji: '🔍',
    description: '你們總是注意到彼此的小細節，像隱形的守護天使。喜歡什麼、不喜歡什麼，你們都默默記在心裡',
    keywords: ['觀察力', '細心度'],
    minScores: { observation: 70, care: 65 }
  },
  soulmate: {
    name: '心有靈犀型',
    emoji: '✨',
    description: '你們默契滿點，常常不用說話就知道對方在想什麼。這種心電感應的友情，真的是可遇不可求',
    keywords: ['默契度', '理解力'],
    minScores: { understanding: 75, empathy: 65 }
  },
  balanced: {
    name: '全方位好友',
    emoji: '⭐',
    description: '你們的友情發展均衡，各方面都照顧得很好。雖然沒有特別突出的優勢，但也沒有短板，這本身就很難得',
    keywords: ['全面發展'],
    minScores: {}  // 無特定需求，作為預設類型
  },
  explorer: {
    name: '持續探索型',
    emoji: '🌱',
    description: '你們的友情還有很大成長空間，正在探索彼此。不過別擔心，友情這種東西，慢慢培養就會越來越好',
    keywords: ['成長空間'],
    minScores: {}  // 當分數都不高時的預設類型
  }
};

/* --------------------------------------------------------------------------
   題目資料（從 final_questions.json 動態載入）
   -------------------------------------------------------------------------- */
let QUESTIONS = [];

/**
 * 從 final_questions.json 載入題目資料
 * @returns {Promise<Array>} 題目陣列
 */
async function loadQuestions() {
  try {
    const response = await fetch('./final_questions_new.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // 兼容两种格式：数组格式 或 {questions: [...]} 对象格式
    QUESTIONS = Array.isArray(data) ? data : data.questions;
    console.log(`✅ 成功載入 ${QUESTIONS.length} 道題目`);
    return QUESTIONS;
  } catch (error) {
    console.error('❌ 載入題目失敗:', error);
    alert('無法載入題目資料，請確認 final_questions_new.json 檔案存在');
    return [];
  }
}

/* --------------------------------------------------------------------------
   維度評級分析文案（幽默風格）
   -------------------------------------------------------------------------- */
const DIMENSION_LEVELS = {
  perfect: { 
    min: 90, 
    label: '記憶大師', 
    description: '你對朋友的了解程度已經到了令人毛骨悚然的地步（褒義）' 
  },
  excellent: { 
    min: 75, 
    label: '優等生', 
    description: '不錯喔，看來平常有在認真聽朋友說話' 
  },
  good: { 
    min: 60, 
    label: '及格邊緣', 
    description: '還算可以，至少不會把朋友的生日記成忌日' 
  },
  fair: { 
    min: 40, 
    label: '選擇性失憶', 
    description: '建議多聊天，或是開始吃銀杏' 
  },
  need_improve: { 
    min: 0, 
    label: '失憶患者', 
    description: '確定你們真的是朋友嗎？（笑）' 
  }
};

/* --------------------------------------------------------------------------
   擴展用：LINE 資料解析器
   用於將 LINE .txt 匯出檔解析為結構化資料
   -------------------------------------------------------------------------- */
class DataParser {
  /**
   * 解析 LINE 對話文字檔
   * @param {string} rawText - LINE 匯出的原始文字內容
   * @returns {Object} 結構化的對話資料
   */
  static parseLINEChat(rawText) {
    const lines = rawText.split('\n');
    const conversations = {};
    let currentDate = null;
    let currentConvId = null;

    lines.forEach(line => {
      // 解析日期行：2019/09/28(六)
      const dateMatch = line.match(/^(\d{4}\/\d{2}\/\d{2})\(([一二三四五六日])\)$/);
      if (dateMatch) {
        currentDate = dateMatch[1];
        const dayOfWeek = dateMatch[2];
        currentConvId = `conv_${currentDate.replace(/\//g, '')}`;
        conversations[currentConvId] = {
          id: currentConvId,
          date: currentDate,
          dayOfWeek: dayOfWeek,
          messages: []
        };
        return;
      }

      // 解析訊息行：18:27	李宜潔	我手機的對話紀錄全部掰掰了
      const msgMatch = line.match(/^(\d{2}:\d{2})\t([^\t]+)\t(.+)$/);
      if (msgMatch && currentConvId) {
        const [, time, sender, text] = msgMatch;
        const senderType = this.detectSender(sender);

        conversations[currentConvId].messages.push({
          time,
          sender: senderType,
          senderName: sender,
          text: this.parseMessageContent(text),
          type: this.detectMessageType(text)
        });
      }
    });

    return conversations;
  }

  /**
   * 識別發送者
   */
  static detectSender(senderName) {
    if (senderName.includes('李宜潔') || senderName.includes('宜潔')) {
      return 'yijie';
    }
    if (senderName.includes('量角器') || senderName.includes('平昕')) {
      return 'pingxin';
    }
    return 'unknown';
  }

  /**
   * 解析訊息內容
   */
  static parseMessageContent(text) {
    // 處理特殊內容
    if (text === '[照片]') return '[照片]';
    if (text === '[貼圖]') return '[貼圖]';
    return text;
  }

  /**
   * 檢測訊息類型
   */
  static detectMessageType(text) {
    if (text === '[照片]') return 'photo';
    if (text === '[貼圖]') return 'sticker';
    if (text.startsWith('http')) return 'link';
    return 'text';
  }
}

/* --------------------------------------------------------------------------
   導出所有資料
   -------------------------------------------------------------------------- */
export { 
  QUESTIONS, 
  DIMENSIONS, 
  QUESTION_TYPES, 
  STAGES, 
  FRIENDSHIP_TYPES,
  DIMENSION_LEVELS, 
  DataParser,
  loadQuestions
};

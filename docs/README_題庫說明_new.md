# 友情記憶測驗題庫 - 生成報告

## 📊 題庫統計

- **總題數**: 36 題
- **時間跨度**: 2019-2025 年
- **生成日期**: 2025-12-31
- **日期唯一性**: ✅ 每題來自完全不同的日期

### 各時期題目分布

| 時期 | 題數 | ID 範圍 |
|------|------|---------|
| 2019-2020 | 12 題 | 1-12 |
| 2021-2022 | 12 題 | 101-112 |
| 2023-2025 | 12 題 | 201-212 |

## 📝 題目類型分布

題目涵蓋以下 6 種類型（每種類型 6 題，共 36 題）：

- **context-recall** (情境回憶) - 回憶特定對話內容或事件
- **detail-observation** (細節觀察) - 觀察對話中的細節
- **preference-memory** (偏好記憶) - 記住朋友的偏好和習慣
- **opinion-expression** (評價觀點) - 記得朋友對某事/某人的看法/評價/態度/反應
- **action-motivation** (行為動機) - 理解為什麼做某事、背後原因/動機
- **action-intention** (行為意圖) - 記得朋友打算/將要做什麼、計劃

### 題型分布表

| 題型 | 數量 | 每時期 | 說明 |
|------|------|---------|------|
| context-recall | 6 題 | 各2題 | 問「誰做了什麼」、「發生什麼事」 |
| detail-observation | 6 題 | 各2題 | 問具體細節（地點、數字等） |
| preference-memory | 6 題 | 各2題 | 問喜好、習慣 |
| opinion-expression | 6 題 | 各2題 | 問看法、評價、態度、反應 |
| action-motivation | 6 題 | 各2題 | 問「為什麼」、原因、動機 |
| action-intention | 6 題 | 各2題 | 問「打算」、「將要」、計劃 |

### 📅 日期唯一性保證

**每題來自完全不同的日期** - 36 題涵蓋 36 個不同的對話日期，確保內容多元且隨機，避免重複題材。這樣設計的好處：
- ✅ 題目更多元，涵蓋更廣時間範圍
- ✅ 避免同一天對話的多個題目造成記憶混淆
- ✅ 每題都是獨特的記憶點
- ✅ 更真實反映友情的各個時刻

## 🎯 維度評分

每題對應以下友情維度之一：

| 維度 | 英文 | 對應題型 | 說明 |
|------|------|----------|------|
| 同理心 | empathy | action-motivation | 理解朋友的動機和原因 |
| 記憶力 | memory | context-recall | 記得發生的事件和對話 |
| 觀察力 | observation | detail-observation | 注意到細節和差異 |
| 細心度 | care | preference-memory | 記住朋友的偏好習慣 |
| 默契度 | understanding | opinion-expression, action-intention | 理解朋友的想法和計劃 |

## 📂 生成檔案

### 主要檔案

1. **final_questions.json** - JSON 格式題庫（適合後端處理）
2. **final_questions.js** - JavaScript 格式題庫（可直接引入前端）

### 檔案結構

```json
{
  "questions": [
    {
      "id": 1,
      "type": "context-recall",
      "category": "情境回憶",
      "dimension": "memory",
      "conversation": {
        "date": "2019/09/28",
        "context": [...],
        "highlightIndex": 3
      },
      "question": "聽到李宜潔的對話紀錄全部不見，量角器📐說了什麼？",
      "options": [...],
      "correctAnswer": "a",
      "explanation": "...",
      "weight": 1.0,
      "period": "2019-2020"
    },
    ...
  ],
  "metadata": {
    "total": 36,
    "generated_at": "2025-12-31",
    "periods": ["2019-2020", "2021-2022", "2023-2025"],
    "counts": {"2019-2020": 12, "2021-2022": 12, "2023-2025": 12},
    "typeDistribution": {
      "context-recall": 6,
      "detail-observation": 6,
      "preference-memory": 6,
      "opinion-expression": 6,
      "action-motivation": 6,
      "action-intention": 6
    },
    "uniqueDates": 36,
    "dateUniquenessGuarantee": true
  }
}
```

## 💡 題目範例

### context-recall (情境回憶)

**題目 1** (2019/09/28): 聽到李宜潔的對話紀錄全部不見，量角器📐說了什麼？
- 維度: 記憶力 (memory)
- 正確答案: 我們的紀錄啊啊啊
- 解釋: 量角器📐也很在意兩人的對話紀錄，展現出對這段友情回憶的重視。

**題目 101** (2021/01/01): 2021年新年這天，量角器📐在幹什麼？
- 維度: 記憶力 (memory)
- 正確答案: 跟老師談心
- 解釋: 量角器📐在新年這天單獨跟老師談心，是個特別的開始。

### detail-observation (細節觀察)

**題目 3** (2019/09/30): 量角器📐說自己是誰？
- 維度: 觀察力 (observation)
- 正確答案: 你家底迪
- 解釋: 量角器📐說「你家底迪」，確認了兩人的親密關係。

**題目 203** (2023/01/03): 李宜潔的手機幾點以後會自動勿擾？
- 維度: 觀察力 (observation)
- 正確答案: 10:00
- 解釋: 李宜潔說她的手機10:00以後就會自動勿擾。

### preference-memory (偏好記憶)

**題目 5** (2019/10/02): 李宜潔怎麼稱呼量角器📐？
- 維度: 細心度 (care)
- 正確答案: 可愛弟弟
- 解釋: 李宜潔親暱地稱呼量角器📐為「可愛弟弟」，展現兩人的親密關係。

**題目 205** (2023/03/20): 李宜潔叫量角器📐什麼暱稱？
- 維度: 細心度 (care)
- 正確答案: 寶寶
- 解釋: 李宜潔親暱地稱呼量角器📐為「寶寶」，展現兩人的親密關係。

### opinion-expression (評價觀點)

**題目 7** (2019/10/04): 李宜潔覺得量角器📐的表達方式怎麼樣？
- 維度: 默契度 (understanding)
- 正確答案: 浮誇
- 解釋: 李宜潔說「浮誇」，調侃量角器📐表達感情的方式很誇張。

**題目 207** (2024/04/15): 李宜潔覺得「今年也要請多指教了」這句話像什麼？
- 維度: 默契度 (understanding)
- 正確答案: 日本情侶交往第一句台詞
- 解釋: 李宜潔吐槽這句話「不是日本情侶交往第一句台詞嗎」，展現她對日劇的熟悉。

### action-motivation (行為動機)

**題目 9** (2019/10/06): 李宜潔為什麼覺得「超邊緣」？
- 維度: 同理心 (empathy)
- 正確答案: 因為聊天室空曠
- 解釋: 李宜潔因為對話紀錄不見導致「聊天室空曠的好哀傷」，所以覺得超邊緣。

**題目 109** (2021/07/08): 李宜潔為什麼覺得面試很困難？
- 維度: 同理心 (empathy)
- 正確答案: 太久沒跟人講話
- 解釋: 李宜潔因為疫情期間太久沒跟人講話，所以覺得面試很困難。

### action-intention (行為意圖)

**題目 11** (2019/10/08): 量角器📐建議李宜潔做什麼？
- 維度: 默契度 (understanding)
- 正確答案: 填充聊天室
- 解釋: 量角器📐說「填充上啊」，建議李宜潔用新的對話填充空曠的聊天室。

**題目 212** (2024/04/20): 量角器📐下禮拜想做什麼？
- 維度: 默契度 (understanding)
- 正確答案: 請假去看海
- 解釋: 量角器📐說「我下禮拜想請假去看海」，分享了自己的計劃。

## 🔧 使用方式

### 在 JavaScript 中引入

```javascript
// 方法 1: 直接引入 JS 檔案
<script src="final_questions.js"></script>
<script>
  console.log(FRIENDSHIP_QUIZ_QUESTIONS);
  console.log('總題數:', FRIENDSHIP_QUIZ_QUESTIONS.length);
  console.log('元數據:', QUIZ_METADATA);
</script>

// 方法 2: ES6 模組引入
import FRIENDSHIP_QUIZ_QUESTIONS from './final_questions.js';

// 方法 3: Node.js 引入
const FRIENDSHIP_QUIZ_QUESTIONS = require('./final_questions.js');
```

### 在 data.js 中整合

可以將 `final_questions.js` 中的題目陣列複製到現有的 `data.js` 檔案中的 `QUESTIONS` 陣列。

### 篩選特定時期或類型的題目

```javascript
// 只取 2019-2020 的題目
const questions_2019_2020 = FRIENDSHIP_QUIZ_QUESTIONS.filter(
  q => q.period === '2019-2020'
);

// 只取評價觀點類型的題目
const opinionQuestions = FRIENDSHIP_QUIZ_QUESTIONS.filter(
  q => q.type === 'opinion-expression'
);

// 只取同理心維度的題目
const empathyQuestions = FRIENDSHIP_QUIZ_QUESTIONS.filter(
  q => q.dimension === 'empathy'
);

// 只取簡單題目（weight <= 1.0）
const easyQuestions = FRIENDSHIP_QUIZ_QUESTIONS.filter(
  q => q.weight <= 1.0
);
```

## ✨ 特色

1. **真實對話**: 所有題目都基於真實的 LINE 對話記錄
2. **有趣內容**: 精選了有記憶點、有趣味性的對話片段
3. **多樣類型**: 涵蓋 6 種題型，全面測試友情記憶的不同面向
4. **時間跨度**: 橫跨 2019-2025 年，記錄友情的不同階段
5. **日期唯一**: 每題來自不同日期，確保內容多元不重複
6. **完整上下文**: 每題都包含 2-5 條連續對話作為上下文
7. **詳細解釋**: 每題都有解釋說明為什麼這是正確答案
8. **難度分級**: 混合簡單/中等/困難題目，保持挑戰性

## 📈 題目品質保證

- ✅ 每題都有完整的對話上下文
- ✅ 選項設計合理，有明確的正確答案
- ✅ 解釋清晰，幫助理解答題思路
- ✅ 題目有趣，展現友情的溫暖時刻
- ✅ 難度適中，既有挑戰又不會太難
- ✅ 日期唯一，確保題材多元
- ✅ 類型均衡，全面測試友情記憶

## 🎮 遊戲建議

1. 可以按時期分階段進行測驗
2. 可以隨機抽取題目混合測驗
3. 可以根據維度統計得分，生成雷達圖
4. 答對後顯示對話上下文，喚起回憶
5. 可以設計「回憶殺」環節，展示完整對話
6. 可以按題型分類測驗，專注某種記憶能力
7. 可以設計難度模式（簡單/中等/困難）

## 📝 後續可擴充

如果需要更多題目，可以：
1. 使用 `analyze_chats.py` 分析更多有趣對話
2. 使用 `find_interesting.py` 根據關鍵字尋找特定主題的對話
3. 手工精選更多經典對話片段
4. 針對特定事件（生日、節日、重要時刻）生成專題題庫
5. 確保新增題目的日期不與現有36題重複

---

**生成者**: GitHub Copilot  
**生成日期**: 2025-12-31  
**版本**: 2.0  
**重大更新**:
- 移除了 emotion-understanding 和 interaction-pattern 類型
- 新增了 opinion-expression、action-motivation、action-intention 類型
- 確保每題來自完全不同的日期（36個不同日期）
- 6種題型均衡分布，每種各6題
- 混合難度設計（簡單/中等/困難）

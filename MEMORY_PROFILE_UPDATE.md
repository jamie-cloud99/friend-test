# 友情記憶測驗 - 結果分析升級

## 核心改變：從「答對率統計」到「記憶輪廓分析」

### 更新內容

#### 1. **新增記憶輪廓分析系統** (`data.js`)
添加了 `MEMORY_PROFILE_TEMPLATES` 包含 8 種溫暖風格的分析模板：

- **CARE_MEMORY_OBSERVATION_HIGH__WARM**  
  「這是一段被好好記住的關係」  
  當用户在關心、記憶、觀察上都表現突出時觸發

- **CARE_HIGH_MEMORY_LOW__HUMOROUS**  
  「事件可能模糊，人不會」  
  高關心但記憶力低時的溫暖鼓勵

- **CARE_HIGH_OBSERVATION_HIGH__WARM_LIGHT**  
  「你一直有在留意」  
  關心和觀察力高時的認可

- **MEMORY_HIGH_CARE_LOW__WARM_LIGHT**  
  「一起走過的痕跡」  
  記憶力強但關心度較低的客觀描述

- **OBSERVATION_ONLY__HUMOROUS**  
  「觀察力點滿」  
  只有觀察維度突出時的幽默評價

- **EMPATHY_UNDERSTANDING_HIGH__WARM**  
  「心靈的共鳴」  
  同理心和默契度高時的深層分析

- **GENERIC_WARM__WARM_LIGHT**  
  「一段舒服的相處」  
  預設溫暖模板，用於任何未命中特定組合

#### 2. **重寫結果分析邏輯** (`game.js`)

**移除的方法：**
- `generatePersonalizedAnalysis()` - 舊的幽默答對率分析
- `getTypeSpecificAnalysis()` - 舊的友情類型特色評語
- `getDimensionJoke()` - 舊的維度調侃系統

**新增的方法：**
- `detectMemoryProfile(normalizedScores, rawScores)` - 核心檢測算法
  - 根據維度組合（65 分為分界線）
  - 智能匹配最合適的分析模板
  - 優先級：特定組合 > 預設溫暖模板

**改進的方法：**
- `shareResults()` - 從分享「答對幾分」改為分享「記憶輪廓」

#### 3. **更新前端展示** (`index.html` & `styles.css`)

**HTML 變更：**
- 標題：「友情分析報告」→ 「友情回憶軌跡」
- 副標題：「平昕與宜潔的默契指數」→ 「你們獨特的相處方式」
- 分數標籤：「總分」→ 「默契指數」
- 分析標題：「你們的友情類型」→ 「你們的記憶輪廓」
- 分享按鈕：「分享結果」→ 「分享我的軌跡」

**CSS 新增：**
- `.memory-profile` - 記憶輪廓卡片樣式
- `.profile-title` - 標題樣式（24px、加粗、居中）
- `.profile-body` - 正文樣式（16px、左對齐、1.8 行高）
- `.profile-closing` - 結尾樣式（斜體、邊框分隔）
- 漸層背景和毛玻璃效果提升視覺層次

### 維度組合檢測邏輯

```javascript
// 65 分以上定義為「高」
const high = {}; // 高分維度
const low = {};  // 低分維度

// 檢測優先級（從最特定到最通用）：
1. CARE + MEMORY + OBSERVATION 都高
2. CARE 高 + MEMORY 低
3. CARE + OBSERVATION 都高
4. MEMORY 高 + CARE 低
5. OBSERVATION 高 + CARE/MEMORY 都低
6. EMPATHY + UNDERSTANDING 都高
7. 預設溫暖模板
```

### 用户體驗改善

- ✨ **移除數字強調**：不再突出答對率和分數
- 💭 **強調情感連接**：聚焦「你是怎麼記得的」而非「你答對了多少」
- 🎯 **個性化深度**：根據真實維度組合生成分析，而非套用固定類型
- ❤️ **溫暖語氣**：所有分析都採用親切、支持性的措辭
- 📱 **易於分享**：新的分享文案更能突出友情的獨特性

### 向後相容性

- 保留 `FRIENDSHIP_TYPES` 和 `DIMENSION_LEVELS` 用於其他用途
- 維度計算邏輯不變
- 雷達圖和維度分析保持原樣


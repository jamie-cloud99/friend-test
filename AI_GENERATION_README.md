# AI 自動生成題目 - 使用指南

## 系統概述

本系統使用 Google Gemini API 自動從對話中生成友誼記憶測驗題目，大幅減少手動編寫題目的時間（從 4-6 小時降至 45-60 分鐘）。

## 已建立的檔案結構

```
/Users/jamie/temp/game/
├── config/
│   ├── selected_dates_ai.json          # ✓ 你挑選的 15 個日期
│   └── ai_generation_config.json       # ✓ AI 生成配置
│
├── scripts/
│   ├── validate_questions.py           # ✓ 驗證模組
│   ├── prompt_builder.py               # ✓ 提示詞構建器
│   ├── generate_ai_auto_questions.py   # ✓ 主生成腳本
│   ├── review_ai_questions.py          # ✓ 審核介面
│   ├── merge_ai_questions.py           # ✓ 合併腳本
│   └── browse_dates.py                 # ✓ 瀏覽日期工具
│
├── intermediate/                        # 生成過程的中間檔案
│   ├── ai_generated_questions_draft.json
│   ├── ai_generated_questions_reviewed.json
│   ├── ai_rejected_questions.json
│   ├── ai_generation_log.txt
│   └── few_shot_examples.json
│
└── backups/                             # 合併前的備份
    └── final_questions_new_YYYYMMDD_HHMMSS.json
```

## 前置準備

### 1. 安裝必要套件

```bash
pip install google-genai
```

### 2. 設定 API 金鑰

```bash
export GOOGLE_API_KEY="your-google-api-key-here"
```

獲取 API 金鑰：https://aistudio.google.com/app/apikey

## 完整工作流程

### 步驟 0：（可選）瀏覽候選日期

如果你想探索更多候選日期，可以使用瀏覽工具：

```bash
# 瀏覽 2019-2020 時期，過濾「認真」標籤的對話
python3 scripts/browse_dates.py --period 2019-2020 --tag 認真 --limit 30

# 互動式選擇模式
python3 scripts/browse_dates.py --period 2021-2022 --interactive
```

**你已經完成這步**：你提供的 15 個日期已保存在 [config/selected_dates_ai.json](config/selected_dates_ai.json)

### 步驟 1：生成題目

執行主生成腳本，使用 Gemini API 自動生成 15 道題目：

```bash
python3 scripts/generate_ai_auto_questions.py
```

**預期輸出**：
```
============================================================
AI 自動生成題目
============================================================

載入配置...
  ✓ 配置已載入
  ✓ 選定 15 個日期

載入 few-shot 範例...
  ✓ 載入 6 種題型的範例

開始生成 15 道題目...

[1/15] 2019/11/20 (context-recall, 困难)
  對話片段: 4 則訊息
  ✓ 生成成功 (品質: 8.5/10.0)

[2/15] 2020/01/31 (preference-memory, 中等)
  對話片段: 3 則訊息
  ✓ 生成成功 (品質: 7.2/10.0)

...

============================================================
生成結果統計
============================================================

總題目數: 15/15
成功: 15
失敗: 0

難度分布:
  困难: 6 (目標: 6) ✓
  中等: 6 (目標: 6) ✓
  简单: 3 (目標: 3) ✓

題型分布:
  context-recall: 3 (目標: 3) ✓
  detail-observation: 2 (目標: 2) ✓
  ...

平均品質: 7.8/10.0

✓ 題目已保存至: intermediate/ai_generated_questions_draft.json
✓ 日誌已保存至: intermediate/ai_generation_log.txt
```

**成本預估**：使用 Gemini 1.5 Flash 幾乎免費（每日有免費配額）

**時間預估**：1-2 分鐘

### 步驟 2：審核題目

使用互動式介面逐題審核：

```bash
python3 scripts/review_ai_questions.py
```

**審核介面範例**：
```
============================================================
題目 1/15
============================================================

日期: 2019/11/20
類型: context-recall
難度: 困难
時期: 2019-2020

對話內容：
  量角器📐: 我覺得我們的方案真的有創意
  李宜潔: 但要怎麼實作？
  量角器📐: 我們可以用...

題目：討論學校專案時，量角器📐覺得他們的方案怎麼樣？

選項：
  a) 很有創意 [正確]
  b) 很普通
  c) 很難
  d) 不可行

解釋：量角器📐說「我覺得我們的方案真的有創意」。

驗證結果：✓ 所有檢查通過

品質評分：8.5/10.0

操作：
  [A] 接受
  [R] 拒絕
  [S] 跳過（稍後審核）
  [V] 重新查看
  [Q] 結束審核

>
```

**操作指引**：
- 按 `A` 接受高品質題目
- 按 `R` 拒絕品質不佳的題目
- 按 `S` 跳過，稍後再決定
- 按 `V` 重新查看對話
- 按 `Q` 提早結束審核

**時間預估**：30-45 分鐘（約 2-3 分鐘/題）

### 步驟 3：合併到題庫

將審核通過的題目合併到最終題庫：

```bash
python3 scripts/merge_ai_questions.py
```

**預期輸出**：
```
============================================================
合併 AI 生成題目
============================================================

載入來源: intermediate/ai_generated_questions_reviewed.json
  ✓ 載入 15 道題目
載入目標: final_questions_new.json
  ✓ 載入 36 道題目

✓ 備份已建立: backups/final_questions_new_20260101_143022.json

指派 ID...
  題目 1 → ID 37
  題目 2 → ID 38
  ...
  題目 15 → ID 51

驗證合併結果...
  ✓ 所有驗證通過

題庫統計：
  總題數: 51

時期分布：
  2019-2020: 16 題
  2021-2022: 18 題
  2023-2025: 17 題

題型分布：
  情境回憶: 9 題
  細節觀察: 8 題
  偏好記憶: 9 題
  評價觀點: 8 題
  行為動機: 9 題
  行為意圖: 8 題

難度分布：
  简单: 8 題
  中等: 26 題
  困难: 17 題

寫入 final_questions_new.json...
  ✓ 寫入完成

============================================================
合併完成！
============================================================

✓ 成功合併 15 道 AI 生成題目
✓ 題庫總題數：36 → 51
```

**完成！** 你的題庫已從 36 題擴充到 51 題。

## 配置說明

### 難度分布（可調整）

編輯 `config/ai_generation_config.json`:

```json
{
  "difficulty_distribution": {
    "困难": 6,    // 調整困難題數量
    "中等": 6,    // 調整中等題數量
    "简单": 3     // 調整簡單題數量
  }
}
```

### 題型分布（可調整）

```json
{
  "type_distribution": {
    "context-recall": 3,        // 情境回憶
    "detail-observation": 2,    // 細節觀察
    "preference-memory": 3,     // 偏好記憶
    "opinion-expression": 2,    // 評價觀點
    "action-motivation": 3,     // 行為動機
    "action-intention": 2       // 行為意圖
  }
}
```

### API 設定（可調整）

```json
{
  "api": {
    "provider": "google",                      // API 提供者
    "model": "gemini-1.5-flash",              // 使用的模型
    "temperature": 0.7,                        // 創造性（0.0-1.0）
    "max_tokens": 1500                         // 最大輸出長度
  }
}
```

**可用的 Gemini 模型**：
- `gemini-1.5-flash`：速度快、成本低、品質好（推薦）
- `gemini-1.5-pro`：品質最高但成本較高
- `gemini-2.0-flash-exp`：最新實驗版本

## 品質控制

### 自動驗證

每個 AI 生成的題目都會經過以下驗證：

1. **Schema 驗證**：檢查必要欄位
2. **語言驗證**：確保使用繁體中文
3. **Grounding 驗證**：解釋必須引用對話
4. **Distractor 驗證**：錯誤選項品質檢查
5. **長度驗證**：題目、選項、解釋長度限制

### 品質評分

每個題目會獲得 0-10 分的品質評分，基於：
- 驗證通過情況
- 引用品質
- 題目具體性
- 選項平衡性

**建議**：接受評分 ≥ 7.0 的題目

## 常見問題

### Q: API 錯誤怎麼辦？

**A:** 系統會自動重試 3 次，每次間隔 2-8 秒。如果仍失敗：
1. 檢查網路連線
2. 確認 API 金鑰正確
3. 檢查 API 配額是否用完

### Q: 生成的題目品質不佳？

**A:** 可以：
1. 在審核時拒絕低品質題目
2. 調整 `temperature`（降低可提高一致性）
3. 選擇更有趣的對話日期
4. 使用更強的模型（如 `gemini-1.5-pro` 或 `gemini-2.0-flash-exp`）

### Q: 想要不同的難度分布？

**A:** 編輯 `config/ai_generation_config.json` 中的 `difficulty_distribution`，然後重新執行 `generate_ai_auto_questions.py`

### Q: 如何增加「認真」類型題目？

**A:** 使用瀏覽工具挑選更多有「認真」標籤的日期：
```bash
python3 scripts/browse_dates.py --period 2021-2022 --tag 認真 --interactive
```

### Q: 可以重新生成特定題目嗎？

**A:** 目前需要：
1. 編輯 `config/selected_dates_ai.json`，只保留想重新生成的日期
2. 重新執行生成腳本
3. 合併時會跳過重複日期

## 檔案說明

### 輸入檔案

- `config/selected_dates_ai.json` - 你挑選的日期清單
- `config/ai_generation_config.json` - AI 生成配置
- `final_questions_new.json` - 現有題庫（用於 few-shot 範例）
- `raw_data/chat_*.json` - 原始對話資料

### 輸出檔案

- `intermediate/ai_generated_questions_draft.json` - AI 生成的初稿
- `intermediate/ai_generated_questions_reviewed.json` - 審核通過的題目
- `intermediate/ai_rejected_questions.json` - 審核拒絕的題目
- `intermediate/ai_generation_log.txt` - 生成日誌
- `backups/final_questions_new_*.json` - 合併前的備份
- `final_questions_new.json` - 最終題庫（更新後）

## 成本與效能

### 成本

- **Gemini 1.5 Flash**：幾乎免費（每日有免費配額，超過後約 $0.01-0.02 / 15 題）
- **Gemini 1.5 Pro**：約 $0.15-0.20 / 15 題（品質更高）

### 時間

- **生成**：1-2 分鐘
- **審核**：30-45 分鐘
- **合併**：< 1 分鐘
- **總計**：約 45-60 分鐘

### 對比手動

- **手動編寫 15 題**：約 4-6 小時
- **使用 AI 系統**：約 45-60 分鐘
- **節省時間**：約 80%

## 下一步

完成 15 題後，如果想繼續擴充：

1. 挑選新的 15 個日期
2. 更新 `config/selected_dates_ai.json`
3. 重複生成 → 審核 → 合併流程

**目標**：最終可達 60-100 題，提供更豐富的遊戲體驗！

## 技術支援

如有問題，請檢查：
1. `intermediate/ai_generation_log.txt` - 生成日誌
2. 終端機輸出的錯誤訊息
3. 確認所有前置條件已滿足

---

**祝生成順利！🎉**

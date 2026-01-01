/* ==========================================================================
   友情記憶測驗遊戲 - 遊戲邏輯
   主控制器、狀態管理、所有類別
   ========================================================================== */

/* --------------------------------------------------------------------------
   導入資料模組
   -------------------------------------------------------------------------- */
import {
  QUESTIONS,
  DIMENSIONS,
  STAGES,
  DIMENSION_LEVELS,
  FRIENDSHIP_TYPES,
  MEMORY_PROFILE_TEMPLATES,
  DIMENSION_MAX_SCORES,
  loadQuestions
} from './data.js';

/* --------------------------------------------------------------------------
   遊戲狀態管理類別
   -------------------------------------------------------------------------- */
class GameState {
  constructor() {
    this.currentQuestion = 0;
    this.totalQuestions = QUESTIONS.length;
    this.answers = [];
    this.scores = {
      observation: 0,
      empathy: 0,
      memory: 0,
      understanding: 0,
      care: 0
    };
    this.correctCount = 0;
    this.startTime = null;
    this.endTime = null;
  }

  recordAnswer(questionId, selectedOption, isCorrect, timeTaken) {
    this.answers.push({
      questionId,
      selectedOption,
      isCorrect,
      timeTaken,
      timestamp: Date.now()
    });

    if (isCorrect) {
      this.correctCount++;
      const question = QUESTIONS.find(q => q.id === questionId);
      if (question) {
        this.scores[question.dimension] += question.weight;
      }
    }
  }

  getProgress() {
    return (this.currentQuestion / this.totalQuestions) * 100;
  }

  getCurrentStage() {
    return Math.floor(this.currentQuestion / 5) + 1;
  }

  getStageName() {
    const stage = this.getCurrentStage();
    return STAGES[stage] || '測驗中';
  }

  getTotalScore() {
    return Math.round((this.correctCount / this.totalQuestions) * 100);
  }
}

/* --------------------------------------------------------------------------
   進度條類別
   -------------------------------------------------------------------------- */
class ProgressBar {
  constructor() {
    this.container = document.getElementById('progress-container');
    this.bar = document.getElementById('progress-bar');
    this.currentQuestionEl = document.getElementById('current-question');
    this.totalQuestionsEl = document.getElementById('total-questions');
    this.stageEl = document.querySelector('.progress-stage');
  }

  show() {
    this.container.classList.remove('hidden');
  }

  hide() {
    this.container.classList.add('hidden');
  }

  update(currentQuestion, totalQuestions, stageName) {
    const percentage = (currentQuestion / totalQuestions) * 100;

    this.bar.classList.add('animating');
    this.bar.style.width = `${percentage}%`;
    this.currentQuestionEl.textContent = currentQuestion;
    this.totalQuestionsEl.textContent = totalQuestions;
    this.stageEl.textContent = stageName;

    setTimeout(() => {
      this.bar.classList.remove('animating');
    }, 600);
  }
}

/* --------------------------------------------------------------------------
   LINE 對話視窗類別
   -------------------------------------------------------------------------- */
class LINEChat {
  constructor() {
    this.container = document.getElementById('line-chat-container');
    this.body = document.getElementById('line-chat-body');
    this.titleEl = document.getElementById('chat-title');
    this.dateEl = document.getElementById('chat-date');
    this.messageDelay = 700;
    this.isSkipped = false;
  }

  async playConversation(conversationData) {
    this.body.innerHTML = '';
    this.isSkipped = false;

    this.dateEl.textContent = conversationData.date;

    for (let i = 0; i < conversationData.context.length; i++) {
      if (this.isSkipped) {
        // 如果被跳過，立即顯示所有剩餘訊息（不等待）
        for (let j = i; j < conversationData.context.length; j++) {
          const msg = conversationData.context[j];
          const isHighlighted = j === conversationData.highlightIndex;
          await this.addMessage(msg, isHighlighted);
        }
        return true; // 返回已跳過狀態
      }
      const msg = conversationData.context[i];
      const isHighlighted = i === conversationData.highlightIndex;
      await this.addMessage(msg, isHighlighted);
      await this.delay(this.messageDelay);
    }
    return false; // 返回正常播放完成
  }

  async addMessage(message, isHighlighted = false) {
    // 支援兩種資料格式：user/content (新格式) 或 sender/text (舊格式)
    const sender = message.user || message.sender || '';
    const text = message.content || message.text || '';
    const time = message.time || '';

    // 將使用者名稱映射為 CSS 類名
    const senderClass = this.getSenderClass(sender);

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${senderClass}`;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = `message-bubble ${isHighlighted ? 'highlighted' : ''}`;
    bubbleDiv.textContent = text;

    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = time;

    messageDiv.appendChild(bubbleDiv);
    messageDiv.appendChild(timeDiv);
    this.body.appendChild(messageDiv);

    this.body.scrollTop = this.body.scrollHeight;
  }

  getSenderClass(sender) {
    // 將實際名字映射為 CSS 類名
    const senderMap = {
      '李宜潔': 'yijie',
      '量角器📐': 'pingxin'
    };
    return senderMap[sender] || 'yijie'; // 預設為 yijie
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  skip() {
    this.isSkipped = true;
  }

  clear() {
    this.body.innerHTML = '';
  }
}

/* --------------------------------------------------------------------------
   五角雷達圖類別
   -------------------------------------------------------------------------- */
class RadarChart {
  constructor(containerId, dimensions) {
    this.container = document.getElementById(containerId);
    this.dimensions = dimensions;
    this.size = 400;
    this.center = this.size / 2;
    this.maxRadius = this.size / 2 - 60;
    this.levels = 5;
  }

  render() {
    this.container.innerHTML = '';
    const svg = this.createSVG();

    this.drawGrid(svg);
    this.drawLabels(svg);
    this.drawDataArea(svg);

    this.container.appendChild(svg);
  }

  createSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', this.size);
    svg.setAttribute('height', this.size);
    svg.setAttribute('viewBox', `0 0 ${this.size} ${this.size}`);
    return svg;
  }

  drawGrid(svg) {
    const dimensionCount = Object.keys(this.dimensions).length;
    const angleStep = (Math.PI * 2) / dimensionCount;

    for (let level = 1; level <= this.levels; level++) {
      const radius = (this.maxRadius / this.levels) * level;
      const points = [];

      for (let i = 0; i < dimensionCount; i++) {
        const angle = angleStep * i - Math.PI / 2;
        const x = this.center + Math.cos(angle) * radius;
        const y = this.center + Math.sin(angle) * radius;
        points.push(`${x},${y}`);
      }

      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.setAttribute('points', points.join(' '));
      polygon.setAttribute('fill', 'none');
      polygon.setAttribute('stroke', '#e0e0e0');
      polygon.setAttribute('stroke-width', '1');
      svg.appendChild(polygon);
    }

    for (let i = 0; i < dimensionCount; i++) {
      const angle = angleStep * i - Math.PI / 2;
      const x = this.center + Math.cos(angle) * this.maxRadius;
      const y = this.center + Math.sin(angle) * this.maxRadius;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', this.center);
      line.setAttribute('y1', this.center);
      line.setAttribute('x2', x);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#e0e0e0');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    }
  }

  drawLabels(svg) {
    const dimensionNames = Object.keys(this.dimensions);
    const dimensionCount = dimensionNames.length;
    const angleStep = (Math.PI * 2) / dimensionCount;
    const labelRadius = this.maxRadius + 40;

    dimensionNames.forEach((dim, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const x = this.center + Math.cos(angle) * labelRadius;
      const y = this.center + Math.sin(angle) * labelRadius;

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('font-size', '14');
      text.setAttribute('font-weight', '600');
      text.setAttribute('fill', '#2c3e50');
      text.textContent = DIMENSIONS[dim];
      svg.appendChild(text);
    });
  }

  drawDataArea(svg) {
    const dimensionNames = Object.keys(this.dimensions);
    const dimensionCount = dimensionNames.length;
    const angleStep = (Math.PI * 2) / dimensionCount;
    const points = [];

    dimensionNames.forEach((dim, i) => {
      const value = this.dimensions[dim];
      const radius = (this.maxRadius * value) / 100;
      const angle = angleStep * i - Math.PI / 2;
      const x = this.center + Math.cos(angle) * radius;
      const y = this.center + Math.sin(angle) * radius;
      points.push(`${x},${y}`);
    });

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points.join(' '));
    polygon.setAttribute('fill', 'rgba(106, 154, 216, 0.3)');
    polygon.setAttribute('stroke', '#4a7ba7');
    polygon.setAttribute('stroke-width', '2');

    const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animate.setAttribute('attributeName', 'opacity');
    animate.setAttribute('from', '0');
    animate.setAttribute('to', '1');
    animate.setAttribute('dur', '1s');
    animate.setAttribute('fill', 'freeze');
    polygon.appendChild(animate);

    svg.appendChild(polygon);

    points.forEach(point => {
      const [x, y] = point.split(',');
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', '5');
      circle.setAttribute('fill', '#4a7ba7');
      svg.appendChild(circle);
    });
  }
}

/* --------------------------------------------------------------------------
   題目畫面類別
   -------------------------------------------------------------------------- */
class QuestionScreen {
  constructor(game, question) {
    this.game = game;
    this.question = question;
    this.selectedOption = null;
  }

  async show() {
    // 直接顯示題目畫面
    this.displayQuestion();
  }

  displayQuestion() {
    document.getElementById('question-type').textContent = this.question.category;
    document.getElementById('question-text').textContent = this.question.question;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    this.question.options.forEach(option => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'option';

      const labelSpan = document.createElement('span');
      labelSpan.className = 'option-label';
      labelSpan.textContent = `${option.id.toUpperCase()}.`;

      const textSpan = document.createElement('span');
      textSpan.className = 'option-text';
      textSpan.textContent = option.text;

      optionDiv.appendChild(labelSpan);
      optionDiv.appendChild(textSpan);

      optionDiv.addEventListener('click', () => this.handleOptionClick(option.id, optionDiv));

      optionsContainer.appendChild(optionDiv);
    });
  }

  async handleOptionClick(optionId, optionElement) {
    if (this.selectedOption) return;

    this.selectedOption = optionId;

    const allOptions = document.querySelectorAll('.option');
    allOptions.forEach(opt => opt.classList.add('disabled'));

    optionElement.classList.add('selected');

    await this.delay(300);

    const isCorrect = optionId === this.question.correctAnswer;

    // 切換到對話回顧畫面
    await this.showChatReplay(isCorrect);
  }

  async showChatReplay(isCorrect) {
    // 切換到對話回顧畫面
    const chatReplayScreen = document.getElementById('chat-replay-screen');
    const skipButton = document.getElementById('skip-chat-button');
    const viewAnswerButton = document.getElementById('view-answer-button');

    this.game.showScreen(chatReplayScreen);

    // 初始狀態：「查看答案」禁用，「跳過對話」啟用
    skipButton.disabled = false;
    viewAnswerButton.disabled = true;

    // 設置跳過按鈕事件
    skipButton.onclick = () => {
      this.game.lineChat.skip();
    };

    // 綁定「查看答案」按鈕事件
    viewAnswerButton.onclick = async () => {
      await this.showAnswerFeedback(isCorrect);
      this.game.state.recordAnswer(this.question.id, this.selectedOption, isCorrect, 0);
    };

    // 播放對話回顧（選完答案後的驚喜）
    await this.game.lineChat.playConversation(this.question.conversation);

    // 對話播放完成後，禁用「跳過對話」，啟用「查看答案」
    skipButton.disabled = true;
    viewAnswerButton.disabled = false;
  }

  async showAnswerFeedback(isCorrect) {
    // 切換到答案反饋畫面
    const feedbackScreen = document.getElementById('feedback-screen');
    this.game.showScreen(feedbackScreen);

    const feedbackIcon = document.getElementById('feedback-icon');
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackExplanation = document.getElementById('feedback-explanation');
    feedbackIcon.className = `feedback-icon ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackTitle.textContent = isCorrect ? '回答正確' : '回答錯誤';
    feedbackTitle.className = `feedback-title ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackExplanation.textContent = this.question.explanation;

    const nextButton = document.getElementById('next-button');
    const isLastQuestion = this.game.state.currentQuestion === this.game.state.totalQuestions - 1;
    
    // 根據是否為最後一題改變按鈕文字
    nextButton.textContent = isLastQuestion ? '查看友情分析 ✨' : '下一題';
    nextButton.onclick = () => this.game.nextQuestion();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/* --------------------------------------------------------------------------
   過場畫面類別
   -------------------------------------------------------------------------- */
class TransitionScreen {
  constructor(game, stage) {
    this.game = game;
    this.stage = stage;
  }

  show() {
    const transitionScreen = document.getElementById('transition-screen');

    document.getElementById('transition-completed').textContent = this.game.state.currentQuestion;
    document.getElementById('transition-total').textContent = this.game.state.totalQuestions;
    document.getElementById('transition-stage').textContent = STAGES[this.stage];

    const messages = {
      1: '你們的回憶才剛開始',
      2: '日常的點滴最是珍貴',
      3: '友情在深度交流中昇華',
      4: '情感的共鳴最為動人',
      5: '最後的默契考驗，加油'
    };

    document.getElementById('transition-message').textContent = messages[this.stage];

    const progressFill = document.getElementById('transition-progress-fill');
    const percentage = (this.game.state.currentQuestion / this.game.state.totalQuestions) * 100;
    progressFill.style.width = `${percentage}%`;

    // 綁定「下一題」按鈕事件
    const nextButton = document.getElementById('transition-next-button');
    if (nextButton) {
      nextButton.onclick = () => this.game.showNextQuestion();
    }

    this.game.showScreen(transitionScreen);
  }

  async autoAdvance() {
    await this.delay(3000);
    this.game.showNextQuestion();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/* --------------------------------------------------------------------------
   結果畫面類別
   -------------------------------------------------------------------------- */
class ResultScreen {
  constructor(game) {
    this.game = game;
    this.normalizedScores = null;
  }

  show() {
    const resultScreen = document.getElementById('result-screen');

    const totalScore = this.game.state.getTotalScore();
    document.getElementById('total-score').textContent = totalScore;
    document.getElementById('correct-count').textContent = this.game.state.correctCount;
    document.getElementById('result-total-questions').textContent = this.game.state.totalQuestions;

    this.normalizedScores = this.normalizeScores();
    const radar = new RadarChart('radar-chart', this.normalizedScores);
    radar.render();

    this.showDimensionAnalysis(this.normalizedScores);

    // 綁定「查看記憶輪廓分析」按鈕
    document.getElementById('view-analysis-button').onclick = () => this.showAnalysisScreen();

    this.game.showScreen(resultScreen);
  }

  showAnalysisScreen() {
    const analysisScreen = document.getElementById('analysis-screen');
    
    this.showFriendshipType(this.normalizedScores);

    document.getElementById('restart-button').onclick = () => location.reload();
    document.getElementById('share-button').onclick = () => this.shareResults();

    this.game.showScreen(analysisScreen);
  }

  normalizeScores() {
    const scores = this.game.state.scores;
    
    const normalized = {};
    Object.keys(scores).forEach(dim => {
      // 使用該維度自己的最大分數來計算占比
      const maxScore = DIMENSION_MAX_SCORES[dim] || 100;
      normalized[dim] = maxScore > 0 ? Math.round((scores[dim] / maxScore) * 100) : 0;
      
      // 確保分數不超過 100
      if (normalized[dim] > 100) {
        normalized[dim] = 100;
      }
    });

    return normalized;
  }

  showDimensionAnalysis(normalizedScores) {
    const dimensionsList = document.getElementById('dimensions-list');
    dimensionsList.innerHTML = '';

    Object.entries(normalizedScores).forEach(([dim, score]) => {
      const level = this.getScoreLevel(score);

      const itemDiv = document.createElement('div');
      itemDiv.className = 'dimension-item';

      const nameDiv = document.createElement('div');
      nameDiv.className = 'dimension-name';
      nameDiv.textContent = DIMENSIONS[dim];

      const scoreDiv = document.createElement('div');
      scoreDiv.className = 'dimension-score';
      scoreDiv.textContent = score;

      const levelDiv = document.createElement('div');
      levelDiv.className = 'dimension-level';
      levelDiv.textContent = level.label;

      itemDiv.appendChild(nameDiv);
      itemDiv.appendChild(scoreDiv);
      itemDiv.appendChild(levelDiv);

      dimensionsList.appendChild(itemDiv);
    });
  }

  getScoreLevel(score) {
    for (const [key, level] of Object.entries(DIMENSION_LEVELS)) {
      if (score >= level.min) {
        return level;
      }
    }
    return DIMENSION_LEVELS.need_improve;
  }

  /**
   * 判定並顯示友情類型（幽默風格）
   */
  showFriendshipType(normalizedScores) {
    const scores = this.game.state.scores;
    
    // 根據維度組合判定記憶輪廓模板
    const template = this.detectMemoryProfile(normalizedScores, scores);
    
    // 記錄友情類型名稱（用於分享）
    this.friendshipType = template.title;
    
    // 顯示記憶輪廓分析
    const analysisContainer = document.getElementById('friendship-analysis');
    if (analysisContainer) {
      analysisContainer.innerHTML = `
        <div class="memory-profile">
          <h3 class="profile-title">${template.title}</h3>
          <p class="profile-body">${template.body}</p>
          <p class="profile-closing">${template.closing}</p>
        </div>
      `;
    }
  }

  /**
   * 檢測維度組合並選擇對應的記憶輪廓模板
   * 根據維度分數組合判定最適合的分析模板
   */
  detectMemoryProfile(normalizedScores, rawScores) {
    // 提取高低維度（以65分為分界線）
    const high = {};
    const low = {};
    
    Object.entries(normalizedScores).forEach(([dim, score]) => {
      if (score >= 65) {
        high[dim] = score;
      } else {
        low[dim] = score;
      }
    });

    const highDims = Object.keys(high);
    const lowDims = Object.keys(low);
    
    // 檢查特定的高分組合模式
    
    // 1. 高CARE + 高MEMORY + 高OBSERVATION：被好好記住的關係
    if (highDims.includes('care') && highDims.includes('memory') && highDims.includes('observation')) {
      return MEMORY_PROFILE_TEMPLATES.CARE_MEMORY_OBSERVATION_HIGH__WARM;
    }
    
    // 2. 高CARE + 低MEMORY：事件可能模糊，人不會
    if (highDims.includes('care') && lowDims.includes('memory') && !highDims.includes('observation')) {
      return MEMORY_PROFILE_TEMPLATES.CARE_HIGH_MEMORY_LOW__HUMOROUS;
    }
    
    // 3. 高CARE + 高OBSERVATION（不管MEMORY）：你一直有在留意
    if (highDims.includes('care') && highDims.includes('observation')) {
      return MEMORY_PROFILE_TEMPLATES.CARE_HIGH_OBSERVATION_HIGH__WARM_LIGHT;
    }
    
    // 4. 高MEMORY + 低CARE：一起走過的痕跡
    if (highDims.includes('memory') && lowDims.includes('care') && !highDims.includes('observation')) {
      return MEMORY_PROFILE_TEMPLATES.MEMORY_HIGH_CARE_LOW__WARM_LIGHT;
    }
    
    // 5. 高OBSERVATION + 低CARE和MEMORY：觀察力點滿
    if (highDims.includes('observation') && lowDims.includes('care') && lowDims.includes('memory')) {
      return MEMORY_PROFILE_TEMPLATES.OBSERVATION_ONLY__HUMOROUS;
    }
    
    // 6. 高EMPATHY + 高UNDERSTANDING：心靈的共鳴
    if (highDims.includes('empathy') && highDims.includes('understanding') && !highDims.includes('care')) {
      return MEMORY_PROFILE_TEMPLATES.EMPATHY_UNDERSTANDING_HIGH__WARM;
    }
    
    // 預設：一段舒服的相處（當沒有特定組合時）
    return MEMORY_PROFILE_TEMPLATES.GENERIC_WARM__WARM_LIGHT;
  }

  shareResults() {
    const memoryProfile = this.friendshipType || '我們的友情';
    const text = `我在「友情記憶測驗」中發現了一段獨特的相處方式：「${memoryProfile}」。完成了平昕與宜潔的回憶之旅。`;

    if (navigator.share) {
      navigator.share({
        title: '友情記憶測驗',
        text: text
      }).catch(err => console.log('分享失敗', err));
    } else {
      alert('分享功能需要在支援的瀏覽器中使用');
    }
  }
}

/* --------------------------------------------------------------------------
   主遊戲控制器
   -------------------------------------------------------------------------- */
class FriendshipMemoryGame {
  constructor() {
    this.selectedQuestionCount = 10; // 預設值
    this.selectedQuestions = []; // 隨機選中的題目
    this.state = null; // 延遲初始化
    this.currentScreen = null;
    this.lineChat = new LINEChat();
    this.progressBar = new ProgressBar();
  }

  async init() {
    this.showScreen(document.getElementById('start-screen'));

    // 題目數選擇事件處理
    const countOptions = document.querySelectorAll('.count-option');
    countOptions.forEach(option => {
      option.addEventListener('click', () => {
        countOptions.forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        this.selectedQuestionCount = parseInt(option.dataset.count);

        // 更新提示文字
        const hints = {
          10: '約 8-10 分鐘',
          25: '約 20-25 分鐘',
          50: '約 40-50 分鐘'
        };
        document.querySelector('.selector-hint').textContent =
          `預設 ${this.selectedQuestionCount} 題，${hints[this.selectedQuestionCount]}`;
      });
    });

    // 開始按鈕
    document.getElementById('start-button').addEventListener('click', () => {
      this.startGame();
    });
  }

  // 隨機選取題目（分層隨機抽樣）
  randomSelectQuestions(count) {
    const result = [];

    // 如果請求的題目數超過題庫總數，直接返回全部題目
    if (count >= QUESTIONS.length) {
      return [...QUESTIONS].sort(() => Math.random() - 0.5);
    }

    // 新的題目類型對應（移除了 emotion-understanding 和 interaction-pattern）
    // 新增了 opinion-expression、action-motivation、action-intention
    const typeRatios = {
      'detail-observation': 0.35,    // 細節觀察 -> 觀察力
      'context-recall': 0.30,        // 情境回憶 -> 記憶力
      'opinion-expression': 0.15,    // 評價觀點 -> 默契度
      'action-motivation': 0.10,     // 行為動機 -> 同理心
      'action-intention': 0.05,      // 行為意圖 -> 默契度
      'preference-memory': 0.05      // 偏好記憶 -> 細心度
    };

    // 使用 Math.floor 避免四捨五入導致總數超出
    let allocated = 0;
    const typeSelections = [];

    Object.entries(typeRatios).forEach(([type, ratio], index, arr) => {
      const typeQuestions = QUESTIONS.filter(q => q.type === type);

      // 最後一個類型分配剩餘所有名額，避免四捨五入誤差
      let selectCount;
      if (index === arr.length - 1) {
        selectCount = count - allocated;
      } else {
        selectCount = Math.floor(count * ratio);
        allocated += selectCount;
      }

      // Fisher-Yates 洗牌
      const shuffled = [...typeQuestions].sort(() => Math.random() - 0.5);
      typeSelections.push(...shuffled.slice(0, Math.min(selectCount, shuffled.length)));
    });

    result.push(...typeSelections);

    // 如果結果不足（某些類型題目數不夠），從所有未選中的題目中隨機補充
    while (result.length < count) {
      const remaining = QUESTIONS.filter(q => !result.includes(q));
      if (remaining.length === 0) break;
      const randomQ = remaining[Math.floor(Math.random() * remaining.length)];
      result.push(randomQ);
    }

    return result.slice(0, count);
  }

  startGame() {
    // 根據選擇的題目數隨機抽題
    this.selectedQuestions = this.randomSelectQuestions(this.selectedQuestionCount);

    // 初始化遊戲狀態
    this.state = new GameState();
    this.state.totalQuestions = this.selectedQuestions.length;
    this.state.startTime = Date.now();

    this.progressBar.show();
    this.showNextQuestion();
  }

  async showNextQuestion() {
    if (this.state.currentQuestion >= this.state.totalQuestions) {
      this.showResults();
      return;
    }

    const question = this.selectedQuestions[this.state.currentQuestion];

    this.progressBar.update(
      this.state.currentQuestion + 1,
      this.state.totalQuestions,
      this.state.getStageName()
    );

    const questionScreen = new QuestionScreen(this, question);
    this.showScreen(document.getElementById('question-screen'));
    await questionScreen.show();
  }

  async nextQuestion() {
    this.state.currentQuestion++;
    await this.showNextQuestion();
  }

  async showStageTransition() {
    const stage = this.state.getCurrentStage();
    const transition = new TransitionScreen(this, stage);
    transition.show();
    // 移除自動換頁功能，改由使用者點擊按鈕控制
  }

  showResults() {
    this.state.endTime = Date.now();
    this.progressBar.hide();

    const resultScreen = new ResultScreen(this);
    resultScreen.show();
  }

  showScreen(screen) {
    if (this.currentScreen) {
      this.currentScreen.classList.remove('active');
    }
    this.currentScreen = screen;
    screen.classList.add('active');
  }
}

/* --------------------------------------------------------------------------
   遊戲啟動
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  // 顯示載入提示
  const startButton = document.getElementById('start-button');
  const originalButtonText = startButton ? startButton.textContent : '';
  
  if (startButton) {
    startButton.disabled = true;
    startButton.textContent = '載入題目中...';
  }
  
  try {
    // 載入題目資料
    await loadQuestions();
    
    // 初始化遊戲
    const game = new FriendshipMemoryGame();
    await game.init();
    
    // 恢復按鈕狀態
    if (startButton) {
      startButton.disabled = false;
      startButton.textContent = originalButtonText;
    }
  } catch (error) {
    console.error('遊戲初始化失敗:', error);
    if (startButton) {
      startButton.textContent = '載入失敗，請重新整理';
    }
  }
});

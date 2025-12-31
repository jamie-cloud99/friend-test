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
    await this.showChatReplay();

    // 播放完對話後，顯示答案反饋
    await this.delay(1200);
    await this.showAnswerFeedback(isCorrect);

    this.game.state.recordAnswer(this.question.id, optionId, isCorrect, 0);
  }

  async showChatReplay() {
    // 切換到對話回顧畫面
    const chatReplayScreen = document.getElementById('chat-replay-screen');
    const skipButton = document.getElementById('skip-chat-button');
    
    this.game.showScreen(chatReplayScreen);
    
    // 設置跳過按鈕事件
    skipButton.onclick = () => {
      this.game.lineChat.skip();
    };

    // 播放對話回顧（選完答案後的驚喜）
    const wasSkipped = await this.game.lineChat.playConversation(this.question.conversation);
    
    // 跳過時只等待  0ms，正常播放等待 800ms
    await this.delay(wasSkipped ? 0 : 800);
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
  }

  show() {
    const resultScreen = document.getElementById('result-screen');

    const totalScore = this.game.state.getTotalScore();
    document.getElementById('total-score').textContent = totalScore;
    document.getElementById('correct-count').textContent = this.game.state.correctCount;
    document.getElementById('result-total-questions').textContent = this.game.state.totalQuestions;

    const normalizedScores = this.normalizeScores();
    const radar = new RadarChart('radar-chart', normalizedScores);
    radar.render();

    this.showDimensionAnalysis(normalizedScores);
    this.showFriendshipType(normalizedScores);

    document.getElementById('restart-button').onclick = () => location.reload();
    document.getElementById('share-button').onclick = () => this.shareResults();

    this.game.showScreen(resultScreen);
  }

  normalizeScores() {
    const scores = this.game.state.scores;
    const values = Object.values(scores);
    const maxScore = Math.max(...values);

    const normalized = {};
    Object.keys(scores).forEach(dim => {
      normalized[dim] = maxScore > 0 ? Math.round((scores[dim] / maxScore) * 100) : 0;
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
    
    // 判定友情類型
    let friendshipType = null;
    
    // 檢查是否符合特定類型的條件
    for (const [key, type] of Object.entries(FRIENDSHIP_TYPES)) {
      if (Object.keys(type.minScores).length === 0) continue; // 跳過預設類型
      
      const meetsRequirements = Object.entries(type.minScores).every(
        ([dim, minScore]) => normalizedScores[dim] >= minScore
      );
      
      if (meetsRequirements) {
        friendshipType = type;
        break;
      }
    }
    
    // 如果沒有符合特定類型，使用預設邏輯
    if (!friendshipType) {
      const avgScore = Object.values(normalizedScores).reduce((a, b) => a + b, 0) / Object.values(normalizedScores).length;
      
      if (avgScore >= 60) {
        friendshipType = FRIENDSHIP_TYPES.balanced;
      } else {
        friendshipType = FRIENDSHIP_TYPES.explorer;
      }
    }
    
    this.friendshipType = friendshipType.name;
    
    // 產生心理測驗式的個人化評語（幽默風格）
    const analysis = this.generatePersonalizedAnalysis(normalizedScores, friendshipType);
    
    // 顯示友情類型和分析
    const analysisContainer = document.getElementById('friendship-analysis');
    if (analysisContainer) {
      analysisContainer.innerHTML = `
        <div class="friendship-type-card">
          <div class="friendship-emoji">${friendshipType.emoji}</div>
          <h3 class="friendship-type-name">${friendshipType.name}</h3>
          <p class="friendship-type-description">${friendshipType.description}</p>
        </div>
        <div class="friendship-analysis-text">
          ${analysis.map(para => `<p>${para}</p>`).join('')}
        </div>
      `;
    }
  }

  /**
   * 產生個人化分析評語（幽默風格）
   */
  generatePersonalizedAnalysis(normalizedScores, friendshipType) {
    const analysis = [];
    const totalScore = this.game.state.getTotalScore();
    const correctCount = this.game.state.correctCount;
    const totalQuestions = this.game.state.totalQuestions;
    
    // 第一段：整體表現（幽默開場）
    if (totalScore >= 80) {
      analysis.push(`哇喔！${totalScore}分！你們這是要申請「國家級好友」認證嗎？這個分數高到讓人懷疑你們是不是共用一個大腦。答對了${correctCount}/${totalQuestions}題，基本上已經可以去參加朋友版的「誰是臥底」了。`);
    } else if (totalScore >= 60) {
      analysis.push(`${totalScore}分，表現不錯！${correctCount}/${totalQuestions}題的正確率證明你們的友情是真材實料，雖然偶爾會有點「選擇性失憶」，但整體來說還是很靠譜的。起碼不會把朋友的生日記成忌日（吧？）。`);
    } else if (totalScore >= 40) {
      analysis.push(`${totalScore}分...嗯...怎麼說呢？${correctCount}/${totalQuestions}的成績證明你們的友情還在「探索期」。建議多聊聊天，或許可以考慮開始吃銀杏？不過別擔心，友情這種東西本來就需要時間慢慢培養嘛。`);
    } else {
      analysis.push(`${totalScore}分...確定你們真的是朋友嗎？（笑）${correctCount}/${totalQuestions}的答對率讓人懷疑你們是不是在玩「猜猜我是誰」。不過沒關係，從今天開始好好經營友情還來得及！畢竟「不打不相識」嘛。`);
    }
    
    // 第二段：根據友情類型給予特色評語
    const typeAnalysis = this.getTypeSpecificAnalysis(friendshipType, normalizedScores);
    analysis.push(typeAnalysis);
    
    // 第三段：維度分析（挑最高和最低的維度調侃）
    const dimensionAnalysis = this.getDimensionJoke(normalizedScores);
    analysis.push(dimensionAnalysis);
    
    return analysis;
  }

  /**
   * 根據友情類型產生特色評語
   */
  getTypeSpecificAnalysis(friendshipType, scores) {
    const typeName = friendshipType.name;
    
    const analyses = {
      '同甘共苦型': '你們的同理心和理解力簡直爆表，大概是那種「對方一個眼神就知道要幹嘛」的境界。不過提醒一下，偶爾也要記得朋友喜歡吃什麼，不然每次聚餐都要重新問一遍也是滿尷尬的。',
      '回憶收藏家': '你們根本是行走的「友情時光機」，連三年前的某個笑話都記得一清二楚。唯一的問題是，會不會太執著於過去啦？偶爾也要創造一些新回憶喔！',
      '細心守護型': '你們的觀察力和細心度讓人佩服，大概是那種「會記得朋友隨口說過想吃什麼」的類型。不過也別太緊迫盯人，有時候朋友只是隨口說說而已啦。',
      '心有靈犀型': '你們的默契好到令人嫉妒，簡直像是裝了心電感應器。不過偶爾還是要「說出口」，畢竟你們還沒有真的能讀心術...吧？',
      '全方位好友': '你們的友情發展很均衡，就像一個完美的五邊形（雖然雷達圖上可能沒那麼完美）。沒有明顯短板，但也沒有特別突出的地方。這樣也好，至少不會讓人覺得你們的友情「偏科」。',
      '持續探索型': '你們還在探索彼此，就像是剛開始玩一款新遊戲。別急，友情這種東西是需要時間慢慢「升級」的。多聊聊天、多見見面，總有一天會從「青銅」打到「王者」的！'
    };
    
    return analyses[typeName] || '你們的友情很獨特，連AI都分析不出來是什麼類型。恭喜你們創造了新的友情模式！';
  }

  /**
   * 根據維度分數產生幽默評語
   */
  getDimensionJoke(scores) {
    const dims = Object.entries(scores).map(([key, value]) => ({
      key,
      name: DIMENSIONS[key],
      value
    })).sort((a, b) => b.value - a.value);
    
    const highest = dims[0];
    const lowest = dims[dims.length - 1];
    
    let joke = `看看你們的強項：「${highest.name}」拿了${highest.value}分，`;
    
    if (highest.value >= 80) {
      joke += '根本是滿級大神的水準！';
    } else if (highest.value >= 60) {
      joke += '表現可圈可點！';
    } else {
      joke += '嗯...至少比其他項目好一點？';
    }
    
    joke += ` 至於「${lowest.name}」只有${lowest.value}分，`;
    
    if (lowest.value < 40) {
      joke += '這個...要不要去醫院檢查一下記憶力？（開玩笑的啦）建議多花點心思在這方面，友情需要全方位經營嘛！';
    } else if (lowest.value < 60) {
      joke += '還有進步空間。不過沒關係，知道哪裡不足就好辦了，對症下藥就好！';
    } else {
      joke += '其實也不差啦！你們根本沒有明顯的弱項，真是讓人羨慕。';
    }
    
    return joke;
  }

  shareResults() {
    const totalScore = this.game.state.getTotalScore();
    const friendshipType = this.friendshipType || '友情';
    const text = `我在「友情記憶測驗」中獲得了 ${totalScore} 分！完成了平昕與宜潔的回憶之旅，友情類型是「${friendshipType}」。`;

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
          15: '約 12-15 分鐘',
          20: '約 15-20 分鐘'
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
    const typeRatios = {
      'detail-observation': 0.35,
      'context-recall': 0.30,
      'emotion-understanding': 0.20,
      'interaction-pattern': 0.10,
      'preference-memory': 0.05
    };

    Object.entries(typeRatios).forEach(([type, ratio]) => {
      const typeQuestions = QUESTIONS.filter(q => q.type === type);
      const selectCount = Math.round(count * ratio);

      // Fisher-Yates 洗牌
      const shuffled = [...typeQuestions].sort(() => Math.random() - 0.5);
      result.push(...shuffled.slice(0, Math.min(selectCount, shuffled.length)));
    });

    // 如果結果不足，從所有題目中隨機補充
    while (result.length < count && result.length < QUESTIONS.length) {
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
    await transition.autoAdvance();
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
  const startScreen = document.getElementById('start-screen');
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

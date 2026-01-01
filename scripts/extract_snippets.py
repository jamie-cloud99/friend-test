import json
import re
from collections import defaultdict

KEYWORDS = {
    '笑点': ['哈哈', '笑死', '好笑', '有趣', 'XDDD', 'XD', '笑', '爆笑', '笑慘', '搞笑', '哭笑'],
    '温馨': ['寶寶', '李包', '量角器', '謝謝', '辛苦', '加油', '祝', '早安', '晚安', '愛', '想你', '關心', '請說', '怎麼說', '感動'],
    '特殊事件': ['生日', '快樂', '新年', '節日', '跨年', '聖誕', '畢業', '考試', '紀念', '第一次', ],
    '有梗': ['欸', '蛤', '喔', '嗯', '真的假的', '太扯', '天啊', '我的天', '不會吧', '震驚', '?', '？', '什麼', '怎麼', '為什麼', '怎麼辦', '真的假的', '真的假的啦', '為何', 'why', '呢', '耶', '誒'],
    '認真': ['討論', '認真', '專業', '分析', '研究', '解釋', '原因', '理由', '看法', '意見', '建議', '方案', '計畫', '議題', '事件', '問題', '解決', '方法', '策略', '目標', '方向', '規劃'],
}

def score_conversation(messages):
    score = 0
    tags = set()
    text = ' '.join([m.get('content', '') for m in messages])
    
    for tag, keywords in KEYWORDS.items():
        for keyword in keywords:
            if keyword in text:
                score += 1
                tags.add(tag)
    
    if 2 <= len(messages) <= 5:
        score += 2
    
    if any('?' in m.get('content', '') or '？' in m.get('content', '') for m in messages):
        score += 1
    
    return score, tags

def get_question_types(messages):
    types = []
    text = ' '.join([m.get('content', '') for m in messages])
    
    if any(keyword in text for keyword in ['我', '你', '他', '做', '說', '去', '看', '買', '吃']):
        types.append('context-recall')
    
    if re.search(r'\d|時間|地點|什麼時候|哪裡', text):
        types.append('detail-observation')
    
    if any(keyword in text for keyword in ['喜歡', '討厭', '想', '要', '愛', '最', '覺得']):
        types.append('preference-memory')
    
    if any(keyword in text for keyword in ['覺得', '認為', '感覺', '好像', '應該']):
        types.append('opinion-expression')
    
    if any(keyword in text for keyword in ['因為', '所以', '為什麼', '為了', '原因']):
        types.append('action-motivation')
    
    if any(keyword in text for keyword in ['打算', '準備', '要', '會', '將', '想要']):
        types.append('action-intention')
    
    return types[:2] if types else ['context-recall']

def extract_snippets(filename, target_count=12):
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    messages = data['messages']
    by_date = defaultdict(list)
    for msg in messages:
        by_date[msg['date']].append(msg)
    
    snippets = []
    
    for date, day_msgs in by_date.items():
        valid_msgs = [m for m in day_msgs if m.get('content') and 
                     '[照片]' not in m['content'] and 
                     '[貼圖]' not in m['content'] and
                     '[影片]' not in m['content'] and
                     '☎' not in m['content'] and
                     len(m['content']) > 1]
        
        if len(valid_msgs) < 2:
            continue
        
        for start_idx in range(len(valid_msgs) - 1):
            for length in [2, 3, 4, 5]:
                if start_idx + length <= len(valid_msgs):
                    snippet = valid_msgs[start_idx:start_idx + length]
                    score, tags = score_conversation(snippet)
                    
                    if score > 2:
                        snippets.append({
                            'date': date,
                            'messages': snippet,
                            'score': score,
                            'tags': list(tags),
                            'question_types': get_question_types(snippet)
                        })
    
    snippets.sort(key=lambda x: x['score'], reverse=True)
    
    selected = []
    used_dates = set()
    
    for snippet in snippets:
        if snippet['date'] not in used_dates and len(selected) < target_count:
            selected.append(snippet)
            used_dates.add(snippet['date'])
    
    return selected

if __name__ == '__main__':
    files = {
        '2019-2020': 'chat_2019_2020.json',
        '2021-2022': 'chat_2021_2022.json',
        '2023-2025': 'chat_2023_2025.json'
    }

    all_results = {}

    for period, filename in files.items():
        print(f'正在处理 {period}...')
        snippets = extract_snippets(filename, 12)
        all_results[period] = snippets
        print(f'找到 {len(snippets)} 个片段\n')

    print('='*80)
    print('36个有趣对话片段')
    print('='*80)

    for period, snippets in all_results.items():
        print(f'\n\n【{period}】共 {len(snippets)} 个片段\n')
        
        for idx, snippet in enumerate(snippets, 1):
            print(f'{idx}. 日期：{snippet["date"]}')
            print(f'   趣味性：{snippet["score"]} 分 | 标签：{", ".join(snippet["tags"])}')
            print(f'   建议题型：{", ".join(snippet["question_types"])}')
            print(f'   对话内容：')
            
            for msg in snippet['messages']:
                user = msg['user']
                content = msg['content']
                print(f'     {user}：{content}')
            
            reasons = []
            if '笑点' in snippet['tags']:
                reasons.append('包含笑点')
            if '温馨' in snippet['tags']:
                reasons.append('温馨互动')
            if '特殊事件' in snippet['tags']:
                reasons.append('特殊时刻')
            if '有梗' in snippet['tags']:
                reasons.append('有趣的反应')
            if '認真' in snippet['tags']:
                reasons.append('认真讨论')
            
            print(f'   说明：{" + ".join(reasons) if reasons else "有记忆点的对话"}')
            print()

    print('\n总计：', sum(len(s) for s in all_results.values()), '个片段')
    
    # 保存为JSON
    with open('curated_snippets.json', 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    print('\n结果已保存到 curated_snippets.json')

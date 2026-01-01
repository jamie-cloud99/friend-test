#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
瀏覽候選日期輔助工具
幫助使用者從原始資料中探索並挑選日期
"""

import json
import argparse
from collections import defaultdict
from extract_snippets import score_conversation, KEYWORDS


def load_raw_data(period):
    """載入原始對話資料"""
    files = {
        '2019-2020': 'raw_data/chat_2019_2020.json',
        '2021-2022': 'raw_data/chat_2021_2022.json',
        '2023-2025': 'raw_data/chat_2023_2025.json'
    }

    if period not in files:
        raise ValueError(f"無效時期: {period}，請選擇 {list(files.keys())}")

    with open(files[period], 'r', encoding='utf-8') as f:
        return json.load(f)


def filter_valid_messages(messages):
    """過濾無效訊息"""
    valid = []
    for m in messages:
        content = m.get('content', '')
        if (content and
            '[照片]' not in content and
            '[貼圖]' not in content and
            '[影片]' not in content and
            '☎' not in content and
            len(content) > 1):
            valid.append(m)
    return valid


def group_by_date(messages):
    """按日期分組訊息"""
    by_date = defaultdict(list)
    for msg in messages:
        by_date[msg['date']].append(msg)
    return by_date


def score_date(messages):
    """評分單個日期的對話"""
    # 找最佳片段
    best_score = -1
    best_snippet = None

    for length in range(2, min(6, len(messages) + 1)):
        for start_idx in range(len(messages) - length + 1):
            snippet = messages[start_idx:start_idx + length]
            score, tags = score_conversation(snippet)

            if score > best_score:
                best_score = score
                best_snippet = snippet

    if best_snippet is None:
        best_snippet = messages[:min(4, len(messages))]
        best_score, tags = score_conversation(best_snippet)
    else:
        _, tags = score_conversation(best_snippet)

    return best_score, list(tags), best_snippet


def load_used_dates(question_file='final_questions_new.json'):
    """載入已使用的日期"""
    try:
        with open(question_file, 'r', encoding='utf-8') as f:
            questions = json.load(f)
        used_dates = {q['conversation']['date'] for q in questions}
        return used_dates
    except FileNotFoundError:
        return set()


def filter_by_tag(dates_data, tag):
    """根據標籤過濾日期"""
    filtered = {}
    for date, data in dates_data.items():
        if tag in data['tags']:
            filtered[date] = data
    return filtered


def browse_dates(period, tag_filter=None, limit=20, min_score=3, exclude_used=True, offset=0):
    """瀏覽候選日期"""
    print('=' * 80)
    print(f'瀏覽候選日期 - {period}')
    print('=' * 80)
    print()

    # 載入已使用的日期
    used_dates = set()
    if exclude_used:
        used_dates = load_used_dates()
        print(f'載入已使用日期: {len(used_dates)} 個')
        print()

    # 載入資料
    print('載入資料...')
    raw_data = load_raw_data(period)
    all_messages = raw_data['messages']

    # 過濾無效訊息
    valid_messages = filter_valid_messages(all_messages)
    print(f'  ✓ 有效訊息數: {len(valid_messages)}')

    # 按日期分組
    by_date = group_by_date(valid_messages)
    print(f'  ✓ 日期數: {len(by_date)}')
    
    # 過濾已使用的日期
    if exclude_used:
        original_count = len(by_date)
        by_date = {date: msgs for date, msgs in by_date.items() if date not in used_dates}
        filtered_count = original_count - len(by_date)
        print(f'  ✓ 排除已使用日期: {filtered_count} 個')
    print()

    # 評分每個日期
    print('評分日期...')
    dates_data = {}
    for date, messages in by_date.items():
        if len(messages) >= 2:
            score, tags, snippet = score_date(messages)
            if score >= min_score:
                dates_data[date] = {
                    'score': score,
                    'tags': tags,
                    'snippet': snippet,
                    'total_messages': len(messages)
                }
    print(f'  ✓ 找到 {len(dates_data)} 個高分日期（分數 >= {min_score}）')
    print()

    # 根據標籤過濾
    if tag_filter:
        dates_data = filter_by_tag(dates_data, tag_filter)
        print(f'  ✓ 標籤過濾（{tag_filter}）: {len(dates_data)} 個日期')
        print()

    # 排序（按分數降序）
    sorted_dates = sorted(dates_data.items(), key=lambda x: x[1]['score'], reverse=True)

    # 計算分頁範圍
    total_dates = len(sorted_dates)
    start_idx = offset
    end_idx = min(offset + limit, total_dates)
    page_dates = sorted_dates[start_idx:end_idx]
    
    # 顯示候選日期
    print('=' * 80)
    if offset > 0:
        print(f'候選日期 ({start_idx + 1}-{end_idx} / 共 {total_dates} 個)')
    else:
        print(f'候選日期 (前 {len(page_dates)} 個 / 共 {total_dates} 個)')
    print('=' * 80)
    print()

    for i, (date, data) in enumerate(page_dates, start_idx + 1):
        print(f"{i}. 日期: {date} | 分數: {data['score']} | 訊息數: {data['total_messages']}")
        print(f"   標籤: {', '.join(data['tags'])}")
        print(f"   對話片段:")

        for msg in data['snippet']:
            print(f"     {msg['user']}: {msg['content']}")

        print()

    return sorted_dates


def interactive_select(sorted_dates, period='2019-2020', output_file=None):
    """互動式選擇日期"""
    print('=' * 80)
    print('互動式選擇模式')
    print('=' * 80)
    print()
    print('指令：')
    print('  輸入數字 - 查看該日期詳細資訊')
    print('  s <數字> - 選擇該日期')
    print('  l - 列出已選日期')
    print('  c - 清除已選日期')
    print('  w - 寫入檔案並結束')
    print('  q - 退出（不儲存）')
    print()

    selected_dates = []

    while True:
        cmd = input("> ").strip().lower()

        if cmd.startswith('s '):
            try:
                idx = int(cmd.split()[1]) - 1
                if 0 <= idx < len(sorted_dates):
                    date = sorted_dates[idx][0]
                    if date not in selected_dates:
                        selected_dates.append(date)
                        print(f"✓ 已選擇: {date}")
                    else:
                        print(f"⊙ 已在清單中: {date}")
                else:
                    print("無效索引")
            except (IndexError, ValueError):
                print("無效指令，格式: s <數字>")

        elif cmd == 'l':
            if selected_dates:
                print(f"\n已選擇 {len(selected_dates)} 個日期:")
                for i, date in enumerate(selected_dates, 1):
                    print(f"  {i}. {date}")
                print()
            else:
                print("尚未選擇任何日期")

        elif cmd == 'c':
            selected_dates = []
            print("✓ 已清除所有選擇")

        elif cmd == 'w':
            if not selected_dates:
                print("錯誤：尚未選擇任何日期")
                continue

            if output_file is None:
                output_file = 'config/selected_dates_ai.json'

            output_data = {
                'dates': selected_dates,
                'total': len(selected_dates),
                'notes': f'從 {period} 瀏覽選擇的日期'
            }

            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, ensure_ascii=False, indent=2)

            print(f"\n✓ 已寫入 {len(selected_dates)} 個日期至: {output_file}")
            break

        elif cmd == 'q':
            print("退出（未儲存）")
            break

        elif cmd.isdigit():
            idx = int(cmd) - 1
            if 0 <= idx < len(sorted_dates):
                date, data = sorted_dates[idx]
                print(f"\n詳細資訊 - {date}")
                print(f"分數: {data['score']}")
                print(f"標籤: {', '.join(data['tags'])}")
                print(f"訊息數: {data['total_messages']}")
                print("\n完整對話片段:")
                for msg in data['snippet']:
                    print(f"  {msg['user']}: {msg['content']}")
                print()
            else:
                print("無效索引")

        else:
            print("無效指令")


def main():
    """主執行流程"""
    parser = argparse.ArgumentParser(description='瀏覽候選日期輔助工具')
    parser.add_argument('--period', default='2019-2020',
                        choices=['2019-2020', '2021-2022', '2023-2025'],
                        help='時期選擇')
    parser.add_argument('--tag', default=None,
                        help='標籤過濾（笑点/温馨/特殊事件/有梗/認真）')
    parser.add_argument('--limit', type=int, default=20,
                        help='顯示數量限制')
    parser.add_argument('--offset', type=int, default=0,
                        help='跳過前N個結果（用於分頁）')
    parser.add_argument('--min-score', type=int, default=3,
                        help='最低分數閾值')
    parser.add_argument('--interactive', action='store_true',
                        help='啟用互動式選擇模式')
    parser.add_argument('--output', default=None,
                        help='輸出檔案路徑')
    parser.add_argument('--include-used', action='store_true',
                        help='包含已使用的日期（預設會排除）')

    args = parser.parse_args()

    # 瀏覽日期
    sorted_dates = browse_dates(
        period=args.period,
        tag_filter=args.tag,
        limit=args.limit,
        min_score=args.min_score,
        exclude_used=not args.include_used,
        offset=args.offset
    )

    # 互動式選擇
    if args.interactive:
        interactive_select(sorted_dates, period=args.period, output_file=args.output)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
互動式審核介面
逐題檢視 AI 生成的題目，接受/拒絕/重新生成
"""

import json
import sys
from validate_questions import validate_all, calculate_quality_score


def load_draft_questions(draft_file='intermediate/new_questions_draft.json'):
    """載入 AI 生成的初稿題目"""
    with open(draft_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def format_conversation(conversation):
    """格式化對話顯示"""
    lines = []
    for msg in conversation:
        lines.append(f"  {msg['user']}: {msg['content']}")
    return '\n'.join(lines)


def format_options(question_data):
    """格式化選項顯示"""
    correct = question_data['correct_answer']
    wrong = question_data['wrong_answers']

    all_options = [{'text': correct, 'is_correct': True}]
    for w in wrong:
        all_options.append({'text': w, 'is_correct': False})

    # 模擬 a, b, c, d 排列
    option_ids = ['a', 'b', 'c', 'd']
    lines = []
    for i, opt in enumerate(all_options):
        marker = '[正確]' if opt['is_correct'] else ''
        lines.append(f"  {option_ids[i]}) {opt['text']} {marker}")

    return '\n'.join(lines)


def display_question(question, index, total):
    """顯示單個題目"""
    print('=' * 80)
    print(f'題目 {index+1}/{total}')
    print('=' * 80)
    print()

    print(f"日期: {question['date']}")
    print(f"類型: {question['type']}")
    print(f"難度: {question['difficulty']}")
    print(f"時期: {question['period']}")
    print()

    print("對話內容：")
    print(format_conversation(question['conversation']))
    print()

    q_data = question['question_data']

    print(f"題目：{q_data['question']}")
    print()

    print("選項：")
    print(format_options(q_data))
    print()

    print(f"解釋：{q_data['explanation']}")
    print()

    # 驗證結果
    is_valid, errors = validate_all(q_data, question['conversation'])
    if is_valid:
        print("驗證結果：✓ 所有檢查通過")
    else:
        print("驗證結果：✗ 發現問題")
        for error in errors:
            print(f"  - {error}")
    print()

    # 品質評分
    quality_score = question.get('quality_score', 0)
    print(f"品質評分：{quality_score:.1f}/10.0")
    print()


def review_question(question, index, total):
    """審核單個題目"""
    display_question(question, index, total)

    while True:
        print("操作：")
        print("  [A] 接受")
        print("  [R] 拒絕")
        print("  [S] 跳過（稍後審核）")
        print("  [V] 重新查看")
        print("  [Q] 結束審核")
        print()

        choice = input("> ").strip().upper()

        if choice == 'A':
            return 'accept'
        elif choice == 'R':
            reason = input("拒絕原因（可選）: ").strip()
            return 'reject', reason
        elif choice == 'S':
            return 'skip'
        elif choice == 'V':
            display_question(question, index, total)
        elif choice == 'Q':
            return 'quit'
        else:
            print("無效選項，請重新選擇")


def main():
    """主執行流程"""
    print('=' * 80)
    print('AI 題目審核介面')
    print('=' * 80)
    print()

    # 載入初稿
    print('載入 AI 生成的題目...')
    try:
        questions = load_draft_questions()
        print(f'  ✓ 載入 {len(questions)} 道題目')
        print()
    except FileNotFoundError:
        print('錯誤：找不到 intermediate/ai_generated_questions_draft.json')
        print('請先執行 generate_ai_auto_questions.py')
        sys.exit(1)

    # 審核結果
    accepted = []
    rejected = []
    skipped = []

    for i, question in enumerate(questions):
        result = review_question(question, i, len(questions))

        if result == 'accept':
            accepted.append(question)
            print(f"✓ 已接受題目 {i+1}")
            print()
        elif result[0] == 'reject':
            reason = result[1] if len(result) > 1 else ''
            question['rejection_reason'] = reason
            rejected.append(question)
            print(f"✗ 已拒絕題目 {i+1}")
            print()
        elif result == 'skip':
            skipped.append(question)
            print(f"⊙ 已跳過題目 {i+1}")
            print()
        elif result == 'quit':
            print()
            print(f"審核結束（已審核 {i}/{len(questions)} 道題目）")
            # 將未審核的題目加入 skipped
            skipped.extend(questions[i:])
            break

    # 統計結果
    print()
    print('=' * 80)
    print('審核結果統計')
    print('=' * 80)
    print()
    print(f'總題目數: {len(questions)}')
    print(f'已接受: {len(accepted)}')
    print(f'已拒絕: {len(rejected)}')
    print(f'已跳過: {len(skipped)}')
    print()

    # 保存結果
    if accepted:
        reviewed_file = 'intermediate/ai_generated_questions_reviewed.json'
        with open(reviewed_file, 'w', encoding='utf-8') as f:
            json.dump(accepted, f, ensure_ascii=False, indent=2)
        print(f'✓ 已接受的題目保存至: {reviewed_file}')

    if rejected:
        rejected_file = 'intermediate/ai_rejected_questions.json'
        with open(rejected_file, 'w', encoding='utf-8') as f:
            json.dump(rejected, f, ensure_ascii=False, indent=2)
        print(f'✓ 已拒絕的題目保存至: {rejected_file}')

    if skipped:
        print(f'⊙ {len(skipped)} 道題目被跳過，請稍後再審核')

    print()
    print('=' * 80)
    print('審核完成！')
    print('=' * 80)

    if accepted:
        print()
        print('下一步：')
        print('  執行 merge_ai_questions.py 將接受的題目合併到題庫')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
合併 AI 生成的題目到最終題庫
"""

import json
import shutil
import argparse
from datetime import datetime


# 型別映射（與 generate_final_ai_questions.py 保持一致）
TYPE_MAPPING = {
    'context-recall': {'category': '情境回憶', 'dimension': 'memory'},
    'detail-observation': {'category': '細節觀察', 'dimension': 'observation'},
    'preference-memory': {'category': '偏好記憶', 'dimension': 'care'},
    'opinion-expression': {'category': '評價觀點', 'dimension': 'understanding'},
    'action-motivation': {'category': '行為動機', 'dimension': 'empathy'},
    'action-intention': {'category': '行為意圖', 'dimension': 'understanding'},
}

# 難度權重
DIFFICULTY_WEIGHTS = {
    '简单': 1.0,
    '中等': 1.2,
    '困难': 1.5
}


def load_reviewed_questions(source_file='intermediate/ai_generated_questions_reviewed.json'):
    """載入審核通過的題目"""
    with open(source_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_existing_questions(target_file='final_questions_new.json'):
    """載入現有題庫"""
    try:
        with open(target_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []


def convert_to_final_format(ai_question, question_id):
    """將 AI 生成的題目轉換為最終格式"""
    q_data = ai_question['question_data']
    q_type = ai_question['type']
    difficulty = ai_question['difficulty']

    # 構建選項（隨機打亂）
    import random
    options = [
        {"id": "a", "text": q_data['correct_answer'], "isCorrect": True}
    ]

    option_ids = ["b", "c", "d"]
    for i, wrong in enumerate(q_data['wrong_answers'][:3]):
        options.append({"id": option_ids[i], "text": wrong, "isCorrect": False})

    # 隨機打亂
    random.shuffle(options)

    # 找出正確答案的新位置
    correct_answer = next(opt["id"] for opt in options if opt["isCorrect"])

    # 組裝最終格式
    return {
        "id": question_id,
        "type": q_type,
        "category": TYPE_MAPPING[q_type]['category'],
        "dimension": TYPE_MAPPING[q_type]['dimension'],
        "conversation": {
            "date": ai_question['date'],
            "context": ai_question['conversation'],
            "highlightIndex": q_data.get('highlight_index', 0)
        },
        "question": q_data['question'],
        "options": options,
        "correctAnswer": correct_answer,
        "explanation": q_data['explanation'],
        "weight": DIFFICULTY_WEIGHTS[difficulty],
        "difficulty": difficulty,
        "period": ai_question['period'],
        "tags": ai_question.get('tags', [])
    }


def validate_merged_questions(questions):
    """驗證合併後的題目"""
    errors = []

    # 檢查日期唯一性
    dates = [q['conversation']['date'] for q in questions]
    if len(dates) != len(set(dates)):
        duplicates = [date for date in dates if dates.count(date) > 1]
        errors.append(f"發現重複日期: {set(duplicates)}")

    # 檢查 ID 唯一性
    ids = [q['id'] for q in questions]
    if len(ids) != len(set(ids)):
        duplicates = [id for id in ids if ids.count(id) > 1]
        errors.append(f"發現重複 ID: {set(duplicates)}")

    return errors


def print_statistics(questions):
    """列印統計資訊"""
    print()
    print('題庫統計：')
    print(f'  總題數: {len(questions)}')
    print()

    # 時期分布
    period_count = {}
    for q in questions:
        period = q['period']
        period_count[period] = period_count.get(period, 0) + 1

    print('時期分布：')
    for period in sorted(period_count.keys()):
        print(f'  {period}: {period_count[period]} 題')
    print()

    # 題型分布
    type_count = {}
    for q in questions:
        qtype = q['type']
        type_count[qtype] = type_count.get(qtype, 0) + 1

    print('題型分布：')
    for qtype in sorted(type_count.keys()):
        print(f'  {TYPE_MAPPING[qtype]["category"]} ({qtype}): {type_count[qtype]} 題')
    print()

    # 難度分布
    diff_count = {}
    for q in questions:
        diff = q['difficulty']
        diff_count[diff] = diff_count.get(diff, 0) + 1

    print('難度分布：')
    for diff in ['简单', '中等', '困难']:
        count = diff_count.get(diff, 0)
        print(f'  {diff}: {count} 題')
    print()


def main():
    """主執行流程"""
    parser = argparse.ArgumentParser(description='合併 AI 生成的題目到最終題庫')
    parser.add_argument('--source', default='intermediate/ai_generated_questions_reviewed.json',
                        help='審核通過的題目檔案')
    parser.add_argument('--target', default='final_questions_new.json',
                        help='最終題庫檔案')
    parser.add_argument('--no-backup', action='store_true',
                        help='不建立備份')

    args = parser.parse_args()

    print('=' * 80)
    print('合併 AI 生成題目')
    print('=' * 80)
    print()

    # 載入題目
    print(f'載入來源: {args.source}')
    try:
        reviewed_questions = load_reviewed_questions(args.source)
        print(f'  ✓ 載入 {len(reviewed_questions)} 道題目')
    except FileNotFoundError:
        print(f'錯誤：找不到 {args.source}')
        print('請先執行 review_ai_questions.py 審核題目')
        return

    print(f'載入目標: {args.target}')
    existing_questions = load_existing_questions(args.target)
    print(f'  ✓ 載入 {len(existing_questions)} 道題目')
    print()

    # 建立備份
    if not args.no_backup and existing_questions:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f'backups/final_questions_new_{timestamp}.json'
        shutil.copy(args.target, backup_file)
        print(f'✓ 備份已建立: {backup_file}')
        print()

    # 指派 ID
    print('指派 ID...')
    if existing_questions:
        max_id = max(q['id'] for q in existing_questions)
        start_id = max_id + 1
    else:
        start_id = 1

    final_questions = []
    for i, ai_q in enumerate(reviewed_questions):
        question_id = start_id + i
        final_q = convert_to_final_format(ai_q, question_id)
        final_questions.append(final_q)
        print(f'  題目 {i+1} → ID {question_id}')
    print()

    # 合併
    merged_questions = existing_questions + final_questions

    # 驗證
    print('驗證合併結果...')
    errors = validate_merged_questions(merged_questions)
    if errors:
        print('✗ 發現問題：')
        for error in errors:
            print(f'  - {error}')
        print()
        print('請修正問題後重試')
        return

    print('  ✓ 所有驗證通過')
    print()

    # 統計資訊
    print_statistics(merged_questions)

    # 寫入最終檔案
    print(f'寫入 {args.target}...')
    with open(args.target, 'w', encoding='utf-8') as f:
        json.dump(merged_questions, f, ensure_ascii=False, indent=2)
    print('  ✓ 寫入完成')
    print()

    print('=' * 80)
    print('合併完成！')
    print('=' * 80)
    print()
    print(f'✓ 成功合併 {len(final_questions)} 道 AI 生成題目')
    print(f'✓ 題庫總題數：{len(existing_questions)} → {len(merged_questions)}')


if __name__ == '__main__':
    import random
    random.seed(42)
    main()

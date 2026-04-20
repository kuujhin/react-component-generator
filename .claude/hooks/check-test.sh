#!/usr/bin/env bash
# TDD 리마인더: src/**/*.ts(x) 수정 시 대응 테스트 파일 존재 여부 확인

input=$(cat)
file=$(echo "$input" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')

[ -z "$file" ] && exit 0

# Windows 백슬래시 → 슬래시 정규화
file_norm=$(echo "$file" | tr '\\' '/')

# src/ 경로 포함 여부 확인 (절대/상대 경로 모두 처리)
[[ "$file_norm" == */src/* || "$file_norm" == src/* ]] || exit 0

# .ts 또는 .tsx 파일만 처리
[[ "$file_norm" == *.ts || "$file_norm" == *.tsx ]] || exit 0

# 테스트 파일 자체는 제외
[[ "$file_norm" == *.test.ts || "$file_norm" == *.test.tsx ]] && exit 0

# 테스트 파일 경로 계산 (확장자 제거 후 .test.ts / .test.tsx 붙이기)
base="${file_norm%.*}"
# .tsx → base 가 여전히 .ts 를 포함할 수 있으므로 한 번 더 제거
base="${base%.ts}"

test_ts="${base}.test.ts"
test_tsx="${base}.test.tsx"

# Windows 원본 경로로도 확인 (백슬래시 경로)
base_orig="${file%.*}"
base_orig="${base_orig%.ts}"
test_ts_orig="${base_orig}.test.ts"
test_tsx_orig="${base_orig}.test.tsx"

if [ -f "$test_ts" ] || [ -f "$test_tsx" ] || [ -f "$test_ts_orig" ] || [ -f "$test_tsx_orig" ]; then
  exit 0
fi

{
  echo "⚠ TDD 리마인더: 테스트 파일이 없습니다 → $file"
  echo "  ./.claude/rules/tdd.md 의 RED-GREEN-REFACTOR 사이클을 확인하세요."
  echo "  테스트 전에 프로덕션 코드를 먼저 작성했다면 '삭제 강제 규칙'을 기억하세요."
} >&2

exit 0

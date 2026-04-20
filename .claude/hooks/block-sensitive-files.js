#!/usr/bin/env node
const chunks = [];
process.stdin.on('data', (d) => chunks.push(d));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    process.exit(0);
  }

  const filePath = (input.tool_input && input.tool_input.file_path) || '';
  const name = filePath.replace(/\\/g, '/').split('/').pop() || '';

  const SENSITIVE = [
    /^\.env(\..+)?$/,
    /\.(pem|key|pfx|p12|crt|cer|keystore|jks)$/i,
    /secret/i,
    /password/i,
    /credential/i,
    /private[_-]?key/i,
    /\.vault$/i,
  ];

  const isBlocked = SENSITIVE.some((re) => re.test(name));

  if (isBlocked) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: `보안 정책 위반: 민감 파일 "${name}"은 읽을 수 없습니다.`,
        },
      })
    );
  }

  process.exit(0);
});

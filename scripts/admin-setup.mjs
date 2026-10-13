import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { randomBytes, scryptSync } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

if (!process.stdin.isTTY) {
  console.error('터미널에서 npm run admin:setup을 실행해주세요.');
  process.exit(1);
}
let hidden = false;
const output = new Writable({ write(chunk, encoding, done) {
  if (!hidden) process.stdout.write(chunk, encoding);
  done();
}});
const rl = createInterface({ input: process.stdin, output, terminal: true });
rl.on('SIGINT', () => { rl.close(); process.exit(130); });
try {
  const username = (await rl.question('관리자 아이디 (영문·숫자·_.-, 3~64자): ')).trim();
  if (!/^[a-zA-Z0-9_.-]{3,64}$/.test(username)) throw new Error('아이디 형식을 확인해주세요.');
  process.stdout.write('비밀번호 (12자 이상, 입력 내용은 표시되지 않음): ');
  hidden = true;
  const password = await rl.question('');
  process.stdout.write('\n비밀번호 확인: ');
  const confirmation = await rl.question('');
  hidden = false;
  process.stdout.write('\n');
  if (password.length < 12 || password.length > 1024) throw new Error('비밀번호는 12~1024자여야 합니다.');
  if (password !== confirmation) throw new Error('비밀번호가 일치하지 않습니다.');
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString('hex');
  let source = '';
  try { source = await readFile('.env.local', 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const values = { ADMIN_USERNAME: username, ADMIN_PASSWORD_HASH: `scrypt:${salt}:${hash}` };
  if (!/^NEXTAUTH_URL=.+/m.test(source)) values.NEXTAUTH_URL = 'http://127.0.0.1:3000';
  if (!/^NEXTAUTH_SECRET=.+/m.test(source)) values.NEXTAUTH_SECRET = randomBytes(32).toString('base64');
  for (const [key, value] of Object.entries(values)) {
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    source = pattern.test(source) ? source.replace(pattern, () => line) : `${source.trimEnd()}\n${line}\n`;
  }
  await writeFile('.env.local', source.trimStart(), { mode: 0o600 });
  console.log('관리자 설정을 .env.local에 저장했습니다. 개발 서버를 재시작해주세요.');
  console.log('운영 배포에는 ADMIN_SETUP.md에 따라 환경변수 네 개를 등록해주세요. 비밀번호 원문은 저장하지 않았습니다.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally { rl.close(); }

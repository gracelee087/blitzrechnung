# Blitzrechnung 시작 가이드 (한국어)

## 1. 내 컴퓨터에서 실행하기 (처음 한 번)

1. **Node.js 설치:** https://nodejs.org 에서 LTS 버전을 받아 설치해요.
2. **압축 풀기:** 이 폴더(`blitzrechnung`)를 원하는 곳에 풀어요.
3. **Claude Code 열기:** 터미널에서 폴더로 이동한 뒤 Claude Code를 열어요.
   ```bash
   cd blitzrechnung
   claude
   ```
4. **실행 부탁하기:** Claude Code에게 이렇게 말하면 돼요.
   > "npm install 하고 npm run dev로 실행해줘"
5. **확인하기:** 브라우저에서 http://localhost:3000 을 열면 앱이 보여요.

## 2. 테스트 결제 해보기 (가짜 돈, devnet)

1. **Phantom 설치:** https://phantom.com 에서 설치해요. 휴대폰 앱이나 크롬 확장 중 편한 걸 쓰면 돼요.
2. **지갑 2개 만들기:** Phantom 안에 **지갑을 2개** 만들어요.
   - 지갑 A = 나(프리랜서, 돈 받는 쪽)
   - 지갑 B = 고객(돈 내는 쪽)
3. **테스트 모드 켜기:** Phantom 설정에서 **Developer Settings → Testnet Mode**를 켜고 **Solana Devnet**을 선택해요.
4. **지갑 B에 가짜 돈 넣기:**
   - https://faucet.solana.com 에서 **SOL**을 받아요. 수수료로 써요.
   - https://faucet.circle.com 에서 **Solana Devnet**을 고르고 **USDC**와 **EURC**를 받아요.
5. **앱 설정하기:** 앱의 **Settings**에 **지갑 A 주소**를 붙여넣고 저장해요.
6. **청구서 만들기:** **New invoice**에서 청구서를 만들고 **Open**을 눌러 결제 페이지를 열어요.
7. **결제하기:** Phantom에서 **지갑 B**로 바꾼 다음 **Pay with browser wallet**을 누르거나, 휴대폰 Phantom으로 **QR을 스캔**해요.
8. **확인하기:** 몇 초 뒤 화면이 **Paid ✓**로 바뀌면 성공이에요! 🎉

## 3. 매일 개발할 때

- Claude Code에게 하고 싶은 걸 **한국어로** 말하면 돼요. 예를 들면 이렇게요.
  > "청구서에 로고 넣는 기능 추가해줘"
- 바꾼 뒤에는 이렇게 말해 주세요.
  > "체크 돌려줘"
  - 그러면 `CLAUDE.md`에 적힌 검사(타입, 린트, 테스트, 빌드)를 돌려요.

## 4. 인터넷에 올리기 (금요일)

1. **GitHub에 올리기:** GitHub에 **공개(public)** 저장소를 만들고 올려요. Claude Code에게 부탁하면 돼요.
2. **Vercel에 배포하기:**
   - https://vercel.com 에 GitHub로 로그인해요.
   - **Add New → Project**에서 저장소를 선택하고 **Deploy**를 눌러요.
3. **완성:** 1~2분 뒤 `https://blitzrechnung-xxx.vercel.app` 같은 주소가 생겨요. 이 주소로 데모하면 돼요.

## 5. 제출 체크리스트 (WHU, 약 10월 4일)

- [ ] 공개 GitHub 저장소
- [ ] 작동하는 데모 (Vercel 주소)
- [ ] 피치덱 링크
- [ ] @SuperteamDE X 팔로우

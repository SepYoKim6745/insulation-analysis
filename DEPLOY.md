# 웹 사이트 배포 가이드

이 웹 애플리케이션을 무료로 배포하는 방법입니다.

## 방법 1: Netlify (가장 간단) ⭐ 추천

### 단계별 가이드:

1. **Netlify 웹사이트 접속**
   - https://www.netlify.com 접속
   - 무료 계정 생성 (GitHub, Google, Email로 가입 가능)

2. **배포 방법 A: 드래그 앤 드롭**
   - Netlify 대시보드에서 "Sites" 클릭
   - "Add new site" → "Deploy manually" 선택
   - `insulation-analysis` 폴더 전체를 드래그 앤 드롭
   - 자동으로 배포 완료!

3. **배포 방법 B: GitHub 연동**
   - GitHub에 프로젝트 업로드
   - Netlify에서 "Add new site" → "Import an existing project"
   - GitHub 저장소 선택
   - Build settings:
     - Build command: (비워두기)
     - Publish directory: `insulation-analysis` 또는 `.`
   - "Deploy site" 클릭

4. **사이트 주소 확인**
   - 배포 완료 후 `https://your-site-name.netlify.app` 형태의 주소 제공
   - "Site settings" → "Change site name"에서 원하는 이름으로 변경 가능

## 방법 2: GitHub Pages

### 단계별 가이드:

1. **GitHub 저장소 생성**
   - GitHub에 로그인
   - 새 저장소 생성 (예: `insulation-analysis`)

2. **프로젝트 업로드**
   ```bash
   cd insulation-analysis
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/insulation-analysis.git
   git push -u origin main
   ```

3. **GitHub Pages 활성화**
   - 저장소 페이지에서 "Settings" 클릭
   - 왼쪽 메뉴에서 "Pages" 선택
   - Source: "Deploy from a branch" 선택
   - Branch: `main` 선택, 폴더: `/ (root)` 선택
   - "Save" 클릭

4. **사이트 주소 확인**
   - 몇 분 후 `https://your-username.github.io/insulation-analysis` 형태의 주소로 접속 가능

## 방법 3: Vercel

### 단계별 가이드:

1. **Vercel 웹사이트 접속**
   - https://vercel.com 접속
   - 무료 계정 생성 (GitHub로 가입 권장)

2. **프로젝트 배포**
   - "Add New Project" 클릭
   - GitHub 저장소 선택 또는 폴더 업로드
   - Framework Preset: "Other" 선택
   - Root Directory: `insulation-analysis` 또는 `.`
   - "Deploy" 클릭

3. **사이트 주소 확인**
   - 배포 완료 후 `https://your-project.vercel.app` 형태의 주소 제공

## 방법 4: Firebase Hosting

### 단계별 가이드:

1. **Firebase CLI 설치**
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase 로그인 및 초기화**
   ```bash
   firebase login
   cd insulation-analysis
   firebase init hosting
   ```
   - 설정 선택:
     - What do you want to use as your public directory? → `.` 또는 `insulation-analysis`
     - Configure as a single-page app? → `Yes`
     - Set up automatic builds? → `No`

3. **배포**
   ```bash
   firebase deploy
   ```

4. **사이트 주소 확인**
   - Firebase Console에서 호스팅 URL 확인

## 추천 순서

1. **Netlify** - 가장 간단하고 빠름 (드래그 앤 드롭 가능)
2. **GitHub Pages** - GitHub 사용자에게 친숙
3. **Vercel** - 빠른 배포 속도
4. **Firebase Hosting** - Google 서비스와 통합 필요시

## 참고사항

- 모든 플랫폼이 무료로 제공됩니다
- 커스텀 도메인 연결도 가능합니다 (대부분 무료)
- HTTPS 자동 적용됩니다
- 배포 후 자동 업데이트 설정 가능합니다 (Git 연동시)


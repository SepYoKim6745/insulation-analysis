# 절연성능 평가 시스템

절연성능 평가 및 절연저항 열화 패턴 분류를 위한 웹 기반 분석 시스템입니다.

## 시스템 개요

본 시스템은 전기 설비의 절연성능을 정량적으로 평가하고, 절연저항의 열화 패턴을 분류하여 예측 기반 유지보수를 지원하는 웹 애플리케이션입니다. 2가지 평가 모드를 제공하며, 데이터 시각화와 이력 관리 기능을 포함합니다.

---

## 주요 기능

### 1. 절연성능 경향평가 (Performance Evaluation)

전류-온도 데이터를 기반으로 절연성능을 정량적으로 평가합니다.

#### 입력
- **전류(I)**: 5분 간격 측정값 [A]
- **온도(T)**: 5분 간격 측정값 [℃]
- **입력 방식**: 단일 입력 또는 Excel/CSV 파일 업로드

#### 계산 지표
1. **전기적 스트레스 (S_I)**
   - 정의: S_I = I_max / I_critic
   - I_max: 측정 전류의 최댓값
   - I_critic: 허용온도(70℃) 도달 시 임계전류

2. **열적 스트레스 (S_T)**
   - 정의: S_T = T_max / T_critic
   - T_max: 측정 온도의 최댓값
   - T_critic: 허용온도 (70℃)

3. **온도반응 민감도 (R)**
   - 정의: R = (T_n2 - T_n1) / (I_n2 - I_n1)
   - 연속 측정값 간 온도변화율

#### 출력
- 각 지표별 위험도 4단계 평가 (L1~L4)
- 위험도 수준별 점검 체크리스트
- 전류-온도 관계 산점도 그래프

### 2. 절연저항 패턴평가 (Degradation Pattern Classification)

시계열 절연저항 데이터의 열화 패턴을 5가지 유형으로 분류합니다.

#### 입력
- **연도+월**: YYYY-MM 형식
- **절연저항**: 측정값 [MΩ]
- **입력 방식**: 단일 입력 또는 Excel/CSV 파일 업로드

#### 분류 패턴
1. **임계형 (Critical)**: 급격한 저하, 1MΩ 이하 도달
2. **가속형 (Accelerated)**: 100MΩ 미만, 70% 이상 감소
3. **완만형 (Gradual)**: 10~20% 완만한 저하
4. **국부형 (Localized)**: 일시적 저하 반복
5. **안정형 (Stable)**: 1000MΩ 이상, 변동폭 ±1% 이내

#### 출력
- 열화 단계 (Healthy/Initiation/Anomaly/Propagation/Failure)
- 권장 관리 방향 및 점검 주기
- 절연저항 시계열 그래프

---

## 파일 구조 및 설명

```
insulation-analysis/
├── index.html      # 사용자 인터페이스 구조 정의
├── styles.css      # 스타일시트 (UI 디자인)
├── script.js       # 핵심 분석 로직 및 이벤트 처리
└── README.md       # 문서 (본 파일)
```

### 주요 외부 라이브러리
- **Chart.js (v4.4.0)**: 데이터 시각화 (그래프 생성)
- **SheetJS (v0.18.5)**: Excel/CSV 파일 파싱

---

## 핵심 코드 설명

### 1. 절연성능 평가 - 임계전류 계산 ([script.js:41-55](script.js#L41-L55))

```javascript
// 회귀식: T = 39.452 + 0.025 * I + 0.014 * I²
// T_critic(70℃) 도달 시 I_critic 계산 (2차 방정식 해법)
const a = REGRESSION_C; // 0.014 (I²의 계수)
const b = REGRESSION_B; // 0.025 (I의 계수)
const c = REGRESSION_A - T_CRITIC; // 39.452 - 70 = -30.548

const discriminant = b * b - 4 * a * c; // 판별식
let iCritic;
if (discriminant >= 0) {
    iCritic = (-b + Math.sqrt(discriminant)) / (2 * a);
} else {
    iCritic = 100; // 기본값
}
```

**설명**: 온도-전류 관계를 2차 회귀식으로 모델링하고, 허용온도(70℃)에 도달하는 임계전류를 2차 방정식의 근의 공식으로 계산합니다.

---

### 2. 절연성능 평가 - 위험도 분류 ([script.js:358-384](script.js#L358-L384))

```javascript
// 전기적 스트레스 위험도 평가
function evaluateRiskI(deltaI) {
    if (deltaI < 1.0) return { level: 'L1', name: '정상', class: 'risk-l1' };
    if (deltaI < 1.2) return { level: 'L2', name: '주의', class: 'risk-l2' };
    if (deltaI < 1.5) return { level: 'L3', name: '경계', class: 'risk-l3' };
    return { level: 'L4', name: '위험', class: 'risk-l4' };
}

// 열적 스트레스 위험도 평가
function evaluateRiskT(deltaT) {
    if (deltaT < 0.5) return { level: 'L1', name: '정상', class: 'risk-l1' };
    if (deltaT < 0.8) return { level: 'L2', name: '주의', class: 'risk-l2' };
    if (deltaT < 1.0) return { level: 'L3', name: '경계', class: 'risk-l3' };
    return { level: 'L4', name: '위험', class: 'risk-l4' };
}

// 온도반응 민감도 위험도 평가
function evaluateRiskR(sensitivity) {
    if (sensitivity === null) {
        return { level: '-', name: '기준값', class: 'risk-baseline' };
    }
    if (sensitivity < 0.4) return { level: 'L1', name: '보통', class: 'risk-l1' };
    if (sensitivity < 1.0) return { level: 'L2', name: '높음', class: 'risk-l2' };
    if (sensitivity < 1.5) return { level: 'L3', name: '위험', class: 'risk-l3' };
    return { level: 'L4', name: '치명', class: 'risk-l4' };
}
```

**설명**: 계산된 스트레스 지표를 임계값 기반으로 4단계 위험도(L1~L4)로 분류합니다. 각 지표마다 고유한 임계값 기준을 적용합니다.

---

### 3. 절연저항 패턴 분석 - 열화 분류 ([script.js:835-938](script.js#L835-L938))

```javascript
function analyzeInsulationPattern(data) {
    // 통계 계산
    const firstValue = data[0].resistance;
    const lastValue = data[data.length - 1].resistance;
    const totalDecreaseRate = ((firstValue - lastValue) / firstValue) * 100;

    // 변동성 계산 (표준편차)
    const mean = data.reduce((sum, d) => sum + d.resistance, 0) / data.length;
    const variance = data.reduce((sum, d) => sum + Math.pow(d.resistance - mean, 2), 0) / data.length;
    const volatility = (Math.sqrt(variance) / mean) * 100;

    // 패턴 분류 로직
    if (belowThreshold || totalDecreaseRate >= 90) {
        pattern = '임계형 (Critical)';
        stage = 'Failure (임계열화)';
        management = '운전중지, 정밀점검, 배선 교체';
    }
    else if (below100 && totalDecreaseRate >= 70) {
        pattern = '가속형 (Accelerated)';
        stage = 'Propagation (진전열화)';
        management = '점검주기 단축 (분기점검)';
    }
    else if (totalDecreaseRate >= 10 && totalDecreaseRate <= 20 && temporaryDrops === 0) {
        pattern = '완만형 (Gradual)';
        stage = 'Initiation (초기열화)';
        management = '경년추이 감시 (반기점검)';
    }
    // ... 추가 분류 로직
}
```

**설명**: 시계열 데이터의 감소율, 변동성, 임계치 도달 여부를 종합적으로 분석하여 5가지 열화 패턴으로 분류합니다. 각 패턴에 따라 적절한 유지보수 방향을 제시합니다.

---

### 4. 파일 업로드 처리 - Excel/CSV 파싱 ([script.js:571-627](script.js#L571-L627))

```javascript
// Excel 파일 읽기 (SheetJS 라이브러리 사용)
function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                resolve(jsonData);
            } catch (error) {
                reject(new Error('Excel 파일을 읽는 중 오류가 발생했습니다: ' + error.message));
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

// CSV 파일 읽기
function readCSVFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                const lines = text.split('\n').filter(line => line.trim() !== '');
                const jsonData = lines.map(line => {
                    return line.split(',').map(part => part.trim());
                });
                resolve(jsonData);
            } catch (error) {
                reject(new Error('CSV 파일을 읽는 중 오류가 발생했습니다: ' + error.message));
            }
        };
        reader.readAsText(file, 'UTF-8');
    });
}
```

**설명**: FileReader API와 SheetJS 라이브러리를 사용하여 Excel/CSV 파일을 비동기로 읽고 2차원 배열 형태로 파싱합니다.

---

### 5. 데이터 시각화 - Chart.js 그래프 생성 ([script.js:1433-1519](script.js#L1433-L1519))

```javascript
function updatePerformanceChartWithData(data) {
    const scatterData = data.map(item => ({
        x: item.current,
        y: item.temperature
    }));

    performanceChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: '전류-온도 응답수준',
                data: scatterData,
                borderColor: 'rgb(102, 126, 234)',
                showLine: true,
                tension: 0.4
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Current (A)' } },
                y: { title: { display: true, text: 'Temperature (℃)' } }
            }
        }
    });
}
```

**설명**: Chart.js 라이브러리를 사용하여 전류-온도 관계를 산점도(scatter plot)로 시각화합니다. showLine 옵션으로 데이터 포인트를 연결합니다.

---

### 6. 로컬 저장소 관리 - 평가 이력 저장 ([script.js:1017-1029](script.js#L1017-L1029))

```javascript
function saveRecord(record) {
    const key = record.type === 'performance' ? STORAGE_KEY_PERFORMANCE : STORAGE_KEY_DEGRADATION;
    const history = getHistory(record.type);
    history.unshift(record); // 최신 기록을 맨 앞에 추가

    // 최대 100개까지만 저장
    if (history.length > 100) {
        history.pop();
    }

    localStorage.setItem(key, JSON.stringify(history));
}
```

**설명**: Web Storage API의 localStorage를 사용하여 평가 결과를 브라우저에 영구 저장합니다. 최대 100개 기록만 유지하여 저장 공간을 관리합니다.

---

## 수학적 모델 및 알고리즘

### 1. 절연성능 평가 회귀 모델

**온도-전류 관계식 (2차 다항 회귀)**

```
T = 39.452 + 0.025·I + 0.014·I²
```

- **T**: 온도 [℃]
- **I**: 전류 [A]
- **계수**: 실측 데이터 기반 최소자승법으로 추정

**임계전류 계산 (2차 방정식 해법)**

```
T_critic = 39.452 + 0.025·I_critic + 0.014·I_critic²
0.014·I_critic² + 0.025·I_critic + (39.452 - 70) = 0

I_critic = [-0.025 + √(0.025² - 4×0.014×(-30.548))] / (2×0.014)
```

### 2. 절연저항 열화 분석 통계 지표

**전체 감소율**

```
감소율(%) = (R_first - R_last) / R_first × 100
```

**변동성 (변동계수, Coefficient of Variation)**

```
CV(%) = (σ / μ) × 100

σ = √[Σ(R_i - μ)² / n]  (표준편차)
μ = Σ R_i / n            (평균)
```

### 3. 위험도 분류 기준

| 지표 | L1 (정상) | L2 (주의) | L3 (경계) | L4 (위험) |
|------|-----------|-----------|-----------|-----------|
| **전기적 스트레스 (S_I)** | < 1.0 | 1.0 ~ 1.2 | 1.2 ~ 1.5 | ≥ 1.5 |
| **열적 스트레스 (S_T)** | < 0.5 | 0.5 ~ 0.8 | 0.8 ~ 1.0 | ≥ 1.0 |
| **온도반응 민감도 (R)** | < 0.4 | 0.4 ~ 1.0 | 1.0 ~ 1.5 | ≥ 1.5 |

---

## 사용 방법

### 1. 시스템 실행
1. `index.html` 파일을 웹 브라우저에서 열기
2. 상단 모드 버튼으로 평가 유형 선택

### 2. 절연성능 경향평가
**방법 1: 단일 데이터 입력**
- 5분 간격으로 전류/온도 측정값 입력 (최소 2회)
- "계산 및 저장" 클릭

**방법 2: 파일 업로드**
- Excel/CSV 파일 준비 (형식: 전류, 온도)
- "다량 데이터 분석" 클릭

### 3. 절연저항 패턴평가
**방법 1: 단일 데이터 입력**
- 연도, 월, 절연저항 입력
- "추가" 클릭 (이전 기록과 자동 병합 가능)

**방법 2: 파일 업로드**
- Excel/CSV 파일 준비 (형식: 연도, 월, 절연저항)
- "다량 데이터 분석" 클릭

### 4. 결과 확인 및 이력 관리
- 평가 결과는 자동으로 localStorage에 저장
- "평가 기록" 섹션에서 이력 조회/삭제
- 체크박스 선택 후 "선택한 기록 그래프 보기"로 데이터 시각화

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **데이터 처리** | SheetJS (xlsx) v0.18.5 |
| **시각화** | Chart.js v4.4.0 |
| **저장소** | Web Storage API (localStorage) |
| **실행 환경** | 모던 웹 브라우저 (Chrome, Firefox, Edge, Safari) |

---

## 논문 부록 활용 가이드

### 부록 A: 시스템 아키텍처
- [index.html](index.html): 사용자 인터페이스 구조
- [script.js](script.js): 핵심 분석 알고리즘

### 부록 B: 핵심 알고리즘 코드
- **임계전류 계산**: [script.js:41-55](script.js#L41-L55)
- **위험도 분류**: [script.js:358-384](script.js#L358-L384)
- **열화 패턴 분석**: [script.js:835-938](script.js#L835-L938)

### 부록 C: 데이터 입출력
- **파일 파싱**: [script.js:571-627](script.js#L571-L627)
- **그래프 생성**: [script.js:1433-1519](script.js#L1433-L1519)

---

## 참고사항

- 본 시스템은 웹 기반으로 설계되어 별도 설치 없이 브라우저에서 즉시 사용 가능
- 모든 데이터는 클라이언트 측(브라우저)에서 처리되며 서버 전송 없음
- localStorage 용량 제한(일반적으로 5~10MB)으로 최대 100개 기록만 저장
- 정확한 분석을 위해 측정 데이터의 품질과 일관성 확보 필요


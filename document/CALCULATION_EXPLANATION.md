# 계산식 코드 설명

`script.js` 파일의 주요 계산식 코드에 대한 상세 설명입니다.

## 목차
1. [상수 정의](#1-상수-정의)
2. [Icritic 계산](#2-icritic-계산---핵심-계산)
3. [정량지표 계산](#3-정량지표-계산)
4. [위험도 평가 함수들](#4-위험도-평가-함수들)
5. [절연저항 열화 패턴 분류](#5-절연저항-열화-패턴-분류)
6. [계산 흐름 요약](#계산-흐름-요약)

---

## 1. 상수 정의 (1-5줄)

```javascript
const T_CRITIC = 70; // 허용온도 (℃)
const REGRESSION_A = 39.452;
const REGRESSION_B = 0.025;
const REGRESSION_C = 0.014;
```

**설명:**
- `T_CRITIC`: 전기배선의 허용온도 70℃
- 회귀식 계수들: 온도와 전류의 관계를 나타내는 2차 회귀식의 계수
- **회귀식**: `T = 39.452 + 0.025 × I + 0.014 × I²`
  - I: 전류 (A)
  - T: 온도 (℃)

---

## 2. Icritic 계산 - 핵심 계산 (39-53줄)

### 목적
회귀식을 역산하여 **허용온도(70℃)에 도달하는 임계 전류값(Icritic)**을 구합니다.

### 계산 과정

#### 1단계: 회귀식을 이차방정식으로 변환

원래 회귀식:
```
T = 39.452 + 0.025 × I + 0.014 × I²
```

목표: T = 70℃일 때의 I값을 구하기
```
70 = 39.452 + 0.025 × I + 0.014 × I²
```

이항하여 이차방정식 형태로 변환:
```
0 = 0.014 × I² + 0.025 × I + (39.452 - 70)
0 = 0.014 × I² + 0.025 × I - 30.548
```

#### 2단계: 이차방정식 계수 설정

```javascript
const a = REGRESSION_C;  // 0.014 (I²의 계수)
const b = REGRESSION_B;  // 0.025 (I의 계수)
const c = REGRESSION_A - T_CRITIC;  // 39.452 - 70 = -30.548 (상수항)
```

#### 3단계: 판별식과 근의 공식 적용

```javascript
const discriminant = b * b - 4 * a * c;  // 판별식: b² - 4ac
let iCritic;
if (discriminant >= 0) {
    iCritic = (-b + Math.sqrt(discriminant)) / (2 * a);  // 근의 공식
} else {
    iCritic = 100; // 기본값 (판별식이 음수인 경우)
}
```

**근의 공식:**
```
I = (-b ± √(b² - 4ac)) / (2a)
```

양수 해만 사용 (물리적으로 의미있는 값)

**의미:**
- Icritic은 허용온도 70℃에 도달하는 임계 전류값
- 이 값과 실제 측정 전류를 비교하여 전기적 스트레스를 평가

---

## 3. 정량지표 계산 (55-58줄)

### 3가지 핵심 지표

```javascript
const deltaI = current / iCritic;        // 전기적 스트레스
const deltaT = temperature / T_CRITIC;    // 열적 스트레스
const sensitivity = deltaT / deltaI;     // 온도반응 민감도
```

#### 1. ΔI (전기적 스트레스)
- **공식**: `ΔI = Imax / Icritic`
- **의미**: 측정된 전류가 임계 전류의 몇 배인지
- **해석**:
  - 1.0 미만: 정상 (임계값 미만)
  - 1.0 이상: 위험 (임계값 초과)

#### 2. ΔT (열적 스트레스)
- **공식**: `ΔT = Tmax / Tcritic`
- **의미**: 측정된 온도가 허용온도의 몇 배인지
- **해석**:
  - 1.0 미만: 정상 (허용온도 미만)
  - 1.0 이상: 위험 (허용온도 초과)

#### 3. R (온도반응 민감도)
- **공식**: `R = ΔT / ΔI`
- **의미**: 전류 변화에 대한 온도 반응의 민감도 (단위: ℃/A)
- **해석**:
  - 값이 클수록 전류 변화에 온도가 민감하게 반응
  - 절연체의 열화 상태를 나타내는 지표

---

## 4. 위험도 평가 함수들

### 4.1 전기적 스트레스 위험도 (73-78줄)

```javascript
function evaluateRiskI(deltaI) {
    if (deltaI < 1.0) return { level: 'L1', name: '정상', class: 'risk-l1' };
    if (deltaI < 1.2) return { level: 'L2', name: '주의', class: 'risk-l2' };
    if (deltaI < 1.5) return { level: 'L3', name: '경계', class: 'risk-l3' };
    return { level: 'L4', name: '위험', class: 'risk-l4' };
}
```

**위험도 기준:**
- **L1 (정상)**: ΔI < 1.0
- **L2 (주의)**: 1.0 ≤ ΔI < 1.2
- **L3 (경계)**: 1.2 ≤ ΔI < 1.5
- **L4 (위험)**: ΔI ≥ 1.5 (7배수 가정)

### 4.2 열적 스트레스 위험도 (81-86줄)

```javascript
function evaluateRiskT(deltaT) {
    if (deltaT < 0.5) return { level: 'L1', name: '정상', class: 'risk-l1' };
    if (deltaT < 0.8) return { level: 'L2', name: '주의', class: 'risk-l2' };
    if (deltaT < 1.0) return { level: 'L3', name: '경계', class: 'risk-l3' };
    return { level: 'L4', name: '위험', class: 'risk-l4' };
}
```

**위험도 기준:**
- **L1 (정상)**: ΔT < 0.5
- **L2 (주의)**: 0.5 ≤ ΔT < 0.8
- **L3 (경계)**: 0.8 ≤ ΔT < 1.0
- **L4 (위험)**: ΔT ≥ 1.0 (도달시 위험)

### 4.3 온도반응 민감도 위험도 (89-94줄)

```javascript
function evaluateRiskR(sensitivity) {
    if (sensitivity < 0.4) return { level: 'L1', name: '보통', class: 'risk-l1' };
    if (sensitivity < 1.0) return { level: 'L2', name: '높음', class: 'risk-l2' };
    if (sensitivity < 1.5) return { level: 'L3', name: '위험', class: 'risk-l3' };
    return { level: 'L4', name: '치명', class: 'risk-l4' };
}
```

**위험도 기준:**
- **L1 (보통)**: R < 0.4 ℃/A
- **L2 (높음)**: 0.4 ≤ R < 1.0 ℃/A
- **L3 (위험)**: 1.0 ≤ R < 1.5 ℃/A
- **L4 (치명)**: R ≥ 1.5 ℃/A

---

## 5. 절연저항 열화 패턴 분류 (272-359줄)

### 함수: `classifyDegradationPattern(resistance, previousResistance, measurementCount)`

절연저항 값과 이전 측정값을 비교하여 5가지 패턴 중 하나로 분류합니다.

### 분류 로직

#### 1. 임계형 (Critical) - 282-292줄
```javascript
if (resistance < 1.0) {
    return {
        type: '임계형',
        characteristics: '급격한 저하 (전체 기울기 90% 이상), 임계치 초과',
        stage: '임계열화 (Failure)',
        management: '운전중지, 정밀점검, 배선교체'
    };
}
```
- **조건**: 저항 < 1MΩ
- **특징**: 절연체 기능 상실
- **조치**: 즉시 운전 중지 필요

#### 2. 가속형 (Accelerated) - 295-305줄
```javascript
if (resistance < 100 && degradationRate >= 70) {
    return {
        type: '가속형',
        characteristics: '100MΩ 미달, 급격한 저하 (전체 기울기 70% 이상)',
        stage: '진전열화 (Propagation)',
        management: '점검주기 단축 (분기점검)'
    };
}
```
- **조건**: 저항 < 100MΩ AND 저하율 ≥ 70%
- **특징**: 급격한 열화 진행 중
- **조치**: 점검 주기 단축

#### 3. 국부형 (Localized) - 308-321줄
```javascript
if (resistance >= 300 && previousResistance) {
    const tempDegradation = degradationRate;
    if (tempDegradation < 10 && measurementCount >= 2) {
        return {
            type: '국부형',
            characteristics: '300MΩ 이상, 일시적 저하 (2회, 10% 미만), 특이점 반복',
            stage: '이상열화 (Anomaly)',
            management: '경년추이 감시 (반기점검), 300MΩ 미만시 단축점검(분기)'
        };
    }
}
```
- **조건**: 저항 ≥ 300MΩ AND 일시적 저하(10% 미만) AND 측정 2회 이상
- **특징**: 국부적 문제 가능성
- **조치**: 경년추이 감시

#### 4. 완만형 (Gradual) - 324-334줄
```javascript
if (previousResistance && degradationRate >= 10 && degradationRate <= 20) {
    return {
        type: '완만형',
        characteristics: '완만한 저하 (10~20%), 특이점 없음',
        stage: '초기열화 (Initiation)',
        management: '경년추이 감시 (반기점검)'
    };
}
```
- **조건**: 저하율 10~20%
- **특징**: 정상적인 노화 과정
- **조치**: 정기 점검

#### 5. 안정형 (Stable) - 337-347줄
```javascript
if (resistance >= 1000) {
    return {
        type: '안정형',
        characteristics: '1,000MΩ 이상, 변동폭 ±1%',
        stage: '건전상태 (Healthy)',
        management: '정상절연 확인 (연간점검)'
    };
}
```
- **조건**: 저항 ≥ 1000MΩ
- **특징**: 정상 상태
- **조치**: 연간 점검

#### 6. 기본값 - 350-358줄
위 조건에 해당하지 않으면 완만형으로 분류

---

## 계산 흐름 요약

```
┌─────────────────┐
│ 입력값 받기      │
│ - 전류 (I)      │
│ - 온도 (T)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Icritic 계산    │
│ (회귀식 역산)   │
│ T=70℃일 때 I값  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 정량지표 계산    │
│ - ΔI = I/Icritic│
│ - ΔT = T/70     │
│ - R = ΔT/ΔI     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 위험도 평가      │
│ - L1~L4 레벨    │
│ - 각 지표별 평가│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 결과 표시        │
│ - 위험도 표시    │
│ - 체크리스트 출력│
└─────────────────┘
```

---

## 참고사항

### 회귀식의 물리적 의미
- 회귀식 `T = 39.452 + 0.025 × I + 0.014 × I²`는 시뮬레이션 데이터를 기반으로 한 경험식입니다.
- 전류의 제곱항(I²)이 포함되어 있어, 전류가 증가할수록 온도가 비선형적으로 상승함을 나타냅니다.
- 이는 전류의 제곱에 비례하는 열 발생(저항 손실)을 반영합니다.

### 계산의 정확도
- Icritic 계산 시 판별식이 음수인 경우는 이론적으로 발생하지 않아야 하지만, 안전을 위해 기본값(100A)을 설정했습니다.
- 실제 사용 시 회귀식 계수는 실제 측정 데이터를 기반으로 재계산해야 할 수 있습니다.

### 위험도 기준의 근거
- 위험도 기준은 산업 안전 기준과 경험적 데이터를 기반으로 설정되었습니다.
- L4(위험) 수준에 도달하면 즉각적인 조치가 필요합니다.


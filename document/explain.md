# 절연 분석 시스템 주요 코드 설명

본 문서는 절연 분석 시스템의 핵심 기능을 구현한 주요 코드 섹션에 대한 설명을 담고 있습니다.

## 목차
1. [위험도 평가 알고리즘](#1-위험도-평가-알고리즘)
2. [그리드 레이아웃 기반 체크리스트 UI](#2-그리드-레이아웃-기반-체크리스트-ui)
3. [컨텍스트 인식 DOM 쿼리 시스템](#3-컨텍스트-인식-dom-쿼리-시스템)
4. [실시간 UI 업데이트 메커니즘](#4-실시간-ui-업데이트-메커니즘)
5. [시계열 데이터 분석](#5-시계열-데이터-분석)

---

## 1. 위험도 평가 알고리즘

### 1.1 전기적 스트레스 위험도 평가
**위치**: [script.js:166-182](script.js#L166-L182)

```javascript
function evaluateRiskI(deltaI) {
    if (deltaI >= 0.6) {
        return { level: 'L4', description: '매우 높은 위험도', color: '#d32f2f', action: '긴급 점검 필요' };
    } else if (deltaI >= 0.4) {
        return { level: 'L3', description: '높은 위험도', color: '#f57c00', action: '점검 필요' };
    } else if (deltaI >= 0.2) {
        return { level: 'L2', description: '중간 위험도', color: '#fbc02d', action: '주의 관찰' };
    } else {
        return { level: 'L1', description: '낮은 위험도', color: '#388e3c', action: '정상 운전' };
    }
}
```

**설명**:
- ΔI 값(전류 변화율)을 기반으로 4단계 위험도 평가 수행
- 임계값: L4(≥0.6), L3(≥0.4), L2(≥0.2), L1(<0.2)
- 각 레벨별로 위험도 설명, 색상 코드, 권장 조치사항 반환

### 1.2 열적 스트레스 위험도 평가
**위치**: [script.js:185-201](script.js#L185-L201)

```javascript
function evaluateRiskT(deltaT) {
    if (deltaT >= 0.6) {
        return { level: 'L4', description: '매우 높은 위험도', color: '#d32f2f', action: '긴급 냉각 필요' };
    } else if (deltaT >= 0.4) {
        return { level: 'L3', description: '높은 위험도', color: '#f57c00', action: '냉각 검토' };
    } else if (deltaT >= 0.2) {
        return { level: 'L2', description: '중간 위험도', color: '#fbc02d', action: '온도 모니터링' };
    } else {
        return { level: 'L1', description: '낮은 위험도', color: '#388e3c', action: '정상 온도' };
    }
}
```

**설명**:
- ΔT 값(온도 변화율)을 기반으로 4단계 위험도 평가 수행
- 전기적 스트레스와 동일한 임계값 구조 사용
- 열적 특성에 맞춘 권장 조치사항 제공

### 1.3 열화 민감도 위험도 평가
**위치**: [script.js:204-220](script.js#L204-L220)

```javascript
function evaluateRiskR(sensitivity) {
    if (sensitivity >= 10) {
        return { level: 'L4', description: '매우 높은 민감도', color: '#d32f2f', action: '즉시 교체 검토' };
    } else if (sensitivity >= 5) {
        return { level: 'L3', description: '높은 민감도', color: '#f57c00', action: '교체 계획 수립' };
    } else if (sensitivity >= 2) {
        return { level: 'L2', description: '중간 민감도', color: '#fbc02d', action: '지속 관찰' };
    } else {
        return { level: 'L1', description: '낮은 민감도', color: '#388e3c', action: '정상 상태' };
    }
}
```

**설명**:
- 열화 민감도 값을 기반으로 4단계 위험도 평가
- 임계값: L4(≥10), L3(≥5), L2(≥2), L1(<2)
- 절연 열화 상태에 따른 교체 및 관리 권장사항 제공

---

## 2. 그리드 레이아웃 기반 체크리스트 UI

### 2.1 전기적 스트레스 체크리스트 레이아웃
**위치**: [script.js:467-562](script.js#L467-L562)

```javascript
html += `
    <div style="margin-bottom: 30px; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h4 style="color: #667eea; margin-bottom: 15px; font-size: 1.2em;">⚡ 전기적 스트레스 점검지표</h4>
        <div style="display: grid; grid-template-columns: 1fr 400px; gap: 20px;">
            <!-- 왼쪽: 체크리스트 항목들 -->
            <div>
                <div class="checklist-item" style="margin-bottom: 8px;">
                    <input type="checkbox" class="checklist-checkbox" data-category="electric" data-weight="2">
                    <label>운전 중 정격전류를 초과하는 구간이 존재하는가?</label>
                </div>
                <!-- ... 추가 체크리스트 항목들 ... -->
            </div>

            <!-- 오른쪽: 점수, 상태, 관리방안 -->
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; text-align: center; color: white;">
                    <div style="font-size: 0.9em; opacity: 0.9; margin-bottom: 5px;">전기적 스트레스 점수</div>
                    <div id="electric-score" style="font-size: 2.5em; font-weight: bold;">0</div>
                    <div style="font-size: 0.8em; opacity: 0.8; margin-top: 5px;">/ 12점</div>
                </div>

                <div id="electric-status-result" style="padding: 15px; background: #f5f5f5; border-radius: 8px; border-left: 4px solid #667eea;">
                    <div style="font-weight: bold; margin-bottom: 8px; color: #667eea;">📊 현재 상태</div>
                    체크리스트를 선택해주세요.
                </div>

                <div id="electric-management-result" style="padding: 15px; background: #f5f5f5; border-radius: 8px; border-left: 4px solid #667eea;">
                    <div style="font-weight: bold; margin-bottom: 8px; color: #667eea;">🔧 관리 방안</div>
                    <div id="electric-management-detail">관리방안이 여기에 표시됩니다.</div>
                </div>
            </div>
        </div>
    </div>
`;
```

**설명**:
- **CSS Grid 레이아웃**: `grid-template-columns: 1fr 400px`를 사용하여 체크리스트와 결과를 좌우 배치
- **왼쪽 영역**: 체크리스트 항목들 (유동 너비)
- **오른쪽 영역**: 고정 너비(400px)로 점수, 상태, 관리방안 표시
- **그라데이션 배경**: 카테고리별 구분을 위한 색상 코딩 (전기: 보라색, 열: 분홍색, 민감도: 파란색)
- **가중치 시스템**: `data-weight` 속성으로 각 항목의 중요도 차등 적용

### 2.2 반응형 결과 표시 영역
**설명**:
- **점수 박스**: 그라데이션 배경으로 시각적 강조, 실시간 점수 업데이트
- **상태 박스**: 현재 위험도 수준 표시 (색상 코드와 함께)
- **관리방안 박스**: 점수 구간별 구체적인 관리 권장사항 제공
- **Flexbox 레이아웃**: `flex-direction: column`으로 수직 정렬, `gap: 10px`로 일정한 간격 유지

---

## 3. 컨텍스트 인식 DOM 쿼리 시스템

### 3.1 문제 상황
상세보기 화면에서 체크박스를 선택해도 점수가 업데이트되지 않는 문제가 발생했습니다. 이는 메인 화면과 상세보기 화면에 동일한 ID를 가진 요소가 존재하여, `getElementById`가 항상 메인 화면의 요소를 찾기 때문이었습니다.

### 3.2 해결 방법: 컨텍스트 기반 쿼리
**위치**: [script.js:710-807](script.js#L710-L807)

```javascript
// 체크리스트 결과 업데이트 함수 (전체 문서 대상)
function updateChecklistResults() {
    updateChecklistResultsInContext(document);
}

// 특정 컨텍스트 내에서 체크리스트 결과 업데이트
function updateChecklistResultsInContext(context) {
    const electricScore = calculateCategoryScoreInContext('electric', context);
    const thermalScore = calculateCategoryScoreInContext('thermal', context);
    const sensitivityScore = calculateCategoryScoreInContext('sensitivity', context);

    // 점수 표시 업데이트
    const electricElement = context.querySelector('#electric-score');
    if (electricElement) {
        electricElement.textContent = electricScore;
    }

    const thermalElement = context.querySelector('#thermal-score');
    if (thermalElement) {
        thermalElement.textContent = thermalScore;
    }

    const sensitivityElement = context.querySelector('#sensitivity-score');
    if (sensitivityElement) {
        sensitivityElement.textContent = sensitivityScore;
    }

    // 각 카테고리별 상태 및 관리방안 업데이트
    updateCategoryResultInContext('electric', electricScore, getElectricResult(electricScore), context);
    updateCategoryResultInContext('thermal', thermalScore, getThermalResult(thermalScore), context);
    updateCategoryResultInContext('sensitivity', sensitivityScore, getSensitivityResult(sensitivityScore), context);
}
```

**설명**:
- **컨텍스트 매개변수**: 모든 업데이트 함수에 `context` 매개변수 추가
- **querySelector 사용**: `getElementById` 대신 `context.querySelector()` 사용하여 특정 컨텍스트 내에서만 검색
- **이중 구조**: 메인 함수(`updateChecklistResults`)는 전체 문서를 컨텍스트로 전달, 상세보기는 `.history-detail` 요소를 컨텍스트로 전달

### 3.3 카테고리별 점수 계산
**위치**: [script.js:759-767](script.js#L759-L767)

```javascript
// 특정 컨텍스트 내에서 카테고리별 점수 계산
function calculateCategoryScoreInContext(category, context) {
    const checkboxes = context.querySelectorAll(`.checklist-checkbox[data-category="${category}"]:checked`);
    let score = 0;
    checkboxes.forEach(checkbox => {
        score += parseInt(checkbox.dataset.weight);
    });
    return score;
}
```

**설명**:
- **CSS 선택자**: `data-category` 속성과 `:checked` 의사 클래스를 결합하여 선택된 체크박스만 필터링
- **가중치 합산**: 각 체크박스의 `data-weight` 값을 정수로 변환하여 합산
- **컨텍스트 범위 제한**: `context.querySelectorAll()`로 검색 범위를 특정 영역으로 제한

### 3.4 상세보기에서의 이벤트 리스너 등록
**위치**: [script.js:1564-1581](script.js#L1564-L1581)

```javascript
if (type === 'performance') {
    setTimeout(() => {
        const detailElement = document.querySelector('.history-detail');
        if (detailElement) {
            const checkboxes = detailElement.querySelectorAll('.checklist-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    updateChecklistResultsInContext(detailElement);
                });
            });

            // 초기 결과 표시
            updateChecklistResultsInContext(detailElement);
        }
    }, 100);
}
```

**설명**:
- **지연 실행**: `setTimeout()`으로 DOM 렌더링 완료 후 이벤트 리스너 등록
- **컨텍스트 전달**: `.history-detail` 요소를 컨텍스트로 전달하여 해당 영역만 업데이트
- **초기화**: 상세보기 열릴 때 초기 결과 표시

---

## 4. 실시간 UI 업데이트 메커니즘

### 4.1 점수 구간별 결과 매핑
**위치**: [script.js:646-676](script.js#L646-L676)

```javascript
function getElectricResult(score) {
    if (score >= 9) {
        return {
            status: '⚠️ 심각한 전기적 스트레스 발생',
            statusColor: '#d32f2f',
            management: `
                <div style="line-height: 1.8;">
                    <strong style="color: #d32f2f;">긴급 조치 필요:</strong><br>
                    • 즉시 운전 정지 및 전문가 점검 실시<br>
                    • 정격전류 초과 원인 분석 및 제거<br>
                    • 절연저항 측정 및 절연 상태 정밀 진단<br>
                    • 필요시 즉시 교체 검토
                </div>
            `
        };
    } else if (score >= 6) {
        return {
            status: '⚡ 높은 전기적 스트레스 감지',
            statusColor: '#f57c00',
            management: `
                <div style="line-height: 1.8;">
                    <strong style="color: #f57c00;">주의 필요:</strong><br>
                    • 정기 점검 주기 단축 (월 1회 → 주 1회)<br>
                    • 전류 변동 패턴 모니터링 강화<br>
                    • 절연저항 측정 및 추이 분석<br>
                    • 3개월 이내 재평가 실시
                </div>
            `
        };
    }
    // ... 나머지 구간
}
```

**설명**:
- **점수 구간 분류**: 체크리스트 점수를 기준으로 4단계 구간 분류
- **상태 메시지**: 각 구간별 위험도를 나타내는 명확한 메시지
- **관리방안**: 구체적이고 실행 가능한 조치사항 제공
- **HTML 포함**: 가독성을 위한 서식 및 강조 포함

### 4.2 카테고리별 결과 업데이트
**위치**: [script.js:769-807](script.js#L769-L807)

```javascript
function updateCategoryResultInContext(category, score, result, context) {
    const statusElement = context.querySelector(`#${category}-status-result`);
    const managementElement = context.querySelector(`#${category}-management-detail`);

    if (statusElement) {
        statusElement.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px; color: ${getCategoryColor(category)};">📊 현재 상태</div>
            <div style="color: ${result.statusColor}; font-weight: bold; font-size: 1.1em;">${result.status}</div>
        `;
    }

    if (managementElement) {
        managementElement.innerHTML = result.management;
    }
}

function getCategoryColor(category) {
    const colors = {
        'electric': '#667eea',
        'thermal': '#f093fb',
        'sensitivity': '#4facfe'
    };
    return colors[category] || '#667eea';
}
```

**설명**:
- **동적 ID 생성**: 카테고리명을 이용한 동적 ID 생성 (`${category}-status-result`)
- **조건부 렌더링**: 요소 존재 여부 확인 후 업데이트
- **색상 코딩**: 카테고리별 고유 색상으로 시각적 구분
- **실시간 반영**: 체크박스 변경 즉시 UI 업데이트

---

## 5. 시계열 데이터 분석

### 5.1 전류 변화율(ΔI) 계산
**위치**: [script.js:81-97](script.js#L81-L97)

```javascript
function calculateDeltaI(timeSeriesData, iCritic) {
    const currents = timeSeriesData.map(d => d.current);
    const avgCurrent = currents.reduce((a, b) => a + b, 0) / currents.length;
    const maxCurrent = Math.max(...currents);
    const minCurrent = Math.min(...currents);

    // 표준편차 계산
    const variance = currents.reduce((sum, val) => sum + Math.pow(val - avgCurrent, 2), 0) / currents.length;
    const stdDev = Math.sqrt(variance);

    // ΔI 계산: (최대전류 - 평균전류) / 임계전류
    const deltaI = (maxCurrent - avgCurrent) / iCritic;

    return { deltaI, avgCurrent, maxCurrent, minCurrent, stdDev };
}
```

**설명**:
- **통계적 분석**: 평균, 최대, 최소, 표준편차 계산
- **정규화**: 임계전류로 나누어 0~1 범위로 정규화
- **변동성 평가**: 표준편차를 통한 전류 변동 패턴 분석
- **반환 객체**: 다양한 통계값을 객체로 반환하여 추가 분석 가능

### 5.2 온도 변화율(ΔT) 계산
**위치**: [script.js:100-116](script.js#L100-L116)

```javascript
function calculateDeltaT(timeSeriesData, tCritic) {
    const temperatures = timeSeriesData.map(d => d.temperature);
    const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
    const maxTemp = Math.max(...temperatures);
    const minTemp = Math.min(...temperatures);

    // 표준편차 계산
    const variance = temperatures.reduce((sum, val) => sum + Math.pow(val - avgTemp, 2), 0) / temperatures.length;
    const stdDev = Math.sqrt(variance);

    // ΔT 계산: (최대온도 - 평균온도) / 임계온도
    const deltaT = (maxTemp - avgTemp) / tCritic;

    return { deltaT, avgTemp, maxTemp, minTemp, stdDev };
}
```

**설명**:
- 전류 분석과 동일한 구조로 온도 데이터 분석
- 열적 스트레스 평가를 위한 통계 지표 제공
- 임계온도 기준 정규화로 표준화된 비교 가능

### 5.3 열화 민감도 계산
**위치**: [script.js:119-163](script.js#L119-L163)

```javascript
function calculateSensitivity(deltaI, deltaT, iCritic, tCritic, timeSeriesData) {
    // 1. 기본 민감도 (전기적 + 열적 스트레스의 조합)
    const baseSensitivity = (deltaI + deltaT) * 5;

    // 2. 전류-온도 상관관계 분석
    const currents = timeSeriesData.map(d => d.current);
    const temperatures = timeSeriesData.map(d => d.temperature);

    const avgCurrent = currents.reduce((a, b) => a + b, 0) / currents.length;
    const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;

    let correlation = 0;
    let numerator = 0;
    let denomCurrent = 0;
    let denomTemp = 0;

    for (let i = 0; i < currents.length; i++) {
        const diffCurrent = currents[i] - avgCurrent;
        const diffTemp = temperatures[i] - avgTemp;
        numerator += diffCurrent * diffTemp;
        denomCurrent += diffCurrent * diffCurrent;
        denomTemp += diffTemp * diffTemp;
    }

    if (denomCurrent > 0 && denomTemp > 0) {
        correlation = numerator / Math.sqrt(denomCurrent * denomTemp);
    }

    // 3. 상관관계 기반 가중치 (높은 상관관계 = 더 위험)
    const correlationFactor = 1 + Math.abs(correlation) * 0.5;

    // 4. 변동성 기반 가중치
    const currentVolatility = Math.max(...currents) - Math.min(...currents);
    const tempVolatility = Math.max(...temperatures) - Math.min(...temperatures);
    const volatilityFactor = 1 + (currentVolatility / iCritic + tempVolatility / tCritic) * 0.3;

    // 5. 최종 민감도 계산
    const sensitivity = baseSensitivity * correlationFactor * volatilityFactor;

    return sensitivity;
}
```

**설명**:
- **다차원 분석**: 전기적, 열적 스트레스를 복합적으로 고려
- **상관관계 분석**: 피어슨 상관계수로 전류-온도 간 관계 분석
- **가중치 시스템**:
  - 상관관계 가중치: 높은 상관관계일수록 위험도 증가
  - 변동성 가중치: 전류/온도 변동폭이 클수록 위험도 증가
- **종합 평가**: 여러 요인을 곱하여 최종 민감도 산출

### 5.4 시계열 데이터 시각화
**위치**: [script.js:223-344](script.js#L223-L344)

```javascript
function displayTimeSeriesCharts(timeSeriesData, iCritic, tCritic) {
    const times = timeSeriesData.map(d => d.time);
    const currents = timeSeriesData.map(d => d.current);
    const temperatures = timeSeriesData.map(d => d.temperature);

    // 전류 차트
    const currentTrace = {
        x: times,
        y: currents,
        type: 'scatter',
        mode: 'lines+markers',
        name: '측정 전류',
        line: { color: '#667eea', width: 2 },
        marker: { size: 6 }
    };

    const currentCriticalTrace = {
        x: times,
        y: Array(times.length).fill(iCritic),
        type: 'scatter',
        mode: 'lines',
        name: '임계 전류',
        line: { color: '#d32f2f', width: 2, dash: 'dash' }
    };

    const currentLayout = {
        title: '시간에 따른 전류 변화',
        xaxis: { title: '시간 (분)' },
        yaxis: { title: '전류 (A)' },
        showlegend: true
    };

    Plotly.newPlot('current-chart', [currentTrace, currentCriticalTrace], currentLayout);

    // ... 온도 차트 및 복합 차트 생성
}
```

**설명**:
- **Plotly.js 활용**: 인터랙티브 차트 생성
- **이중 플롯**: 측정값과 임계값을 함께 표시하여 위험 구간 시각화
- **시간축 기반**: 시계열 데이터의 시간적 패턴 분석 가능
- **복합 차트**: 전류와 온도를 동시에 표시하여 상관관계 파악

---

## 6. 데이터 영속성 및 이력 관리

### 6.1 LocalStorage 기반 이력 저장
**위치**: [script.js:1382-1440](script.js#L1382-L1440)

```javascript
function saveToHistory(type, data) {
    let history = JSON.parse(localStorage.getItem('analysisHistory')) || [];

    const historyItem = {
        id: Date.now(),
        type: type,
        timestamp: new Date().toISOString(),
        data: data
    };

    history.unshift(historyItem);

    // 최대 100개까지만 저장
    if (history.length > 100) {
        history = history.slice(0, 100);
    }

    localStorage.setItem('analysisHistory', JSON.stringify(history));
    displayHistory();
}
```

**설명**:
- **JSON 직렬화**: 복잡한 객체를 문자열로 변환하여 저장
- **타임스탬프**: ISO 8601 형식으로 정확한 시간 기록
- **최신순 정렬**: `unshift()`로 최신 항목을 배열 앞에 추가
- **용량 관리**: 최대 100개 항목으로 제한하여 저장공간 관리

### 6.2 이력 항목 삭제
**위치**: [script.js:1442-1448](script.js#L1442-L1448)

```javascript
function deleteHistoryItem(id) {
    let history = JSON.parse(localStorage.getItem('analysisHistory')) || [];
    history = history.filter(item => item.id !== id);
    localStorage.setItem('analysisHistory', JSON.stringify(history));
    displayHistory();
}
```

**설명**:
- **ID 기반 삭제**: 고유 ID로 특정 항목 식별 및 제거
- **함수형 접근**: `filter()` 메서드로 불변성 유지
- **즉시 반영**: 삭제 후 화면 자동 갱신

---

## 결론

본 시스템은 다음과 같은 핵심 기술을 활용하여 절연 상태를 종합적으로 분석합니다:

1. **통계적 위험도 평가**: 전류, 온도, 민감도를 정량적으로 분석하여 4단계 위험도 산출
2. **반응형 UI 설계**: CSS Grid와 Flexbox를 활용한 효율적인 공간 배치
3. **컨텍스트 인식 아키텍처**: 범위 기반 DOM 쿼리로 다중 화면 지원
4. **실시간 피드백**: 체크리스트 기반 즉각적인 상태 평가 및 관리방안 제시
5. **시계열 분석**: 상관관계 및 변동성 분석을 통한 종합적 열화 민감도 평가
6. **데이터 영속성**: LocalStorage를 활용한 분석 이력 관리

이러한 구현을 통해 사용자는 절연 상태를 과학적으로 분석하고, 선제적인 유지보수 계획을 수립할 수 있습니다.

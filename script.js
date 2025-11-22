// 상수 정의
const T_CRITIC = 70; // 허용온도 (℃)
const REGRESSION_A = 39.452;
const REGRESSION_B = 0.025;
const REGRESSION_C = 0.014;

// 모드 전환
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        
        // 버튼 활성화 상태 변경
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // 모드 컨텐츠 전환
        document.querySelectorAll('.mode-content').forEach(content => {
            content.classList.remove('active');
        });
        
        if (mode === 'performance') {
            document.getElementById('performance-mode').classList.add('active');
            loadHistory('performance');
        } else if (mode === 'degradation') {
            document.getElementById('degradation-mode').classList.add('active');
            loadHistory('degradation');
        }
    });
});

// 절연성능 평가 계산
document.getElementById('calculate-performance').addEventListener('click', () => {
    const current = parseFloat(document.getElementById('current-input').value);
    const temperature = parseFloat(document.getElementById('temperature-input').value);
    
    if (!current || !temperature) {
        alert('전류와 온도를 모두 입력해주세요.');
        return;
    }
    
    // Icritic 계산 (회귀식: T = 39.452 + 0.025 * I + 0.014 * I²)
    // T_CRITIC = REGRESSION_A + REGRESSION_B * I + REGRESSION_C * I²
    // 0 = REGRESSION_C * I² + REGRESSION_B * I + (REGRESSION_A - T_CRITIC)
    const a = REGRESSION_C; // 0.014 (I²의 계수)
    const b = REGRESSION_B; // 0.025 (I의 계수)
    const c = REGRESSION_A - T_CRITIC; // 39.452 - 70 = -30.548 (상수항)
    
    const discriminant = b * b - 4 * a * c; // 판별식: b² - 4ac
    let iCritic;
    if (discriminant >= 0) {
        iCritic = (-b + Math.sqrt(discriminant)) / (2 * a);
    } else {
        // 음수인 경우, 실용적인 값으로 대체
        iCritic = 100; // 기본값
    }
    
    // 정량지표 계산
    const deltaI = current / iCritic; // 전기적 스트레스
    const deltaT = temperature / T_CRITIC; // 열적 스트레스
    const sensitivity = deltaT / deltaI; // 온도반응 민감도
    
    // 위험도 평가
    const riskI = evaluateRiskI(deltaI);
    const riskT = evaluateRiskT(deltaT);
    const riskR = evaluateRiskR(sensitivity);
    
    // 결과 표시
    displayPerformanceResults(deltaI, deltaT, sensitivity, riskI, riskT, riskR, iCritic);
    
    // 체크리스트 표시
    displayChecklist(riskI, riskT, riskR);
    
    // 자동으로 기록 저장
    const record = {
        id: Date.now(),
        type: 'performance',
        date: new Date().toISOString(),
        inputs: {
            current: current,
            temperature: temperature
        },
        results: {
            deltaI: deltaI,
            deltaT: deltaT,
            sensitivity: sensitivity,
            iCritic: iCritic,
            riskI: riskI,
            riskT: riskT,
            riskR: riskR
        }
    };
    
    saveRecord(record);
    // 기록 목록 새로고침
    loadHistory('performance');
});

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
    if (sensitivity < 0.4) return { level: 'L1', name: '보통', class: 'risk-l1' };
    if (sensitivity < 1.0) return { level: 'L2', name: '높음', class: 'risk-l2' };
    if (sensitivity < 1.5) return { level: 'L3', name: '위험', class: 'risk-l3' };
    return { level: 'L4', name: '치명', class: 'risk-l4' };
}

// 절연성능 평가 결과 표시
function displayPerformanceResults(deltaI, deltaT, sensitivity, riskI, riskT, riskR, iCritic) {
    const tbody = document.getElementById('indicators-tbody');
    tbody.innerHTML = `
        <tr>
            <td><strong>전기적 스트레스 (ΔI)</strong><br><small>ΔI = Imax / Icritic</small><br><small>Icritic = ${iCritic.toFixed(2)} A</small></td>
            <td>${deltaI.toFixed(3)}</td>
            <td>
                <div class="risk-badge-container">
                    <span class="risk-badge ${riskI.class}">${riskI.level}</span>
                    <span class="risk-badge-name ${riskI.class}">${riskI.name}</span>
                </div>
            </td>
            <td>${getRiskDescriptionI(riskI.level)}</td>
        </tr>
        <tr>
            <td><strong>열적 스트레스 (ΔT)</strong><br><small>ΔT = Tmax / Tcritic</small><br><small>Tcritic = ${T_CRITIC} ℃</small></td>
            <td>${deltaT.toFixed(3)}</td>
            <td>
                <div class="risk-badge-container">
                    <span class="risk-badge ${riskT.class}">${riskT.level}</span>
                    <span class="risk-badge-name ${riskT.class}">${riskT.name}</span>
                </div>
            </td>
            <td>${getRiskDescriptionT(riskT.level)}</td>
        </tr>
        <tr>
            <td><strong>온도반응 민감도 (R)</strong><br><small>R = ΔT / ΔI</small></td>
            <td>${sensitivity.toFixed(3)} ℃/A</td>
            <td>
                <div class="risk-badge-container">
                    <span class="risk-badge ${riskR.class}">${riskR.level}</span>
                    <span class="risk-badge-name ${riskR.class}">${riskR.name}</span>
                </div>
            </td>
            <td>${getRiskDescriptionR(riskR.level)}</td>
        </tr>
    `;
    
    document.getElementById('performance-results').style.display = 'block';
}

// 위험도 설명
function getRiskDescriptionI(level) {
    const descriptions = {
        'L1': '1.0 미만',
        'L2': '1.0 이상 ~ 1.2 미만',
        'L3': '1.2 이상 ~ 1.5 미만',
        'L4': '1.5 이상 (7배수 가정)'
    };
    return descriptions[level] || '';
}

function getRiskDescriptionT(level) {
    const descriptions = {
        'L1': '0.5 미만',
        'L2': '0.5 이상 ~ 0.8 미만',
        'L3': '0.8 이상 ~ 1.0 미만',
        'L4': '1.0 이상 (도달시 위험)'
    };
    return descriptions[level] || '';
}

function getRiskDescriptionR(level) {
    const descriptions = {
        'L1': '0.4 미만',
        'L2': '0.4 이상 ~ 1.0 미만',
        'L3': '1.0 이상',
        'L4': '1.5 이상'
    };
    return descriptions[level] || '';
}

// 체크리스트 표시
function displayChecklist(riskI, riskT, riskR) {
    const checklistSection = document.getElementById('checklist-section');
    let html = '';
    
    // 전류 관련 체크리스트 (전기적 스트레스가 L2 이상일 때)
    if (['L2', 'L3', 'L4'].includes(riskI.level)) {
        html += `
            <div class="checklist-category">
                <h4>전류 관련 체크리스트</h4>
                <div class="checklist-item">
                    <input type="checkbox" id="check1">
                    <label for="check1">운전 중 정격전류를 초과하는 구간이 존재하는가?</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check2">
                    <label for="check2">부하변동이 크거나, 순간 과전류가 반복되는가?</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check3">
                    <label for="check3">교반기에 이물질이 끼인 상태로 운전되는가?</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check4">
                    <label for="check4">모터 기동방식은 비(非)인버터 인가? (DOL/Y-Δ)</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check5">
                    <label for="check5">S.F(여유계수) 1.0 이하의 모터를 장시간 운전하는가?</label>
                </div>
            </div>
        `;
    }
    
    // 온도 관련 체크리스트 (열적 스트레스가 L2 이상일 때)
    if (['L2', 'L3', 'L4'].includes(riskT.level)) {
        html += `
            <div class="checklist-category">
                <h4>온도 관련 체크리스트</h4>
                <div class="checklist-item">
                    <input type="checkbox" id="check6">
                    <label for="check6">전기배선 단자부가 70℃에 근접한 적이 있는가?</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check7">
                    <label for="check7">전기배선 주변온도가 40℃를 초과하는가?</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check8">
                    <label for="check8">설치장소가 통풍 또는 발열 불충분 조건인가?</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check9">
                    <label for="check9">열원(전열, 증기열)이 전기배선에 인접해 있는가?</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check10">
                    <label for="check10">1회 가동시 수일 이상 연속가동 되는가?</label>
                </div>
            </div>
        `;
    }
    
    // 온도반응/열화 관련 체크리스트 (민감도가 L2 이상일 때)
    if (['L2', 'L3', 'L4'].includes(riskR.level)) {
        html += `
            <div class="checklist-category">
                <h4>온도반응/열화 관련 체크리스트</h4>
                <div class="checklist-item">
                    <input type="checkbox" id="check11">
                    <label for="check11">동일조건 중 과거보다 온도가 빠르게 상승하는가?</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check12">
                    <label for="check12">전류변화가 작음에도 온도 급상승 패턴이 있는가?</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check13">
                    <label for="check13">부하증가시 온도가 비선형적으로 급하게 상승하는가?</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check14">
                    <label for="check14">동종의 다른 설비보다 온도상승폭이 과도한가?</label>
                </div>
                <div class="checklist-item">
                    <input type="checkbox" id="check15">
                    <label for="check15">온도상승 후 냉각될 때 열이 잔류하는 경향이 있는가?</label>
                </div>
            </div>
        `;
    }
    
    if (html === '') {
        html = '<p style="text-align: center; color: #28a745; font-weight: 600; padding: 20px;">모든 지표가 정상 범위입니다. 특별한 체크리스트가 필요하지 않습니다.</p>';
    }
    
    checklistSection.innerHTML = html;
}

// 절연저항 열화 패턴 분류
document.getElementById('calculate-degradation').addEventListener('click', () => {
    const resistance = parseFloat(document.getElementById('resistance-input').value);
    const previousResistance = parseFloat(document.getElementById('previous-resistance-input').value) || null;
    const measurementCount = parseInt(document.getElementById('measurement-count-input').value) || 1;
    
    if (!resistance) {
        alert('절연저항을 입력해주세요.');
        return;
    }
    
    // 패턴 분류
    const pattern = classifyDegradationPattern(resistance, previousResistance, measurementCount);
    
    // 결과 표시
    displayDegradationResults(pattern, resistance, previousResistance, measurementCount);
    
    // 자동으로 기록 저장
    const degradationRate = previousResistance ? ((previousResistance - resistance) / previousResistance) * 100 : null;
    const record = {
        id: Date.now(),
        type: 'degradation',
        date: new Date().toISOString(),
        inputs: {
            resistance: resistance,
            previousResistance: previousResistance || null,
            measurementCount: measurementCount
        },
        results: {
            pattern: pattern,
            degradationRate: degradationRate
        }
    };
    
    saveRecord(record);
    // 기록 목록 새로고침
    loadHistory('degradation');
});

// 절연저항 열화 패턴 분류 함수
function classifyDegradationPattern(resistance, previousResistance, measurementCount) {
    let degradationRate = 0;
    let hasRepeatedAnomalies = false;
    
    // 이전 측정값이 있는 경우 저하율 계산
    if (previousResistance && previousResistance > 0) {
        degradationRate = ((previousResistance - resistance) / previousResistance) * 100;
    }
    
    // 임계형 (Critical): 1MΩ 미만 또는 급격한 저하
    if (resistance < 1.0) {
        return {
            type: '임계형',
            typeEn: 'Critical',
            class: 'pattern-critical',
            characteristics: '급격한 저하 (전체 기울기 90% 이상), 임계치 초과',
            stage: '임계열화 (Failure)',
            management: '운전중지, 정밀점검, 배선교체',
            equipment: '농축Tank #3'
        };
    }
    
    // 가속형 (Accelerated): 100MΩ 미만이고 급격한 저하
    if (resistance < 100 && degradationRate >= 70) {
        return {
            type: '가속형',
            typeEn: 'Accelerated',
            class: 'pattern-accelerated',
            characteristics: '100MΩ 미달, 급격한 저하 (전체 기울기 70% 이상)',
            stage: '진전열화 (Propagation)',
            management: '점검주기 단축 (분기점검)',
            equipment: '농축Tank #2'
        };
    }
    
    // 국부형 (Localized): 300MΩ 이상이고 일시적 저하
    if (resistance >= 300 && previousResistance) {
        const tempDegradation = degradationRate;
        if (tempDegradation < 10 && measurementCount >= 2) {
            return {
                type: '국부형',
                typeEn: 'Localized',
                class: 'pattern-localized',
                characteristics: '300MΩ 이상, 일시적 저하 (2회, 10% 미만), 특이점 반복',
                stage: '이상열화 (Anomaly)',
                management: '경년추이 감시 (반기점검), 300MΩ 미만시 단축점검(분기)',
                equipment: '농축Tank #5'
            };
        }
    }
    
    // 완만형 (Gradual): 완만한 저하 (10~20%)
    if (previousResistance && degradationRate >= 10 && degradationRate <= 20) {
        return {
            type: '완만형',
            typeEn: 'Gradual',
            class: 'pattern-gradual',
            characteristics: '완만한 저하 (10~20%), 특이점 없음',
            stage: '초기열화 (Initiation)',
            management: '경년추이 감시 (반기점검)',
            equipment: '농축Tank #1, #4'
        };
    }
    
    // 안정형 (Stable): 1,000MΩ 이상이고 변동폭 작음
    if (resistance >= 1000) {
        return {
            type: '안정형',
            typeEn: 'Stable',
            class: 'pattern-stable',
            characteristics: '1,000MΩ 이상, 변동폭 ±1%',
            stage: '건전상태 (Healthy)',
            management: '정상절연 확인 (연간점검)',
            equipment: 'Pump (.CIP, 이송, 진공, 순환, 쿨링)'
        };
    }
    
    // 기본값: 완만형으로 분류
    return {
        type: '완만형',
        typeEn: 'Gradual',
        class: 'pattern-gradual',
        characteristics: '완만한 저하 또는 안정 상태',
        stage: '초기열화 (Initiation)',
        management: '경년추이 감시 (반기점검)',
        equipment: '농축Tank #1, #4'
    };
}

// 절연저항 열화 패턴 분류 결과 표시
function displayDegradationResults(pattern, resistance, previousResistance, measurementCount) {
    const resultContent = document.getElementById('degradation-result-content');
    
    let degradationInfo = '';
    if (previousResistance) {
        const degradationRate = ((previousResistance - resistance) / previousResistance) * 100;
        degradationInfo = `
            <div class="result-item">
                <h4>저하율 분석</h4>
                <p><strong>이전 측정값:</strong> ${previousResistance.toFixed(2)} MΩ</p>
                <p><strong>현재 측정값:</strong> ${resistance.toFixed(2)} MΩ</p>
                <p><strong>저하율:</strong> ${degradationRate.toFixed(2)}%</p>
            </div>
        `;
    }
    
    resultContent.innerHTML = `
        <div class="result-item">
            <h4>분류된 패턴</h4>
            <p><span class="pattern-type ${pattern.class}">${pattern.type} (${pattern.typeEn})</span></p>
            <p><strong>설비 예시:</strong> ${pattern.equipment}</p>
        </div>
        <div class="result-item">
            <h4>패턴 특성</h4>
            <p>${pattern.characteristics}</p>
        </div>
        <div class="result-item">
            <h4>열화 단계</h4>
            <p><strong>${pattern.stage}</strong></p>
        </div>
        <div class="result-item">
            <h4>관리 방향</h4>
            <p><strong>${pattern.management}</strong></p>
        </div>
        ${degradationInfo}
        <div class="result-item">
            <h4>현재 절연저항</h4>
            <p><strong>${resistance.toFixed(2)} MΩ</strong></p>
        </div>
    `;
    
    document.getElementById('degradation-results').style.display = 'block';
}

// ==================== 기록 저장/조회 기능 ====================

// LocalStorage 키
const STORAGE_KEY_PERFORMANCE = 'insulation_performance_history';
const STORAGE_KEY_DEGRADATION = 'insulation_degradation_history';

// 저장 버튼은 제거되었고, 계산 시 자동으로 저장됩니다.

// 기록 저장 함수
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

// 기록 조회 함수
function getHistory(type) {
    const key = type === 'performance' ? STORAGE_KEY_PERFORMANCE : STORAGE_KEY_DEGRADATION;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

// 전체 기록 조회
function getAllHistory() {
    const performance = getHistory('performance');
    const degradation = getHistory('degradation');
    return [...performance, ...degradation].sort((a, b) => new Date(b.date) - new Date(a.date));
}

// 기록 목록 표시
function loadHistory(filter = 'all') {
    let historyList, history = [];
    
    if (filter === 'performance') {
        historyList = document.getElementById('performance-history-list');
        history = getHistory('performance');
    } else if (filter === 'degradation') {
        historyList = document.getElementById('degradation-history-list');
        history = getHistory('degradation');
    } else {
        // 'all'인 경우는 더 이상 사용하지 않지만 호환성을 위해 유지
        historyList = document.getElementById('history-list');
        if (!historyList) return; // history-list가 없으면 종료
        history = getAllHistory();
    }
    
    if (!historyList) return;
    
    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="history-empty">
                <div class="history-empty-icon">📋</div>
                <p>저장된 기록이 없습니다.</p>
            </div>
        `;
        // 그래프도 초기화
        if (filter === 'performance') {
            updatePerformanceChart([]);
        } else if (filter === 'degradation') {
            updateDegradationChart([]);
        }
        return;
    }
    
    historyList.innerHTML = history.map(record => {
        const date = new Date(record.date);
        const dateStr = date.toLocaleString('ko-KR');
        
        if (record.type === 'performance') {
            const { current, temperature } = record.inputs;
            const { riskI, riskT, riskR } = record.results;
            return `
                <div class="history-item" data-id="${record.id}" data-type="${record.type}">
                    <div class="history-item-header">
                        <span class="history-item-type">절연성능 평가</span>
                        <span class="history-item-date">${dateStr}</span>
                    </div>
                    <div class="history-item-summary">
                        <p><strong>입력:</strong> 전류 ${current.toFixed(2)} A, 온도 ${temperature.toFixed(2)} ℃</p>
                        <p><strong>위험도:</strong> 전기적 스트레스 ${riskI.level}(${riskI.name}), 열적 스트레스 ${riskT.level}(${riskT.name}), 민감도 ${riskR.level}(${riskR.name})</p>
                    </div>
                    <div class="history-item-actions">
                        <button class="btn-view" onclick="viewHistoryDetail(${record.id}, '${record.type}')">상세보기</button>
                        <button class="btn-delete" onclick="deleteHistory(${record.id}, '${record.type}')">삭제</button>
                    </div>
                </div>
            `;
        } else {
            const { resistance, previousResistance } = record.inputs;
            const { pattern, degradationRate } = record.results;
            return `
                <div class="history-item" data-id="${record.id}" data-type="${record.type}">
                    <div class="history-item-header">
                        <span class="history-item-type degradation">절연저항 열화 패턴</span>
                        <span class="history-item-date">${dateStr}</span>
                    </div>
                    <div class="history-item-summary">
                        <p><strong>입력:</strong> 절연저항 ${resistance.toFixed(2)} MΩ${previousResistance ? `, 이전값 ${previousResistance.toFixed(2)} MΩ` : ''}</p>
                        <p><strong>패턴:</strong> ${pattern.type} (${pattern.typeEn}) - ${pattern.stage}</p>
                        ${degradationRate !== null ? `<p><strong>저하율:</strong> ${degradationRate.toFixed(2)}%</p>` : ''}
                    </div>
                    <div class="history-item-actions">
                        <button class="btn-view" onclick="viewHistoryDetail(${record.id}, '${record.type}')">상세보기</button>
                        <button class="btn-delete" onclick="deleteHistory(${record.id}, '${record.type}')">삭제</button>
                    </div>
                </div>
            `;
        }
    }).join('');
    
    // 그래프 업데이트
    if (filter === 'performance') {
        updatePerformanceChart(history);
    } else if (filter === 'degradation') {
        updateDegradationChart(history);
    }
    
    // 그래프 업데이트
    if (filter === 'performance') {
        updatePerformanceChart(history);
    } else if (filter === 'degradation') {
        updateDegradationChart(history);
    }
}

// 기록 상세보기
function viewHistoryDetail(id, type) {
    const history = type === 'performance' ? getHistory('performance') : getHistory('degradation');
    const record = history.find(r => r.id === id);
    
    if (!record) {
        alert('기록을 찾을 수 없습니다.');
        return;
    }
    
    const date = new Date(record.date);
    const dateStr = date.toLocaleString('ko-KR');
    
    let detailHTML = `
        <div class="history-detail">
            <h4>기록 상세 정보</h4>
            <div class="history-detail-item">
                <div class="history-detail-label">평가 유형</div>
                <div class="history-detail-value">${type === 'performance' ? '절연성능 평가' : '절연저항 열화 패턴 분류'}</div>
            </div>
            <div class="history-detail-item">
                <div class="history-detail-label">평가 일시</div>
                <div class="history-detail-value">${dateStr}</div>
            </div>
    `;
    
    if (type === 'performance') {
        const { current, temperature } = record.inputs;
        const { deltaI, deltaT, sensitivity, iCritic, riskI, riskT, riskR } = record.results;
        detailHTML += `
            <div class="history-detail-item">
                <div class="history-detail-label">입력값</div>
                <div class="history-detail-value">전류: ${current.toFixed(2)} A, 온도: ${temperature.toFixed(2)} ℃</div>
            </div>
            <div class="history-detail-item">
                <div class="history-detail-label">계산 결과</div>
                <div class="history-detail-value">
                    <p>Icritic: ${iCritic.toFixed(2)} A</p>
                    <p>전기적 스트레스 (ΔI): ${deltaI.toFixed(3)} - ${riskI.level} (${riskI.name})</p>
                    <p>열적 스트레스 (ΔT): ${deltaT.toFixed(3)} - ${riskT.level} (${riskT.name})</p>
                    <p>온도반응 민감도 (R): ${sensitivity.toFixed(3)} ℃/A - ${riskR.level} (${riskR.name})</p>
                </div>
            </div>
        `;
    } else {
        const { resistance, previousResistance, measurementCount } = record.inputs;
        const { pattern, degradationRate } = record.results;
        detailHTML += `
            <div class="history-detail-item">
                <div class="history-detail-label">입력값</div>
                <div class="history-detail-value">
                    <p>절연저항: ${resistance.toFixed(2)} MΩ</p>
                    ${previousResistance ? `<p>이전 측정값: ${previousResistance.toFixed(2)} MΩ</p>` : ''}
                    <p>측정 횟수: ${measurementCount}</p>
                </div>
            </div>
            <div class="history-detail-item">
                <div class="history-detail-label">분류 결과</div>
                <div class="history-detail-value">
                    <p>패턴: ${pattern.type} (${pattern.typeEn})</p>
                    <p>특성: ${pattern.characteristics}</p>
                    <p>열화 단계: ${pattern.stage}</p>
                    <p>관리 방향: ${pattern.management}</p>
                    <p>설비 예시: ${pattern.equipment}</p>
                    ${degradationRate !== null ? `<p>저하율: ${degradationRate.toFixed(2)}%</p>` : ''}
                </div>
            </div>
        `;
    }
    
    detailHTML += `
            <div style="margin-top: 20px;">
                <button class="btn-view" onclick="closeHistoryDetail()">닫기</button>
            </div>
        </div>
    `;
    
    // 기존 상세보기 제거
    const existingDetail = document.querySelector('.history-detail');
    if (existingDetail) {
        existingDetail.remove();
    }
    
    // 새 상세보기 추가 (각 모드에 맞는 기록 목록에 추가)
    let historyList;
    if (type === 'performance') {
        historyList = document.getElementById('performance-history-list');
    } else {
        historyList = document.getElementById('degradation-history-list');
    }
    
    if (historyList) {
        historyList.insertAdjacentHTML('afterbegin', detailHTML);
        // 스크롤을 맨 위로
        historyList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// 상세보기 닫기
function closeHistoryDetail() {
    const detail = document.querySelector('.history-detail');
    if (detail) {
        detail.remove();
    }
}

// 기록 삭제
function deleteHistory(id, type) {
    if (!confirm('이 기록을 삭제하시겠습니까?')) {
        return;
    }
    
    const key = type === 'performance' ? STORAGE_KEY_PERFORMANCE : STORAGE_KEY_DEGRADATION;
    const history = getHistory(type);
    const filtered = history.filter(r => r.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
    
    // 해당 모드의 목록 새로고침
    loadHistory(type);
    
    // 상세보기 제거
    closeHistoryDetail();
}

// 절연성능 평가 기록 전체 삭제
document.getElementById('clear-performance-history').addEventListener('click', () => {
    if (!confirm('절연성능 평가 기록을 모두 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        return;
    }
    
    localStorage.removeItem(STORAGE_KEY_PERFORMANCE);
    loadHistory('performance');
    alert('절연성능 평가 기록이 모두 삭제되었습니다.');
});

// 절연저항 열화 패턴 분류 기록 전체 삭제
document.getElementById('clear-degradation-history').addEventListener('click', () => {
    if (!confirm('절연저항 열화 패턴 분류 기록을 모두 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        return;
    }
    
    localStorage.removeItem(STORAGE_KEY_DEGRADATION);
    loadHistory('degradation');
    alert('절연저항 열화 패턴 분류 기록이 모두 삭제되었습니다.');
});

// 전역 함수로 등록 (onclick에서 사용하기 위해)
window.viewHistoryDetail = viewHistoryDetail;
window.deleteHistory = deleteHistory;
window.closeHistoryDetail = closeHistoryDetail;

// 그래프 변수
let performanceChart = null;
let degradationChart = null;

// 절연성능 평가 그래프 업데이트
function updatePerformanceChart(history) {
    const ctx = document.getElementById('performance-chart');
    if (!ctx) return;
    
    // 기존 차트가 있으면 제거
    if (performanceChart) {
        performanceChart.destroy();
    }
    
    if (history.length === 0) {
        const canvas = ctx.getContext('2d');
        canvas.clearRect(0, 0, ctx.width, ctx.height);
        return;
    }
    
    // 전류-온도 관계 데이터 준비 (산점도)
    const scatterData = history.map(record => ({
        x: record.inputs.current,
        y: record.inputs.temperature
    }));
    
    // 전류 순으로 정렬 (선 그래프를 위해)
    scatterData.sort((a, b) => a.x - b.x);
    
    performanceChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: '전류-온도 관계',
                data: scatterData,
                borderColor: 'rgb(102, 126, 234)',
                backgroundColor: 'rgba(102, 126, 234, 0.5)',
                pointRadius: 6,
                pointHoverRadius: 8,
                showLine: true,
                tension: 0.4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'point',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: '전류-온도 관계 그래프'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `전류: ${context.parsed.x.toFixed(2)} A, 온도: ${context.parsed.y.toFixed(2)} ℃`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    display: true,
                    title: {
                        display: true,
                        text: 'Current (A)'
                    },
                    position: 'bottom'
                },
                y: {
                    type: 'linear',
                    display: true,
                    title: {
                        display: true,
                        text: 'Temperature (℃)'
                    }
                }
            }
        }
    });
}

// 절연저항 열화 패턴 분류 그래프 업데이트
function updateDegradationChart(history) {
    const ctx = document.getElementById('degradation-chart');
    if (!ctx) return;
    
    // 기존 차트가 있으면 제거
    if (degradationChart) {
        degradationChart.destroy();
    }
    
    if (history.length === 0) {
        const canvas = ctx.getContext('2d');
        canvas.clearRect(0, 0, ctx.width, ctx.height);
        return;
    }
    
    // 날짜순 정렬
    const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 년도 기준으로 그룹화 (같은 년도의 평균값 사용)
    const yearData = {};
    sortedHistory.forEach(record => {
        const date = new Date(record.date);
        const year = date.getFullYear();
        if (!yearData[year]) {
            yearData[year] = [];
        }
        yearData[year].push(record.inputs.resistance);
    });
    
    const years = Object.keys(yearData).sort((a, b) => a - b);
    const resistanceData = years.map(year => {
        const values = yearData[year];
        return values.reduce((sum, val) => sum + val, 0) / values.length; // 평균값
    });
    
    degradationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Insulation Resistance (MΩ)',
                data: resistanceData,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: '절연저항 추이 (년도별)'
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Year'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Insulation Resistance (MΩ)'
                    }
                }
            }
        }
    });
}

// 페이지 로드 시 현재 활성화된 모드의 기록 로드
document.addEventListener('DOMContentLoaded', () => {
    // 초기 로드 시 절연성능 평가 모드가 활성화되어 있으므로 해당 기록 로드
    loadHistory('performance');
});

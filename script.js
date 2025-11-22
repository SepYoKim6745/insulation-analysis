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
        } else {
            document.getElementById('degradation-mode').classList.add('active');
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
    const a = REGRESSION_C;
    const b = REGRESSION_B;
    const c = REGRESSION_A - T_CRITIC;
    
    const discriminant = b * b - 4 * a * c;
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
            <td><span class="risk-level ${riskI.class}">${riskI.level} (${riskI.name})</span></td>
            <td>${getRiskDescriptionI(riskI.level)}</td>
        </tr>
        <tr>
            <td><strong>열적 스트레스 (ΔT)</strong><br><small>ΔT = Tmax / Tcritic</small><br><small>Tcritic = ${T_CRITIC} ℃</small></td>
            <td>${deltaT.toFixed(3)}</td>
            <td><span class="risk-level ${riskT.class}">${riskT.level} (${riskT.name})</span></td>
            <td>${getRiskDescriptionT(riskT.level)}</td>
        </tr>
        <tr>
            <td><strong>온도반응 민감도 (R)</strong><br><small>R = ΔT / ΔI</small></td>
            <td>${sensitivity.toFixed(3)} ℃/A</td>
            <td><span class="risk-level ${riskR.class}">${riskR.level} (${riskR.name})</span></td>
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
    displayDegradationResults(pattern);
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
function displayDegradationResults(pattern) {
    const resultContent = document.getElementById('degradation-result-content');
    const resistance = parseFloat(document.getElementById('resistance-input').value);
    const previousResistance = parseFloat(document.getElementById('previous-resistance-input').value);
    
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


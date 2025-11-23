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

// ==================== 데이터 입력 테이블 관리 ====================

// 초기 행 추가
function initializeDataTable() {
    // 초기에 5개의 빈 행 추가
    for (let i = 0; i < 5; i++) {
        addDataRow();
    }
}

// 데이터 행 추가
function addDataRow(year = '', month = '', resistance = '') {
    const tbody = document.getElementById('data-input-tbody');
    const row = document.createElement('tr');
    const rowId = Date.now() + Math.random();

    row.innerHTML = `
        <td><input type="number" class="table-input year-input" placeholder="예: 2020" min="1900" max="2100" value="${year}"></td>
        <td><input type="number" class="table-input month-input" placeholder="예: 1" min="1" max="12" value="${month}"></td>
        <td><input type="number" class="table-input resistance-input" placeholder="예: 1200" step="0.01" min="0" value="${resistance}"></td>
        <td style="text-align: center;">
            <button class="delete-row-btn" onclick="deleteDataRow(this)">🗑️</button>
        </td>
    `;

    tbody.appendChild(row);
}

// 데이터 행 삭제
function deleteDataRow(button) {
    const row = button.parentElement.parentElement;
    row.remove();
}

// 테이블 전체 삭제
function clearDataTable() {
    if (!confirm('모든 입력 데이터를 삭제하시겠습니까?')) {
        return;
    }
    document.getElementById('data-input-tbody').innerHTML = '';
    initializeDataTable(); // 빈 행 다시 추가
}

// 테이블에서 데이터 수집
function collectTableData() {
    const tbody = document.getElementById('data-input-tbody');
    const rows = tbody.querySelectorAll('tr');
    const data = [];

    rows.forEach(row => {
        const yearInput = row.querySelector('.year-input');
        const monthInput = row.querySelector('.month-input');
        const resistanceInput = row.querySelector('.resistance-input');

        const year = yearInput.value.trim();
        const month = monthInput.value.trim();
        const resistance = resistanceInput.value.trim();

        // 모든 필드가 채워진 경우만 추가
        if (year && month && resistance) {
            const paddedMonth = month.padStart(2, '0');
            data.push({
                date: `${year}-${paddedMonth}`,
                resistance: parseFloat(resistance)
            });
        }
    });

    // 날짜순 정렬
    data.sort((a, b) => {
        const dateA = new Date(a.date + '-01');
        const dateB = new Date(b.date + '-01');
        return dateA - dateB;
    });

    return data;
}

// 버튼 이벤트 리스너
document.getElementById('add-data-row').addEventListener('click', () => {
    addDataRow();
});

document.getElementById('clear-data-table').addEventListener('click', clearDataTable);

// ==================== 파일 업로드 ====================

document.getElementById('upload-file').addEventListener('click', () => {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];

    if (!file) {
        alert('파일을 선택해주세요.');
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // 첫 번째 시트 읽기
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // JSON으로 변환
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // 데이터 파싱 (첫 행이 헤더인 경우 제외)
            const startRow = jsonData[0] && (isNaN(jsonData[0][0]) || jsonData[0][0] === '연도' || jsonData[0][0] === 'Year') ? 1 : 0;

            // 테이블 초기화
            document.getElementById('data-input-tbody').innerHTML = '';

            let validDataCount = 0;
            for (let i = startRow; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (row && row.length >= 3) {
                    const year = row[0] ? row[0].toString().trim() : '';
                    const month = row[1] ? row[1].toString().trim() : '';
                    const resistance = row[2] ? row[2].toString().trim() : '';

                    if (year && month && resistance) {
                        addDataRow(year, month, resistance);
                        validDataCount++;
                    }
                }
            }

            if (validDataCount === 0) {
                alert('파일에서 유효한 데이터를 찾을 수 없습니다.\n형식: 연도, 월, 절연저항(MΩ)');
                initializeDataTable();
            } else {
                alert(`${validDataCount}개의 데이터를 불러왔습니다.`);
            }

        } catch (error) {
            alert('파일을 읽는 중 오류가 발생했습니다.\n' + error.message);
        }
    };

    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                const lines = text.split('\n');

                // 첫 행이 헤더인지 확인
                const startRow = lines[0] && (lines[0].includes('연도') || lines[0].includes('Year')) ? 1 : 0;

                // 테이블 초기화
                document.getElementById('data-input-tbody').innerHTML = '';

                let validDataCount = 0;
                for (let i = startRow; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const parts = line.split(',').map(part => part.trim());
                    if (parts.length >= 3) {
                        const year = parts[0];
                        const month = parts[1];
                        const resistance = parts[2];

                        if (year && month && resistance) {
                            addDataRow(year, month, resistance);
                            validDataCount++;
                        }
                    }
                }

                if (validDataCount === 0) {
                    alert('파일에서 유효한 데이터를 찾을 수 없습니다.\n형식: 연도, 월, 절연저항(MΩ)');
                    initializeDataTable();
                } else {
                    alert(`${validDataCount}개의 데이터를 불러왔습니다.`);
                }

            } catch (error) {
                alert('CSV 파일을 읽는 중 오류가 발생했습니다.\n' + error.message);
            }
        };
    } else {
        reader.readAsArrayBuffer(file);
    }
});

// ==================== 절연저항 열화 패턴 분류 ====================

document.getElementById('calculate-degradation').addEventListener('click', () => {
    // 테이블에서 데이터 수집
    const parsedData = collectTableData();

    if (parsedData.length === 0) {
        alert('데이터를 입력해주세요.\n최소 1개 이상의 데이터가 필요합니다.');
        return;
    }

    // 패턴 분석
    const analysis = analyzeInsulationPattern(parsedData);

    // 결과 표시
    displayDegradationResults(analysis, parsedData);

    // 자동으로 기록 저장
    const record = {
        id: Date.now(),
        type: 'degradation',
        date: new Date().toISOString(),
        inputs: {
            data: parsedData
        },
        results: {
            pattern: analysis.pattern,
            stage: analysis.stage,
            management: analysis.management,
            characteristics: analysis.characteristics,
            decreaseRate: analysis.decreaseRate,
            volatility: analysis.volatility,
            belowThreshold: analysis.belowThreshold
        }
    };

    saveRecord(record);
    // 기록 목록 새로고침
    loadHistory('degradation');
});

// 데이터 파싱 함수
function parseInsulationData(dataString) {
    const lines = dataString.split('\n').filter(line => line.trim() !== '');
    const data = [];

    for (const line of lines) {
        const parts = line.split(',').map(part => part.trim());
        if (parts.length === 2) {
            const date = parts[0];
            const resistance = parseFloat(parts[1]);

            if (date && !isNaN(resistance)) {
                data.push({ date, resistance });
            }
        }
    }

    // 날짜순 정렬
    data.sort((a, b) => {
        const dateA = new Date(a.date + '-01');
        const dateB = new Date(b.date + '-01');
        return dateA - dateB;
    });

    return data;
}

// 절연저항 패턴 분석 함수
function analyzeInsulationPattern(data) {
    if (data.length === 0) {
        return null;
    }

    const firstValue = data[0].resistance;
    const lastValue = data[data.length - 1].resistance;
    const minValue = Math.min(...data.map(d => d.resistance));
    const maxValue = Math.max(...data.map(d => d.resistance));

    // 전체 감소율 계산
    const totalDecreaseRate = ((firstValue - lastValue) / firstValue) * 100;

    // 변동성 계산 (표준편차)
    const mean = data.reduce((sum, d) => sum + d.resistance, 0) / data.length;
    const variance = data.reduce((sum, d) => sum + Math.pow(d.resistance - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    const volatility = (stdDev / mean) * 100; // 변동계수 (%)

    // 임계치 도달 여부
    const belowThreshold = lastValue < 1.0;
    const below100 = lastValue < 100;
    const above1000 = lastValue >= 1000;
    const above300 = lastValue >= 300;

    // 일시적 저하 감지 (국부형)
    let temporaryDrops = 0;
    for (let i = 1; i < data.length - 1; i++) {
        const prevResistance = data[i - 1].resistance;
        const currResistance = data[i].resistance;
        const nextResistance = data[i + 1].resistance;

        // 일시적 저하: 이전보다 떨어졌다가 다시 회복
        const drop = ((prevResistance - currResistance) / prevResistance) * 100;
        const recovery = ((nextResistance - currResistance) / currResistance) * 100;

        if (drop > 0 && drop < 10 && recovery > 0) {
            temporaryDrops++;
        }
    }

    // 패턴 분류 로직
    let pattern, stage, management, characteristics;

    // ① 임계형 (Critical)
    if (belowThreshold || totalDecreaseRate >= 90) {
        pattern = '임계형 (Critical)';
        stage = 'Failure (임계열화)';
        management = '운전중지, 정밀점검, 배선 교체';
        characteristics = '급격한 저하 (전체 기간 중 90% 이상 감소), 절연저항이 임계치(1 MΩ) 이하';
    }
    // ② 가속형 (Accelerated)
    else if (below100 && totalDecreaseRate >= 70) {
        pattern = '가속형 (Accelerated)';
        stage = 'Propagation (진전열화)';
        management = '점검주기 단축 (분기점검)';
        characteristics = '100 MΩ 미만 도달, 급격한 저하 (전체 기간의 70% 이상 감소)';
    }
    // ③ 완만형 (Gradual)
    else if (totalDecreaseRate >= 10 && totalDecreaseRate <= 20 && temporaryDrops === 0) {
        pattern = '완만형 (Gradual)';
        stage = 'Initiation (초기열화)';
        management = '경년추이 감시 (반기점검)';
        characteristics = '10~20% 수준의 완만한 저하, 특이점 없음';
    }
    // ④ 국부형 (Localised)
    else if (above300 && temporaryDrops >= 2) {
        pattern = '국부형 (Localised)';
        stage = 'Anomaly (이상열화)';
        management = '경년추이 감시, 300MΩ 미만 시 단축점검 (분기)';
        characteristics = `전체 수치는 양호하나 일시적 저하 반복 (${temporaryDrops}회, 각 저하 폭 10% 미만)`;
    }
    // ⑤ 안정형 (Stable)
    else if (above1000 && volatility <= 1.0) {
        pattern = '안정형 (Stable)';
        stage = 'Healthy (건전상태)';
        management = '정기 절연 확인 (연 1회)';
        characteristics = '1000 MΩ 이상, 변동폭 ±1% 이내';
    }
    // 기타 (완만형으로 분류)
    else {
        pattern = '완만형 (Gradual)';
        stage = 'Initiation (초기열화)';
        management = '경년추이 감시 (반기점검)';
        characteristics = '완만한 저하 또는 안정 상태';
    }

    return {
        pattern,
        stage,
        management,
        characteristics,
        decreaseRate: totalDecreaseRate,
        volatility,
        belowThreshold,
        firstValue,
        lastValue,
        minValue,
        maxValue,
        temporaryDrops
    };
}

// 절연저항 열화 패턴 분류 결과 표시
function displayDegradationResults(analysis, data) {
    const resultContent = document.getElementById('degradation-result-content');

    // 패턴별 클래스 설정
    let patternClass = 'pattern-gradual';
    if (analysis.pattern.includes('임계형')) patternClass = 'pattern-critical';
    else if (analysis.pattern.includes('가속형')) patternClass = 'pattern-accelerated';
    else if (analysis.pattern.includes('국부형')) patternClass = 'pattern-localized';
    else if (analysis.pattern.includes('안정형')) patternClass = 'pattern-stable';

    resultContent.innerHTML = `
        <div class="result-item">
            <h4>📊 패턴 특성 분석</h4>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px;"><strong>전체 감소폭</strong></td>
                    <td style="padding: 8px;">${analysis.decreaseRate.toFixed(2)}%</td>
                </tr>
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px;"><strong>변동성 (변동계수)</strong></td>
                    <td style="padding: 8px;">${analysis.volatility.toFixed(2)}%</td>
                </tr>
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px;"><strong>임계치 도달 여부</strong></td>
                    <td style="padding: 8px;">${analysis.belowThreshold ? '예 (1 MΩ 이하)' : '아니오'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px;"><strong>초기값</strong></td>
                    <td style="padding: 8px;">${analysis.firstValue.toFixed(2)} MΩ</td>
                </tr>
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px;"><strong>최종값</strong></td>
                    <td style="padding: 8px;">${analysis.lastValue.toFixed(2)} MΩ</td>
                </tr>
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px;"><strong>최소값</strong></td>
                    <td style="padding: 8px;">${analysis.minValue.toFixed(2)} MΩ</td>
                </tr>
                <tr>
                    <td style="padding: 8px;"><strong>최대값</strong></td>
                    <td style="padding: 8px;">${analysis.maxValue.toFixed(2)} MΩ</td>
                </tr>
            </table>
        </div>

        <div class="result-item">
            <h4>🏷️ 최종 열화 패턴 유형</h4>
            <p><span class="pattern-type ${patternClass}" style="font-size: 1.2em; padding: 8px 16px;">${analysis.pattern}</span></p>
            <p style="margin-top: 10px;"><strong>특성:</strong> ${analysis.characteristics}</p>
        </div>

        <div class="result-item">
            <h4>📈 열화 단계 (Heat Stage)</h4>
            <p style="font-size: 1.1em; color: #2c3e50;"><strong>${analysis.stage}</strong></p>
        </div>

        <div class="result-item">
            <h4>🔧 관리 방향 (Management Action)</h4>
            <p style="font-size: 1.1em; color: #e74c3c;"><strong>${analysis.management}</strong></p>
        </div>
    `;

    document.getElementById('degradation-results').style.display = 'block';

    // 그래프 업데이트
    updateDegradationChartWithData(data);
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
            const { data } = record.inputs;
            const { pattern, stage, decreaseRate } = record.results;

            // 데이터 요약
            const dataCount = data ? data.length : 0;
            const firstValue = data && data.length > 0 ? data[0].resistance : 0;
            const lastValue = data && data.length > 0 ? data[data.length - 1].resistance : 0;

            return `
                <div class="history-item" data-id="${record.id}" data-type="${record.type}">
                    <div class="history-item-header">
                        <span class="history-item-type degradation">절연저항 열화 패턴</span>
                        <span class="history-item-date">${dateStr}</span>
                    </div>
                    <div class="history-item-summary">
                        <p><strong>데이터 수:</strong> ${dataCount}개 측정</p>
                        <p><strong>절연저항 범위:</strong> ${firstValue.toFixed(2)} MΩ → ${lastValue.toFixed(2)} MΩ</p>
                        <p><strong>패턴:</strong> ${pattern} - ${stage}</p>
                        <p><strong>감소율:</strong> ${decreaseRate !== null && decreaseRate !== undefined ? decreaseRate.toFixed(2) + '%' : 'N/A'}</p>
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
        const { data } = record.inputs;
        const { pattern, stage, management, characteristics, decreaseRate, volatility, belowThreshold } = record.results;

        // 데이터 테이블 생성
        let dataTable = '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
        dataTable += '<thead><tr><th style="border: 1px solid #ddd; padding: 8px;">연도+월</th><th style="border: 1px solid #ddd; padding: 8px;">절연저항 (MΩ)</th></tr></thead>';
        dataTable += '<tbody>';
        if (data && data.length > 0) {
            data.forEach(d => {
                dataTable += `<tr><td style="border: 1px solid #ddd; padding: 8px;">${d.date}</td><td style="border: 1px solid #ddd; padding: 8px;">${d.resistance.toFixed(2)}</td></tr>`;
            });
        }
        dataTable += '</tbody></table>';

        detailHTML += `
            <div class="history-detail-item">
                <div class="history-detail-label">입력 데이터</div>
                <div class="history-detail-value">
                    ${dataTable}
                </div>
            </div>
            <div class="history-detail-item">
                <div class="history-detail-label">분석 결과</div>
                <div class="history-detail-value">
                    <p><strong>전체 감소폭:</strong> ${decreaseRate !== null && decreaseRate !== undefined ? decreaseRate.toFixed(2) + '%' : 'N/A'}</p>
                    <p><strong>변동성:</strong> ${volatility !== null && volatility !== undefined ? volatility.toFixed(2) + '%' : 'N/A'}</p>
                    <p><strong>임계치 도달:</strong> ${belowThreshold ? '예 (1 MΩ 이하)' : '아니오'}</p>
                </div>
            </div>
            <div class="history-detail-item">
                <div class="history-detail-label">분류 결과</div>
                <div class="history-detail-value">
                    <p><strong>패턴:</strong> ${pattern}</p>
                    <p><strong>특성:</strong> ${characteristics}</p>
                    <p><strong>열화 단계:</strong> ${stage}</p>
                    <p><strong>관리 방향:</strong> ${management}</p>
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

// 절연저항 열화 패턴 분류 그래프 업데이트 (현재 입력 데이터용)
function updateDegradationChartWithData(data) {
    const ctx = document.getElementById('degradation-chart');
    if (!ctx) return;

    // 기존 차트가 있으면 제거
    if (degradationChart) {
        degradationChart.destroy();
    }

    if (data.length === 0) {
        const canvas = ctx.getContext('2d');
        canvas.clearRect(0, 0, ctx.width, ctx.height);
        return;
    }

    const labels = data.map(d => d.date);
    const resistanceData = data.map(d => d.resistance);

    degradationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '절연저항 (MΩ)',
                data: resistanceData,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8,
                borderWidth: 2
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
                    text: '절연저항 추이 (연도+월)'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `절연저항: ${context.parsed.y.toFixed(2)} MΩ`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '연도+월 (YYYY-MM)'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: '절연저항 (MΩ)'
                    },
                    beginAtZero: false
                }
            }
        }
    });
}

// 절연저항 열화 패턴 분류 그래프 업데이트 (기록용)
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

    // 가장 최근 기록 사용
    const latestRecord = history[0];
    if (latestRecord.inputs.data) {
        updateDegradationChartWithData(latestRecord.inputs.data);
    }
}

// 전역 함수로 등록
window.deleteDataRow = deleteDataRow;

// 페이지 로드 시 현재 활성화된 모드의 기록 로드
document.addEventListener('DOMContentLoaded', () => {
    // 초기 로드 시 절연성능 평가 모드가 활성화되어 있으므로 해당 기록 로드
    loadHistory('performance');

    // 데이터 입력 테이블 초기화
    initializeDataTable();
});

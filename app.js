const app = document.getElementById("app");

let students = JSON.parse(localStorage.getItem('students')) || []; // 학생 목록
let selectedStudent = null;
let currentStage = 1; // 현재 단계 (1, 2, 3)

// 학생 목록 화면
function renderStudentList() {
  app.innerHTML = `
    <h2>학생 목록</h2>
    <ul>
      ${students.map((student, index) => `
        <li>
          ${student.name} - 평균 점수: ${calculateAveragePercentile(student)}점
          <button onclick="selectStudent(${index})">평가하기</button>
          <button onclick="showFinalEvaluation(${index})">최종 평가</button>
          <button onclick="deleteStudent(${index})">삭제</button> <!-- 삭제 버튼 추가 -->
        </li>
      `).join('')}
    </ul>
    <input type="text" id="newStudent" placeholder="새 학생 이름">
    <button onclick="addStudent()">추가</button>
  `;
}

// 학생 추가
function addStudent() {
  const input = document.getElementById("newStudent");
  const name = input.value.trim();
  
  if (name === "") {
    alert("학생 이름을 입력해주세요.");
    return;
  }
  
  students.push({ 
    name, 
    scores: {}, 
    stageNames: ["", "", ""], // 각 학생에 대한 장소 이름 배열 초기화
    notes: {} // 각 학생에 대한 노트 객체 추가
  });
  input.value = ""; // Clear the input field
  saveToLocalStorage(); // Save updated students list
  renderStudentList(); // Re-render the student list
}

// 학생 선택
function selectStudent(index) {
  selectedStudent = students[index];
  currentStage = 1; // Start from the first stage
  renderEvaluationPage(); // Render the first stage
}

// 학생 삭제
function deleteStudent(index) {
  if (confirm(`정말 ${students[index].name} 학생을 삭제하시겠습니까?`)) {
    students.splice(index, 1); // 학생 목록에서 해당 학생 제거
    saveToLocalStorage(); // Save updated students list
    renderStudentList(); // 삭제 후 목록 재렌더링
  }
}

// 평가 화면
function renderEvaluationPage() {
  app.innerHTML = `
    <h2>${selectedStudent.name} 평가 - 장소 ${currentStage}</h2>
    <label for="stageName">단계 ${currentStage} 이름:</label>
    <input type="text" id="stageName" placeholder="단계 이름 입력" value="${selectedStudent.stageNames[currentStage - 1]}">
    
    <form id="evaluationForm">
      ${createEvaluationItem("scriptKnowledge")}
      ${createEvaluationItem("basicKnowledge")}
      ${createEvaluationItem("posture")}
      ${createEvaluationItem("nonVerbal")}
      ${createEvaluationItem("pronunciation")}
      ${createEvaluationItem("breathing")}
      ${createEvaluationItem("speed")}
      ${createEvaluationItem("interaction")}
      ${createEvaluationItem("voiceTone")}
      ${createEvaluationItem("movementUnderstanding")}
      <button type="button" onclick="saveEvaluation()">저장</button>
      <button type="button" onclick="nextStage()">다음 단계</button>
      <button type="button" onclick="renderStudentList()">돌아가기</button>
    </form>
  `;
  loadPreviousScores(); // 이전 점수 불러오기
}

// Create Evaluation Item HTML
function createEvaluationItem(id) {
  return `
    <div class="evaluation-item">
      <label for="${id}">${getStageLabel(id)}:</label>
      ${createCircleRating(id)}
      <textarea id="${id}Note" placeholder="이 항목에 대한 노트를 추가">${selectedStudent.notes[`stage${currentStage}`]?.[id] || ""}</textarea>
    </div>
  `;
}

// 평가 원 생성 (9 levels)
function createCircleRating(id) {
  return `
    <div class="circle-rating" id="${id}">
      <div class="label left">매우 낮음</div>
      ${[...Array(9).keys()].map(i => `
        <div class="circle" data-value="${i + 1}" onclick="selectCircleRating(event, '${id}')">
          <span class="circle-percent"></span>
        </div>
      `).join('')}
      <div class="label right">매우 높음</div>
    </div>
  `;
}

// Handle Circle Rating Selection
function selectCircleRating(event, id) {
  const selectedValue = event.target.getAttribute('data-value');
  document.querySelectorAll(`#${id} .circle`).forEach(circle => {
    circle.classList.remove('selected');
    circle.querySelector('.circle-percent').textContent = '';
  });
  event.target.classList.add('selected');
  
  const percentile = convertToPercentile(selectedValue);
  event.target.querySelector('.circle-percent').textContent = `${percentile}%`;

  // Save the selected value in the current stage's scores
  if (!selectedStudent.scores[`stage${currentStage}`]) {
    selectedStudent.scores[`stage${currentStage}`] = {};
  }
  selectedStudent.scores[`stage${currentStage}`][id] = selectedValue;
  saveToLocalStorage(); // Save updated scores
}

// Load previous scores for the current stage
function loadPreviousScores() {
  if (selectedStudent.scores[`stage${currentStage}`]) {
    Object.keys(selectedStudent.scores[`stage${currentStage}`]).forEach(id => {
      const value = selectedStudent.scores[`stage${currentStage}`][id];
      const circle = document.querySelector(`#${id} .circle[data-value="${value}"]`);
      if (circle) {
        circle.classList.add('selected');
        const percentile = convertToPercentile(value);
        circle.querySelector('.circle-percent').textContent = `${percentile}%`;
      }
    });
  }
}

// 평가 저장
function saveEvaluation() {
  const stageNameInput = document.getElementById('stageName');
  selectedStudent.stageNames[currentStage - 1] = stageNameInput.value;
  
  // Save notes for each evaluation item
  selectedStudent.notes[`stage${currentStage}`] = {
    scriptKnowledge: document.getElementById('scriptKnowledgeNote').value,
    basicKnowledge: document.getElementById('basicKnowledgeNote').value,
    posture: document.getElementById('postureNote').value,
    nonVerbal: document.getElementById('nonVerbalNote').value,
    pronunciation: document.getElementById('pronunciationNote').value,
    breathing: document.getElementById('breathingNote').value,
    speed: document.getElementById('speedNote').value,
    interaction: document.getElementById('interactionNote').value,
    voiceTone: document.getElementById('voiceToneNote').value,
    movementUnderstanding: document.getElementById('movementUnderstandingNote').value
  };

  saveToLocalStorage(); // Save updated notes
  alert('평가가 저장되었습니다!');
}

// Move to next stage
function nextStage() {
  if (currentStage < 3) {
    currentStage++;
    renderEvaluationPage(); // Render the next stage's evaluation
  } else {
    saveEvaluation(); // Save the final evaluation
    renderStudentList(); // Go back to the student list
  }
}

// 점수를 백분위로 변환
function convertToPercentile(score) {
  return ((score - 1) / (9 - 1)) * 80 + 20;
}

// 평균 백분위 점수 계산
function calculateAveragePercentile(student) {
  if (Object.keys(student.scores).length === 0) {
    return 0;
  }

  const allScores = [];
  Object.keys(student.scores).forEach(stage => {
    const stageScores = student.scores[stage];
    Object.values(stageScores).forEach(score => {
      allScores.push(convertToPercentile(Number(score)));
    });
  });

  const totalPercentile = allScores.reduce((total, score) => total + score, 0);
  const averagePercentile = totalPercentile / allScores.length;

  return averagePercentile.toFixed(1);
}

// 최종 평가 요약 화면
function showFinalEvaluation(index) {
  const student = students[index];
  
  const averagePercentile = calculateAveragePercentile(student);

  let summary = `<h3>이름: ${student.name}</h3>`;
  summary += `<p><strong>점수:</strong> ${averagePercentile}점</p><br>`;
  
  summary += `<ul>`;
  Object.keys(student.scores).forEach(stage => {
    summary += `<li><strong>장소 ${stage.replace('stage', '')} (${student.stageNames[Number(stage.replace('stage', ''))-1]}):</strong><ul>`;
    
    const stageScores = student.scores[stage];
    Object.keys(stageScores).forEach(id => {
      const scoreValue = stageScores[id];
      const percentile = convertToPercentile(Number(scoreValue));
      const message = getScoreMessage(percentile);

      // 각 항목에 대한 노트를 불러오기
      const note = student.notes[stage] && student.notes[stage][id] ? student.notes[stage][id] : "";

      // 항목과 점수, 메시지, 노트 출력
      summary += `<li>${getStageLabel(id)}: ${percentile}% - ${message}`;
      
      // 노트가 존재하면 노트도 함께 출력
      if (note) {
        summary += `<br><strong>노트:</strong> ${note}`;
      }
      
      summary += `</li>`;
    });
 
    summary += `</ul></li>`;
  });

  summary += `</ul>`;
  
  app.innerHTML = `
    <h2>최종 평가</h2>
    ${summary}
    <button onclick="renderStudentList()">돌아가기</button>
  `;
}

// 점수대에 맞는 메시지 반환
function getScoreMessage(percentile) {
  if (percentile >= 100) {
    return "잘 해낼 수 있음";
  } else if (percentile >= 80) {
    return "잘 해낼 수 있지만 디테일적인 부분을 더 깊게 설명할 필요가 있음";
  } else if (percentile >= 60) {
    return "완벽하지 않지만 무난히 해 낼 수 있음";
  } else if (percentile >= 40) {
    return "무난히 해낼 수 있지만 더 노력이 필요함";
  } else {
    return "노력이 필요함";
  }
}

// 평가 항목 레이블
function getStageLabel(id) {
  const labels = {
    scriptKnowledge: "대본 숙지",
    basicKnowledge: "기초지식",
    posture: "올바른 자세 유지",
    nonVerbal: "비언어적 표현 활용",
    pronunciation: "발음",
    breathing: "문장의 자연스러움",
    speed: "진행 속도",
    interaction: "Interaction",
    voiceTone: "목소리의 높낮이",
    movementUnderstanding: "추가 개선점"
  };

  return labels[id] || id; 
}

// Local Storage에 저장
function saveToLocalStorage() {
  localStorage.setItem('students', JSON.stringify(students));
}

// Initial render
renderStudentList();

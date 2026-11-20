
function get(id) {
  return document.getElementById(id);
}

const examSubjects = {
  "CBSE Class 10": ["Mathematics", "Science", "Social Science", "English"],
  "CBSE Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science", "English"],
  "JEE Main": ["Physics", "Chemistry", "Mathematics"],
  "JEE Advanced": ["Physics", "Chemistry", "Mathematics"],
  "NEET UG": ["Physics", "Chemistry", "Biology"],
  "CLAT": ["English", "Legal Reasoning", "Logical Reasoning", "Current Affairs", "Quantitative Techniques"],
  "CA Foundation": ["Accounting", "Business Laws", "Quantitative Aptitude", "Business Economics"],
  "CA Intermediate": ["Advanced Accounting", "Corporate Laws", "Taxation", "Cost Accounting", "Auditing"],
  "CA Final": ["Financial Reporting", "Financial Management", "Advanced Auditing", "Direct Tax", "Indirect Tax"],
  "CUET UG": ["English", "General Test", "Mathematics", "Physics", "Chemistry", "Biology", "History", "Geography"]
};

const subjectTopics = {
  "Computer Science": ["Programming Fundamentals", "Python Functions", "File Handling", "Stack", "SQL"],
  "Physics": ["Dual Nature", "Atoms", "Nuclei", "Semiconductors", "Wave Optics"],
  "Chemistry": ["Solutions", "Electrochemistry", "Chemical Kinetics", "Coordination Compounds", "Organic Chemistry"],
  "Mathematics": ["Matrices", "Determinants", "Integrals", "Probability", "Differentiation"],
  "Biology": ["Genetics", "Evolution", "Human Reproduction", "Biotechnology", "Ecology"],
  "English": ["Reading Comprehension", "Grammar", "Vocabulary", "Writing Skills"],
  "Science": ["Physics Basics", "Chemistry Basics", "Biology Basics", "Environment"],
  "Social Science": ["History", "Geography", "Political Science", "Economics"],
  "Legal Reasoning": ["Constitution", "Legal Principles", "Case Studies"],
  "Logical Reasoning": ["Arguments", "Series", "Puzzles", "Syllogisms"],
  "Current Affairs": ["National Affairs", "International Affairs", "Important Events"],
  "Quantitative Techniques": ["Percentages", "Ratio", "Averages", "Profit and Loss"],
  "Accounting": ["Accounting Basics", "Journal Entries", "Ledger", "Trial Balance"],
  "Business Laws": ["Indian Contract Act", "Sale of Goods", "Partnership"],
  "Quantitative Aptitude": ["Ratio", "Percentages", "Time and Work", "Statistics"],
  "Business Economics": ["Demand", "Supply", "Markets", "National Income"],
  "Advanced Accounting": ["Company Accounts", "Consolidation", "Financial Statements"],
  "Corporate Laws": ["Company Law", "Directors", "Meetings"],
  "Taxation": ["Income Tax", "GST", "Tax Basics"],
  "Cost Accounting": ["Cost Sheet", "Budgeting", "Standard Costing"],
  "Auditing": ["Audit Basics", "Audit Evidence", "Internal Control"],
  "Financial Reporting": ["Financial Statements", "Accounting Standards"],
  "Financial Management": ["Capital Budgeting", "Working Capital", "Cost of Capital"],
  "Advanced Auditing": ["Audit Planning", "Audit Reports", "Professional Ethics"],
  "Direct Tax": ["Income Tax", "Tax Planning", "Assessment"],
  "Indirect Tax": ["GST", "Customs", "Input Tax Credit"],
  "General Test": ["General Knowledge", "Reasoning", "Numerical Ability"],
  "History": ["Ancient History", "Medieval History", "Modern History"],
  "Geography": ["Physical Geography", "Human Geography", "Indian Geography"]
};

const questionBank = {
  "Computer Science|Programming Fundamentals|Easy": [
    { q: "What does CPU stand for?", o: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Control Processing User"], a: 0 },
    { q: "Which language is used to style web pages?", o: ["HTML", "CSS", "Python", "Java"], a: 1 },
    { q: "Which symbol creates a single-line JavaScript comment?", o: ["<!-- -->", "/* */", "//", "#"], a: 2 },
    { q: "Which data type stores true or false?", o: ["String", "Integer", "Boolean", "Float"], a: 2 },
    { q: "Which HTML tag creates the largest heading?", o: ["<h6>", "<head>", "<h1>", "<title>"], a: 2 }
  ]
};


let profile = JSON.parse(localStorage.getItem("examProfile") || "null");
let history = JSON.parse(localStorage.getItem("examHistory") || "[]");
let exam = "", subject = "", topic = "", difficulty = "Easy";
let questions = [], answers = {}, current = 0;

function showPage(id) {
  document.querySelectorAll(".page").forEach(page => page.classList.add("hidden"));
  get(id).classList.remove("hidden");
}

get("profileForm").onsubmit = function(event) {
  event.preventDefault();

  profile = {
    name: get("studentName").value.trim(),
    course: get("course").value.trim(),
    semester: get("semester").value.trim()
  };

  localStorage.setItem("examProfile", JSON.stringify(profile));
  displayDashboard();
};

get("editProfile").onclick = function() {
  get("studentName").value = profile.name;
  get("course").value = profile.course;
  get("semester").value = profile.semester;
  showPage("profilePage");
};

function displayDashboard() {
  get("welcomeName").textContent = profile.name;

  let total = 0, best = 0;

  for (let test of history) {
    let score = test.total ? test.score / test.total * 100 : 0;
    total += score;
    if (score > best) best = score;
  }

  get("totalTests").textContent = history.length;
  get("averageScore").textContent = history.length ? Math.round(total / history.length) + "%" : "0%";
  get("bestScore").textContent = Math.round(best) + "%";

  showHistory();
  showPage("dashboardPage");
}

get("examSelect").onchange = function() {
  exam = this.value;
  subject = "";
  topic = "";

  get("subjectCards").innerHTML = "";
  get("topicSelect").innerHTML = '<option value="">Select a topic</option>';
  get("topicSelect").disabled = true;

  let subjects = examSubjects[exam] || [];

  for (let name of subjects) {
    let button = document.createElement("button");
    button.textContent = name;
    button.className = "subject";
    button.onclick = function() { selectSubject(name, button); };
    get("subjectCards").appendChild(button);
  }

  updateAvailability();
};

function selectSubject(name, button) {
  subject = name;

  document.querySelectorAll(".subject").forEach(b => b.classList.remove("active"));
  button.classList.add("active");

  let topics = subjectTopics[subject] || ["Introduction", "Basic Concepts", "Important Questions"];
  get("topicSelect").innerHTML = '<option value="">Select a topic</option>';

  for (let name of topics) {
    let option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    get("topicSelect").appendChild(option);
  }

  get("topicSelect").disabled = false;
  topic = "";
  updateAvailability();
}

get("topicSelect").onchange = function() {
  topic = this.value;
  updateAvailability();
};

get("difficultySelect").onchange = function() {
  difficulty = this.value;
  updateAvailability();
};

get("questionAmount").onchange = updateAvailability;

function updateAvailability() {
  if (!exam || !subject || !topic) {
    get("testStatus").textContent = "Select an exam, subject and topic.";
    get("startTest").disabled = true;
    return;
  }

  let key = subject + "|" + topic + "|" + difficulty;
  let count = Number(get("questionAmount").value);

  get("testStatus").textContent =
    questionBank[key] && count === 5
      ? "5 sample questions available."
      : "AI questions will be generated for this test.";

  get("startTest").disabled = false;
}

async function generateQuestions(count) { //groq AI
  let response = await fetch("http://127.0.0.1/generate-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exam, subject, topic, difficulty, count })
  });

  let data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || "Question generation failed.");
  }

  if (!Array.isArray(data.questions) || data.questions.length !== count) {
    throw new Error("The AI returned an incorrect number of questions.");
  }

  questions = data.questions.map(item => ({
    q: item.question,
    o: item.options,
    a: item.answer,
    explanation: item.explanation
  }));
}

get("startTest").onclick = async function() {
  let count = Number(get("questionAmount").value);
  let key = subject + "|" + topic + "|" + difficulty;

  get("startTest").disabled = true;
  get("startTest").textContent = "Please wait...";

  try {
    if (questionBank[key] && count === 5) {
      questions = questionBank[key];
    } else {
      get("testStatus").textContent = "AI is preparing your questions...";
      await generateQuestions(count);
    }

    answers = {};
    current = 0;
    get("testTitle").textContent = exam + " | " + subject + " | " + topic;

    displayQuestion();
    showPage("testPage");
  } catch (error) {
    alert(error.message);
    get("testStatus").textContent = "Question generation failed. Please try again.";
  }

  get("startTest").disabled = false;
  get("startTest").textContent = "Start Practice Test";
};

function displayQuestion() {
  let q = questions[current];

  get("questionCount").textContent = "Question " + (current + 1) + " of " + questions.length;
  get("questionText").textContent = q.q;
  get("options").innerHTML = "";
  get("questionExplanation").textContent = "";
  get("questionExplanation").style.display = "none";

  q.o.forEach((option, i) => {
    let label = document.createElement("label");
    let radio = document.createElement("input");

    radio.type = "radio";
    radio.name = "answer";
    radio.value = i;
    radio.checked = answers[current] === i;

    radio.onchange = function() {
      answers[current] = i;
      showExplanation();
    };

    label.append(radio, option);
    get("options").appendChild(label);
  });

  if (answers[current] !== undefined) showExplanation();

  get("previousBtn").disabled = current === 0;
  get("nextBtn").disabled = current === questions.length - 1;
}

function showExplanation() {
  let explanation = questions[current].explanation;

  if (explanation) {
    get("questionExplanation").textContent = "Explanation: " + explanation;
    get("questionExplanation").style.display = "block";
  }
}

get("previousBtn").onclick = function() {
  if (current > 0) {
    current--;
    displayQuestion();
  }
};

get("nextBtn").onclick = function() {
  if (current < questions.length - 1) {
    current++;
    displayQuestion();
  }
};

get("submitTest").onclick = function() {
  if (!confirm("Are you sure you want to submit?")) return;

  let score = 0;

  for (let i = 0; i < questions.length; i++) {
    if (answers[i] === questions[i].a) score++;
  }

  let result = {
    exam, subject, topic, difficulty, score,
    total: questions.length,
    date: new Date().toLocaleDateString()
  };

  history.unshift(result);
  localStorage.setItem("examHistory", JSON.stringify(history));

  get("scoreText").textContent = score + " / " + questions.length;
  get("resultMessage").textContent = score === questions.length ? "Excellent work!" : "Keep practising!";

  let percentage = Math.round(score / questions.length * 100);
  get("resultDetails").textContent = exam + " | " + subject + " | " + topic + " | " + percentage + "%";

  showPage("resultPage");
};

function showHistory() {
  get("historyList").innerHTML = "";

  if (history.length === 0) {
    get("historyList").textContent = "No tests attempted yet.";
    return;
  }

  for (let test of history.slice(0, 5)) {
    let p = document.createElement("p");
    p.textContent = test.exam + " - " + test.subject + " - " + test.topic +
      " | Score: " + test.score + "/" + test.total +
      " | " + test.difficulty + " | " + test.date;
    get("historyList").appendChild(p);
  }
}

get("dashboardBtn").onclick = displayDashboard;

if (profile) displayDashboard();
else showPage("profilePage");

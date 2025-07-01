google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(termGPA);
google.charts.setOnLoadCallback(drawCourseGradeTrendChart);
google.charts.setOnLoadCallback(passingRate);
google.charts.setOnLoadCallback(difficultyLevel);
google.charts.setOnLoadCallback(enrollment);

//fetching data from json files
async function fetchJSON(file) {
  try {
      let response = await fetch(file);
      return await response.json();
  } catch (error) {
      console.error("Error fetching JSON:", error);
      return null;
  }
}

//calculating GPA per term
async function calculateGPAData() {
  try {
      const studentCourseHistory = await fetchJSON('../student/data/student-course-history.json');
      const coursesData = await fetchJSON('../student/data/courses.json');

      if (!studentCourseHistory || !coursesData) {
          console.error("Error: Missing required data.");
          return [];
      }

      const allCourses = Object.values(coursesData).flat(); 
      const courseMap = new Map(allCourses.map(c => [c.code, c.units]));

      let gpaData = [['Academic Term', 'GPA']]; // First row (headers) for Google Charts

      studentCourseHistory.forEach(termData => {
          let totalWeighted = 0;
          let totalUnits = 0;

          termData.courses.forEach(course => {
              const units = courseMap.get(course.code) || 0;
              if (!isNaN(course.grade) && units > 0) {
                  totalWeighted += course.grade * units;
                  totalUnits += units;
              }
          });

          if (totalUnits > 0) {
              const gpa = parseFloat((totalWeighted / totalUnits).toFixed(2));
              gpaData.push([termData.term, gpa]); // Add computed term and GPA
          }
      });

      console.log("Generated GPA Data:", gpaData); // Debugging output
      return gpaData;
  } catch (error) {
      console.error("Error processing GPA:", error);
      return [];
  }
}

//Term vs GPA chart
async function termGPA() {
  const gpaData = await calculateGPAData();
  
  if (gpaData.length <= 1) {
      console.error("No valid GPA data found.");
      return;
  }

  // Modify the data structure to include annotations
  let updatedData = [['Term', 'GPA', { role: 'annotation' }]];

  gpaData.slice(1).forEach(row => {
      updatedData.push([row[0], row[1], row[1].toFixed(2)]); // Term, GPA, Annotation (formatted GPA)
  });

  var data = google.visualization.arrayToDataTable(updatedData);

  var options = {
      colors: ['#00563f'],
      hAxis: { textStyle: { fontSize: 11, color: '#333'} },
      vAxis: {
          textStyle: { fontSize: 11},
          minValue: 1, 
          maxValue: 3,
          direction: -1, 
          viewWindow: { min: 1, max: 3 }, 
          gridlines: { count: 5, color: '#ccc' }
      },
      legend: { position: 'none' },
      pointShape: 'circle',
      pointSize: 7,
      chartArea: { left: 30, top: 5, right: 10, bottom: 40, width: '90%', height: '80%' },
      series: {
        0: { annotations: {
                style: 'point',  // Places annotations directly on the data points
                textStyle: {
                    fontSize: 12,
                    color: '#000',  // Black text for readability
                    bold: true }}
            }
      }
  };

  var chart = new google.visualization.LineChart(document.getElementById('chart1_div'));
  chart.draw(data, options);

   // Resize event listener
   window.addEventListener('resize', function() {
    chart.draw(data, options);
  });

   // Select the first data point by default
   var firstTerm = data.getValue(0, 0); // Get the first term value

   updateTable(firstTerm);
   //updateCourseGradeTrends(firstTerm);
   //updateDifficultyMatrix(firstTerm);
   document.getElementById("termLabel").innerHTML = `<span class="txt-gray2">TERM ${firstTerm}</span> <span class="green pad-5 border-round12">Scholastic Standing: GOOD</span>`;
   //document.getElementById("termLabel").textContent = `TERM ${firstTerm}`;
   //document.getElementById("insightsLabel").textContent = `Insights on TERM ${firstTerm}`;
  

  google.visualization.events.addListener(chart, 'select', function () {
    var selection = chart.getSelection();
    if (selection.length > 0) {
        var term = data.getValue(selection[0].row, 0);
        updateTable(term);
        //updateCourseGradeTrends(term);
        //updateDifficultyMatrix(term);
         // Update the term label dynamically
        document.getElementById("termLabel").innerHTML = `<span class="txt-black">TERM ${term}</span> <span class="green pad-5 border-round12">Scholastic Standing: GOOD</span>`;
        //document.getElementById("termLabel").textContent = `TERM ${term}`;
        //document.getElementById("insightsLabel").textContent = `Insights on TERM ${term}`;
        }
});
}

// cumulative GPA
async function updateCumulativeGPA() {
    try {
        const studentCourseHistory = await fetchJSON('../student/data/student-course-history.json');
        const coursesData = await fetchJSON('../student/data/courses.json');

        if (!studentCourseHistory || !coursesData) {
            console.error("Error: Missing required data.");
            return;
        }

        const allCourses = Object.values(coursesData).flat(); 
        const courseMap = new Map(allCourses.map(c => [c.code, c.units]));

        let cumulativeWeighted = 0;
        let cumulativeUnits = 0;

        studentCourseHistory.forEach(termData => {
            termData.courses.forEach(course => {
                const grade = parseFloat(course.grade);
                const units = parseFloat(courseMap.get(course.code));

                // Include only courses with numeric grades and numeric units
                if (!isNaN(grade) && !isNaN(units) && units > 0) {
                    cumulativeWeighted += grade * units;
                    cumulativeUnits += units;
                }
            });
        });

        const cumulativeGPA = cumulativeUnits > 0 ? parseFloat((cumulativeWeighted / cumulativeUnits).toFixed(2)) : null;

        if (cumulativeGPA !== null) {
            // Insert GPA into the <p> element
            document.getElementById("cumulative-gpa").textContent = `${cumulativeGPA}`;
        }
    } catch (error) {
        console.error("Error processing Cumulative GPA:", error);
    }
}

// Call function after the page loads
document.addEventListener("DOMContentLoaded", updateCumulativeGPA);

//Remarks table
let currentPage = 1;
const rowsPerPage = 5;
let currentCourses = [];

async function updateTable(selectedTerm) {
    const studentCourseHistory = await fetchJSON('../student/data/student-course-history.json');
    if (!studentCourseHistory) return;

    const termData = studentCourseHistory.find(term => term.term === selectedTerm);
    if (!termData) {
        console.error("No data found for term:", selectedTerm);
        return;
    }

    const performanceLevels = [
        { min: 1, max: 1.49, level: "Outstanding" },
        { min: 1.5, max: 1.99, level: "Above Average" },
        { min: 2, max: 2.49, level: "Competent" },
        { min: 2.5, max: 2.99, level: "Acceptable" },
        { min: 3, max: 3, level: "Minimum Competence" },
        { min: 4, max: 4, level: "At Risk" },
        { min: 5, max: 5, level: "Failed" }
    ];

    function getPerformanceLevel(grade) {
        if (grade === "INC") return "Pending Completion";
        if (grade === "DRP") return "Withdrew";
        const numericGrade = parseFloat(grade);
        if (!isNaN(numericGrade)) {
            const level = performanceLevels.find(pl => numericGrade >= pl.min && numericGrade <= pl.max);
            return level ? level.level : "Unknown";
        }
        return "Unknown";
    }

    currentCourses = termData.courses.map(course => ({
        code: course.code,
        grade: course.grade,
        performance: getPerformanceLevel(course.grade)
    }));

    currentPage = 1; // Reset to first page when updating
    updateTableDisplay();
}

function updateTableDisplay() {
    let tableBody = document.getElementById("gradeRemarks");
    tableBody.innerHTML = ""; 

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedCourses = currentCourses.slice(start, end);

    paginatedCourses.forEach(course => {
        let row = `<tr>
            <td>${course.code}</td>
            <td>${course.grade}</td>
            <td>${course.performance}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });

    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = end >= currentCourses.length;
    document.getElementById('pageInfo').textContent = `Page ${currentPage}`;
}

// Event Listeners for Pagination
function pagination() 
    {document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateTableDisplay();
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentPage * rowsPerPage < currentCourses.length) {
            currentPage++;
            updateTableDisplay();
        }
    });
}

// passing rate
function passingRate() {
    const data = google.visualization.arrayToDataTable([
        ['Attempts', '1 Take', '2 Takes', '3 Takes', '>3'],
        ['Students', 72, 90, 32, 20]
    ]);

    const options = {
        isStacked: 'percent',
        legend: { position: 'none' },
        hAxis: {
        textPosition: 'none'
        },
        vAxis: {
        textPosition: 'none',
        gridlines: { color: 'transparent' }
        },
        chartArea: { width: '100%', height: '40' },
        colors: ['#72f0b2', '#41cf7f', '#28a86f', '#4c8c6a'],
        bar: { groupWidth: '100%' }
    };

    const chart = new google.visualization.BarChart(document.getElementById("chart3_div"));
    chart.draw(data, options);
}

function difficultyLevel() {
    const data = google.visualization.arrayToDataTable([
        ['Level', 'Very easy', 'Eay', 'Somewhat easy', 'Moderate', 'Somewhat difficult','Difficult','Very difficult'],
        ['Students', 32, 23, 90, 72, 127, 12, 7]
    ]);

    const options = {
        isStacked: 'percent',
        legend: { position: 'none' },
        hAxis: {
        textPosition: 'none'
        },
        vAxis: {
        textPosition: 'none',
        gridlines: { color: 'transparent' }
        },
        chartArea: { width: '100%', height: '40' },
        colors: ['#6ce5e8', '#41b8d5', '#2d8bba', '#506e9a', '#635a92', '#7e468a', '#942270'],
        bar: { groupWidth: '100%' }
    };

    const chart = new google.visualization.BarChart(document.getElementById("chart4_div"));
    chart.draw(data, options);
}

function enrollment() {
    var data = google.visualization.arrayToDataTable([
        ['Year', '1st sem', '2nd sem', 'Midyear'],
        ['2022', 1000, 1000, 1200],
        ['2023', 9500, 3500, 800],
        ['2024', 1800, 2500, 700],
        ['2025', 3200, 3000, 900],
    ]);

    var options = {
        title: '',
        curveType: 'none', // no smoothing
        legend: { position: 'none' }, // hide legend to match the image
        colors: ['#c3083d', '#e19109', '#059669'], // red, orange, green
        lineWidth: 3,
        pointSize: 5,
        chartArea: { top: 10, right: 10, bottom: 20, left: 0, width: '85%', height: '70%' },
        hAxis: {
        textStyle: { fontSize: 12 }
        },
        vAxis: {
        textStyle: { fontSize: 12 },
        minValue: 0
        }
    };

    var chart = new google.visualization.LineChart(document.getElementById('chart5_div'));
    chart.draw(data, options);
}

// currently hidden
// Function to update course grade trends dynamically
async function updateCourseGradeTrends(selectedTerm) {
  const studentCourseHistory = await fetchJSON('../student/data/student-course-history.json');
  const coursesData = await fetchJSON('../student/data/courses.json');

  if (!studentCourseHistory || !coursesData) {
      console.error("Error: Missing required data.");
      return;
  }

  // Find the selected term's course data
  const termData = studentCourseHistory.find(term => term.term === selectedTerm);
  if (!termData) {
      console.error("No data found for term:", selectedTerm);
      return;
  }

  // Flatten course categories and create a map for easy lookup
  const allCourses = Object.values(coursesData).flat(); 
  const courseMap = new Map(allCourses.map(course => [course.code, course]));

  // Prepare data array for Google Charts
  let chartData = [['Course', 'Actual Grades', 'Benchmark Grades']];

  termData.courses.forEach(course => {
      const matchedCourse = courseMap.get(course.code);
      if (matchedCourse) {
          chartData.push([
              course.code, 
              parseFloat(course.grade) || 0,  // Current term grade
              parseFloat(matchedCourse.historicalgrade) || 0  // Historical grade
          ]);
      }
  });

  drawCourseGradeTrendChart(chartData);
}

// Function to draw the Course Grade Trend Chart
function drawCourseGradeTrendChart(chartData) {
  var data = google.visualization.arrayToDataTable(chartData);

  var options = {
    title: '',
    chartArea: { width: '80%', height: '70%' },
    legend: { position: 'bottom' },
    hAxis: { 
      textStyle: { fontSize: 10 }, 
    },
    vAxis: { 
      textStyle: { fontSize: 11},
      minValue: 1, 
      maxValue: 3, 
      direction: -1,
      viewWindow: { min: 1, max: 3 }, 
      gridlines: { count: 5, color: '#ccc' },
      minorGridlines: { count: 1, color: '#eee' },
      ticks: [1.0, 1.5, 2.0, 2.5, 3.0]
    },
    series: {
      0: { color: '#00563f', pointShape: 'circle', pointSize: 7}, // Solid green line
      1: { color: '#8d1436', lineDashStyle: [10, 5], pointShape: 'star',  pointSize: 7} // Dashed maroon line
    },
    chartArea: { left: 30, top: 20, right: 10, bottom: 40, width: '90%', height: '80%' }
  };

  var chart = new google.visualization.LineChart(document.getElementById('chart2_div'));
  chart.draw(data, options);

   // Resize event listener
   window.addEventListener('resize', function() {
    chart.draw(data, options);
  });
}

// Define difficulty color mapping based on the conditions
function getDifficultyColor(value) {
  if (value === 0) return "#fff";
  if (value < 0.1) return "#2a7570";
  if (value < 0.3) return "#93b0bf";
  if (value < 0.5) return "#d8c9de";
  if (value < 0.7) return "#b67496";
  if (value < 0.9) return "#a44868";
  return "#8d1436"; // Value == 1
}

//difficulty matrix
async function updateDifficultyMatrix(selectedTerm) {
  const studentCourseHistory = await fetchJSON('../student/data/student-course-history.json');
  const coursesData = await fetchJSON('../student/data/courses.json');

  if (!studentCourseHistory || !coursesData) {
      console.error("Error: Missing required data.");
      return;
  }

  // Find the selected term's courses
  const termData = studentCourseHistory.find(term => term.term === selectedTerm);
  if (!termData) {
      console.error("No data found for term:", selectedTerm);
      return;
  }

  console.log("Selected Term:", selectedTerm);

  const difficultyIndex = [
      { label: "Very Easy", value: 0.1 },
      { label: "Easy", value: 0.3 },
      { label: "Moderate", value: 0.5 },
      { label: "Difficult", value: 0.7 },
      { label: "Very Difficult", value: 0.9 }
  ];

  function getDifficultyIndex(difficulty) {
      if (difficulty) {
          const index = difficultyIndex.find(di => difficulty === di.label);
          return index ? index.value : 0; // Return 0 if difficulty is unknown
      }
      return 0;
  }

  console.log("Courses in Selected Term:", termData.courses);

  // Flatten course categories and create a map for easy lookup
  const allCourses = Object.values(coursesData).flat();
  const courseMap = new Map(allCourses.map(course => [course.code, course]));

  console.log("Course Map (Flattened):", courseMap); // Debugging: Ensure all courses are mapped

  // 🔹 Extract course codes & difficulty index from student history
  const courses = termData.courses.map(course => {
      const courseDetails = courseMap.get(course.code);
      const difficultyLabel = courseDetails ? courseDetails.difficulty : null;
      return {
          code: course.code,
          difficulty: difficultyLabel,
          difficultyIndex: getDifficultyIndex(difficultyLabel)
      };
  });

  console.log("Mapped Courses for Matrix:", courses); // Debugging: Check if difficulties are correctly assigned

  // 🔹 Generate matrix table
  generateMatrixTable(courses, selectedTerm);
}

function generateMatrixTable(courses, term) {
  const table = document.getElementById("difficultyMatrix");
  table.innerHTML = ""; // Clear previous table

  // Table Header Row
  let headerRow = "<tr><th></th>";
  courses.forEach(course => {
      headerRow += `<th>${course.code}</th>`;
  });
  headerRow += "</tr>";
  table.innerHTML += headerRow;

  // Generate Matrix Rows (Lower Triangle Only)
  courses.forEach((courseA, i) => {
      let row = `<tr><th>${courseA.code}</th>`;
      courses.forEach((courseB, j) => {
          let cellContent = "";
          if (j <= i) { // Fill only the lower triangular part (including diagonal)
              let diffValue;
              if (i === j) {
                  diffValue = 0; // Set diagonal values to 1 (self-comparison)
              } else {
                  let diffA = courseA.difficultyIndex || 0;
                  let diffB = courseB.difficultyIndex || 0;
                  diffValue = diffA + diffB;
                  if (diffValue > 1) diffValue = 1; // Cap at 1
              }
              let cellColor = getDifficultyColor(diffValue);
              cellContent = `<td style="background-color:${cellColor}">${diffValue.toFixed(1)}</td>`;
          } else {
              cellContent = `<td></td>`; // Leave upper triangle empty
          }
          row += cellContent;
      });
      row += "</tr>";
      table.innerHTML += row;
  });
}

// units percentage 
async function updateUnitProgress() {
    try {
        const studentCourseHistory = await fetchJSON('../student/data/student-course-history.json');
        const coursesData = await fetchJSON('../student/data/courses.json');

        if (!studentCourseHistory || !coursesData) {
            console.error("Error: Missing required data.");
            return;
        }

        console.log("Loaded studentCourseHistory:", studentCourseHistory);
        console.log("Loaded coursesData:", coursesData);

        // Convert courses into a map for easy lookup
        const allCourses = Object.values(coursesData).flat();
        const courseMap = new Map(allCourses.map(c => [c.code, parseFloat(c.units)])); // Ensure units are numbers

        let completedUnits = 0;
        let inProgressUnits = 0;
        const totalUnitsRequired = 160;

        // Retrieve coursePlan from localStorage
        let coursePlan = JSON.parse(localStorage.getItem('coursePlan')) || [];

        // Sum up the units from coursePlan for in-progress courses
        inProgressUnits = coursePlan.reduce((sum, course) => {
          return sum + (!isNaN(course.units) ? Number(course.units) : 0);
        }, 0);

        // Calculate completed units from studentCourseHistory
        studentCourseHistory.forEach(termData => {
            termData.courses.forEach(course => {
                const units = courseMap.get(course.code);
                if (!isNaN(units) && !isNaN(parseFloat(course.grade))) {
                    completedUnits += units; // Completed courses
                }
            });
        });
                const notStartedUnits = totalUnitsRequired - (completedUnits + inProgressUnits);

        // Calculate percentages
        const percentCompleted = ((completedUnits / totalUnitsRequired) * 100).toFixed(1);
        const percentInProgress = ((inProgressUnits / totalUnitsRequired) * 100).toFixed(1);
        const percentNotStarted = ((notStartedUnits / totalUnitsRequired) * 100).toFixed(1);

        let classification = "Freshman";
        if (percentCompleted > 75) {
            classification = percentCompleted === 100 ? "Graduating" : "Senior";
        } else if (percentCompleted > 50) {
            classification = "Junior";
        } else if (percentCompleted > 25) {
            classification = "Sophomore";
        }

        // Debugging
        console.log("Computed Units:", { completedUnits, inProgressUnits, notStartedUnits });
        console.log("Computed Percentages:", { percentCompleted, percentInProgress, percentNotStarted });

        // Ensure elements exist before updating
        if (document.getElementById("units-completed")) {
            document.getElementById("units-completed").textContent = 
                `${completedUnits} units completed`;
        }
        if (document.getElementById("units-in-progress")) {
            document.getElementById("units-in-progress").textContent = `${inProgressUnits} units in progress`;
        }
        if (document.getElementById("units-not-started")) {
            document.getElementById("units-not-started").textContent = `${notStartedUnits} units to be taken`;
        }
        if (document.getElementById("percent-completed")) {
            document.getElementById("percent-completed").textContent = `${percentCompleted}%`;
        }
        if (document.getElementById("percent-completed1")) {
            document.getElementById("percent-completed1").textContent = `${percentCompleted}%`;
        }
        if (document.getElementById("percent-in-progress")) {
            document.getElementById("percent-in-progress").textContent = `${percentInProgress}%`;
        }
        if (document.getElementById("percent-not-started")) {
            document.getElementById("percent-not-started").textContent = `${percentNotStarted}%`;
        }
        if (document.getElementById("classification")) {
            document.getElementById("classification").textContent = classification;
        }

        // Update progress bar widths
        if (document.querySelector(".progress-fill")) {
            document.querySelector(".progress-fill").style.width = `${percentCompleted}%`;
        }
        if (document.querySelector(".progress-ongoing")) {
            document.querySelector(".progress-ongoing").style.width = `${percentInProgress}%`;
        }
        if (document.querySelector(".progress-remaining")) {
            document.querySelector(".progress-remaining").style.width = `${percentNotStarted}%`;
        }

        console.log("Progress bar updated!");
    } catch (error) {
        console.error("Error updating unit progress:", error);
    }
}

// Run when page loads
document.addEventListener("DOMContentLoaded", updateUnitProgress);

// progress flowchart 
async function SPMF() {
  const studentCourseHistory = await fetch('../student/data/student-course-history.json').then(res => res.json());
  const courses = await fetch('../student/data/courses.json').then(res => res.json());
  const courseCurriculum = await fetch('../student/data/courses-curriculum.json').then(res => res.json());

  // Step 1: Retrieve coursePlan from localStorage
  const coursePlan = JSON.parse(localStorage.getItem("coursePlan")) || [];

  // Step 2: Merge coursePlan into studentCourseHistory
  //if (coursePlan.length > 0) {
  //    studentCourseHistory.push({ term: "1S AY24-25", courses: coursePlan });
  //}
  
  // ✅ Step 2: Merge coursePlan into studentCourseHistory
    if (coursePlan.length === 0) {
    // If no courses yet, use predefined courses
    const predefinedCourses = ["IE 199", "IE 158", "IE 165", "IE 185", "HK 12 (1)", "IE 200C", "MGT 131"];

    // Push predefined courses to coursePlan
    predefinedCourses.forEach(courseCode => {
        // Optional: add as simple objects
        coursePlan.push({ code: courseCode });
    });
    }

    studentCourseHistory.push({
    term: "1S AY24-25",
    courses: coursePlan
    });

  // Step 3: Add type attribute to student course history
  studentCourseHistory.forEach(term => {
      term.courses.forEach(course => {
          Object.values(courses).flat().forEach(c => {
              if (c.code === course.code && c.type) {
                  course.type = c.type;
              }
          });
      });
  });

  // Step 4: Replace course codes in curriculum
  courseCurriculum.forEach(course => {
      course.modifiedCode = course.code; // Default to original code
  });

  studentCourseHistory.forEach(term => {
      term.courses.forEach(studentCourse => {
          for (let course of courseCurriculum) {
              if (!course.modifiedCode || course.modifiedCode === course.code) {
                  if (studentCourse.type === "capstone" && course.code.includes("IE 200/B/C")) {
                      course.modifiedCode = studentCourse.code;
                      break;
                  }
                  if (studentCourse.type === "elective" && course.code.includes("GE Elective")) {
                      course.modifiedCode = studentCourse.code;
                      break;
                  }
                  if (studentCourse.type === "cognate" && course.code.includes("Cognate")) {
                      course.modifiedCode = studentCourse.code;
                      break;
                  }
                  if (studentCourse.type === "choose one" && course.code.includes("KAS 1/HIST 1")) {
                      course.modifiedCode = studentCourse.code;
                      break;
                  }
              }
          }
      });
  });

  // Step 5: Assign terms to modified courses
  const courseTermMap = {}; // Stores modifiedCode -> term mappings

  courseCurriculum.forEach(course => {
      let assignedTerm = "2S AY24-25"; // Default term for unmatched courses

      // Check student course history for a match
      for (let term of studentCourseHistory) {
          if (term.courses.some(c => c.code === course.modifiedCode)) {
              assignedTerm = term.term; // Keep original term if matched
              break;
          }
      }

      // Check if course exists in coursePlan (pushed to 1S AY24-25)
      if (coursePlan.some(c => c.code === course.modifiedCode)) {
          assignedTerm = "1S AY24-25";
      }

      courseTermMap[course.modifiedCode] = assignedTerm;
  });

  // Step 6: Retrieve units from courses.json or fallback to courses-curriculum.json
  const courseUnitMap = {}; // Stores modifiedCode -> units mappings

  courseCurriculum.forEach(course => {
      let units = null;

      // Check courses.json for a match
      for (let category of Object.values(courses)) {
          let matchedCourse = category.find(c => c.code === course.modifiedCode);
          if (matchedCourse) {
              units = matchedCourse.units;
              break;
          }
      }

      // Fallback to courses-curriculum.json if no match is found
      if (units === null) {
          units = course.units || "N/A"; // Default to "N/A" if no unit is found
      }

      courseUnitMap[course.modifiedCode] = units;
  });

  // Step 7: Log modified course codes, assigned terms, and units
  console.log("Modified Codes, Assigned Terms, and Units:");
  Object.entries(courseTermMap).forEach(([code, term]) => {
      console.log(`Course: ${code}, Term: ${term}, Units: ${courseUnitMap[code]}`);
  });

  // Step 9: Calculate total units
  let totalUnits = 0;
  Object.values(courseUnitMap).forEach(units => {
      if (!isNaN(units) && units !== null && units !== "") {
          totalUnits += Number(units);
      }
  });

  // Log the total units
  console.log(`Total Units: ${totalUnits}`);

  const container = document.getElementById("courseContainer");
  container.innerHTML = ""; // Clear previous content

  // Define the desired term order
  const termOrder = [
      "1S AY21-22", "2S AY21-22",
      "1S AY22-23", "2S AY22-23", "MIDYR 22-23",
      "1S AY23-24", "2S AY23-24", "MIDYR 23-24",
      "1S AY24-25", "2S AY24-25"
  ];

  // Transform courseTermMap and courseUnitMap into a structured array
  const formattedCourses = Object.entries(courseTermMap).map(([code, term]) => ({
      code,
      term,
      units: courseUnitMap[code] || 0 // Default to 0 if no unit data is found
  }));

  // Group courses by term
  const groupedByTerm = {};

  // Populate groupedByTerm with course data
  formattedCourses.forEach(({ code, term, units }) => {
      if (!groupedByTerm[term]) {
          groupedByTerm[term] = { courses: [], totalUnits: 0 };
      }
      groupedByTerm[term].courses.push({ code, units });

      // Only sum numeric units
      if (!isNaN(units) && units !== null && units !== "") {
          groupedByTerm[term].totalUnits += Number(units);
      }
  });

  // Sort terms according to predefined order
  const sortedTerms = termOrder.filter(term => groupedByTerm[term]); // Keep only existing terms

  // Create columns in sorted order
  sortedTerms.forEach(term => {
      const { courses, totalUnits } = groupedByTerm[term];

      const column = document.createElement("div");
      column.classList.add("column");

      // Add term title
      const termTitle = document.createElement("div");
      termTitle.classList.add("term-title");
      termTitle.textContent = term;
      column.appendChild(termTitle);

      // Create a wrapper for courses
      const courseWrapper = document.createElement("div");
      courseWrapper.classList.add("course-wrapper");

      // Add course boxes
      courses.forEach(({ code }) => {
          const courseBox = document.createElement("div");
          courseBox.classList.add("course-box");
          let properCode = 
              code.startsWith("HK 12") ? "HK 12" :
              code.startsWith("IE 200/B/C") ? "IE 200/B/C" :
              code.startsWith("GE Elective") ? "GE Elective" :
              code.startsWith("Cognate") ? "Cognate" :
              code;

          courseBox.textContent = properCode;

          // Assign colors based on term
          if (term === "1S AY24-25") {
              courseBox.classList.add("yellow");
          } else if (term === "2S AY24-25") {
              courseBox.classList.add("light-gray");
          } else {
              courseBox.classList.add("green");
          }

          courseWrapper.appendChild(courseBox);
      });

      column.appendChild(courseWrapper);

      // Add total units box
      const totalUnitsBox = document.createElement("div");
      totalUnitsBox.classList.add("total-units");
      totalUnitsBox.textContent = `${totalUnits} units`;
      column.appendChild(totalUnitsBox);

      container.appendChild(column);
  });
}

// Fetch and display course data when page loads
document.addEventListener("DOMContentLoaded", SPMF);

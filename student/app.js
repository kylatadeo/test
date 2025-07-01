document.addEventListener("DOMContentLoaded", function() {
  changeTab(0, 'student-info.html');
});

// course-planning.html tab contents
function changeTab(index, page) {
  const tabs = document.querySelectorAll(".tab");
  const content = document.getElementById("tabContent");

  // Update active tab styling
  tabs.forEach((tab, i) => {
      tab.classList.toggle("active", i === index);
      tab.classList.toggle("inactive", i !== index);
  });

  // Load HTML content dynamically
  fetch(page)
      .then(response => response.text())
      .then(html => {
          content.innerHTML = html;

          // Reattach event listeners
          if (page === 'course-plan.html') {
            showHideCourseList();
            courseLists(0,'all_courses');
            document.querySelectorAll(".remove-button").forEach(button => {
              button.style.display = "none"; // Hide remove buttons
            });
            generateSchedule();
            loadCourses();
            prefBtn();
            generateBtn();
          }

          if (page === 'student-info.html') {
            termGPA();
            pagination();
            updateCumulativeGPA();
            updateUnitProgress();
          }

          if (page === 'spmf.html'){
            SPMF();
            updateUnitProgress();
            reqBtn();
          }

          if (page === 'course-analytics.html') {
            passingRate();
            difficultyLevel();
            enrollment();
          }
      })
      .catch(error => {
          content.innerHTML = "Error loading content.";
          console.error("Error:", error);
      });
}

// Function to show and hide courseList-container
function showHideCourseList() {
  const modifyButton = document.getElementById("modify-button");
  const saveButton = document.getElementById("save-button");
  //const finalizeButton = document.getElementById("finalize-button");
  const courseListContainer = document.querySelector(".courseList-container");

  modifyButton.addEventListener("click", function () {
    courseListContainer.classList.remove("hide"); // Show course list
    modifyButton.style.display = "none"; // Hide modify button
    //finalizeButton.style.display = "none"
    saveButton.classList.remove("hidden"); // Enable save button

    // Select all remove buttons (including newly added ones)
    document.querySelectorAll(".remove-button").forEach(button => {
      button.style.display = "inline-block"; // Show remove buttons
    });
  });

  saveButton.addEventListener("click", function () {
    courseListContainer.classList.add("hide"); // Hide course list
    modifyButton.style.display = "block"; // Show modify button again
    //finalizeButton.style.display ="block"
    saveButton.classList.add("hidden"); // Disable save button

    // Select all remove buttons (including newly added ones)
    document.querySelectorAll(".remove-button").forEach(button => {
      button.style.display = "none"; // Hide remove buttons
    });
  });

  //finalizeButton.addEventListener("click", function () {
    //confirm("By finalizing your course plan, you are also finalizing your SPMF. Your academic adviser will be notified to review it. Do you wish to continue?")
  //});
}

// Start of course planning 
let coursePlan = JSON.parse(localStorage.getItem("coursePlan")) || []; 
let courseInfo = [];
let courseOfferings = []; // Store data globally
let addToCoursePlan;

let alertActive = false;

// Loading data to the course list, adding courses into the course plan
function courseLists(index, category) {
  const tabs = document.querySelectorAll(".tab1");

  // Update active state
  tabs.forEach((tab, i) => {
      if (i === index) {
          tab.classList.add("active1");
          tab.classList.remove("inactive1");
      } else {
          tab.classList.add("inactive1");
          tab.classList.remove("active1");
      }
  });

  let courseInfoHTML = document.querySelector('.course-list');
  let coursePlanHTML = document.querySelector('.course-plan');
  let totalUnitsText = document.querySelector('.total-units');
  let totalUnits = 0;

  // Check if alert has been shown in this session
  //let alertShown = sessionStorage.getItem("alertShown") === "true"; 

  // Function to Add Course data to Course List
  const addDataToHTML = () => {
    courseInfoHTML.innerHTML = '';
    if (courseInfo.length > 0) {
      courseInfo.forEach(course => {
        let newCourse = document.createElement('tr');
        newCourse.classList.add('course-info');
        newCourse.dataset.code = course.code;
        let properName = course.code.startsWith("HK 12") ? "HK 12" : course.code;
        newCourse.innerHTML = `
          <td>${properName}</td>
          <td>${course.title}</td>
          <td>${course.units}</td>
          <td class="difficulty">${course.difficulty}</td>
          <td class="performance">${course.performance}</td>
          <td>
            <button class="view-button bg-green button txt-white">View Info</button>
            <button class="add-button bg-blue button txt-white">Add</button>
          </td>`;
        courseInfoHTML.appendChild(newCourse);
      });
    }
  }

  // Event Listener for Add Button
  courseInfoHTML.addEventListener('click', (event) => {
    courseInput.value = ""; 
    isFiltered = false; // Filter resets when a course is added
    filterButton.innerHTML = `<span class="material-symbols-outlined">
            filter_alt</span>
          <span class="txt-14 txt-semibold">Apply Filter</span>`; 
    
    //let positionClick = event.target;
    //if (positionClick.classList.contains('add-button')) {
    //  let row = positionClick.closest('tr');
    //  if (row) {
    //    let course_code = row.dataset.code;
    //    addToCoursePlan(course_code);
    //  }
    //}

    document.addEventListener('click', (event) => {
      const positionClick = event.target;

      if (positionClick.classList.contains('add-button')) {
        if (positionClick.disabled) return; // prevent spamming

        positionClick.disabled = true;
        setTimeout(() => positionClick.disabled = false, 500); // Re-enable after 0.5s

        const row = positionClick.closest('tr');
        if (row) {
          const course_code = row.dataset.code;
          addToCoursePlan(course_code);
        }
      }
    });
  });

  // Function to Add Course to Course Plan
  addToCoursePlan = (course_code) => {
    // Ensure course offerings are loaded before proceeding
    if (courseOfferings.length === 0) {
      showAlert("Course offerings data is not yet loaded. Please try again.");
      //if (!alertShown) {
      //  alert("Course offerings data is not yet loaded. Please try again.");   
      //  sessionStorage.setItem("alertShown", "true");    
      //  }
      return;
    }

    // Check if the student has already taken this course with a passing grade
    if (hasTakenCourse(course_code)) {
      showAlert(`You have already taken ${course_code} with a passing grade. It cannot be added again.`);
      //if (!alertShown) {
      //  alert(`You have already taken ${course_code} with a passing grade. It cannot be added again.`);     
      //  sessionStorage.setItem("alertShown", "true");    
      //  }
      return;
    }

    // Find the course in course-offerings.json
    let courseOffering = courseOfferings.find(course => course.code === course_code);

    // Check if the course exists and has a valid section
    if (!courseOffering || !courseOffering.sections || courseOffering.sections.length === 0) {
      showAlert("This course cannot be added because it has no available sections.");
      //if (!alertShown) {
      //  alert("This course cannot be added because it has no available sections.");      
      //  sessionStorage.setItem("alertShown", "true");    
      //  }
      return;
    }

    let courseIndex = courseInfo.findIndex(course => course.code === course_code);
    
    if (courseIndex >= 0) {
        let selectedCourse = courseInfo[courseIndex];
        let courseUnits = !isNaN(selectedCourse.units) ? Number(selectedCourse.units) : 0;

        // Check if adding the course will exceed 21 units
        if (totalUnits + courseUnits > 21) {
          showAlert("Adding this course will exceed the maximum allowed number of units.");
          //if (!alertShown) {
          //alert("Adding this course will exceed the maximum allowed number of units.");      
          //sessionStorage.setItem("alertShown", "true");    
          //}
        return; // Prevent adding the course when it exceeds 
        }

        if (!coursePlan.some(course => course.course_code === course_code)) {
            coursePlan.push(selectedCourse);

            if (!isNaN(selectedCourse.units)) {
              totalUnits += Number(selectedCourse.units);  
            }
            updateTotalUnits();

            localStorage.setItem("coursePlan", JSON.stringify(coursePlan)); // Save to localStorage

            // Remove from course list when added to course plan
            courseInfo.splice(courseIndex, 1);
            localStorage.setItem("courseList", JSON.stringify(courseInfo));
            updateCourseListHTML();
            addCourseToHTML();
        }
    }
  }

  window.addToCoursePlan = addToCoursePlan;

  // Updating course list when course is added to the Course plan
  const updateCourseListHTML = () => {
    courseInfoHTML.innerHTML = ''; // Clear the UI
    if (courseInfo.length > 0) {
        courseInfo.forEach(course => {
            let newCourse = document.createElement('tr');
            newCourse.classList.add('course-info');
            newCourse.dataset.code = course.code;
            newCourse.innerHTML = `
                <td>${course.code}</td>
                <td>${course.title}</td>
                <td>${course.units}</td>
                <td class="difficulty">${course.difficulty}</td>
                <td class="performance">${course.performance}</td>
                <td>
                    <button class="view-button bg-green button txt-white">View Info</button>
                    <button class="add-button bg-blue button txt-white" data-code="${course.code}">Add</button>
                </td>`;
            courseInfoHTML.appendChild(newCourse);
        });
    }
  };
  
  // Function to Display Course Plan in HTML
  const addCourseToHTML = () => {
    coursePlanHTML.innerHTML = '';

    if (coursePlan.length > 0) {
      coursePlan.forEach(plan => {
        let newPlan = document.createElement('tr');
        newPlan.classList.add('course-info');
        newPlan.dataset.code = plan.code; // Use plan.code directly

        // Find the course in the loaded courses to check if it has labs
        let foundCourse = courses.find(course => course.code.trim() === plan.code.trim());
        let hasLab = foundCourse && foundCourse.sections.some(section => section.lab && section.lab.length > 0);
        let properName = plan.code.startsWith("HK 12") ? "HK 12" : plan.code;

        newPlan.innerHTML = `
          <td>${properName}</td>
          <td>${plan.title}</td>
          <td>${plan.units}</td>
          <td class="difficulty">${plan.difficulty}</td>
          <td class="performance">${plan.performance}</td>
          <td>
            <select class="sectionSelect">
            <option value="">Select a section</option>
            </select>
            ${hasLab ? `<select class="labSelect"><option value="">Select a lab</option></select>` : ""}
          </td>
          <td><div class="slots green txt-center txt-12 txt-semibold">20/20</div></td>
          <td>
            <button class="view-button bg-green button txt-white">View Info</button>
            <button class="remove-button bg-red button txt-white">Remove</button>
          </td>`; 

        coursePlanHTML.appendChild(newPlan);
        
        // Call populateSections() now that the row exists
        let sectionSelect = newPlan.querySelector(".sectionSelect");
        let labSelect = newPlan.querySelector(".labSelect");

        if (sectionSelect) {
            console.log(`Populating sections for ${plan.code}...`);
            populateSections(plan.code);
            
        }
      });
    }
    restoreDropdownSelections();
  }

  // Event listeners for Remove Buttons
  coursePlanHTML.addEventListener("click", (event) => {
    let positionRemove = event.target;
    if (positionRemove.classList.contains("remove-button")) {
      let row = positionRemove.closest('tr');
      if (row) {
        let course_code = row.dataset.code;
      removeFromCoursePlan(course_code);

        // Remove the saved section from localStorage
        let selectedSections = JSON.parse(localStorage.getItem("selectedSections")) || {};
        if (selectedSections[course_code]) {
          delete selectedSections[course_code];
          localStorage.setItem("selectedSections", JSON.stringify(selectedSections));
          loadSchedule();
        }
        
      }
    }
  });
  
  document.addEventListener('change', function (event) {
    if (event.target.classList.contains('sectionSelect') || event.target.classList.contains('labSelect')) {
        let row = event.target.closest('tr');
        let courseCode = row.getAttribute('data-code');
        addClass(courseCode);
        console.log(`addClass called for ${courseCode}`);
        saveDropdownSelections();
    }
  });

  // Remove course in course plan
  const removeFromCoursePlan = (course_code) => {
    let courseIndex = coursePlan.findIndex(course => course.code === course_code);

      if (courseIndex >= 0) {
        let removedCourse = coursePlan.splice(courseIndex, 1)[0]; // Remove from course plan
        if (!isNaN(removedCourse.units)) {
          totalUnits -= Number(removedCourse.units);  
        }
        updateTotalUnits();
        localStorage.setItem("coursePlan", JSON.stringify(coursePlan)); // Update localStorage

        // Restore the course to course list
        courseInfo.push(removedCourse);
        localStorage.setItem("courseList", JSON.stringify(courseInfo));

        // Update UI
        updateCourseListHTML();
        addCourseToHTML();
        removeClass(course_code);
      }
  }

  // calculates total units
  const updateTotalUnits = () => {
    totalUnitsText.textContent = totalUnits;
    //if (totalUnits < 21) {
    //    sessionStorage.setItem("alertShown", "false");
    //}
  }

  const recalculateTotalUnits = () => {
    totalUnits = coursePlan.reduce((sum, course) => {
        return sum + (!isNaN(course.units) ? Number(course.units) : 0);
    }, 0);
    updateTotalUnits(); 
  }
  
  // Load Courses from JSON
  const initApp = (category) => {
    fetch('../student/data/courses.json')
      .then(response => response.json())
      .then(data => {
        let freshCourseInfo;

        if (category === 'all_courses') {
          // ✅ Flatten all categories into one big array
          freshCourseInfo = Object.keys(data)
            .filter(key => Array.isArray(data[key]))
            .flatMap(key => data[key]);
        } else {
          // ✅ Just one category
          freshCourseInfo = data[category];
        }

        // ✅ Remove already added courses
        courseInfo = freshCourseInfo.filter(course =>
          !coursePlan.some(plan => plan.code === course.code)
        );

        // ✅ Save specific + all to storage
        localStorage.setItem("courseList", JSON.stringify(courseInfo));

        let allCourses = Object.keys(data)
          .filter(key => Array.isArray(data[key]))
          .flatMap(key => data[key]);

        localStorage.setItem("all_courses", JSON.stringify(allCourses));

        recalculateTotalUnits();
        addDataToHTML();
      })
      .catch(error => {
        console.error("Error fetching course data:", error);
      });

    addCourseToHTML();
  };

  initApp(category);

  // Fetch course offerings when the page loads
  const fetchCourseOfferings = async () => {
    try {
      let response = await fetch('../student/data/course-offerings.json');
      courseOfferings = await response.json();
      console.log("Loaded course offerings:", courseOfferings);
    } catch (error) {
      console.error("Error fetching course offerings:", error);
    }
  };
  // Call fetch when the page loads
  fetchCourseOfferings();

  const fetchStudentRecords = async () => {
    try {
      let response = await fetch('../student/data/student-course-history.json');
      studentRecords = await response.json();
    } catch (error) {
      console.error("Error fetching student records:", error)
    }
  }
  fetchStudentRecords();

  // Function to check if a course has been taken with a passing grade
  const hasTakenCourse = (course_code) => {
    for (let term of studentRecords) {
      for (let course of term.courses) {
        if (course.code === course_code && course.grade !== 5 && course.grade !== "U" && course.grade !== "DRP") {
          return true; // Course already taken and passed
        }
      }
    }
    return false; // Course can be taken
  };

  // filter function
  const filterButton = document.getElementById("filter");
  const courseInput = document.getElementById("course-input");

  // Track filter state
  let isFiltered = false;

  // Function to filter courses
  const filterCourses = () => {
      let searchCode = courseInput.value.trim().toUpperCase(); // Get input & normalize
      let courseRows = document.querySelectorAll(".course-list .course-info"); // Get course rows
      let found = false;

      courseRows.forEach(row => {
        let courseCode = row.dataset.code.toUpperCase();
        if (courseCode.includes(searchCode)) {
            row.style.display = ""; // Show matching courses
            found = true;
        } else {
            row.style.display = "none"; // Hide non-matching courses
        }
      });

      if (!found) {
          courseInfoHTML.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Try searching in other categories.</td></tr>`;
      }

      // Change button to "Reset Filter"
      filterButton.innerHTML = `<span class="material-symbols-outlined">
            filter_alt</span>
          <span class="txt-14 txt-semibold">Reset Filter</span>`;
      isFiltered = true;
  };

  // Function to reset filter
  const resetFilter = () => {
      let courseRows = document.querySelectorAll(".course-list .course-info");
      courseRows.forEach(row => {
          row.style.display = ""; // Show all courses
      });

      // Restore original course list
      updateCourseListHTML();

           // Reset button text
      filterButton.innerHTML = `<span class="material-symbols-outlined">
            filter_alt</span>
          <span class="txt-14 txt-semibold">Apply Filter</span>`;
      isFiltered = false;
  };

  // Add event listener to filter button
  filterButton.addEventListener("click", () => {
      if (isFiltered) {
          resetFilter();
      } else {
          filterCourses();
      }
  });
  
  // Reset filter state when changing tabs
  isFiltered = false;
  filterButton.innerHTML = `<span class="material-symbols-outlined">
            filter_alt</span>
          <span class="txt-14 txt-semibold">Apply Filter</span>`; 
}

// start of scheduling functions
function generateSchedule() {
  let scheduleBody = document.getElementById('scheduleBody');
  scheduleBody.innerHTML = '';
  
  for (let hour = 7; hour < 19; hour++) {
      let displayHour = (hour > 12) ? hour - 12 : hour; // Convert 13-19 to 1-7, keep 12 as 12
      let nextDisplayHour = ((hour + 1) > 12) ? (hour + 1) - 12 : (hour + 1); // Ensure next hour follows 12-hour format
      
      let row = `<tr>`;
      row += `<td>${displayHour} - ${nextDisplayHour}</td>`; // Fixing display range
  
      for (let day = 0; day < 5; day++) {
          row += `<td id="${hour}-${day}" style="position: relative;"></td>`;
      }
  
      row += `</tr>`;
      scheduleBody.innerHTML += row;
    }
  
  loadSchedule();
  }
  
//start of scheduling function
let courses = [];         // Global courses array
let matchedCourses = [];  // Make matchedCourses global
let classList = new Set();
//let scheduledClasses = [];
let scheduledClasses = JSON.parse(localStorage.getItem("scheduledClasses")) || []; // Stores all added class schedules

async function loadCourses() {
  try {
    let response = await fetch('../student/data/course-offerings.json');
    courses = await response.json(); // Store data globally

    let coursesResponse = await fetch ('../student/data/courses.json');
    coursesData = await coursesResponse.json();

    let allCourses = Object.values(coursesData).flat();

    console.log("Loaded Courses:", courses);
    console.log("All Courses", allCourses);

    // Store matchedCourses globally
    matchedCourses = allCourses.map(courseEntry => {
      let foundCourse = courses.find(course => courseEntry.code.trim() === course.code.trim());

      if (!foundCourse) {
          console.warn(`Course not found: ${courseEntry.code}`);
      }

      return foundCourse;
    }).filter(course => course); // Remove null values

    console.log("Matched Courses:", matchedCourses);

    matchedCourses.forEach(course => {
      console.log("Calling populateSections with:", course.code);
      populateSections(course.code);
    });

  } catch (error) {
    console.error('Error loading courses:', error);
  }
}

// Populate Sections
const populateSections = (courseCode) => {
    let foundCourse = matchedCourses.find(course => course.code === courseCode);
    
    if (!foundCourse) {
        console.error(`No course found for: ${courseCode}`);
        return;
    }

    console.log("Populated sections for:", courseCode, foundCourse.sections);

    let sectionSelect = document.querySelector(`tr[data-code="${courseCode}"] .sectionSelect`);
    let labSelect = document.querySelector(`tr[data-code="${courseCode}"] .labSelect`);

       // Clear dropdown before adding new options
    sectionSelect.innerHTML = '<option value="">Select a section</option>';

    foundCourse.sections.forEach(section => {
        let option = document.createElement('option');
        option.value = JSON.stringify(section);
        option.textContent = `${section.label} - ${section.sched}`;
        sectionSelect.appendChild(option);
    });

    // Listen for section changes to populate labs dynamically
    sectionSelect.addEventListener('change', function () {
        labSelect.innerHTML = '<option value="">Select a lab</option>'; // Reset lab options
        let selectedSection = JSON.parse(sectionSelect.value);

        if (selectedSection.lab) {
            selectedSection.lab.forEach(labSection => {
                let labOption = document.createElement('option');
                labOption.value = JSON.stringify(labSection);
                labOption.textContent = `${selectedSection.label}${labSection.lab_label} - ${labSection.lab_sched}`;
                labSelect.appendChild(labOption);
            });
        }
    });
};

// Call loadCourses when the page loads
loadCourses();

function parseSchedule(schedule) {
  let [days, timeRange] = schedule.split('|').map(s => s.trim());
  let [startTime, endTime] = timeRange.split('-').map(t => convertTo24Hour(t.trim()));
  let dayIndices = mapDaysToIndices(days);
  return { dayIndices, startTime, endTime };
}

function mapDaysToIndices(days) {
  const dayMap = { "M": 0, "T": 1, "W": 2, "Th": 3, "F": 4 };
  let dayIndices = [];
  let i = 0;
  while (i < days.length) {
      if (days[i] === "T" && i + 1 < days.length && days[i + 1] === "h") {
          dayIndices.push(dayMap["Th"]);
          i += 2;
      } else {
          dayIndices.push(dayMap[days[i]]);
          i++;
      }
  }
  return dayIndices;
}

function convertTo24Hour(time) {
  let [hour, min, meridian] = time.match(/(\d+):(\d+) (\w+)/).slice(1);
  hour = parseInt(hour);
  min = parseInt(min);
  if (meridian === 'PM' && hour !== 12) hour += 12;
  if (meridian === 'AM' && hour === 12) hour = 0;
  return { hour, min };
}

function checkTimeConflict(dayIndices, startTime, endTime) {
  let startMinutes = startTime.hour * 60 + startTime.min;
  let endMinutes = endTime.hour * 60 + endTime.min;

  for (let scheduledClass of scheduledClasses) { // Use a proper schedule storage
      let { dayIndices: existingDays, startTime: existingStart, endTime: existingEnd } = scheduledClass;

      let existingStartMinutes = existingStart.hour * 60 + existingStart.min;
      let existingEndMinutes = existingEnd.hour * 60 + existingEnd.min;

      for (let day of dayIndices) {
          if (existingDays.includes(day)) {
              // Check if there is an overlap
              if (startMinutes < existingEndMinutes && endMinutes > existingStartMinutes) {
                  return true; // Conflict detected
              }
          }
      }
  }
  return false; // No conflict
}

function addClass(courseCode) {
  let row = document.querySelector(`tr[data-code="${courseCode}"]`);
  if (!row) {
    console.error(`Row with courseCode ${courseCode} not found.`);
    return;
  }

  let sectionSelect = row.querySelector(".sectionSelect");
  let labSelect = row.querySelector(".labSelect");

  let section = JSON.parse(sectionSelect.value);
  let lab = labSelect && labSelect.value ? JSON.parse(labSelect.value) : null;

  console.log("Selected Section:", section);
  console.log("Selected Course:", courseCode);

  let classKey = `${courseCode}-`;
  
  // Remove previously selected section
  removeClass(courseCode);

  // Extract lecture schedule
  let { dayIndices, startTime, endTime } = parseSchedule(section.sched);
  classKey += section.label;

  // If course requires a lab but no lab is selected, prevent adding
  if (section.lab && section.lab.length > 0 && !lab) {
    return;
  }

  // Check for time conflicts in the lecture
  if (checkTimeConflict(dayIndices, startTime, endTime)) {
    alert("Time conflict detected! This section overlaps with another scheduled class.");
    sectionSelect.value = "";
    labSelect.value = "";
    return;
  }

  // If there's a lab, extract its schedule and check for conflicts
  if (lab) {
    let { dayIndices: labDays, startTime: labStart, endTime: labEnd } = parseSchedule(lab.lab_sched);
    let labKey = `${classKey}-${lab.lab_label}`;

    if (checkTimeConflict(labDays, labStart, labEnd)) {
      alert("Time conflict detected in the lab section! The class will not be added.");
      labSelect.value = "";
      return; // Prevent both lecture and lab from being added
    }

    // Add lab to schedule if no conflicts
    scheduledClasses.push({ courseCode, section, labKey, dayIndices: labDays, startTime: labStart, endTime: labEnd });
    plotSchedule(courseCode, section, lab, labStart, labEnd, labDays, labKey, true);
    classList.add(labKey);

    saveSchedule();
  }

  // Add lecture to schedule after lab check passes
  scheduledClasses.push({ courseCode, section, classKey, dayIndices, startTime, endTime });
  plotSchedule(courseCode, section, null, startTime, endTime, dayIndices, classKey, false);
  classList.add(classKey);

  saveSchedule();
}

function plotSchedule(courseCode, section, lab, startTime, endTime, dayIndices, classKey, isLab) {
  for (let day of dayIndices) {
    let firstCell = document.getElementById(`${startTime.hour}-${day}`);
    if (firstCell) {
      let entry = document.createElement("div");
      entry.className = "class-entry";
      entry.style.backgroundColor = isLab ? "#8d1436" : ""; 

      let displaySHour = startTime.hour > 12 ? startTime.hour - 12 : startTime.hour;
      let displayEhour = endTime.hour > 12 ? endTime.hour - 12 : endTime.hour;
      let displaySMin = startTime.min === 30 ? "30" : "00";
      let displayEMin = endTime.min === 30 ? "30" : "00";
      let properName = courseCode.startsWith("HK 12") ? "HK 12" : courseCode;
      let properLab = isLab ? `${lab.lab_label}`: "";

      entry.innerText = `${properName} ${section.label}${properLab} ${displaySHour}:${displaySMin} - ${displayEhour}:${displayEMin}`;
      entry.dataset.className = classKey;

      let height = ((endTime.hour * 60 + endTime.min) - (startTime.hour * 60 + startTime.min)) / 60 * 28;
      let topOffset = startTime.min === 30 ? "50%" : "0";

      entry.style.height = `${height}px`;
      entry.style.top = topOffset;

      firstCell.appendChild(entry);
    }
  }
}

function removeClass(courseCode) {
  // Filter out previous section instances from scheduledClasses
  scheduledClasses = scheduledClasses.filter(cls => cls.courseCode !== courseCode);

  // Remove plotted entries in the schedule grid
  document.querySelectorAll(`.class-entry[data-class-name^="${courseCode}-"]`).forEach(el => el.remove());
  classList.delete(courseCode);

  saveSchedule();
}


function saveSchedule() {
  localStorage.setItem("scheduledClasses", JSON.stringify(scheduledClasses));
  console.log("Saved Classes:", scheduledClasses);
}

console.log(localStorage.getItem("scheduledClasses"));
console.log(localStorage.getItem("coursePlan"));

function loadSchedule() {
  let savedClasses = localStorage.getItem("scheduledClasses");
  console.log("Loaded schedule:", scheduledClasses); // Debugging

  if (savedClasses) {
      scheduledClasses = JSON.parse(savedClasses);
      scheduledClasses.forEach(cls => {

        console.log(`plotSchedule called with: ${cls.courseCode}, Section: ${JSON.stringify(cls.section)}, 
        Time: ${cls.startTime.hour}:${cls.startTime.min} - ${cls.endTime.hour}:${cls.endTime.min}, 
        Days: ${cls.dayIndices}`);
    
        plotSchedule(
            cls.courseCode, 
            cls.section,
            null, 
            cls.startTime, 
            cls.endTime, 
            cls.dayIndices, 
            cls.classKey, 
            false
        );
        classList.add(cls.courseCode);
    });
  }
}

function saveDropdownSelections() {
  let selectedSections = JSON.parse(localStorage.getItem("selectedSections")) || {};

  document.querySelectorAll("tr[data-code]").forEach(row => {
    let courseCode = row.getAttribute("data-code");
    let sectionSelect = row.querySelector(".sectionSelect");
    let labSelect = row.querySelector(".labSelect");

    if (!selectedSections[courseCode]) {
      selectedSections[courseCode] = {};
    }

    if (sectionSelect) {
      selectedSections[courseCode].section = sectionSelect.value;
    }

    if (labSelect && labSelect.value !== "") { // Ensure lab selection is stored
      selectedSections[courseCode].lab = labSelect.value;
    }
  });

  localStorage.setItem("selectedSections", JSON.stringify(selectedSections));
  console.log("Saved Dropdown Selections:", selectedSections);
}

function restoreDropdownSelections() {
  let savedSelections = JSON.parse(localStorage.getItem("selectedSections")) || {};
  console.log("Restoring selections:", savedSelections);

  document.querySelectorAll("tr[data-code]").forEach(row => {
    let courseCode = row.getAttribute("data-code");
    let sectionSelect = row.querySelector(".sectionSelect");
    let labSelect = row.querySelector(".labSelect");

    if (sectionSelect && savedSelections[courseCode]?.section) {
      sectionSelect.value = savedSelections[courseCode].section;

      // Trigger lab population dynamically
      sectionSelect.dispatchEvent(new Event("change")); 

      setTimeout(() => {
        if (labSelect && savedSelections[courseCode]?.lab) {
          labSelect.value = savedSelections[courseCode].lab;
        }
      }, 100); // Small delay to allow population before setting value
    }
  });
}

function prefBtn() {
  const button = document.querySelector(".preferences-button");

    if (button) {
      button.addEventListener("click", () => {
        const overlay = document.getElementById("preferencesOverlay");
        const iframe = document.getElementById("preferencesIframe");
    
        if (overlay && iframe) {
          overlay.classList.remove("hidden");
          iframe.src = "preferences.html";
        }
      });
    }
    
    // Listen to message from iframe
    window.addEventListener('message', (event) => {
      if (event.data === 'closeOverlay') {
        overlay.classList.add("hidden");
        iframe.src = "";
      }
    });
}

function reqBtn() {
  const button = document.querySelector(".request-button");

    if (button) {
      button.addEventListener("click", () => {
        const overlay = document.getElementById("requestOverlay");
        const iframe = document.getElementById("requestIframe");
    
        if (overlay && iframe) {
          overlay.classList.remove("hidden");
          iframe.src = "request-form.html";
        }
      });
    }
    
    // Listen to message from iframe
    window.addEventListener('message', (event) => {
      if (event.data === 'closeOverlay') {
        overlay.classList.add("hidden");
        iframe.src = "";
      }
    });
}

function generateBtn() {
  const predefinedCoursesWithSections = {
    "IE 199": { section: { label: "AB", sched: "TTh | 02:30 PM - 04:00 PM" } },
    "IE 158": { section: { label: "EF", sched: "WF | 01:00 PM - 02:30 PM" } },
    "IE 165": { section: { label: "AB", sched: "TTh | 11:00 AM - 12:30 PM" } },
    "IE 200C": { section: { label: "AB", sched: "TBA" } },
    "MGT 131": { section: { label: "YZ", sched: "TTh | 05:30 PM - 07:00 PM" } },
    "HK 12 (1)": { section: { label: "AB", sched: "TTh | 01:00 PM - 02:30 PM" } },
    "IE 185": {
      section: { label: "EF", 
      sched: "Th | 08:00 AM - 10:00 AM",
      lab: [{ lab_label: "1L", lab_sched: "M | 12:00 PM - 03:00 PM" }]
    } }
  };

  const button = document.querySelector(".generate-button");

  if (button) {
    button.addEventListener("click", async () => {
      sessionStorage.removeItem("alertShown");

      for (const [courseCode, sectionInfo] of Object.entries(predefinedCoursesWithSections)) {
        if (typeof addToCoursePlan === 'function') {
          await addToCoursePlan(courseCode); // assume addToCoursePlan is async or returns a promise

          // Wait for DOM row to be added
          const tryApplySection = () => {
            const row = document.querySelector(`tr[data-code="${courseCode}"]`);
            if (!row) {
              return false;
            }

            const sectionSelect = row.querySelector(".sectionSelect");
            const labSelect = row.querySelector(".labSelect");

            // Apply section
            if (sectionSelect && sectionInfo.section) {
              const optionValue = JSON.stringify(sectionInfo.section);
              const foundOption = Array.from(sectionSelect.options).find(opt => opt.value === optionValue);
              if (foundOption) {
                sectionSelect.value = optionValue;
                sectionSelect.dispatchEvent(new Event("change")); // Trigger lab loading
              }
            }

            // Apply lab if needed
            if (labSelect && sectionInfo.section?.lab?.length > 0) {
              const labData = sectionInfo.section.lab[0];
              const labOptionValue = JSON.stringify(labData);
              const foundLab = Array.from(labSelect.options).find(opt => opt.value === labOptionValue);
              if (foundLab) {
                labSelect.value = labOptionValue;
              }
            }

            return true;
          };

          // Retry until the row is available
          let retries = 0;
          const maxRetries = 10;
          const interval = setInterval(() => {
            const success = tryApplySection();
            if (success || ++retries >= maxRetries) {
              clearInterval(interval);
              if (success) {
                saveDropdownSelections();
                addClass(courseCode); // Optional: auto-plot it to the schedule
              }
            }
          }, 100); // Retry every 100ms
        } else {
          console.warn(`addToCoursePlan not available for ${courseCode}`);
        }
      }
    });
  }
}

function showAlert(message) {
  if (alertActive) return; // Block if an alert is already showing

  alertActive = true;
  setTimeout(() => {
    alert(message);
    alertActive = false;
  }, 0);
}
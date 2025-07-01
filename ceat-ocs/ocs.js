google.charts.load("current", { packages: ["corechart"] });
      google.charts.setOnLoadCallback(drawCharts);

      function drawCharts() {
        // Chart 1: Scholastic Standing
        var data1 = google.visualization.arrayToDataTable([
          ["Status", "Number"],
          ["Good", 115],
          ["Warning", 20],
          ["Probation", 20],
          ["Dismissed", 20],
          ["Permanently Disqualified", 20],
        ]);

        var options1 = {
          title: "",
          pieHole: 0.7,
          legend: "none",
          colors: ["#2ecc71", "#fedf37", "#f59e0b", "#e54e4e", "#c3083d"],
          pieSliceText: "none",
          chartArea: {top: 5, bottom: 10, width: '100%', height: '100%' },
          backgroundColor: 'transparent',
        };

        var chart1 = new google.visualization.PieChart(
          document.getElementById("donutchart1")
        );
        chart1.draw(data1, options1);

        // Chart 2: Enrollment Status 
        var data2 = google.visualization.arrayToDataTable([
          ["Status", "Number"],
          ["Active and enrolled", 153],
          ["Active but pending erollment", 42],
          ["On leave of absence", 5],
          ["AWOL", 5],
        ]);

        var options2 = {
          title: "",
          pieHole: 0.7,
          legend: "none",
          colors: ["#2ecc71", "#fedf37", "#f59e0b", "#e54e4e"],
          pieSliceText: "none",
          chartArea: {top: 5, bottom: 10, width: '100%', height: '100%' },
          backgroundColor: 'transparent',
        };

        var chart2 = new google.visualization.PieChart(
          document.getElementById("donutchart2")
        );
        chart2.draw(data2, options2);

        // Chart 3: Progress by Units
        var data3 = google.visualization.arrayToDataTable([
          ["Status", "Number"],
          ["On time", 90],
          ["Behind", 105],
        ]);

        var options3 = {
          title: "",
          pieHole: 0.7,
          legend: "none",
          colors: ["#2ecc71", "#e54e4e"],
          pieSliceText: "none",
          chartArea: {top: 5, bottom: 10, width: '100%', height: '100%' },
          backgroundColor: 'transparent',
        };

        var chart3 = new google.visualization.PieChart(
          document.getElementById("donutchart3")
        );
        chart3.draw(data3, options3);

        // Chart 4: SPMF Monitoring
        var data4 = google.visualization.arrayToDataTable([
          ["Status", "Number"],
          ["Accomplished", 130],
          ["Pending adviser review", 23],
          ["Not yet finalized", 42]
        ]);

        var options4 = {
          title: "",
          pieHole: 0.7,
          legend: "none",
          colors: ["#2ecc71", "#fedf37","#e54e4e"],
          pieSliceText: "none",
          chartArea: {top: 5, bottom: 10, width: '100%', height: '100%' },
          backgroundColor: 'transparent',
        };

        var chart4 = new google.visualization.PieChart(
          document.getElementById("donutchart4")
        );
        chart4.draw(data4, options4);

        // Chart 5: 
        var data5 = google.visualization.arrayToDataTable([
          ["Program", "Freshman", "Sophomore", "Junior", "Senior", { role: "annotation" }],
          ["BS ABE", 6, 6, 8, 4, ""],
          ["BS CE", 8, 10, 11, 6, ""],
          ["BS ChE", 6, 7, 12, 5, ""],
          ["BS EE", 6, 8, 10, 6, ""],
          ["BS IE", 8, 12, 12, 8, ""],
          ["BS ME", 7, 11, 10, 6, ""],
          ["BS MatE", 10, 12, 0, 0, ""],
        ]);

        var options5 = {
          isStacked: true,
          chartArea: { width: "80%", height: "70%" },
          legend: { position: "top", maxLines: 3 },
          colors: ["#3366cc", "#ffcc00", "#e74c3c", "#27ae60"],
          vAxis: {
            title: "",
            gridlines: { count: 5 },
            minValue: 0,
            maxValue: 40,
          },
          annotations: {
            alwaysOutside: false,
            textStyle: {
              fontSize: 12,
              auraColor: "none",
              color: "#000",
            },
          },
          chartArea: {width: '90%', height: '50%' },
          backgroundColor: 'transparent',
        };

        var chart = new google.visualization.ColumnChart(
          document.getElementById("chart_div")
        );
        chart.draw(data5, options5);
      }

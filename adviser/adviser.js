google.charts.load("current", { packages: ["corechart"] });
      google.charts.setOnLoadCallback(drawCharts);

      function drawCharts() {
        // Chart 1: Scholastic Standing
        var data1 = google.visualization.arrayToDataTable([
          ["Status", "Number"],
          ["Good", 6],
          ["Warning", 1],
          ["Probation", 1],
          ["Dismissed", 1],
          ["Permanently Disqualified", 1],
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
          ["Active and enrolled", 4],
          ["Active but pending erollment", 3],
          ["On leave of absence", 2],
          ["AWOL", 1],
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
          ["On time", 4],
          ["Behind", 3],
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

        // Chart 4: Progress by Critical Path
        var data4 = google.visualization.arrayToDataTable([
          ["Status", "Number"],
          ["On time", 4],
          ["Behind", 3],
        ]);

        var options4 = {
          title: "",
          pieHole: 0.7,
          legend: "none",
          colors: ["#2ecc71", "#e54e4e"],
          pieSliceText: "none",
          chartArea: {top: 5, bottom: 10, width: '100%', height: '100%' },
          backgroundColor: 'transparent',
        };

        var chart4 = new google.visualization.PieChart(
          document.getElementById("donutchart4")
        );
        chart4.draw(data4, options4);
      }

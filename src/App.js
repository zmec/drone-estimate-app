import React, { useState } from "react"; 

const DroneEstimateApp = () => {
  // Customer & Job Details
  const [jobName, setJobName] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [sizeOfPlacement, setSizeOfPlacement] = useState("");
  const [materialType, setMaterialType] = useState("Final Cure");
  const [applicationRate, setApplicationRate] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Labor & Work-Related Inputs
  const [laborBaseWage, setLaborBaseWage] = useState("30"); // default: Entry-Level Skilled ($30/hr)
  const [hourlyPowerCost, setHourlyPowerCost] = useState(5);
  const [commuteHours, setCommuteHours] = useState(2);
  const [actualWorkHours, setActualWorkHours] = useState("");

  // Drone & Operational Inputs
  const [avgTimePerTrip, setAvgTimePerTrip] = useState(10);
  const [avgAreaPerTrip, setAvgAreaPerTrip] = useState(4500);
  const [appRatePerTrip, setAppRatePerTrip] = useState(1600);
  const [overtimeHourlyCharge, setOvertimeHourlyCharge] = useState(65);

  // Cost & Business Inputs
  const [mobilizationCost, setMobilizationCost] = useState(100);
  const [miscRate, setMiscRate] = useState(10);
  const [markupRate, setMarkupRate] = useState(40); // default markup rate is 40%
  // Updated default values:
  const [finalCurePrice, setFinalCurePrice] = useState(122.31);
  const [evaporationRetarderPrice, setEvaporationRetarderPrice] = useState(21.87);

  // State to store plain text and structured estimate data
  const [estimateResult, setEstimateResult] = useState("");
  const [estimateData, setEstimateData] = useState(null);

  // Helper to calculate the number of needed drone trips
  const calculateNeededTrips = (jobSize, avgArea, appRate, reqAppRate) => {
    return Math.ceil((jobSize / avgArea) * (appRate / reqAppRate));
  };

  const calculateEstimate = () => {
    // Parse basic inputs
    const size = parseFloat(sizeOfPlacement);
    const rate = parseFloat(applicationRate);
    const baseWage = parseFloat(laborBaseWage);

    if (isNaN(size) || isNaN(rate) || isNaN(baseWage)) {
      setEstimateResult("Invalid input. Please enter valid numbers for Size, Application Rate, and Base Wage.");
      return;
    }

    // Calculate needed drone trips and flat-fee hours
    const neededTrips = calculateNeededTrips(size, parseFloat(avgAreaPerTrip), parseFloat(appRatePerTrip), rate);
    const flatFeeHours = (neededTrips * parseFloat(avgTimePerTrip)) / 60 + 1;

    // Use actual work hours input if provided, otherwise default to flatFeeHours
    const inputActualHours = parseFloat(actualWorkHours);
    const usedActualHours = isNaN(inputActualHours) ? flatFeeHours : inputActualHours;
    const overtime = usedActualHours - flatFeeHours > 0 ? usedActualHours - flatFeeHours : 0;
    const totalWorkHours = flatFeeHours + overtime + parseFloat(commuteHours);

    // Calculate hourly labor cost: base wage + 35% payroll taxes & benefits + 25% overhead (i.e. base wage * 1.60)
    const hourlyLaborCost = baseWage * 1.60;
    const hourlyCost = hourlyLaborCost + parseFloat(hourlyPowerCost);
    const totalLaborCost = hourlyCost * totalWorkHours;
    const overtimeCost = overtime * parseFloat(overtimeHourlyCharge);

    // Determine material unit cost based on the material type
    const pricePer5Gallon = materialType === "Final Cure" ? parseFloat(finalCurePrice) : parseFloat(evaporationRetarderPrice);
    const materialUnitCost = (pricePer5Gallon / 5) / rate;
    const materialCost = materialUnitCost * size;

    const miscCost = (parseFloat(miscRate) / 100) * (materialCost + totalLaborCost + parseFloat(mobilizationCost));
    // Markup is computed on totalLaborCost, mobilizationCost, and miscCost (excluding materialCost)
    const markup = (parseFloat(markupRate) / 100) * (totalLaborCost + parseFloat(mobilizationCost) + miscCost);

    // Total cost calculation (subtracting overtime cost then adding it back for the final customer price)
    const totalCost = materialCost + totalLaborCost + parseFloat(mobilizationCost) + miscCost + markup - overtimeCost;
    const userCost = totalCost + overtimeCost;
    const totalUnitCost = totalCost / size;

    // Build a structured data object (storing only the fields needed for the email summary)
    const data = {
      jobName,
      address,
      date,
      size: size.toFixed(0), // no decimals for size
      overtime: overtime.toFixed(2),
      overtimeCost: overtimeCost.toFixed(2),
      totalUnitCost: totalUnitCost.toFixed(2),
      userCost: userCost.toFixed(2),
      flatFeeHours: flatFeeHours.toFixed(0) // store flat fee hours as an integer
    };

    setEstimateData(data);

    // Also update the plain text estimate result (full output for debugging if needed)
    const fullEstimateText = `
Job Name: ${jobName}
Address: ${address}
Date: ${date}
Size of Project: ${size} sqft
Needed Drone Trips: ${neededTrips}
Flat-Fee Hours: ${flatFeeHours.toFixed(2)} hrs
Actual Work Hours: ${usedActualHours.toFixed(2)} hrs
Overtime (hrs): ${overtime.toFixed(2)}
Total Work Hours: ${totalWorkHours.toFixed(2)} hrs
Material Cost: $${materialCost.toFixed(2)}
Total Labor Cost: $${totalLaborCost.toFixed(2)}
Overtime Cost: $${overtimeCost.toFixed(2)}
Mobilization Cost: $${parseFloat(mobilizationCost).toFixed(2)}
Miscellaneous Cost: $${miscCost.toFixed(2)}
Markup: $${markup.toFixed(2)}
Total Cost: $${totalCost.toFixed(2)}
Total Unit Cost: $${totalUnitCost.toFixed(2)}
User Cost: $${userCost.toFixed(2)}
    `;
    setEstimateResult(fullEstimateText);
  };

  const sendEmail = () => {
    if (!customerEmail) {
      alert("Please enter a valid customer email.");
      return;
    }
    if (!estimateData) {
      alert("Please generate an estimate first.");
      return;
    }
    
    // Format "Size of Project" and "User Cost" with US thousand formatting and no decimals
    const formattedSize = Number(estimateData.size).toLocaleString('en-US', { maximumFractionDigits: 0 });
    const formattedUserCost = Number(estimateData.userCost).toLocaleString('en-US', { maximumFractionDigits: 0 });
    
    // Build an HTML table with only the original email summary outputs and add the note at the end.
    const emailBody = `
<html>
  <body>
    <table border="1" cellspacing="0" cellpadding="5">
      <tr>
        <th>Field</th>
        <th>Value</th>
      </tr>
      <tr><td>Job Name</td><td>${estimateData.jobName}</td></tr>
      <tr><td>Address</td><td>${estimateData.address}</td></tr>
      <tr><td>Date</td><td>${estimateData.date}</td></tr>
      <tr>
        <td>Overtime Hourly Charge</td>
        <td>$${parseFloat(overtimeHourlyCharge).toFixed(2)}</td>
      </tr>
      <tr><td>Overtime (hrs)</td><td>${estimateData.overtime}</td></tr>
      <tr><td>Overtime Cost</td><td>$${estimateData.overtimeCost}</td></tr>
      <tr><td>Total Unit Cost</td><td>$${estimateData.totalUnitCost}</td></tr>
      <tr><td>Size of Project</td><td>${formattedSize} sqft</td></tr>
      <tr><td>User Cost</td><td>$${formattedUserCost}</td></tr>
    </table>
    <br/><br/>
    <p>
      Please note that this estimate assumes no overtime. The flat-rate is only applicable for the first ${estimateData.flatFeeHours} hours. 
      After ${estimateData.flatFeeHours} hours, the overtime rate applies, which will be reflected in the final invoice.
    </p>
  </body>
</html>
    `;
    
    const subject = encodeURIComponent("Concrete Curing Estimate");
    const bodyEncoded = encodeURIComponent(emailBody);
    // Using Outlook's URL scheme to directly launch Outlook on iOS/Android
    const outlookUrl = `ms-outlook://compose?to=${customerEmail}&subject=${subject}&body=${bodyEncoded}`;
    
    window.location.href = outlookUrl;
  };

  return (
    <div className="container mx-auto p-4 w-full max-w-2xl">
      <h1 className="text-2xl font-bold mb-4 text-center">Drone Estimate Calculator</h1>
      
      {/* Customer & Job Details */}
      <section className="mb-6">
        <h2 className="font-semibold mb-2">Customer & Job Details</h2>
        <div className="mb-2">
          <label className="block">Job Name</label>
          <input 
            type="text" 
            value={jobName} 
            onChange={(e) => setJobName(e.target.value)} 
            className="w-full p-2 border rounded" 
          />
        </div>
        <div className="mb-2">
          <label className="block">Address</label>
          <input 
            type="text" 
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
            className="w-full p-2 border rounded" 
          />
        </div>
        <div className="mb-2">
          <label className="block">Date</label>
          <input 
            type="text" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="w-full p-2 border rounded" 
            placeholder="MM/DD/YYYY"
          />
        </div>
        <div className="mb-2">
          <label className="block">Size of Placement (sqft)</label>
          <input 
            type="number" 
            value={sizeOfPlacement} 
            onChange={(e) => setSizeOfPlacement(e.target.value)} 
            className="w-full p-2 border rounded" 
          />
        </div>
        <div className="mb-2">
          <label className="block">Material Type</label>
          <select 
            value={materialType} 
            onChange={(e) => setMaterialType(e.target.value)} 
            className="w-full p-2 border rounded"
          >
            <option value="Final Cure">Final Cure</option>
            <option value="Evaporation Retarder">Evaporation Retarder</option>
          </select>
        </div>
        <div className="mb-2">
          <label className="block">Application Rate (sqft/gal)</label>
          <input 
            type="number" 
            value={applicationRate} 
            onChange={(e) => setApplicationRate(e.target.value)} 
            className="w-full p-2 border rounded" 
          />
        </div>
        <div className="mb-2">
          <label className="block">Customer Email</label>
          <input 
            type="email" 
            value={customerEmail} 
            onChange={(e) => setCustomerEmail(e.target.value)} 
            className="w-full p-2 border rounded" 
          />
        </div>
      </section>

      {/* Labor & Work-Related Inputs */}
      <section className="mb-6">
        <h2 className="font-semibold mb-2">Labor & Work-Related Inputs</h2>
        <div className="mb-2">
          <label className="block">Base Wage (Select Option)</label>
          <select 
            value={laborBaseWage} 
            onChange={(e) => setLaborBaseWage(e.target.value)} 
            className="w-full p-2 border rounded"
          >
            <option value="30">Entry-Level Skilled ($30/hr)</option>
            <option value="35">Junior Skilled ($35/hr)</option>
            <option value="40">Senior Skilled ($40/hr)</option>
            <option value="15">Entry Unskilled ($15/hr)</option>
            <option value="18">Junior Unskilled ($18/hr)</option>
            <option value="22">Senior Unskilled ($22/hr)</option>
          </select>
        </div>
        <div className="mb-2">
          <label className="block">Hourly Power Cost ($)</label>
          <input 
            type="number" 
            value={hourlyPowerCost} 
            onChange={(e) => setHourlyPowerCost(e.target.value)} 
            className="w-full p-2 border rounded" 
          />
        </div>
        <div className="mb-2">
          <label className="block">Commute Hours</label>
          <input 
            type="number" 
            value={commuteHours} 
            onChange={(e) => setCommuteHours(e.target.value)} 
            className="w-full p-2 border rounded" 
          />
        </div>
        <div className="mb-2">
          <label className="block">Actual Work Hours (leave blank for default flat-fee hours)</label>
          <input 
            type="number" 
            value={actualWorkHours} 
            onChange={(e) => setActualWorkHours(e.target.value)} 
            className="w-full p-2 border rounded" 
            placeholder="Default: calculated flat-fee hours"
          />
        </div>
      </section>

      {/* Drone & Operational Inputs */}
      <section className="mb-6">
        <h2 className="font-semibold mb-2">Drone & Operational Inputs</h2>
        <div className="mb-2">
          <label className="block">Average Time Per Drone Trip (mins)</label>
          <input 
            type="number" 
            value={avgTimePerTrip} 
            onChange={(e) => setAvgTimePerTrip(e.target.value)} 
            className="w-full p-2 border rounded" 
          />
        </div>
        <div className="mb-2">
          <label className="block">Average Covered Area Per Trip (sqft)</label>
          <input 
            type="number" 
            value={avgAreaPerTrip} 
            onChange={(e) => setAvgAreaPerTrip(e.target.value)} 
            className="w-full p-2 border rounded" 
          />
        </div>
        <div className="mb-2">
          <label className="block">Application Rate Per Trip (sqft/gal)</label>
          <input 
            type="number" 
            value={appRatePerTrip} 
            onChange={(e) => setAppRatePerTrip(e.target.value)} 
            className="w-full p-2 border rounded" 
          />
        </div>
        <div className="mb-2">
          <label className="block">Overtime Hourly Charge ($/hr)</label>
          <input 
            type="number" 
            value={overtimeHourlyCharge} 
            onChange={(e) => setOvertimeHourlyCharge(e.target.value)} 
            className="w-full p-2 border rounded" 
          />
        </div>
      </section>

      {/* Cost & Business Inputs */}
      <section className="mb-6">
        <h2 className="font-semibold mb-2">Cost & Business Inputs</h2>
        <div className="mb-2">
          <label className="block">Mobilization Cost ($)</label>
          <input 
            type="number" 
            value={mobilizationCost} 
            onChange={(e) => setMobilizationCost(e.target.value)} 
            className="w-full p-2 border rounded" 
          />
        </div>
        <div className="mb-2">
          <label className="block">Miscellaneous Rate (%)</label>
          <input 
            type="number" 
            value={miscRate} 
            onChange={(e) => setMiscRate(e.target.value)} 
            className="w-full p-2 border rounded" 
          />
        </div>
        <div className="mb-2">
          <label className="block">Markup Rate (%)</label>
          <input 
            type="number" 
            value={markupRate} 
            onChange={(e) => setMarkupRate(e.target.value)} 
            className="w-full p-2 border rounded" 
          />
        </div>
        <div className="mb-2">
          <label className="block">Final Cure Price ($ per 5-gallon)</label>
          <input 
            type="number" 
            value={finalCurePrice} 
            onChange={(e) => setFinalCurePrice(e.target.value)} 
            className="w-full p-2 border rounded" 
          />
        </div>
        <div className="mb-2">
          <label className="block">Evaporation Retarder Price ($ per 5-gallon)</label>
          <input 
            type="number" 
            value={evaporationRetarderPrice} 
            onChange={(e) => setEvaporationRetarderPrice(e.target.value)} 
            className="w-full p-2 border rounded" 
          />
        </div>
      </section>

      <button onClick={calculateEstimate} className="w-full bg-blue-500 text-white p-2 mt-2 rounded">
        Generate Estimate
      </button>
      <button onClick={sendEmail} className="w-full bg-green-500 text-white p-2 mt-2 rounded">
        Send Estimate via Email
      </button>
      <pre className="bg-gray-100 p-4 mt-4 whitespace-pre-wrap text-sm">{estimateResult}</pre>
    </div>
  );
};

export default DroneEstimateApp;

"use client";

import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";

interface CancerDoc {
  data_type: string;
  cancer_type: string;
  year: number;
  sex: string;
  age_group: string;
  count: number;
  rate: number;
  icd10_code?: string;
}

export default function CancerPage() {
  // States for filters and data
  const [loading, setLoading] = useState(true);
  const [cancerData, setCancerData] = useState<CancerDoc[]>([]);
  const [dataTypes, setDataTypes] = useState<string[]>([]);
  const [cancerTypes, setCancerTypes] = useState<string[]>([]);
  const [sexOptions, setSexOptions] = useState<string[]>([]);
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  
  // Selected filters
  const [selectedDataType, setSelectedDataType] = useState<string>("");
  const [selectedCancerType, setSelectedCancerType] = useState<string>("");
  const [selectedSex, setSelectedSex] = useState<string>("");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("");
  const [activeView] = useState<"yearly">("yearly");
  
  // Chart references
  const yearlyChartRef = useRef<HTMLDivElement>(null);

  // Fetch field values on mount
  useEffect(() => {
    const fetchFieldValues = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/cancer-field-values");
        if (!res.ok) {
          throw new Error(`Failed to fetch field values: ${res.status}`);
        }
        
        const values = await res.json();
        console.log("Fetched field values:", Object.keys(values).map(k => `${k}: ${values[k]?.length || 0} items`));
        
        setDataTypes(values.dataTypes || []);
        
        // Add "All Cancers" option to the cancer types list
        const allTypes = ["All Cancers", ...(values.cancerTypes || [])];
        setCancerTypes(allTypes);
        
        setSexOptions(values.sexOptions || []);
        setAgeGroups(values.ageGroups || []);
        setYears(values.years || []);
        
        // Set initial selections with safer defaults
        if (values.dataTypes?.length) setSelectedDataType(values.dataTypes[0]);
        setSelectedCancerType("All Cancers"); // Default to showing all cancers
        if (values.sexOptions?.length) setSelectedSex(values.sexOptions[0]);
        
        // Select "All ages combined" if available, otherwise first age group
        const allAgesOption = values.ageGroups?.find(a => a === "All ages combined");
        setSelectedAgeGroup(allAgesOption || (values.ageGroups?.[0] || ""));
        
      } catch (error) {
        console.error("Error fetching field values:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFieldValues();
  }, []);

  // Fetch cancer data when filters change
  useEffect(() => {
    const fetchFilteredData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedDataType) params.append("data_type", selectedDataType);
        // Only add cancer_type param if a specific type is selected
        if (selectedCancerType && selectedCancerType !== "All Cancers") {
          params.append("cancer_type", selectedCancerType);
        }
        if (selectedSex) params.append("sex", selectedSex);
        
        console.log(`Fetching cancer data with params: ${params.toString()}`);
        const res = await fetch(`/api/cancer-data?${params.toString()}`);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch cancer data: ${res.status}`);
        }
        
        const json = await res.json();
        if (!json.data || !Array.isArray(json.data)) {
          console.warn("Invalid data format:", json);
          setCancerData([]);
          return;
        }
        
        console.log(`Fetched ${json.data.length} cancer records`);
        
        // If we're showing "All Cancers", aggregate the data by year, sex, and age_group
        let processedData = json.data;
        if (selectedCancerType === "All Cancers") {
          // Group by year, sex, and age_group
          const groupedData = {};
          json.data.forEach(item => {
            const key = `${item.year}-${item.sex}-${item.age_group}`;
            if (!groupedData[key]) {
              groupedData[key] = {
                data_type: item.data_type,
                cancer_type: "All Cancers",
                year: item.year,
                sex: item.sex,
                age_group: item.age_group,
                count: 0,
                rate: 0,
                records: 0
              };
            }
            groupedData[key].count += item.count;
            groupedData[key].rate += item.rate;
            groupedData[key].records += 1;
          });
          
          // Calculate averages for rate (rate is usually per 100,000, so we need to average it)
          processedData = Object.values(groupedData).map(group => ({
            ...group,
            rate: group.rate / group.records
          }));
        }
        
        setCancerData(processedData);
        
      } catch (error) {
        console.error("Error fetching cancer data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFilteredData();
  }, [selectedDataType, selectedCancerType, selectedSex]);

  // Filter data based on age group
  const filteredData = cancerData.filter(d => 
    !selectedAgeGroup || d.age_group === selectedAgeGroup
  );

  // Draw yearly trends chart
  useEffect(() => {
    if (!yearlyChartRef.current || loading || !filteredData.length || activeView !== "yearly") return;
    
    // Clear previous chart
    d3.select(yearlyChartRef.current).selectAll("*").remove();
    
    // Prepare data by sex and year
    const sexes = [...new Set(filteredData.map(d => d.sex))];
    
    // Group data by year and sex
    const yearlyDataBySex: Record<string, Record<number, CancerDoc>> = {};
    
    sexes.forEach(sex => {
      yearlyDataBySex[sex] = {};
      
      filteredData
        .filter(d => d.sex === sex)
        .forEach(d => {
          yearlyDataBySex[sex][d.year] = d;
        });
    });
    
    // Setup dimensions
    const containerWidth = yearlyChartRef.current.clientWidth || 600;
    const containerHeight = 400;
    const margin = { top: 30, right: 120, bottom: 50, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;
    
    const svg = d3.select(yearlyChartRef.current)
      .append("svg")
      .attr("width", containerWidth)
      .attr("height", containerHeight)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Get all years from the filtered data
    const distinctYears = [...new Set(filteredData.map(d => d.year))].sort((a, b) => a - b);
    
    // X scale - years
    const x = d3.scaleLinear()
      .domain([Math.min(...distinctYears), Math.max(...distinctYears)])
      .range([0, width]);
    
    // Y scales - one for count, one for rate
    const maxCount = d3.max(filteredData, d => d.count) || 0;
    const yCount = d3.scaleLinear()
      .domain([0, maxCount * 1.1])
      .range([height, 0]);
    
    const maxRate = d3.max(filteredData, d => d.rate) || 0;
    const yRate = d3.scaleLinear()
      .domain([0, maxRate * 1.1])
      .range([height, 0]);
    
    // Color scale for different sexes
    const color = d3.scaleOrdinal<string>()
      .domain(sexes)
      .range(d3.schemeCategory10);
    
    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d => String(d)).ticks(Math.min(distinctYears.length, 10)));
    
    svg.append("g")
      .call(d3.axisLeft(yCount))
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", -45)
      .attr("x", -height/2)
      .attr("text-anchor", "middle")
      .text("Count");
    
    svg.append("g")
      .attr("transform", `translate(${width}, 0)`)
      .call(d3.axisRight(yRate))
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 45)
      .attr("x", -height/2)
      .attr("text-anchor", "middle")
      .text("Rate per 100,000");
    
    // Draw lines for each sex - both count and rate
    sexes.forEach((sex, i) => {
      // Prepare year-based series
      const lineData = distinctYears
        .filter(year => yearlyDataBySex[sex][year])
        .map(year => yearlyDataBySex[sex][year]);
      
      if (lineData.length < 2) return; // Need at least 2 points for a line
      
      // Line for count
      const countLine = d3.line<CancerDoc>()
        .defined(d => d && typeof d.count === 'number')
        .x(d => x(d.year))
        .y(d => yCount(d.count))
        .curve(d3.curveMonotoneX);
      
      svg.append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", color(sex))
        .attr("stroke-width", 2)
        .attr("d", countLine)
        .attr("class", "count-line");
      
      // Line for rate
      const rateLine = d3.line<CancerDoc>()
        .defined(d => d && typeof d.rate === 'number')
        .x(d => x(d.year))
        .y(d => yRate(d.rate))
        .curve(d3.curveMonotoneX);
      
      svg.append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", color(sex))
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("d", rateLine)
        .attr("class", "rate-line");
      
      // Add dots for count
      svg.selectAll(`.dot-count-${i}`)
        .data(lineData)
        .enter()
        .append("circle")
        .attr("class", `dot-count-${i}`)
        .attr("cx", d => x(d.year))
        .attr("cy", d => yCount(d.count))
        .attr("r", 4)
        .attr("fill", color(sex));
      
      // Add dots for rate
      svg.selectAll(`.dot-rate-${i}`)
        .data(lineData)
        .enter()
        .append("circle")
        .attr("class", `dot-rate-${i}`)
        .attr("cx", d => x(d.year))
        .attr("cy", d => yRate(d.rate))
        .attr("r", 4)
        .attr("fill", color(sex));
    });
    
    // Legend for both sex and count/rate
    const legendData = [];
    
    sexes.forEach(sex => {
      legendData.push({ type: "count", sex, label: `${sex} - Count` });
      legendData.push({ type: "rate", sex, label: `${sex} - Rate` });
    });
    
    const legend = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .selectAll("g")
      .data(legendData)
      .enter().append("g")
      .attr("transform", (d, i) => `translate(${width + 10},${i * 20})`);
    
    legend.append("rect")
      .attr("x", 0)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", d => color(d.sex))
      .attr("stroke", d => d.type === "rate" ? "white" : "none")
      .attr("stroke-width", 2)
      .style("stroke-dasharray", d => d.type === "rate" ? "5,5" : "0");
    
    legend.append("text")
      .attr("x", 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(d => d.label);
    
    // Chart title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(`${selectedCancerType} Trends (${selectedAgeGroup})`);
    
  }, [filteredData, activeView, selectedAgeGroup, loading, selectedCancerType]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Cancer Statistics</h1>
      
      {/* Loading indicator that appears when fetching field values or initial data */}
      {loading && dataTypes.length === 0 && (
        <div className="flex justify-center items-center h-64">
          <p>Loading cancer data...</p>
        </div>
      )}
      
      {/* Only show UI after field values are loaded */}
      {dataTypes.length > 0 && (
        <>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Data Type</label>
              <select 
                className="w-full border rounded p-2"
                value={selectedDataType}
                onChange={e => setSelectedDataType(e.target.value)}
                disabled={loading}
              >
                {dataTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Cancer Type</label>
              <select 
                className="w-full border rounded p-2"
                value={selectedCancerType}
                onChange={e => setSelectedCancerType(e.target.value)}
                disabled={loading}
              >
                {cancerTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Sex</label>
              <select 
                className="w-full border rounded p-2"
                value={selectedSex}
                onChange={e => setSelectedSex(e.target.value)}
                disabled={loading}
              >
                <option value="">All</option>
                {sexOptions.map(sex => (
                  <option key={sex} value={sex}>{sex}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Age Group</label>
              <select 
                className="w-full border rounded p-2"
                value={selectedAgeGroup}
                onChange={e => setSelectedAgeGroup(e.target.value)}
                disabled={loading}
              >
                <option value="All ages combined">All ages combined</option>
                {ageGroups
                  .filter(age => age !== "All ages combined")
                  .map(age => (
                    <option key={age} value={age}>{age}</option>
                  ))}
              </select>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b mb-6">
            <button 
              className="py-2 px-4 border-b-2 border-blue-500 font-medium"
              disabled={loading}
            >
              Yearly Trends
            </button>
          </div>
          
          {/* Loading state for data fetching */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <p>Loading chart data...</p>
            </div>
          )}
          
          {/* Charts */}
          {!loading && (
            <>
              {activeView === "yearly" && (
                <div 
                  ref={yearlyChartRef} 
                  className="border rounded-lg p-4 shadow-sm bg-white h-[400px]"
                />
              )}
            </>
          )}
          
          {/* Show message if no data available */}
          {!loading && filteredData.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
              No data available for the selected filters.
              <br />
              Try selecting different criteria.
            </div>
          )}
          
          {/* Descriptive Text */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">About this Data</h2>
            <p className="text-gray-700">
              This visualization shows 
              {selectedCancerType === "All Cancers" 
                ? "aggregated data for all cancer types" 
                : `${selectedCancerType} statistics`}
              {selectedSex ? ` for ${selectedSex}` : ""}.
              {selectedCancerType === "All Cancers" && 
                " Counts are summed across all cancer types, while rates are averaged."}
              The data includes both count of cases and rate per 100,000 population.
              {selectedAgeGroup ? ` Showing age group: ${selectedAgeGroup}.` : ""}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
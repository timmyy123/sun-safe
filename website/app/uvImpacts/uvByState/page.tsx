"use client";

import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// UV data fetching
const fetchUVData = async () => {
  const response = await fetch('/api/uv-data');
  if (!response.ok) throw new Error('Failed to fetch UV data');
  return response.json();
};

export default function UVByState() {
  const [uvData, setUvData] = useState([]);
  const [selectedState, setSelectedState] = useState("all");
  const chartRef = useRef(null);
  const yearlyChartRef = useRef(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch and process UV data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const rawData = await fetchUVData();

        // Group by state & year & month, calculate avg and max
        const processed = {};
        rawData.forEach(item => {
          const { state, date, month, avgUV, maxUV } = item;
          // Extract the year from the date string
          const year = date ? parseInt(date.split('-')[0]) : new Date().getFullYear();
          const key = `${state}-${year}-${month}`;

          if (!processed[key]) {
            processed[key] = { 
              state, 
              year, 
              month,
              totals: 0, 
              count: 0, 
              maxUV: 0 
            };
          }
          processed[key].totals += avgUV;
          processed[key].count++;
          processed[key].maxUV = Math.max(processed[key].maxUV, maxUV);
        });

        // Turn into { state, year, month, avgUV, maxUV }
        const finalData = Object.values(processed).map(d => ({
          state: d.state,
          year: d.year,
          month: d.month,
          avgUV: d.totals / d.count,
          maxUV: d.maxUV
        }));
        
        setUvData(finalData);
      } catch (error) {
        console.error("Error fetching UV data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Render line chart by state
  useEffect(() => {
    if (!chartRef.current || !uvData.length || loading) return;
    
    d3.select(chartRef.current).selectAll('*').remove();

    // Setup dimensions
    const margin = { top: 30, right: 80, bottom: 50, left: 60 };
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create svg
    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Filter data based on selected state
    let filteredData = uvData;
    if (selectedState !== "all") {
      filteredData = uvData.filter(d => d.state === selectedState);
    }

    // Group data by state
    const states = Array.from(new Set(filteredData.map(d => d.state)));
    
    // Parse month names for ordering
    const monthOrder = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
      'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    
    // Get all months in order
    const months = Object.keys(monthOrder).sort((a, b) => monthOrder[a] - monthOrder[b]);

    // X scale (months)
    const x = d3.scaleBand()
      .domain(months)
      .range([0, width])
      .padding(0.1);

    // Y scale
    const y = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => Math.max(d.avgUV, d.maxUV)) * 1.1])
      .range([height, 0]);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");
      
    svg.append('g')
      .call(d3.axisLeft(y));

    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(selectedState === "all" ? "UV Levels by Month Across All States" : `UV Levels in ${selectedState}`);

    // Add X axis label
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 5)
      .attr("text-anchor", "middle")
      .text("Month");

    // Add Y axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("UV Index");

    // Color scale for states
    const color = d3.scaleOrdinal()
      .domain(states)
      .range(d3.schemeCategory10);

    // Group data by state and month
    const stateMonthData = {};
    filteredData.forEach(d => {
      if (!stateMonthData[d.state]) {
        stateMonthData[d.state] = {};
      }
      stateMonthData[d.state][d.month] = d;
    });

    // Draw lines for each state
    states.forEach(state => {
      const monthlyData = months
        .map(month => {
          const entry = stateMonthData[state]?.[month];
          return entry ? {
            state,
            month,
            avgUV: entry.avgUV,
            maxUV: entry.maxUV
          } : null;
        })
        .filter(Boolean);

      // Only draw if we have data
      if (monthlyData.length > 0) {
        // Draw avgUV line
        svg.append('path')
          .datum(monthlyData)
          .attr('fill', 'none')
          .attr('stroke', color(state))
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,0')
          .attr('d', d3.line()
            .x(d => x(d.month) + x.bandwidth() / 2)
            .y(d => y(d.avgUV))
          );

        // Draw maxUV line
        svg.append('path')
          .datum(monthlyData)
          .attr('fill', 'none')
          .attr('stroke', color(state))
          .attr('stroke-width', 2)
          .attr('d', d3.line()
            .x(d => x(d.month) + x.bandwidth() / 2)
            .y(d => y(d.maxUV))
          );
          
        // Add dots for max UV
        svg.selectAll(`.maxdot-${state}`)
          .data(monthlyData)
          .join('circle')
          .attr('class', `maxdot-${state}`)
          .attr('cx', d => x(d.month) + x.bandwidth() / 2)
          .attr('cy', d => y(d.maxUV))
          .attr('r', 4)
          .attr('fill', color(state));
      }
    });

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width + 20}, 0)`);

    states.forEach((state, i) => {
      // Line for state
      legend.append('line')
        .attr('x1', 0)
        .attr('y1', i * 25)
        .attr('x2', 20)
        .attr('y2', i * 25)
        .attr('stroke', color(state))
        .attr('stroke-width', 2);

      // Label for state  
      legend.append('text')
        .attr('x', 25)
        .attr('y', i * 25 + 4)
        .text(state)
        .style('font-size', '12px')
        .attr('alignment-baseline', 'middle');
    });

    // Solid line for max
    legend.append('line')
      .attr('x1', 0)
      .attr('y1', states.length * 25 + 10)
      .attr('x2', 20)
      .attr('y2', states.length * 25 + 10)
      .attr('stroke', 'black')
      .attr('stroke-width', 2);

    legend.append('text')
      .attr('x', 25)
      .attr('y', states.length * 25 + 14)
      .text('Maximum UV')
      .style('font-size', '12px');

    // Dotted line for avg
    legend.append('line')
      .attr('x1', 0)
      .attr('y1', states.length * 25 + 30)
      .attr('x2', 20)
      .attr('y2', states.length * 25 + 30)
      .attr('stroke', 'black')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,0');

    legend.append('text')
      .attr('x', 25)
      .attr('y', states.length * 25 + 34)
      .text('Average UV')
      .style('font-size', '12px');

  }, [uvData, selectedState, loading]);

  // Render yearly trends chart
  useEffect(() => {
    if (!yearlyChartRef.current || !uvData.length || loading) return;
    d3.select(yearlyChartRef.current).selectAll('*').remove();

    // Setup dimensions
    const margin = { top: 30, right: 20, bottom: 50, left: 60 };
    const width = 700 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    // Create svg
    const svg = d3.select(yearlyChartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Group data by year
    const yearData = {};
    uvData.forEach(d => {
      if (!yearData[d.year]) {
        yearData[d.year] = { 
          year: d.year, 
          totalAvgUV: 0, 
          totalMaxUV: 0, 
          count: 0 
        };
      }
      yearData[d.year].totalAvgUV += d.avgUV;
      yearData[d.year].totalMaxUV += d.maxUV;
      yearData[d.year].count++;
    });

    // Calculate yearly averages
    const yearlyAverages = Object.values(yearData)
      .map(d => ({
        year: d.year,
        avgUV: d.totalAvgUV / d.count,
        maxUV: d.totalMaxUV / d.count
      }))
      .sort((a, b) => a.year - b.year);

    // X scale
    const x = d3.scaleLinear()
      .domain(d3.extent(yearlyAverages, d => d.year))
      .range([0, width]);

    // Y scale
    const y = d3.scaleLinear()
      .domain([0, d3.max(yearlyAverages, d => Math.max(d.avgUV, d.maxUV)) * 1.1])
      .range([height, 0]);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));
      
    svg.append('g')
      .call(d3.axisLeft(y));

    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Yearly UV Trends in Australia");

    // Add X axis label
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .attr("text-anchor", "middle")
      .text("Year");

    // Add Y axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("UV Index");

    // Draw avgUV line
    svg.append('path')
      .datum(yearlyAverages)
      .attr('fill', 'none')
      .attr('stroke', '#ffa500')
      .attr('stroke-width', 2)
      .attr('d', d3.line()
        .x(d => x(d.year))
        .y(d => y(d.avgUV))
      );

    // Draw maxUV line
    svg.append('path')
      .datum(yearlyAverages)
      .attr('fill', 'none')
      .attr('stroke', '#e05252')
      .attr('stroke-width', 2)
      .attr('d', d3.line()
        .x(d => x(d.year))
        .y(d => y(d.maxUV))
      );
      
    // Add dots
    svg.selectAll(".max-dots")
      .data(yearlyAverages)
      .join("circle")
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.maxUV))
      .attr("r", 4)
      .attr("fill", "#e05252");
      
    svg.selectAll(".avg-dots")
      .data(yearlyAverages)
      .join("circle")
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.avgUV))
      .attr("r", 4)
      .attr("fill", "#ffa500");

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 120}, 10)`);

    // Max UV line
    legend.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 20)
      .attr('y2', 0)
      .attr('stroke', '#e05252')
      .attr('stroke-width', 2);

    legend.append('text')
      .attr('x', 25)
      .attr('y', 4)
      .text('Maximum UV')
      .style('font-size', '12px');

    // Avg UV line
    legend.append('line')
      .attr('x1', 0)
      .attr('y1', 20)
      .attr('x2', 20)
      .attr('y2', 20)
      .attr('stroke', '#ffa500')
      .attr('stroke-width', 2);

    legend.append('text')
      .attr('x', 25)
      .attr('y', 24)
      .text('Average UV')
      .style('font-size', '12px');

  }, [uvData, loading]);

  return (
    <div className="container p-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        UV Index Trends by State
      </h1>
      
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Yearly UV Trends in Australia</CardTitle>
            <CardDescription>
              Annual average and maximum UV index measurements across Australia from 2020-2023
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                Loading data...
              </div>
            ) : (
              <div ref={yearlyChartRef}></div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly UV Index by State</CardTitle>
            <CardDescription>
              Compare UV patterns across different states throughout the year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedState} onValueChange={setSelectedState}>
              <TabsList className="grid grid-cols-4 mb-4 sm:grid-cols-8">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="NSW">NSW</TabsTrigger>
                <TabsTrigger value="VIC">VIC</TabsTrigger>
                <TabsTrigger value="QLD">QLD</TabsTrigger>
                <TabsTrigger value="SA">SA</TabsTrigger>
                <TabsTrigger value="WA">WA</TabsTrigger>
                <TabsTrigger value="TAS">TAS</TabsTrigger>
                <TabsTrigger value="NT">NT</TabsTrigger>
              </TabsList>
              
              <div className="h-[400px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    Loading data...
                  </div>
                ) : (
                  <div ref={chartRef}></div>
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle>Protecting Yourself from UV Radiation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">UV Peaks in Summer</h3>
                <p>
                  UV levels are highest during summer months (December-February), 
                  reaching extreme levels that require maximum protection.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Regional Differences</h3>
                <p>
                  Northern regions (QLD, NT) experience higher UV levels year-round,
                  while southern states have more seasonal variation.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Year-Round Protection</h3>
                <p>
                  Even during winter months in southern Australia, UV levels can 
                  still reach moderate levels that require sun protection.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
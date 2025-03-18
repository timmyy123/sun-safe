"use client";

import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface UVDoc {
  state: string;
  year?: number;
  month?: string;
  avgUV: number;
  maxUV: number;
}

export default function UVByStatePage() {
  const [groupBy, setGroupBy] = useState<"year"|"month">("year");
  const [selectedState, setSelectedState] = useState("all");
  const [uvData, setUvData] = useState<UVDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Website theme colors
  const themeColors = {
    primary: "#F97316",     // Orange-500
    secondary: "#38BDF8",   // Sky-400
    accent: "#F59E0B",      // Amber-500
    background: "#FFFFFF",  // White
    text: "#334155",        // Slate-700
    border: "#E2E8F0"       // Slate-200
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("groupBy", groupBy);
        if (selectedState !== "all") {
          params.append("state", selectedState);
        }
        const res = await fetch(`/api/uv-data?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch UV data");
        const json = await res.json();
        setUvData(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [groupBy, selectedState]);

  useEffect(() => {
    if (!chartRef.current || !uvData.length) return;

    d3.select(chartRef.current).selectAll("*").remove();

    const containerWidth = chartRef.current.clientWidth || 600;
    const containerHeight = 400;
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const svg = d3.select(chartRef.current)
      .append("svg")
      .attr("width", containerWidth)
      .attr("height", containerHeight)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X values
    let x: d3.ScaleBand<string> | d3.ScaleLinear<number, number>;
    let sortedData = uvData.slice();
    if (groupBy === "month") {
      // Predefined month order
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      x = d3.scalePoint()
        .domain(months)
        .range([0, width])
        .padding(0.5);
      // Sort by that order if needed
      sortedData.sort((a, b) => months.indexOf(a.month || "") - months.indexOf(b.month || ""));
    } else {
      // groupBy=year -> numeric x
      const allYears = Array.from(new Set(sortedData.map(d => d.year))).sort((a, b) => (a || 0) - (b || 0));
      x = d3.scaleLinear()
        .domain([d3.min(allYears) || 0, d3.max(allYears) || 1])
        .range([0, width]);
      // Sort by year
      sortedData.sort((a, b) => (a.year || 0) - (b.year || 0));
    }

    // Y scale: consider both avgUV and maxUV
    const maxVal = d3.max(sortedData, d => Math.max(d.avgUV, d.maxUV)) || 10;
    const y = d3.scaleLinear()
      .domain([0, maxVal * 1.1])
      .range([height, 0]);

    // Style axes with theme colors
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        groupBy === "month" 
          ? d3.axisBottom(x as d3.ScalePoint<string>)
          : d3.axisBottom(x as d3.ScaleLinear<number, number>).tickFormat(d3.format("d"))
      )
      .call(g => g.selectAll("line").attr("stroke", themeColors.text))
      .call(g => g.selectAll("path").attr("stroke", themeColors.text))
      .call(g => g.selectAll("text").attr("fill", themeColors.text));
    
    svg.append("g")
      .call(d3.axisLeft(y))
      .call(g => g.selectAll("line").attr("stroke", themeColors.text))
      .call(g => g.selectAll("path").attr("stroke", themeColors.text))
      .call(g => g.selectAll("text").attr("fill", themeColors.text));

    // Add axis labels
    svg.append("text")
      .attr("transform", `translate(${width/2}, ${height + 40})`)
      .style("text-anchor", "middle")
      .style("fill", themeColors.text)
      .style("font-size", "14px")
      .text(groupBy === "month" ? "Month" : "Year");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -45)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .style("fill", themeColors.text)
      .style("font-size", "14px")
      .text("UV Index");

    // Create line generators
    const lineAvg = d3.line<UVDoc>()
      .defined(d => d.avgUV !== undefined)
      .x(d => {
        if (groupBy === "month") {
          return (x as d3.ScalePoint<string>)(d.month || "") || 0;
        }
        return (x as d3.ScaleLinear<number, number>)(d.year || 0);
      })
      .y(d => y(d.avgUV))
      .curve(d3.curveMonotoneX);

    const lineMax = d3.line<UVDoc>()
      .defined(d => d.maxUV !== undefined)
      .x(d => {
        if (groupBy === "month") {
          return (x as d3.ScalePoint<string>)(d.month || "") || 0;
        }
        return (x as d3.ScaleLinear<number, number>)(d.year || 0);
      })
      .y(d => y(d.maxUV))
      .curve(d3.curveMonotoneX);

    // Draw the avgUV line
    svg.append("path")
      .datum(sortedData)
      .attr("fill", "none")
      .attr("stroke", themeColors.secondary)
      .attr("stroke-width", 2.5)
      .attr("d", lineAvg);

    // Draw the maxUV line
    svg.append("path")
      .datum(sortedData)
      .attr("fill", "none")
      .attr("stroke", themeColors.primary)
      .attr("stroke-width", 2.5)
      .attr("d", lineMax);
    
    // Add jitter to the data points to avoid overlap
    const jitter = (scale: d3.ScalePoint<string> | d3.ScaleLinear<number, number>, value: string | number) => {
      const jitterAmount = 0.1; // Adjust this value to control the amount of jitter
      if (typeof value === "string") {
        return (scale as d3.ScalePoint<string>)(value) + (Math.random() - 0.5) * jitterAmount;
      }
      return (scale as d3.ScaleLinear<number, number>)(value) + (Math.random() - 0.5) * jitterAmount;
    };

    // Add dots to the lines for better readability
    svg.selectAll(".dot-avg")
      .data(sortedData)
      .enter()
      .append("circle")
      .attr("class", "dot-avg")
      .attr("cx", d => jitter(groupBy === "month" ? x as d3.ScalePoint<string> : x as d3.ScaleLinear<number, number>, groupBy === "month" ? d.month : d.year))
      .attr("cy", d => y(d.avgUV))
      .attr("r", 4)
      .attr("fill", themeColors.secondary);

    svg.selectAll(".dot-max")
      .data(sortedData)
      .enter()
      .append("circle")
      .attr("class", "dot-max")
      .attr("cx", d => jitter(groupBy === "month" ? x as d3.ScalePoint<string> : x as d3.ScaleLinear<number, number>, groupBy === "month" ? d.month : d.year))
      .attr("cy", d => y(d.maxUV))
      .attr("r", 4)
      .attr("fill", themeColors.primary);

    // Add chart title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", themeColors.text)
      .text(`UV Index ${selectedState !== "all" ? `for ${selectedState}` : "by State"}`);

    // Create better legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 120}, 10)`);

    // Legend background
    legend.append("rect")
      .attr("width", 110)
      .attr("height", 60)
      .attr("fill", "white")
      .attr("stroke", themeColors.border)
      .attr("rx", 5)
      .attr("ry", 5);

    // Max UV legend item
    legend.append("line")
      .attr("x1", 10)
      .attr("y1", 20)
      .attr("x2", 30)
      .attr("y2", 20)
      .attr("stroke", themeColors.primary)
      .attr("stroke-width", 2.5);
      
    legend.append("circle")
      .attr("cx", 20)
      .attr("cy", 20)
      .attr("r", 4)
      .attr("fill", themeColors.primary);

    legend.append("text")
      .attr("x", 40)
      .attr("y", 24)
      .style("font-size", "12px")
      .style("fill", themeColors.text)
      .text("Max UV");

    // Avg UV legend item
    legend.append("line")
      .attr("x1", 10)
      .attr("y1", 40)
      .attr("x2", 30)
      .attr("y2", 40)
      .attr("stroke", themeColors.secondary)
      .attr("stroke-width", 2.5);
      
    legend.append("circle")
      .attr("cx", 20)
      .attr("cy", 40)
      .attr("r", 4)
      .attr("fill", themeColors.secondary);

    legend.append("text")
      .attr("x", 40)
      .attr("y", 44)
      .style("font-size", "12px")
      .style("fill", themeColors.text)
      .text("Avg UV");

  }, [uvData, groupBy, selectedState, themeColors]);

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-800">UV Index Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="groupBy" className="text-sm font-medium text-slate-700">Group By</Label>
              <Select value={groupBy} onValueChange={(value) => setGroupBy(value as "year" | "month")}>
                <SelectTrigger id="groupBy" className="w-full border-slate-300 bg-white focus:ring-orange-500 focus:border-orange-500">
                  <SelectValue placeholder="Select grouping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="year">Year</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-medium text-slate-700">State</Label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger id="state" className="w-full border-slate-300 bg-white focus:ring-orange-500 focus:border-orange-500">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  <SelectItem value="SA">South Australia</SelectItem>
                  <SelectItem value="NSW">New South Wales</SelectItem>
                  <SelectItem value="VIC">Victoria</SelectItem>
                  <SelectItem value="QLD">Queensland</SelectItem>
                  <SelectItem value="WA">Western Australia</SelectItem>
                  <SelectItem value="TAS">Tasmania</SelectItem>
                  <SelectItem value="NT">Northern Territory</SelectItem>
                  <SelectItem value="ACT">Australian Capital Territory</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 p-4 bg-white">
              <div ref={chartRef} className="w-full h-[400px]" />
            </div>
          )}
          
          <div className="mt-6 text-sm text-slate-600">
            <p>
              This chart displays {groupBy === "year" ? "yearly" : "monthly"} UV index data 
              {selectedState !== "all" ? ` for ${selectedState}` : " across all Australian states"}.
              The orange line shows maximum UV levels, while the blue line shows average UV levels.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
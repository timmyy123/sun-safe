"use client";

import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Cancer data fetching
const fetchCancerData = async () => {
  const response = await fetch('/api/cancer-data');
  if (!response.ok) throw new Error('Failed to fetch cancer data');
  return response.json();
};

export default function CancerImpacts() {
  const [cancerData, setCancerData] = useState([]);
  const [activeTab, setActiveTab] = useState('yearly');
  const [loading, setLoading] = useState(true);
  
  const yearlyChartRef = useRef(null);
  const ageSexChartRef = useRef(null);
  const typeChartRef = useRef(null);
  
  // Fetch and process cancer data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchCancerData();
        setCancerData(data);
      } catch (error) {
        console.error("Error fetching cancer data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Render yearly cancer trends chart
  useEffect(() => {
    if (loading || !yearlyChartRef.current || !cancerData.length) return;
    if (activeTab !== 'yearly') return;
    
    d3.select(yearlyChartRef.current).selectAll('*').remove();
    
    // Process cancer data by year
    const cancerByYear = cancerData.reduce((acc, curr) => {
      if (!curr.year) return acc;
      
      const key = curr.year;
      if (!acc[key]) acc[key] = { total: 0, maleCount: 0, femaleCount: 0 };
      
      acc[key].total += curr.cases;
      if (curr.sex === 'Males') acc[key].maleCount += curr.cases;
      if (curr.sex === 'Females') acc[key].femaleCount += curr.cases;
      
      return acc;
    }, {});
    
    const yearlyData = Object.keys(cancerByYear)
      .map(year => ({
        year: parseInt(year),
        total: cancerByYear[year].total,
        maleCount: cancerByYear[year].maleCount,
        femaleCount: cancerByYear[year].femaleCount
      }))
      .sort((a, b) => a.year - b.year);
    
    // Setup dimensions
    const margin = { top: 40, right: 80, bottom: 60, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create svg
    const svg = d3.select(yearlyChartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // X scale
    const x = d3.scaleLinear()
      .domain(d3.extent(yearlyData, d => d.year))
      .range([0, width]);
    
    // Y scale
    const y = d3.scaleLinear()
      .domain([0, d3.max(yearlyData, d => d.total) * 1.1])
      .range([height, 0]);
    
    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')));
    
    svg.append('g')
      .call(d3.axisLeft(y).tickFormat(d => d3.format(',')(d)));
    
    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text("Cancer Cases in Australia by Year");
    
    // Add X axis label
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Year");
    
    // Add Y axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -60)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Number of Cases");
    
    // Draw total line
    svg.append('path')
      .datum(yearlyData)
      .attr('fill', 'none')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 3)
      .attr('d', d3.line()
        .x(d => x(d.year))
        .y(d => y(d.total))
      );
    
    // Draw male line
    svg.append('path')
      .datum(yearlyData)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,0')
      .attr('d', d3.line()
        .x(d => x(d.year))
        .y(d => y(d.maleCount))
      );
    
    // Draw female line
    svg.append('path')
      .datum(yearlyData)
      .attr('fill', 'none')
      .attr('stroke', '#93c5fd')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,0')
      .attr('d', d3.line()
        .x(d => x(d.year))
        .y(d => y(d.femaleCount))
      );
    
    // Add data points
    svg.selectAll('.total-dots')
      .data(yearlyData)
      .join('circle')
      .attr('class', 'total-dots')
      .attr('cx', d => x(d.year))
      .attr('cy', d => y(d.total))
      .attr('r', 5)
      .attr('fill', '#2563eb');
    
    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 120}, 0)`);
    
    // Total line
    legend.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 20)
      .attr('y2', 0)
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 3);
    
    legend.append('text')
      .attr('x', 30)
      .attr('y', 4)
      .text('Total Cases')
      .style('font-size', '12px');
    
    // Male line
    legend.append('line')
      .attr('x1', 0)
      .attr('y1', 20)
      .attr('x2', 20)
      .attr('y2', 20)
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,0');
    
    legend.append('text')
      .attr('x', 30)
      .attr('y', 24)
      .text('Males')
      .style('font-size', '12px');
    
    // Female line
    legend.append('line')
      .attr('x1', 0)
      .attr('y1', 40)
      .attr('x2', 20)
      .attr('y2', 40)
      .attr('stroke', '#93c5fd')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,0');
    
    legend.append('text')
      .attr('x', 30)
      .attr('y', 44)
      .text('Females')
      .style('font-size', '12px');
    
  }, [cancerData, loading, activeTab]);
  
  // Render age/sex breakdown chart
  useEffect(() => {
    if (loading || !ageSexChartRef.current || !cancerData.length) return;
    if (activeTab !== 'age') return;
    
    d3.select(ageSexChartRef.current).selectAll('*').remove();
    
    // Process cancer data by age group and sex
    const ageGroups = {};
    cancerData.forEach(d => {
      if (!d.age_group || !d.cases || !d.sex) return;
      
      // Skip "All ages combined" age group
      if (d.age_group === 'All ages combined') return;
      
      if (!ageGroups[d.age_group]) {
        ageGroups[d.age_group] = { male: 0, female: 0 };
      }
      
      if (d.sex === 'Males') ageGroups[d.age_group].male += d.cases;
      if (d.sex === 'Females') ageGroups[d.age_group].female += d.cases;
    });
    
    // Convert to array for d3
    const ageGroupData = Object.entries(ageGroups)
      .map(([ageGroup, data]) => ({
        ageGroup,
        male: data.male,
        female: data.female
      }))
      .sort((a, b) => {
        const ageA = parseInt(a.ageGroup.split('-')[0]) || 0;
        const ageB = parseInt(b.ageGroup.split('-')[0]) || 0;
        return ageA - ageB;
      });
    
    // Setup dimensions
    const margin = { top: 40, right: 30, bottom: 120, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    // Create svg
    const svg = d3.select(ageSexChartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // X scale (age groups)
    const x = d3.scaleBand()
      .domain(ageGroupData.map(d => d.ageGroup))
      .range([0, width])
      .padding(0.2);
    
    // X scale for grouped bars
    const xSubgroup = d3.scaleBand()
      .domain(['male', 'female'])
      .range([0, x.bandwidth()])
      .padding(0.05);
    
    // Y scale
    const y = d3.scaleLinear()
      .domain([0, d3.max(ageGroupData, d => Math.max(d.male, d.female)) * 1.1])
      .range([height, 0]);
    
    // Color scale
    const color = d3.scaleOrdinal()
      .domain(['male', 'female'])
      .range(['#3b82f6', '#db2777']);
    
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
      .call(d3.axisLeft(y).tickFormat(d => d3.format(',')(d)));
    
    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text("Cancer Cases by Age Group and Sex");
    
    // Add X axis label
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 70)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Age Group");
    
    // Add Y axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -60)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Number of Cases");
    
    // Add bars
    svg.append("g")
      .selectAll("g")
      .data(ageGroupData)
      .join("g")
      .attr("transform", d => `translate(${x(d.ageGroup)},0)`)
      .selectAll("rect")
      .data(d => [
        { key: 'male', value: d.male, ageGroup: d.ageGroup },
        { key: 'female', value: d.female, ageGroup: d.ageGroup }
      ])
      .join("rect")
      .attr("x", d => xSubgroup(d.key))
      .attr("y", d => y(d.value))
      .attr("width", xSubgroup.bandwidth())
      .attr("height", d => height - y(d.value))
      .attr("fill", d => color(d.key));
    
    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 120}, 0)`);
    
    // Male rect
    legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#3b82f6');
    
    legend.append('text')
      .attr('x', 25)
      .attr('y', 12)
      .text('Males')
      .style('font-size', '12px');
    
    // Female rect
    legend.append('rect')
      .attr('x', 0)
      .attr('y', 25)
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#db2777');
    
    legend.append('text')
      .attr('x', 25)
      .attr('y', 37)
      .text('Females')
      .style('font-size', '12px');
    
  }, [cancerData, loading, activeTab]);
  
  // Render cancer type chart
  useEffect(() => {
    if (loading || !typeChartRef.current || !cancerData.length) return;
    if (activeTab !== 'type') return;
    
    d3.select(typeChartRef.current).selectAll('*').remove();
    
    // Process cancer data by cancer type
    const cancerTypes = cancerData.reduce((acc, curr) => {
      if (!curr.cancer_type || !curr.cases) return acc;
      
      // Skip "All cancers combined"
      if (curr.cancer_type === 'All cancers combined') return acc;
      
      if (!acc[curr.cancer_type]) acc[curr.cancer_type] = 0;
      acc[curr.cancer_type] += curr.cases;
      return acc;
    }, {});
    
    // Sort and take top 15 cancer types
    const topCancers = Object.entries(cancerTypes)
      .map(([type, cases]) => ({ type, cases }))
      .sort((a, b) => b.cases - a.cases)
      .slice(0, 15);
    
    // Setup dimensions
    const margin = { top: 40, right: 30, bottom: 120, left: 150 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    // Create svg
    const svg = d3.select(typeChartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Y scale (cancer types)
    const y = d3.scaleBand()
      .domain(topCancers.map(d => d.type))
      .range([0, height])
      .padding(0.2);
    
    // X scale
    const x = d3.scaleLinear()
      .domain([0, d3.max(topCancers, d => d.cases) * 1.1])
      .range([0, width]);
    
    // Add axes
    svg.append('g')
      .call(d3.axisLeft(y));
    
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d => d3.format(',')(d)));
    
    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text("Top 15 Cancer Types by Total Cases");
    
    // Add X axis label
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Number of Cases");
    
    // Color scale - highlight skin-related cancers
    const getBarColor = (cancerType) => {
      const skinRelated = ['Melanoma of the skin', 'Non-melanoma skin cancer', 'Basal cell carcinoma', 'Squamous cell carcinoma'];
      return skinRelated.some(term => cancerType.includes(term)) ? '#e11d48' : '#3b82f6';
    };
    
    // Add bars
    svg.selectAll('.bar')
      .data(topCancers)
      .join('rect')
      .attr('class', 'bar')
      .attr('y', d => y(d.type))
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('width', d => x(d.cases))
      .attr('fill', d => getBarColor(d.type));
    
    // Add labels
    svg.selectAll('.label')
      .data(topCancers)
      .join('text')
      .attr('class', 'label')
      .attr('y', d => y(d.type) + y.bandwidth() / 2)
      .attr('x', d => x(d.cases) + 5)
      .attr('dy', '.35em')
      .text(d => d3.format(',')(d.cases));
    
    // Add legend for skin-related cancers
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 200}, ${height + 60})`);
    
    // Skin-related rect
    legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#e11d48');
    
    legend.append('text')
      .attr('x', 25)
      .attr('y', 12)
      .text('Skin-related Cancers')
      .style('font-size', '12px');
    
    // Other rect
    legend.append('rect')
      .attr('x', 0)
      .attr('y', 25)
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#3b82f6');
    
    legend.append('text')
      .attr('x', 25)
      .attr('y', 37)
      .text('Other Cancers')
      .style('font-size', '12px');
    
  }, [cancerData, loading, activeTab]);
  
  return (
    <div className="container p-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Cancer Incidence in Australia
      </h1>
      
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Cancer Data Visualization</CardTitle>
            <CardDescription>
              Exploring the impact of cancer in Australia with a focus on skin cancer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="yearly">Yearly Trends</TabsTrigger>
                <TabsTrigger value="age">Age & Sex</TabsTrigger>
                <TabsTrigger value="type">Cancer Types</TabsTrigger>
              </TabsList>
              
              <TabsContent value="yearly" className="pt-4">
                <div className="h-[400px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      Loading data...
                    </div>
                  ) : (
                    <div ref={yearlyChartRef} className="w-full h-full"></div>
                  )}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  This chart shows the trend of cancer cases in Australia over time, broken down by sex.
                </p>
              </TabsContent>
              
              <TabsContent value="age" className="pt-4">
                <div className="h-[500px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      Loading data...
                    </div>
                  ) : (
                    <div ref={ageSexChartRef} className="w-full h-full"></div>
                  )}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  This chart shows cancer cases by age group and sex, highlighting different risk patterns.
                </p>
              </TabsContent>
              
              <TabsContent value="type" className="pt-4">
                <div className="h-[500px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      Loading data...
                    </div>
                  ) : (
                    <div ref={typeChartRef} className="w-full h-full"></div>
                  )}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  This chart shows the top 15 cancer types by total cases, with skin-related cancers highlighted.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle>The Link Between UV Exposure and Skin Cancer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Australia's Skin Cancer Crisis</h3>
                <p>
                  Australia has one of the highest rates of skin cancer in the world, with approximately 
                  2 in 3 Australians diagnosed with skin cancer by age 70.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">UV Radiation is the Main Cause</h3>
                <p>
                  95% of skin cancers are caused by UV radiation exposure. Australia's geographic 
                  location and primarily fair-skinned population contribute to this high rate.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Young Adults at High Risk</h3>
                <p>
                  Melanoma is the most common cancer in young Australians aged 15-39. 
                  Sun damage in your teens and 20s significantly increases lifetime skin cancer risk.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
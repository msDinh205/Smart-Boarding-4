import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { format } from 'date-fns';

interface ViolationHeatmapProps {
  history: any[];
  classes: string[];
}

export const ViolationHeatmap: React.FC<ViolationHeatmapProps> = ({ history, classes }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || history.length === 0) return;

    // Prepare data
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    
    // Initialize data map: { "10A-Monday": count }
    const dataMap: Record<string, number> = {};
    classes.forEach(cls => {
      days.forEach(day => {
        dataMap[`${cls}-${day}`] = 0;
      });
    });

    // Count violations (records where score < 10)
    history.forEach(record => {
      if (record.score < 10) {
        const date = new Date(record.date);
        const dayName = days[(date.getDay() + 6) % 7]; // Adjust for Mon-Sun
        const key = `${record.className}-${dayName}`;
        if (dataMap[key] !== undefined) {
          dataMap[key]++;
        }
      }
    });

    const data = Object.entries(dataMap).map(([key, value]) => {
      const [cls, day] = key.split('-');
      return { class: cls, day, value };
    });

    // Dimensions
    const margin = { top: 40, right: 30, bottom: 40, left: 60 };
    const width = containerRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .range([0, width])
      .domain(days)
      .padding(0.05);

    const yScale = d3.scaleBand()
      .range([height, 0])
      .domain(classes)
      .padding(0.05);

    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([0, d3.max(data, d => d.value) || 1]);

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat((_, i) => dayLabels[i]))
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("color", "#94a3b8")
      .call(g => g.select(".domain").remove());

    g.append("g")
      .call(d3.axisLeft(yScale))
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("color", "#94a3b8")
      .call(g => g.select(".domain").remove());

    // Rectangles
    g.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => xScale(d.day)!)
      .attr("y", d => yScale(d.class)!)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .style("fill", d => d.value === 0 ? "#f8fafc" : colorScale(d.value))
      .style("stroke-width", 1)
      .style("stroke", "#e2e8f0")
      .append("title")
      .text(d => `Lớp ${d.class}, ${dayLabels[days.indexOf(d.day)]}: ${d.value} lỗi`);

  }, [history, classes]);

  return (
    <div ref={containerRef} className="w-full bg-white p-6 rounded-3xl shadow-sm border border-primary/5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-primary uppercase tracking-widest text-left">Bản đồ nhiệt Vi phạm (Theo Thứ & Lớp)</h3>
      </div>
      <svg ref={svgRef} width="100%" height="300"></svg>
      <div className="flex items-center justify-center gap-4 text-[9px] font-bold text-primary/40 uppercase tracking-widest">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-slate-50 border border-slate-200 rounded-sm"></div>
          <span>Không có lỗi</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-200 border border-yellow-300 rounded-sm"></div>
          <span>Ít lỗi</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 border border-red-600 rounded-sm"></div>
          <span>Nhiều lỗi</span>
        </div>
      </div>
    </div>
  );
};

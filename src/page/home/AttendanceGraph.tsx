import React, { useRef, useEffect } from "react";
import { GlubEvent } from "state/models";
import * as d3 from "d3";
import { HoveredEvent } from "./Page";
import { eventIsOver } from "utils/helpers";
import { GOLD_COLOR } from "state/constants";

interface AttendanceGraphProps {
  events: GlubEvent[];
  hover: (event: HoveredEvent | null) => void;
}

export const AttendanceGraph: React.FC<AttendanceGraphProps> = ({
  events,
  hover
}) => {
  const d3Container = useRef<SVGGElement | null>(null);

  const margin = { top: 20, right: 20, bottom: 20, left: 30 };
  const width = 1350;
  const height = 400;
  const pastEvents = events.filter(eventIsOver);

  const x = d3.scaleTime().rangeRound([margin.left, width - margin.right]);
  const y = d3.scaleLinear().rangeRound([height - margin.bottom, margin.top]);
  x.domain(d3.extent(events, event => event.callTime) as [number, number]);
  y.domain([0, 100]);

  useEffect(() => {
    if (!d3Container.current || !pastEvents.length) return;

    const svg = d3.select(d3Container.current).html("");

    // create axes
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(3));
    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y));

    // draw the line between event grades
    const valueline = d3
      .line<{ callTime: number; partialScore: number }>()
      .x(event => x(event.callTime))
      .y(event => y(Math.max(0, event.partialScore)))
      .curve(d3.curveMonotoneX); // http://bl.ocks.org/d3indepth/b6d4845973089bc1012dec1674d3aff8
    svg
      .append("path")
      .datum([
        {
          callTime: pastEvents[0].callTime,
          partialScore: 0
        },
        ...pastEvents.map(event => ({
          callTime: event.callTime,
          partialScore: event.change!.partialScore
        })),
        {
          callTime: pastEvents[pastEvents.length - 1].callTime,
          partialScore: 0
        }
      ])
      .attr("class", "line")
      .attr("d", valueline);
  }, [pastEvents, margin, x, y]);

  return (
    <svg width={width} height={height}>
      <g ref={d3Container} />

      <g>
        {pastEvents.map(event => (
          <circle
            cx={x(event.callTime)}
            cy={y(Math.max(event.change!.partialScore, 0))}
            r={4}
            strokeWidth={3}
            className="attendanceDot"
          />
        ))}
      </g>
      <g>
        {pastEvents.map(glubEvent => (
          <circle
            cx={x(glubEvent.callTime)}
            cy={y(Math.max(glubEvent.change!.partialScore, 0))}
            r={8}
            fillOpacity={0}
            onMouseOver={event =>
              hover({
                event: glubEvent,
                x: event.clientX,
                y: event.clientY
              })
            }
            onMouseOut={() => hover(null)}
          />
        ))}
      </g>

      <defs>
        <linearGradient id="attendanceGradient" gradientTransform="rotate(90)">
          <stop offset="0%" stopColor={GOLD_COLOR} stopOpacity={0.85} />
          <stop offset="100%" stopColor={GOLD_COLOR} stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
};

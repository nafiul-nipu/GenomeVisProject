import React from "react";
import styles from "../../styles/Home.module.css";

export const AxisBottom = ({ xScale, yScale, scaleOffset, innerHeight }) => {
    const [xStart, xEnd] = xScale.range();
    const [, yEnd] = yScale.range();
    const ticks = xScale.ticks();
    // console.log(ticks)
    return (
        <g transform={`translate(0, ${innerHeight})`}>
            <line className={styles.axisLine} x1={xStart} x2={xEnd} y1={yEnd} y2={yEnd} />
            <g className={styles.ticks}>
                {ticks.map((t, i) => {
                    const x = xScale(t);
                    return (
                        <React.Fragment key={i}>
                            <line x1={x} x2={x} y1={yEnd} y2={yEnd + scaleOffset} />
                            <text
                                x={x}
                                y={yEnd + scaleOffset * 4}
                                textAnchor="end"
                            // transform="rotate(-45)"
                            >
                                {t}
                            </text>
                        </React.Fragment>
                    );
                })}
            </g>
        </g>
    );
};
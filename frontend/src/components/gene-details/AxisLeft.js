import React from "react";
import styles from "../../styles/Home.module.css";

export const AxisLeft = ({ xScale, yScale, scaleOffset }) => {
    const [xStart,] = xScale.range();
    const [yStart, yEnd] = yScale.range();
    const ticks = yScale.ticks();
    return (
        <>
            <line className={styles.axisLine} x1={xStart} x2={xStart} y1={yEnd} y2={yStart} />
            <g className={styles.ticks}>
                {ticks.map((t, i) => {
                    const y = yScale(t);
                    return (
                        <React.Fragment key={i}>
                            <line x1={xStart} x2={xStart - scaleOffset} y1={y} y2={y} />
                            <text
                                x={xStart - scaleOffset * 4}
                                y={y + scaleOffset * 1.25}
                            >
                                {t * 100}
                            </text>
                        </React.Fragment>
                    );
                })}
            </g>
        </>
    );
};
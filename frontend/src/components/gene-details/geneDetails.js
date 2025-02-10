import styles from "../../styles/Home.module.css";
import { useMemo } from "react";
import { AxisBottom } from "./AxisBottom";
import { AxisLeft } from "./AxisLeft";
import { extent, max, scaleBand, scaleLinear } from "d3";

const margin = { top: 10, right: 30, bottom: 30, left: 75 };

export const GeneDetails = (props) => {
    // console.log(props.data)
    const width = useMemo(() => {
        return ((17 * window.innerWidth) / 100);
    }, [window.innerWidth]);

    const height = 2500;

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = scaleLinear()
        .domain([0, max(props.data, d => !isNaN(d.gene_id) ? d.count : 0)])
        .range([0, innerWidth]);

    // console.log(xScale.ticks())

    const yScale = scaleBand()
        .domain(props.data.filter(item => !isNaN(item.gene_id)).map(item => item.gene_id))
        .range([0, innerHeight])
        .paddingInner(0.15);

    const handleClick = (gene_id) => {
        props.setGene(+gene_id)
    };

    // console.log(props.gene)
    return (
        <div className={styles[props.geneStyles]}>
            Gene Id vs Atom #
            <div className={styles.geneSvgContainer}>
                <svg width={width} height={height}>
                    <g transform={`translate(${margin.left}, ${margin.top})`}>
                        {props.data.filter(item => !isNaN(item.gene_id)).map((item, i) => {
                            return (
                                <g key={i}>
                                    <rect
                                        key={i}
                                        x={xScale(0)}
                                        y={yScale(item.gene_id)}
                                        width={xScale(item.count) - xScale(0)}
                                        height={yScale.bandwidth()}
                                        fill={+props.gene === item.gene_id ? "red" : "steelblue"}
                                        onClick={() => handleClick(item.gene_id)}
                                    /><title>{`Gene Id : ${item.gene_id} 
                                    \n Atom # : ${item.count}`}</title>
                                    <text
                                        x={xScale(0) - 70}
                                        y={yScale(item.gene_id) + yScale.bandwidth() / 2}
                                        dy=".32em"
                                    > {item.gene_id} </text>
                                    <text
                                        x={xScale(item.count) + 5}
                                        y={yScale(item.gene_id) + yScale.bandwidth() / 2}
                                        dy=".32em"
                                    > {item.count} </text>
                                </g>
                            )
                        })}
                    </g>
                </svg>
            </div>
            <div className={styles.fixedAxis}>
                <svg width={width} height={30}>
                    <g transform={`translate(${margin.left}, -26)`}>
                        <AxisBottom
                            xScale={xScale}
                            yScale={scaleBand().domain([]).range([0, 30])}
                            scaleOffset={5}
                            innerHeight={0} // Adjust height as needed
                        />
                    </g>
                </svg>
            </div>
        </div>
    )
}
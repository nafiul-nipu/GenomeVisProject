import { InputNumber, Slider, Row, Col, Button } from "antd";
import { Grid } from "@nextui-org/react";
import { useState } from "react";

export const AccessibilityRangeSlider = ({
  minVal,
  maxVal,
  accRange,
  setAccRange,
}) => {
  return (
    <Grid.Container>
      <Grid xs={3} style={{ paddingLeft: "7%" }}>
        Accessibility
      </Grid>
      <Grid xs={2}>
        <InputNumber
          min={minVal}
          max={maxVal}
          value={accRange[0]}
          onChange={(value) => setAccRange([value, accRange[1]])}
        />
      </Grid>
      <Grid xs={4}>
        <Slider
          range={{ draggableTrack: true }}
          min={minVal}
          max={maxVal}
          defaultValue={[minVal, maxVal]}
          value={accRange}
          onChange={(value) => setAccRange(value)}
          style={{ width: "100%" }}
        />
      </Grid>
      <Grid xs={2}>
        <InputNumber
          min={minVal}
          max={maxVal}
          value={accRange[1]}
          onChange={(value) => setAccRange([accRange[0], value])}
        />
      </Grid>
    </Grid.Container>
  );
};

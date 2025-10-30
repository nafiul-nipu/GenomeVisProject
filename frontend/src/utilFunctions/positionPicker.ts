import type { PositionPicker } from "../types/data_types_interfaces";

export const positionPicker: PositionPicker = (item, mode) => {
  switch (mode) {
    case "aligned":
      return [item.aligned_pos[0], item.aligned_pos[1], item.aligned_pos[2]];
    case "middle":
      return [item.middle_x, item.middle_y, item.middle_z];
    case "start":
      return [item.start_x, item.start_y, item.start_z];
    case "end":
      return [item.end_x, item.end_y, item.end_z];
    default:
      return [item.middle_x, item.middle_y, item.middle_z];
  }
};

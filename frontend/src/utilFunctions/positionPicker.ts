import type { PositionPicker } from "../types/data_types_interfaces";

export const positionPicker: PositionPicker = (item, mode) => {
  const middle: [number, number, number] = [
    item.middle_x ?? 0,
    item.middle_y ?? 0,
    item.middle_z ?? 0,
  ];

  switch (mode) {
    case "aligned":
      return item.aligned_pos
        ? [item.aligned_pos[0], item.aligned_pos[1], item.aligned_pos[2]]
        : middle;

    case "start":
      return [
        item.start_x ?? middle[0],
        item.start_y ?? middle[1],
        item.start_z ?? middle[2],
      ];

    case "end":
      return [
        item.end_x ?? middle[0],
        item.end_y ?? middle[1],
        item.end_z ?? middle[2],
      ];

    case "middle":
      return middle;
    case "default":
    default:
      return [item.x ?? middle[0], item.y ?? middle[1], item.z ?? middle[2]];
  }
};

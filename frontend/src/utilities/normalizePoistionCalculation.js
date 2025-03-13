export default function normalizePoistionCalculation(
  data,
  pos_attr_name,
  scaleFactor = 15
) {
  //   console.log(data);

  const positions = data.map((pos) => pos[pos_attr_name]);

  const minX = Math.min(...positions.map((pos) => pos[0]));
  const maxX = Math.max(...positions.map((pos) => pos[0]));
  const minY = Math.min(...positions.map((pos) => pos[1]));
  const maxY = Math.max(...positions.map((pos) => pos[1]));
  const minZ = Math.min(...positions.map((pos) => pos[2]));
  const maxZ = Math.max(...positions.map((pos) => pos[2]));

  const normalize = (value, min, max) => (value - min) / (max - min);

  const updatedPositions = data.map((pos) => {
    const normalizedPos = [
      normalize(pos[pos_attr_name][0], minX, maxX) * scaleFactor, // Normalize and scale X
      normalize(pos[pos_attr_name][1], minY, maxY) * scaleFactor, // Normalize and scale Y
      normalize(pos[pos_attr_name][2], minZ, maxZ) * scaleFactor, // Normalize and scale Z
    ];

    // Return a new object with the updated middle_pos
    return {
      ...pos, // Preserve all other properties
      [pos_attr_name]: normalizedPos,
      original_pos: pos[pos_attr_name],
    };
  });

  return updatedPositions;
}

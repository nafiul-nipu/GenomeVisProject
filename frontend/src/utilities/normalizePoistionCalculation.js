export default function normalizePoistionCalculation(data, scaleFactor = 15) {
  //   console.log(data);

  const middlePositions = data.map((pos) => pos.middle_pos);

  const minX = Math.min(...middlePositions.map((pos) => pos[0]));
  const maxX = Math.max(...middlePositions.map((pos) => pos[0]));
  const minY = Math.min(...middlePositions.map((pos) => pos[1]));
  const maxY = Math.max(...middlePositions.map((pos) => pos[1]));
  const minZ = Math.min(...middlePositions.map((pos) => pos[2]));
  const maxZ = Math.max(...middlePositions.map((pos) => pos[2]));

  const normalize = (value, min, max) => (value - min) / (max - min);

  const updatedPositions = data.map((pos) => {
    const normalizedPos = [
      normalize(pos.middle_pos[0], minX, maxX) * scaleFactor, // Normalize and scale X
      normalize(pos.middle_pos[1], minY, maxY) * scaleFactor, // Normalize and scale Y
      normalize(pos.middle_pos[2], minZ, maxZ) * scaleFactor, // Normalize and scale Z
    ];

    // Return a new object with the updated middle_pos
    return {
      ...pos, // Preserve all other properties
      middle_pos: normalizedPos, // Update middle_pos
    };
  });

  return updatedPositions;
}

/** converting python code from Roxana to JS
 *  to align the before and after dataset */

import Matrix, { SingularValueDecomposition } from "ml-matrix";

export default function calculate_similarity_transform(A, B) {
  // compute centroids
  let centroid_A = computeCentroid(A);
  let centroid_B = computeCentroid(B);

  // center the data
  let AA = centerData(A, centroid_A);
  let BB = centerData(B, centroid_B);

  // compute H matrix
  let AA_transpose = AA.transpose();
  let H = AA_transpose.mmul(BB);

  // SVD
  let svd = new SingularValueDecomposition(H);
  let U = svd.leftSingularVectors;
  let V = svd.rightSingularVectors;
  let Vt = V.transpose;

  // compute rotation matrix
  let R = V.mmul(U.transpose());

  // Ensure proper rotation by enforcing right-handed coordinate system
  if (R.det() < 0) {
    Vt.set(2, 0, -Vt.get(2, 0));
    Vt.set(2, 1, -Vt.get(2, 1));
    Vt.set(2, 2, -Vt.get(2, 2));
    R = Vt.mmul(U.transpose());
  }

  // Compute scaling
  let S = svd.diagonal;
  let scale = S.sum() / AA.clone().mul(AA).sum();

  // Compute translation vector t
  let t = centroid_B.clone().sub(R.mmul(centroid_A).mul(scale));

  return { scale, R, t };
}

// function to calculate centroid of a data containing three d points
function computeCentroid(points) {
  let numPoints = points.length;
  let numDimensions = points[0].length;
  let centroid = Array(numDimensions).fill(0); // initialize centroid to 0

  for (let i = 0; i < numPoints; i++) {
    for (let j = 0; j < numDimensions; j++) {
      centroid[j] += points[i][j];
    }
  }

  for (let j = 0; j < numDimensions; j++) {
    centroid[j] /= numPoints;
  }

  return centroid;
}

// function to center the data around the centroid
function centerData(points, centroid) {
  let numPoints = points.length;
  let numDimensions = points[0].length;
  let centered = new Array(numPoints);

  for (let i = 0; i < numPoints; i++) {
    centered[i] = new Array(numDimensions);
    for (let j = 0; j < numDimensions; j++) {
      centered[i][j] = points[i][j] - centroid[j];
    }
  }

  return new Matrix(centered);
}

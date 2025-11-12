import numpy as np
from typing import Optional, Tuple
from scipy.spatial import cKDTree
from skimage.measure import find_contours
##################### Common metrics #####################
# Metrics 
# Intersection-over-Union (IoU) for boolean masks
def iou_bool(A: np.ndarray, B: np.ndarray) -> float:
    # if either is None or empty, return NaN
    inter = np.logical_and(A,B).sum()
    union = np.logical_or(A,B).sum()
    return float(inter) / float(union + 1e-9)

# Contour distances (mean nearest neighbor + Hausdorff)
# using cKDTree for fast nearest neighbor search
def contour_distances(CA: Optional[np.ndarray], CB: Optional[np.ndarray]) -> Tuple[float,float]:
    if CA is None or CB is None: return float('nan'), float('nan')
    TA, TB = cKDTree(CA), cKDTree(CB)
    da,_ = TA.query(CB, k=1); db,_ = TB.query(CA, k=1)
    return float((da.mean()+db.mean())/2.0), float(max(da.max(), db.max()))

# find contour from boolean mask
def contour_from_bool(M: np.ndarray) -> Optional[np.ndarray]:
    if M is None or M.sum() == 0: return None
    # find contours at level 0.5 (between False=0 and True=1)
    cs = find_contours(M.astype(float), level=0.5)
    if not cs: return None
    # return the longest contour
    cs.sort(key=lambda c: c.shape[0], reverse=True)
    return cs[0]

def all_contours_from_bool(M: np.ndarray, min_len: int = 10) -> list[np.ndarray]:
    """
    Return ALL reasonably sized contour loops from a boolean mask.
    Used for visualization / export so we can keep multiple blobs.
    """
    if M is None or M.sum() == 0:
        return []
    cs = find_contours(M.astype(float), level=0.5)
    if not cs:
        return []
    # Drop tiny specks
    return [c for c in cs if c.shape[0] >= min_len]

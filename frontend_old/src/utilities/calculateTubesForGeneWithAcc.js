/**
 * example for a gene
 * gene = [{start: 0, end: 10}]
 * acc = [{start: 5, end: 7, value: 0.5}, {start: 8, end: 9, value: 0.25}]
 *
 * result = [{start: 0, end: 5, value: 0}, {start: 5, end: 7, value: 0.5}, {start: 8, end: 9, value: 0.25}, {start: 9, end: 10, value: 0}]
 */

export async function calculateTubesForGeneWithAcc(genes, accs) {
  const geneWithAcc = [];
  genes.forEach((gene) => {
    const acc = accs.filter((acc) => {
      return (
        (gene.start <= acc.end && gene.end >= acc.start) ||
        (gene.start >= acc.start && gene.end <= acc.end) ||
        (gene.start <= acc.start && gene.end >= acc.end)
      );
    });
    const merged = mergeGeneWithAcc(gene, acc);

    const result = {
      id: gene.id,
      name: gene.name,
      distance_from_com: gene.distance_from_com,
      start: gene.start,
      end: gene.end,
      gene_with_acc: merged,
    };

    geneWithAcc.push(result);
  });

  return geneWithAcc;
}

function mergeGeneWithAcc(gene, acc) {
  const result = [];

  if (acc.length === 0) {
    result.push({
      start: gene.start,
      end: gene.end,
      value: 0,
      start_pos: gene.start_pos,
      end_pos: gene.end_pos,
    });
    return result;
  }

  if (gene.start <= acc[0].start) {
    // console.log("gene is before acc");
    // acc is after gene started
    result.push({
      start: gene.start,
      end: acc[0].start,
      value: 0,
      start_pos: gene.start_pos,
      end_pos: acc[0].end_pos,
    });

    let end = { id: acc[0].start, pos: acc[0].start_pos };

    for (let i = 0; i < acc.length; i++) {
      if (acc[i].start === end.id) {
        if (acc[i].end >= gene.end) {
          result.push({
            start: acc[i].start,
            end: gene.end,
            value: acc[i].value,
            start_pos: acc[i].start_pos,
            end_pos: gene.end_pos,
          });
          end = { id: acc[i].end, pos: acc[i].end_pos };
          break;
        } else {
          result.push({
            start: end.id,
            end: acc[i].end,
            value: acc[i].value,
            start_pos: end.pos,
            end_pos: acc[i].end_pos,
          });
          end = { id: acc[i].end, pos: acc[i].end_pos };
        }
      } else if (acc[i].start !== end.id) {
        result.push({
          start: end.id,
          end: acc[i].start,
          value: 0,
          start_pos: end.pos,
          end_pos: acc[i].start_pos,
        });
        end = { id: acc[i].end, pos: acc[i].end_pos };
        if (end.id >= gene.end) {
          result.push({
            start: acc[i].start,
            end: gene.end,
            value: acc[i].value,
            start_pos: acc[i].start_pos,
            end_pos: gene.end_pos,
          });
          break;
        } else {
          result.push({
            start: acc[i].start,
            end: acc[i].end,
            value: acc[i].value,
            start_pos: acc[i].start_pos,
            end_pos: acc[i].end_pos,
          });
        }
      }
    }

    if (end.id < gene.end) {
      result.push({
        start: end.id,
        end: gene.end,
        value: 0,
        start_pos: end.pos,
        end_pos: gene.end_pos,
      });
    }
  } else {
    // acc is before gene started
    result.push({
      start: gene.start,
      end: acc[0].end,
      value: acc[0].value,
      start_pos: gene.start_pos,
      end_pos: acc[0].end_pos,
    });

    let end = { id: acc[0].end, pos: acc[0].end_pos };

    for (let i = 1; i < acc.length; i++) {
      if (acc[i].start === end.id) {
        if (acc[i].end >= gene.end) {
          result.push({
            start: acc[i].start,
            end: gene.end,
            value: acc[i].value,
            start_pos: acc[i].start_pos,
            end_pos: gene.end_pos,
          });
          end = { id: gene.end, pos: gene.end_pos };
          break;
        } else {
          result.push({
            start: acc[i].start,
            end: acc[i].end,
            value: acc[i].value,
            start_pos: acc[i].start_pos,
            end_pos: acc[i].end_pos,
          });
          end = { id: acc[i].end, pos: acc[i].end_pos };
        }
      } else if (acc[i].start !== end.id) {
        result.push({
          start: end.id,
          end: acc[i].start,
          value: 0,
          start_pos: end.pos,
          end_pos: acc[i].start_pos,
        });
        end = { id: acc[i].end, pos: acc[i].end_pos };
        if (end.id >= gene.end) {
          result.push({
            start: acc[i].start,
            end: gene.end,
            value: acc[i].value,
            start_pos: acc[i].start_pos,
            end_pos: gene.end_pos,
          });
          break;
        } else {
          result.push({
            start: acc[i].start,
            end: acc[i].end,
            value: acc[i].value,
            start_pos: acc[i].start_pos,
            end_pos: acc[i].end_pos,
          });
        }
      }
    }

    if (end.id < gene.end) {
      result.push({
        start: end.id,
        end: gene.end,
        value: 0,
        start_pos: end.pos,
        end_pos: gene.end_pos,
      });
    }
  }

  return result;
}

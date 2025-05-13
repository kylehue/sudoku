function shuffle(array: any[]) {
   for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
   }
   return array;
}

function generateRandomArray(size: number) {
   return shuffle(new Array(size).fill(0).map((_, index) => index));
}

/** Generates a fully solved sudoku table using backtracking algorithm. */
export function generateRandomSolvedSudokuTable(sizeRoot: number) {
   const sizeSq = sizeRoot ** 2;
   const table: number[][] = new Array(sizeSq)
      .fill([])
      .map(() => new Array(sizeSq).fill(NaN));
   const rowLookupSets = Array.from({ length: sizeSq }, () => new Set());
   const colLookupSets = Array.from({ length: sizeSq }, () => new Set());
   const boxLookupSets = Array.from({ length: sizeRoot }, () =>
      Array.from({ length: sizeRoot }, () => new Set())
   );

   function backtrack(i: number, j: number) {
      if (i === sizeSq) return true; // last row is done so return

      let nextRow = i;
      let nextCol = j + 1;
      if (nextCol >= sizeSq) {
         nextRow++;
         nextCol = 0;
      }

      let rowLookupSet = rowLookupSets[i];
      let colLookupSet = colLookupSets[j];
      let boxLookupSet = boxLookupSets[~~(i / sizeRoot)][~~(j / sizeRoot)];

      for (let num of generateRandomArray(sizeSq)) {
         num++;
         if (rowLookupSet.has(num)) continue;
         if (colLookupSet.has(num)) continue;
         if (boxLookupSet.has(num)) continue;

         rowLookupSet.add(num);
         colLookupSet.add(num);
         boxLookupSet.add(num);
         table[i][j] = num;

         if (backtrack(nextRow, nextCol)) return true;

         rowLookupSet.delete(num);
         colLookupSet.delete(num);
         boxLookupSet.delete(num);
         table[i][j] = NaN;
      }

      return false;
   }

   backtrack(0, 0);

   return table;
}

/** Generates a number of solved sudoku tables from another existing table. */
export function solveSudoku(
   table: number[][],
   maxSolutions: number = 1
): number[][][] {
   const sizeSq = table.length;
   const sizeRoot = Math.sqrt(sizeSq);
   const solutions: number[][][] = [];

   const resultTable: number[][] = table.map((row) =>
      row.map((cell) => (isNaN(cell) ? NaN : cell))
   );

   const rowLookupSets = Array.from(
      { length: sizeSq },
      () => new Set<number>()
   );
   const colLookupSets = Array.from(
      { length: sizeSq },
      () => new Set<number>()
   );
   const boxLookupSets = Array.from({ length: sizeRoot }, () =>
      Array.from({ length: sizeRoot }, () => new Set<number>())
   );

   // fill lookup sets with initial values
   for (let i = 0; i < sizeSq; i++) {
      for (let j = 0; j < sizeSq; j++) {
         const num = resultTable[i][j];
         if (!isNaN(num)) {
            rowLookupSets[i].add(num);
            colLookupSets[j].add(num);
            boxLookupSets[~~(i / sizeRoot)][~~(j / sizeRoot)].add(num);
         }
      }
   }

   function backtrack(i: number, j: number) {
      if (i === sizeSq) {
         solutions.push(resultTable.map((row) => [...row]));
         return solutions.length >= maxSolutions;
      }

      let nextRow = i;
      let nextCol = j + 1;
      if (nextCol >= sizeSq) {
         nextRow++;
         nextCol = 0;
      }

      // skip if already has a number
      if (!isNaN(resultTable[i][j])) {
         return backtrack(nextRow, nextCol);
      }

      let rowLookupSet = rowLookupSets[i];
      let colLookupSet = colLookupSets[j];
      let boxLookupSet = boxLookupSets[~~(i / sizeRoot)][~~(j / sizeRoot)];

      for (let num = 1; num <= sizeSq; num++) {
         if (rowLookupSet.has(num)) continue;
         if (colLookupSet.has(num)) continue;
         if (boxLookupSet.has(num)) continue;

         rowLookupSet.add(num);
         colLookupSet.add(num);
         boxLookupSet.add(num);
         resultTable[i][j] = num;

         if (backtrack(nextRow, nextCol)) return true;

         rowLookupSet.delete(num);
         colLookupSet.delete(num);
         boxLookupSet.delete(num);
         resultTable[i][j] = NaN;
      }

      return false;
   }

   backtrack(0, 0);

   return solutions;
}

/**
 * Generates a number of solved sudoku tables from another existing table.
 * (For visualization)
 */
export async function solveSudokuVisualize(
   table: number[][],
   onStep: (currentTable: number[][]) => Promise<void> | void,
   maxSolutions: number = 1
): Promise<number[][][]> {
   const sizeSq = table.length;
   const sizeRoot = Math.sqrt(sizeSq);
   const solutions: number[][][] = [];

   const resultTable: number[][] = table.map((row) =>
      row.map((cell) => (isNaN(cell) ? NaN : cell))
   );

   const rowLookupSets = Array.from(
      { length: sizeSq },
      () => new Set<number>()
   );
   const colLookupSets = Array.from(
      { length: sizeSq },
      () => new Set<number>()
   );
   const boxLookupSets = Array.from({ length: sizeRoot }, () =>
      Array.from({ length: sizeRoot }, () => new Set<number>())
   );

   // fill lookup sets with initial values
   for (let i = 0; i < sizeSq; i++) {
      for (let j = 0; j < sizeSq; j++) {
         const num = resultTable[i][j];
         if (!isNaN(num)) {
            rowLookupSets[i].add(num);
            colLookupSets[j].add(num);
            boxLookupSets[~~(i / sizeRoot)][~~(j / sizeRoot)].add(num);
         }
      }
   }

   async function sleep() {
      const delay = (window as any).VISUALIZATION_DELAY ?? 100;
      return new Promise((resolve) => setTimeout(resolve, delay));
   }

   async function backtrack(i: number, j: number): Promise<boolean> {
      if (i === sizeSq) {
         solutions.push(resultTable.map((row) => [...row]));
         return solutions.length >= maxSolutions;
      }

      let nextRow = i;
      let nextCol = j + 1;
      if (nextCol >= sizeSq) {
         nextRow++;
         nextCol = 0;
      }

      // skip if already has a number
      if (!isNaN(resultTable[i][j])) {
         return backtrack(nextRow, nextCol);
      }

      for (let num = 1; num <= sizeSq; num++) {
         if (
            rowLookupSets[i].has(num) ||
            colLookupSets[j].has(num) ||
            boxLookupSets[~~(i / sizeRoot)][~~(j / sizeRoot)].has(num)
         ) {
            let old = resultTable[i][j];
            resultTable[i][j] = num;
            if (onStep) await onStep(resultTable);
            await sleep();
            resultTable[i][j] = old;
            continue;
         }

         rowLookupSets[i].add(num);
         colLookupSets[j].add(num);
         boxLookupSets[~~(i / sizeRoot)][~~(j / sizeRoot)].add(num);
         resultTable[i][j] = num;

         if (onStep) await onStep(resultTable);
         await sleep();

         if (await backtrack(nextRow, nextCol)) return true;

         rowLookupSets[i].delete(num);
         colLookupSets[j].delete(num);
         boxLookupSets[~~(i / sizeRoot)][~~(j / sizeRoot)].delete(num);
         resultTable[i][j] = NaN;
      }

      return false;
   }

   await backtrack(0, 0);

   return solutions;
}

/** Generates a sudoku table with missing entries. */
export function generateRandomUnsolvedSudokuTable(sizeRoot: number) {
   const sizeSq = sizeRoot * sizeRoot;
   const table = generateRandomSolvedSudokuTable(sizeRoot);

   const positions: [number, number][] = [];
   for (let i = 0; i < sizeSq; i++) {
      for (let j = 0; j < sizeSq; j++) {
         positions.push([i, j]);
      }
   }

   shuffle(positions);

   // blip 50% (perfectly balanced, as all things should be)
   const maxRemovals = Math.floor(sizeSq * sizeSq * 0.5);
   let removals = 0;

   for (const [i, j] of positions) {
      const old = table[i][j];
      table[i][j] = NaN;

      const solutions = solveSudoku(table, 2);
      if (solutions.length !== 1) {
         table[i][j] = old; // restore! we broke uniqueness
      } else {
         removals++;
         if (removals >= maxRemovals) break;
      }
   }

   return table;
}

/**
 * Generates a matrix that indicates which rows, columns, or box groups
 * has valid values.
 */
export function generateValidityMatrix(table: number[][]): boolean[][] {
   const sizeSq = table.length;
   const sizeRoot = Math.sqrt(sizeSq);
   const valid = Array.from({ length: sizeSq }, () => Array(sizeSq).fill(true));

   // track duplicates in rows, columns, and boxes
   const rowCounts = Array.from(
      { length: sizeSq },
      () => new Map<number, number>()
   );
   const colCounts = Array.from(
      { length: sizeSq },
      () => new Map<number, number>()
   );
   const boxCounts = Array.from({ length: sizeRoot }, () =>
      Array.from({ length: sizeRoot }, () => new Map<number, number>())
   );

   // count occurrences of each number in rows, columns, and boxes
   for (let i = 0; i < sizeSq; i++) {
      for (let j = 0; j < sizeSq; j++) {
         const num = table[i][j];
         if (!isNaN(num)) {
            rowCounts[i].set(num, (rowCounts[i].get(num) || 0) + 1);
            colCounts[j].set(num, (colCounts[j].get(num) || 0) + 1);
            boxCounts[~~(i / sizeRoot)][~~(j / sizeRoot)].set(
               num,
               (boxCounts[~~(i / sizeRoot)][~~(j / sizeRoot)].get(num) || 0) + 1
            );
         }
      }
   }

   // identify rows, columns, and boxes with duplicates
   const invalidRows = new Set<number>();
   const invalidCols = new Set<number>();
   const invalidBoxes = new Set<string>();

   // check rows for duplicates
   for (let i = 0; i < sizeSq; i++) {
      for (const [_, count] of rowCounts[i]) {
         if (count > 1) {
            invalidRows.add(i);
            break;
         }
      }
   }

   // check columns for duplicates
   for (let j = 0; j < sizeSq; j++) {
      for (const [_, count] of colCounts[j]) {
         if (count > 1) {
            invalidCols.add(j);
            break;
         }
      }
   }

   // check boxes for duplicates
   for (let bi = 0; bi < sizeRoot; bi++) {
      for (let bj = 0; bj < sizeRoot; bj++) {
         for (const [_, count] of boxCounts[bi][bj]) {
            if (count > 1) {
               invalidBoxes.add(`${bi},${bj}`);
               break;
            }
         }
      }
   }

   // mark entire rows, columns, or boxes as invalid
   for (let i = 0; i < sizeSq; i++) {
      for (let j = 0; j < sizeSq; j++) {
         if (
            invalidRows.has(i) ||
            invalidCols.has(j) ||
            invalidBoxes.has(`${~~(i / sizeRoot)},${~~(j / sizeRoot)}`)
         ) {
            valid[i][j] = false;
         }
      }
   }

   return valid;
}

/** Checks whether a sudoku table is valid or not. */
export function isValidSudoku(table: number[][]): boolean {
   const n = table.length;
   const boxSize = Math.sqrt(n);

   // check rows
   for (let i = 0; i < n; i++) {
      const seen = new Set<number>();
      for (let j = 0; j < n; j++) {
         const val = table[i][j];
         if (val === 0) continue;
         if (seen.has(val)) return false;
         seen.add(val);
      }
   }

   // check columns
   for (let j = 0; j < n; j++) {
      const seen = new Set<number>();
      for (let i = 0; i < n; i++) {
         const val = table[i][j];
         if (val === 0) continue;
         if (seen.has(val)) return false;
         seen.add(val);
      }
   }

   // check box groups
   for (let boxRow = 0; boxRow < boxSize; boxRow++) {
      for (let boxCol = 0; boxCol < boxSize; boxCol++) {
         const seen = new Set<number>();
         for (let i = 0; i < boxSize; i++) {
            for (let j = 0; j < boxSize; j++) {
               const row = boxRow * boxSize + i;
               const col = boxCol * boxSize + j;
               const val = table[row][col];
               if (val === 0) continue;
               if (seen.has(val)) return false;
               seen.add(val);
            }
         }
      }
   }

   return true;
}

/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */
import React, { useEffect, useState, type FC } from "react";
import { useLocation, useNavigate } from "react-router";
import "./sudoku.scss";

export interface SudokuResultProps {
  numbers: number[][];
}

const SudokuResult: FC<SudokuResultProps> = props => {
  const location = useLocation();
  const navigate = useNavigate();
  const arr: (number | "")[][] = Array.from({ length: 9 }, () =>
    new Array(9).fill(""),
  );
  const numbers: (number | "")[][] = location.state?.data ?? arr;
  const [answer, setAnswer] = useState(arr);

  function solveSudoku(board: (number | "")[][]): void {
    const row = Array.from({ length: 9 }, () => 0);
    const col = Array.from({ length: 9 }, () => 0);
    const block = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => 0),
    );

    function getPossibleValue(x: number, y: number) {
      const ans =
        ((1 << 9) - 1) ^
        (row[x] | col[y] | block[Math.floor(x / 3)][Math.floor(y / 3)]);
      return ans;
    }

    function getNextPosition() {
      let res = [-1, -1];
      let minCount = 10;
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (board[i][j] !== "") {
            continue;
          }
          let cell = getPossibleValue(i, j);
          let count = 0;
          while (cell > 0) {
            count += cell & 1;
            cell = cell >>> 1;
          }
          if (count >= minCount) continue;
          minCount = count;
          res = [i, j];
        }
      }
      return res;
    }

    function fillNum(x: number, y: number, value: number, fill: boolean) {
      if (fill) {
        row[x] |= 1 << value;
        col[y] |= 1 << value;
        block[Math.floor(x / 3)][Math.floor(y / 3)] |= 1 << value;
      } else {
        const mask = (1 << 9) - 1 - (1 << value);
        row[x] &= mask;
        col[y] &= mask;
        block[Math.floor(x / 3)][Math.floor(y / 3)] &= mask;
      }
    }

    function dfs(totalCount: number): boolean {
      if (totalCount === 0) return true;
      const [x, y] = getNextPosition();
      let possibleValue = getPossibleValue(x, y);
      let value = 1;
      while (possibleValue > 0) {
        if ((possibleValue & 1) === 1) {
          board[x][y] = value;
          fillNum(x, y, value - 1, true);
          if (dfs(totalCount - 1)) return true;
          board[x][y] = "";
          fillNum(x, y, value - 1, false);
        }
        value++;
        possibleValue = possibleValue >>> 1;
      }

      return false;
    }

    let totalSpace = 0;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const space = board[i][j];
        if (space === "") {
          totalSpace++;
        } else {
          const num = space - 1;
          row[i] |= 1 << num;
          col[j] |= 1 << num;
          block[Math.floor(i / 3)][Math.floor(j / 3)] |= 1 << num;
        }
      }
    }
    dfs(totalSpace);
  }

  const back = () => {
    navigate(-1);
  };

  useEffect(() => {
    const newAnswer = numbers.map(row => row.map(col => col));
    solveSudoku(newAnswer);
    setAnswer(newAnswer);
  }, [numbers]);

  return (
    <div>
      <div>Sudoku Result!</div>
      <div className="sudoku-board">
        {answer.map((row, i) => (
          <div key={`row_${i}`} className="sudoku-row">
            {row.map((cell, j) => (
              <div key={`col_${i * 9 + j}`} className="sudoku-cell">
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div>
        <button onClick={back}>Back</button>
      </div>
    </div>
  );
};

export default SudokuResult;

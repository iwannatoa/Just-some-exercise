/*
 * Copyright © 2016-2025 Patrick Zhang.
 * All Rights Reserved.
 */
import { useEffect, useState } from "react";
import "./sudoku.scss";
import { useNavigate, useNavigation } from "react-router";

function SudokuInput() {
  const SESSION_KEY = "SUDOKU_INPUT";
  const arr: (number | "")[][] = Array.from({ length: 9 }, () =>
    new Array(9).fill(""),
  );

  const [numbers, setNumbers] = useState(arr);
  const navigate = useNavigate();

  const input = (row: number, col: number, val: string) => {
    const n = Number(val);
    const newNumber = [...numbers];
    if (n > 0 && n <= 9) {
      newNumber[row][col] = n;
    } else if (n === 0) {
      newNumber[row][col] = "";
    }
    setNumbers(newNumber);
  };

  const clear = () => {
    setNumbers(arr);
  };

  useEffect(() => {
    const value = window.sessionStorage.getItem(SESSION_KEY);
    if (value) {
      try {
        setNumbers(JSON.parse(value));
      } catch (e) {
        console.warn("session stored value wrong", value, e);
      }
    }
  }, []);

  const submit = () => {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(numbers));
    navigate("/sudoku/result", { state: { data: [...numbers] } });
  };

  return (
    <div>
      <div>This is the input component.</div>
      <div className="sudoku-board">
        {numbers.map((row, i) => (
          <div key={`row_${i}`} className="sudoku-row">
            {row.map((col, j) => (
              <input
                key={`col_${i * 9 + j}`}
                className="sudoku-cell"
                type="text"
                value={col}
                onChange={e => input(i, j, e.target.value)}
              />
            ))}
          </div>
        ))}
      </div>
      <div>
        <button onClick={clear}>Clear</button>
        <button onClick={submit}>Submit</button>
      </div>
    </div>
  );
}

export default SudokuInput;

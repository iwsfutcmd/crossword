import React, { Component } from 'react';

import './Puzzle.css';

const unfill = grid => (
  grid.map(r => r.map(c => c ? " " : ""))
);

const extractLetters = grid => {
  let letters = Array.from(new Set([].concat.apply([], grid)));
  letters.sort();
  return letters;
}

const toId = cell => "cw" + cell.map(c => c.toString().padStart(3, "0")).join("");

const toClueCellMap = (clues, rtl=false) => {
  let clueMap = {};
  let cellMap = [];
  clues.forEach((clue, i) => {
    clue[0].forEach((c, j) => {
      let row = clue[2] + (clue[4] ? j : 0);
      let col = clue[3] + (clue[4] ? 0 : (rtl ? -j : j));
      let id = toId([row, col]);
      if (!clueMap[id]) {
        clueMap[id] = {c: "", v: undefined, h: undefined}
      }
      if (!cellMap[i]) {
        cellMap[i] = new Set();
      }
      clueMap[id].c = c;
      clueMap[id][clue[4] ? "v" : "h"] = i;
      cellMap[i].add(id);
    })
  })
  return [clueMap, cellMap];
}

const getClue = (cell, clueMap, clueList, vert, rtl=false) => {
  let id = toId(cell);
  let clue = clueMap[id] ? clueList[clueMap[id][vert ? "v" : "h"]] : "";
  return (vert ? "↓" : rtl ? "←" : "→") + (clue || "");
}

class LetterPicker extends Component {
  render() {
    return (
      <div className="letter-picker">
        {this.props.letters.map((l, i) => (
          <button key={i} onClick={() => this.props.letterClick(l)}>
            {l || (this.props.rtl ? "\u2326" : "\u232b")}
          </button>
        ))}
      </div>
    )
  }
}

class Grid extends Component { 
  render() {
    return (
      <table cellSpacing="0">
        <tbody>
          {this.props.filledPuzzle.map((r, i) => (
            <tr key={i}>
              {
                r.map((c, j) => {
                  let id = toId([i, j]);
                  let isSelected = (this.props.currCell[0] === i && this.props.currCell[1] === j);
                  // let clueSelected = this.props.vert ? 
                  //   this.props.currCell[1] === j : 
                  //   this.props.currCell[0] === i;
                  let clueCellSelected = this.props.currClueCells.has(id);
                  return (
                    <td 
                      id={id}
                      tabIndex={c && "0"}
                      className={[
                        "cell", 
                        c || "black", 
                        isSelected ? "selected" : "",
                        clueCellSelected ? "clue-selected" : "",
                        (this.props.peep && c !== this.props.grid[i][j]) ? "wrong-letter" : "",
                      ].join(" ")} 
                      key={j}
                      onClick={() => this.props.cellClick([i, j])}
                      onKeyPress={this.props.cellKeyPress}
                      onKeyDown={this.props.cellKeyDown}
                    >
                      {c}
                    </td>
                  )
                })
              }
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

class Puzzle extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filledPuzzle: unfill(this.props.puzzle.grid),
      currCell: [0, 0],
      vert: false,
      peep: true,
    };
    [this.clueMap, this.cellMap] = toClueCellMap(this.props.puzzle.clues, this.props.puzzle.rtl);
    this.clueList = this.props.puzzle.clues.map(clue => clue[1]);
    this.rtl = this.props.puzzle.rtl;
  };

  componentWillMount = () => {
    this.selectNextCell("right");
  }

  getClueCells = (currCell, vert) => {
    let clue = this.clueMap[toId(currCell)];
    return clue ? this.cellMap[clue[vert ? "v": "h"]] : new Set();
  }

  cellClick = cell => {
    let selected = (this.state.currCell[0] === cell[0] && this.state.currCell[1] === cell[1]);
    if (selected) {
      this.setState({vert: !this.state.vert, currClueCells: this.getClueCells(cell, !this.state.vert)});
    } else if (this.props.puzzle.grid[cell[0]][cell[1]]) {
      this.setState({currCell: cell, currClueCells: this.getClueCells(cell, this.state.vert)})
    }
  }

  cellKeyPress = e => {
    e.preventDefault();
    this.inputLetter(e.key);
    this.selectCell(this.nextCell(this.state.currCell, this.state.vert ? "down" : this.rtl ? "left" : "right", false));
  }

  cellKeyDown = e => {
    // console.log(e.key);
    if (e.key === "Delete") {
      this.inputLetter("");
    } else if (e.key === "Backspace") {
      let prevCell = this.nextCell(this.state.currCell, this.state.vert ? "up" : this.rtl ? "right" : "left", false);
      if (this.state.filledPuzzle[this.state.currCell[0]][this.state.currCell[1]] === " ") {
        this.inputLetter("", prevCell);
        this.selectCell(prevCell);
      } else {
        this.inputLetter("");
      }
    } else if (e.key.includes("Arrow")) {
      e.preventDefault();
      let nextCell = this.nextCell(this.state.currCell, e.key.slice(5).toLowerCase());
      this.selectCell(nextCell);
      this.setState({currClueCells: this.getClueCells(nextCell, this.state.vert)});
    } else if (e.key === "Tab") {
      e.preventDefault();
      this.setState({vert: !this.state.vert, currClueCells: this.getClueCells(this.state.currCell, !this.state.vert)});
    } else if (e.key === "F1") {
      e.preventDefault();
      this.revealCell();
    } else if (e.key === "Enter") {
      e.preventDefault();
      let nextClue = (this.clueMap[toId(this.state.currCell)][this.state.vert ? "v" : "h"] + 1) % this.props.puzzle.clues.length;
      let newCell = this.props.puzzle.clues[nextClue].slice(2, 4)
      this.selectCell(newCell);
      this.setState({currClueCells: this.getClueCells(newCell, this.state.vert)});
    }
  }

  inputLetter = (l, cell=this.state.currCell) => {
    if (this.props.puzzle.allcaps) {
      l = l.toUpperCase();
    }
    let filledPuzzle = this.state.filledPuzzle;
    filledPuzzle[cell[0]][cell[1]] = l || " ";
    this.setState({filledPuzzle});
  }

  letterClick = l => {
    this.inputLetter(l);
    this.selectCell(this.nextCell(this.state.currCell, this.state.vert ? "down" : this.rtl ? "left" : "right", false));
  }

  nextCell = (cell, dir, skip=true) => {
    let filledPuzzle = this.state.filledPuzzle;
    let newCell = cell.slice();
    let m = (dir === "up" || dir === "left") ? -1 : 1;
    let [axis, axisLen] = (dir === "up" || dir === "down") ? 
      [0, filledPuzzle.length] :
      [1, filledPuzzle[newCell[0]].length];
    if (newCell[axis] + m < axisLen && newCell[axis] + m >= 0) {
      newCell[axis] += m;
    }
    if (skip) {
      while (newCell[axis] + m < axisLen && newCell[axis] + m >= 0 && !filledPuzzle[newCell[0]][newCell[1]]) {
        newCell[axis] += m;
      }
    }
    return filledPuzzle[newCell[0]][newCell[1]] ? newCell : cell;
  }

  selectCell = cell => {
    let cellElement = document.getElementById(toId(cell));
    if (cellElement) {cellElement.focus()};
    this.setState({currCell: cell, currCellClues: this.getClueCells(cell, this.state.vert)});
  }

  selectNextCell = (dir, skip=true) => {
    let filledPuzzle = this.state.filledPuzzle;
    let currCell = this.state.currCell.slice();
    let currClueCells = this.getClueCells(currCell, this.state.vert);
    let m = (dir === "up" || dir === "left") ? -1 : 1;
    if (dir === "up" || dir === "down") {    
      if (currCell[0] + m < filledPuzzle.length && currCell[0] + m >= 0) {
        currCell[0] += m;
        while (
          currCell[0] + m < filledPuzzle.length && 
          currCell[0] + m >= 0 &&
          !filledPuzzle[currCell[0]][currCell[1]]
        ) {
          currCell[0] += m;
        }
      }
    } else {
      if (currCell[1] + m < filledPuzzle[currCell[0]].length && currCell[1] + m >= 0) {
        currCell[1] += m;
        while (
          currCell[1] + m < filledPuzzle[currCell[0]].length && 
          currCell[1] + m >= 0 &&
          !filledPuzzle[currCell[0]][currCell[1]]
        ) {
          currCell[1] += m;
        }
      }
    }
    if ((skip && filledPuzzle[currCell[0]][currCell[1]]) || currClueCells.has(toId(currCell))) {
      // console.log(currCell);
      let cellElement = document.getElementById(toId(currCell));
      if (cellElement) {cellElement.focus()};
      this.setState({currCell, currClueCells: this.getClueCells(currCell, this.state.vert)});
    }
  }

  revealCell = (cell=this.state.currCell) => {
    let filledPuzzle = this.state.filledPuzzle;
    console.log(cell);
    filledPuzzle[cell[0]][cell[1]] = this.props.puzzle.grid[cell[0]][cell[1]];
    this.setState({filledPuzzle});
  }

  getClue = getClue;
  toId = toId;

  render() {  
    return (
      <div className="puzzle">
        <div className="top-bar">
          <div/>
          <div className="clue">
            {getClue(this.state.currCell, this.clueMap, this.clueList, this.state.vert, this.rtl) || " "}
          </div>
          <button onClick={() => this.revealCell()}>?</button>
        </div>
        <div className="clues-grid">
          {/* <div className="clues horiz">
            {
              this.props.clues.filter(c => c[4] === 0).map((c, i) => (
                <div key={i}>{c[1]}</div>
              ))
            }
          </div> */}
          <Grid 
            grid={this.props.puzzle.grid}
            filledPuzzle={this.state.filledPuzzle}
            currCell={this.state.currCell}
            vert={this.state.vert}
            cellClick={this.cellClick}
            cellKeyPress={this.cellKeyPress}
            cellKeyDown={this.cellKeyDown}
            peep={this.state.peep}
            currClueCells={this.state.currClueCells || new Set()}
          />
          {/* <div className="clues vert">
            {
              this.props.clues.filter(c => c[4] === 1).map((c, i) => (
                <div key={i}>{c[1]}</div>
              ))
            }
          </div> */}
        </div>
        <LetterPicker 
          letters={extractLetters(this.props.puzzle.grid)}
          letterClick={this.letterClick}
          rtl={this.rtl}
        />
      </div>
    )
  }
}
export default Puzzle;
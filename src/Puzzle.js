import React, { Component } from 'react';

import './Puzzle.css';

const unfill = puzzle => (
  puzzle.map(r => r.map(c => c ? " " : ""))
);

const extractLetters = puzzle => {
  let letters = Array.from(new Set([].concat.apply([], puzzle)));
  letters.sort();
  return letters;
}

const toId = cell => "cw" + cell.map(c => c.toString().padStart(3, "0")).join("");

const toClueMap = clues => {
  let clueMap = {};
  clues.forEach((clue, i) => {
    clue[0].forEach((c, j) => {
      let row = clue[2] + (clue[4] ? j : 0);
      let col = clue[3] + (clue[4] ? 0 : j);
      let id = toId([row, col]);
      if (!clueMap[id]) {
        clueMap[id] = {}
      }
      clueMap[id].c = c;
      clueMap[id][clue[4] ? "v" : "h"] = i;
    })
  })
  return clueMap;
}

const getClue = (cell, clueMap, clueList, vert) => {
  let id = toId(cell);
  let clue = clueMap[id] ? clueList[clueMap[id][vert ? "v" : "h"]] : "";
  return (vert ? "↓" : "→") + (clue || "");
}

class LetterPicker extends Component {
  render() {
    return (
      <div className="letter-picker">
        {this.props.letters.map((l, i) => (
          <button key={i} onClick={() => this.props.letterClick(l)}>
            {l}
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
                  let selected = (this.props.currCell[0] === i && this.props.currCell[1] === j);
                  let clueSelected = this.props.vert ? 
                    this.props.currCell[1] === j : 
                    this.props.currCell[0] === i;
                  return (
                    <td 
                      id={toId([i, j])}
                      tabIndex={c && "0"}
                      className={[
                        "cell", 
                        c || "black", 
                        selected ? "selected" : "",
                        clueSelected ? "clue-selected" : "",
                        (this.props.peep && c !== this.props.puzzle[i][j]) ? "wrong-letter" : "",
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
      filledPuzzle: unfill(this.props.puzzle),
      currCell: [0, 0],
      vert: false,
      peep: true,
    };
    this.clueMap = toClueMap(this.props.clues);
    this.clueList = this.props.clues.map(clue => clue[1]);
  };

  componentWillMount = () => {
    // document.addEventListener('keypress', e => {
    //   // e.preventDefault();
    //   console.log(e);
    // });
    this.selectNextCell("right");
  }

  cellClick = cell => {
    let selected = (this.state.currCell[0] === cell[0] && this.state.currCell[1] === cell[1]);
    if (selected) {
      this.setState({vert: !this.state.vert});
    } else if (this.props.puzzle[cell[0]][cell[1]]) {
      this.setState({currCell: cell})
    }
  }

  cellKeyPress = e => {
    e.preventDefault();
    this.inputLetter(e.key);
  }

  cellKeyDown = e => {
    // e.preventDefault();
    console.log(e.key);
    if (e.key === "Delete") {
      this.inputLetter("");
    } else if (e.key === "Backspace") {
      this.selectNextCell(this.state.vert ? "up" : this.props.rtl ? "right" : "left");
      this.inputLetter("");
    } else if (e.key.includes("Arrow")) {
      e.preventDefault();
      this.selectNextCell(e.key.slice(5).toLowerCase())
    } else if (e.key === "Tab") {
      e.preventDefault();
      this.setState({vert: !this.state.vert});
    }
  }

  inputLetter = l => {
    let filledPuzzle = this.state.filledPuzzle;
    let currCell = this.state.currCell;
    if (filledPuzzle[currCell[0]][currCell[1]]) {
      filledPuzzle[currCell[0]][currCell[1]] = l || " ";
      this.setState({filledPuzzle});
      if (l) {
        this.selectNextCell(this.state.vert ? "down" : this.props.rtl ? "left" : "right");
      }
    }
  }

  selectNextCell = dir => {
    let filledPuzzle = this.state.filledPuzzle;
    let currCell = this.state.currCell;
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
      // let m = this.props.rtl ? -1 : 1;
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
    let cellElement = document.getElementById(toId(currCell));
    if (cellElement) {cellElement.focus()};
    this.setState({currCell});
  }

  getClue = getClue;
  toId = toId;

  render() {  
    return (
      <div className="puzzle">
        <div className="clue">
          {getClue(this.state.currCell, this.clueMap, this.clueList, this.state.vert) || " "}
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
            puzzle={this.props.puzzle}
            filledPuzzle={this.state.filledPuzzle}
            currCell={this.state.currCell}
            vert={this.state.vert}
            cellClick={this.cellClick}
            cellKeyPress={this.cellKeyPress}
            cellKeyDown={this.cellKeyDown}
            peep={this.state.peep}
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
          letters={extractLetters(this.props.puzzle)}
          letterClick={this.inputLetter}
        />
      </div>
    )
  }
}
export default Puzzle;
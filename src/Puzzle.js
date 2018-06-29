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
  };

  componentWillMount = () => {
    document.addEventListener('keypress', e => {
      // e.preventDefault();
      console.log(e);
    });
    this.selectNextCell();
  }

  cellClick = cell => {
    let selected = (this.state.currCell[0] === cell[0] && this.state.currCell[1] === cell[1]);
    if (selected) {
      this.setState({vert: !this.state.vert});
    } else if (this.props.puzzle[cell[0]][cell[1]]) {
      this.setState({currCell: cell})
    }
  }

  inputLetter = l => {
    let filledPuzzle = this.state.filledPuzzle;
    let currCell = this.state.currCell;
    if (filledPuzzle[currCell[0]][currCell[1]]) {
      filledPuzzle[currCell[0]][currCell[1]] = l || " ";
      this.setState({filledPuzzle});
      this.selectNextCell();
    }
  }

  selectNextCell = () => {
    let filledPuzzle = this.state.filledPuzzle;
    let currCell = this.state.currCell;
    if (this.state.vert) {
      if (currCell[0] + 1 < filledPuzzle.length) {
        currCell[0] += 1;
        while (currCell[0] + 1 < filledPuzzle.length && !filledPuzzle[currCell[0]][currCell[1]]) {
          currCell[0] += 1;
        }
      }
    } else {
      let m = this.props.rtl ? -1 : 1;
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
    this.setState({currCell});
  }

  render() {
    return (
      <div className="puzzle">
        <div className="clues-grid">
          <div className="clues horiz">
            {
              this.props.clues.filter(c => c[4] === 0).map((c, i) => (
                <div key={i}>{c[1]}</div>
              ))
            }
          </div>
          <Grid 
            puzzle={this.props.puzzle}
            filledPuzzle={this.state.filledPuzzle}
            currCell={this.state.currCell}
            vert={this.state.vert}
            cellClick={this.cellClick}
            peep={this.state.peep}
          />
          <div className="clues vert">
            {
              this.props.clues.filter(c => c[4] === 1).map((c, i) => (
                <div key={i}>{c[1]}</div>
              ))
            }
          </div>
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
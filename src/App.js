import React, { Component } from 'react';
import './App.css';

import Puzzle from './Puzzle';

import puzzle from './puzzle.json';

// const puzzle = puz.grid;
// const clues = puz.clues;

class App extends Component {
  render() {
    return (
      <div className="App">
        {/* <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header> */}
        <div className="puzzle-container">
          <Puzzle puzzle={puzzle}/>
        </div>
      </div>
    );
  }
}

export default App;

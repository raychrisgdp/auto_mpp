import React from 'react';
import { NavLink, Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import './App.css';
import PersonnelView from './components/PersonnelView';
import TasksView from './components/TasksView';
import TimelineView from './components/TimelineView';

function App() {
  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li>
              <NavLink to="/personnel" activeClassName="active-link">Personnel</NavLink>
            </li>
            <li>
              <NavLink to="/tasks" activeClassName="active-link">Tasks</NavLink>
            </li>
            <li>
              <NavLink to="/timeline" activeClassName="active-link">Timeline</NavLink>
            </li>
          </ul>
        </nav>

        <Switch>
          <Route path="/personnel">
            <PersonnelView />
          </Route>
          <Route path="/tasks">
            <TasksView />
          </Route>
          <Route path="/timeline">
            <TimelineView />
          </Route>
          <Route path="/">
            <h1>Welcome to Project Management App</h1>
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
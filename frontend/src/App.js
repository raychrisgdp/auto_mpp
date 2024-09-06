import React, { useEffect } from 'react';
import { NavLink, Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import './App.css';
import PersonnelView from './components/PersonnelView';
import RolesView from './components/RolesView';
import TasksView from './components/TasksView';
import TimelineView from './components/TimelineView';

function App() {
  useEffect(() => {
    function handleVisibilityChange() {
      if (!document.hidden) {
        // Force a re-render when the page becomes visible
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li>
              <NavLink to="/roles" activeClassName="active-link">Roles</NavLink>
            </li>
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
          <Route path="/roles">
            <RolesView />
          </Route>
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
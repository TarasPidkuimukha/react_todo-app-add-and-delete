/* eslint-disable max-len */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useState, useEffect, useRef } from 'react';
import { UserWarning } from './UserWarning';
import { USER_ID, deleteTodo, getTodos, postTodos } from './api/todos';
import { Todo } from './types/Todo';
import classNames from 'classnames';

export const App: React.FC = () => {
  const [title, setTitle] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'completed'
  >('all');

  const [deleting, setDeleting] = useState<number[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const [disable, setDisable] = useState(false);
  // const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const addTodos = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmed = title.trim();

    if (trimmed === '') {
      setErrorMessage('Title should not be empty');

      return;
    }

    setErrorMessage('');

    setTempTodo({
      id: 0,
      title: trimmed,
      userId: USER_ID,
      completed: false,
    });

    const newTodo = {
      title: trimmed,
      userId: USER_ID,
      completed: false,
    };

    setDisable(true);

    postTodos(newTodo)
      .then(response => {
        setTodos([...todos, response]);
        setTempTodo(null);
        setDisable(false);
        setTitle('');
      })
      .catch(() => {
        setErrorMessage('Unable to add a todo');
        setTempTodo(null);
        setDisable(false);
        // setTitle('');
      });
  };

  const deleteTodos = (id: number) => {
    setDeleting([...deleting, id]);

    deleteTodo(id)
      .then(() => {
        setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
        setDeleting(deleting.filter(todo => todo !== id));
        inputRef.current?.focus();
      })
      .catch(() => {
        setDeleting(deleting.filter(todo => todo !== id));
        setErrorMessage('Unable to delete a todo');
      });
  };

  const resolveTodos = () => {
    const completedTodos = todos.filter(todo => todo.completed === true);
    const Promises = completedTodos.map(todo => deleteTodos(todo.id));

    Promise.allSettled(Promises);
  };

  useEffect(() => {
    setErrorMessage('');
    getTodos()
      .then(setTodos)
      .catch(() => setErrorMessage('Unable to load todos'));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setErrorMessage('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [errorMessage]);

  //filtering logic
  const visibleTodos = todos.filter(todo =>
    filterStatus === 'active'
      ? !todo.completed
      : filterStatus === 'completed'
        ? todo.completed
        : filterStatus === 'all',
  );

  //focus
  useEffect(() => {
    if (inputRef.current !== null && !disable) {
      inputRef.current.focus();
    }
  }, [disable]);

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have active class only if all todos are completed */}
          <button
            type="button"
            className="todoapp__toggle-all active"
            data-cy="ToggleAllButton"
          />

          {/* Add a todo on form submit */}
          <form onSubmit={addTodos}>
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={title}
              onChange={event => setTitle(event.target.value)}
              disabled={disable}
              ref={inputRef}
            />
          </form>
        </header>

        {todos.length > 0 && (
          <div>
            <section className="todoapp__main" data-cy="TodoList">
              {visibleTodos.map(todo => (
                <div
                  data-cy="Todo"
                  key={todo.id}
                  className={classNames('todo', {
                    completed: todo.completed,
                  })}
                >
                  <input
                    data-cy="TodoStatus"
                    type="checkbox"
                    className="todo__status"
                    checked={todo.completed}
                    readOnly
                  />

                  <span data-cy="TodoTitle" className="todo__title">
                    {todo.title}
                  </span>
                  <button
                    type="button"
                    className="todo__remove"
                    data-cy="TodoDelete"
                    onClick={() => deleteTodos(todo.id)}
                  >
                    ×
                  </button>
                  <div
                    data-cy="TodoLoader"
                    className={classNames('modal overlay', {
                      'is-active': deleting.includes(todo.id),
                    })}
                  >
                    <div className="modal-background has-background-white-ter" />
                    <div className="loader" />
                  </div>
                </div>
              ))}
              {tempTodo !== null && (
                <div
                  data-cy="Todo"
                  className={classNames('todo', {
                    completed: tempTodo.completed,
                  })}
                >
                  <input
                    data-cy="TodoStatus"
                    type="checkbox"
                    className="todo__status"
                    checked={tempTodo.completed}
                    readOnly
                  />

                  <span data-cy="TodoTitle" className="todo__title">
                    {tempTodo.title}
                  </span>
                  <div data-cy="TodoLoader" className="modal overlay is-active">
                    <div className="modal-background has-background-white-ter" />
                    <div className="loader" />
                  </div>
                </div>
              )}
            </section>
            <footer className="todoapp__footer" data-cy="Footer">
              <span className="todo-count" data-cy="TodosCounter">
                {todos.filter(todo => !todo.completed).length} items left
              </span>
              <nav className="filter" data-cy="Filter">
                <a
                  href="#/"
                  className={classNames('filter__link', {
                    selected: filterStatus === 'all',
                  })}
                  onClick={event => {
                    event.preventDefault();
                    setFilterStatus('all');
                  }}
                  data-cy="FilterLinkAll"
                >
                  All
                </a>
                <a
                  href="#/active"
                  className={classNames('filter__link', {
                    selected: filterStatus === 'active',
                  })}
                  data-cy="FilterLinkActive"
                  onClick={event => {
                    event.preventDefault();
                    setFilterStatus('active');
                  }}
                >
                  Active
                </a>
                <a
                  href="#/completed"
                  className={classNames('filter__link', {
                    selected: filterStatus === 'completed',
                  })}
                  data-cy="FilterLinkCompleted"
                  onClick={event => {
                    event.preventDefault();
                    setFilterStatus('completed');
                  }}
                >
                  Completed
                </a>
              </nav>

              <button
                type="button"
                className="todoapp__clear-completed"
                data-cy="ClearCompletedButton"
                disabled={
                  todos.filter(todo => todo.completed === true).length === 0
                }
                onClick={resolveTodos}
              >
                Clear completed
              </button>
            </footer>
          </div>
        )}
        <div
          data-cy="ErrorNotification"
          className={classNames(
            'notification is-danger is-light has-text-weight-normal',
            {
              hidden: errorMessage === '',
            },
          )}
        >
          <button
            data-cy="HideErrorButton"
            type="button"
            className="delete"
            onClick={() => setErrorMessage('')}
          />
          {errorMessage}
        </div>
      </div>
    </div>
  );
};

const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./database.sqlite');

const makeDatabase = (sql) => {
  db.run(sql, err => {
    if(err) {
      throw err
    }
  });
}

makeDatabase(`
  CREATE TABLE IF NOT EXISTS 'Employee' (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    wage INTEGER NOT NULL,
    is_current_employee INTEGER DEFAULT 1
  )
`);

makeDatabase(`
  CREATE TABLE IF NOT EXISTS 'Timesheet' (
    id INTEGER PRIMARY KEY NOT NULL,
    hours INTEGER NOT NULL,
    rate INTEGER NOT NULL,
    date INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
      FOREIGN KEY (employee_id) REFERENCES Employee(id)
  )
`);

makeDatabase(`
  CREATE TABLE IF NOT EXISTS 'Menu' (
    id INTEGER PRIMARY KEY NOT NULL,
    title TEXT NOT NULL
  )
`);

makeDatabase(`
  CREATE TABLE IF NOT EXISTS 'MenuItem' (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    inventory INTEGER NOT NULL,
    price INTEGER NOT NULL,
    menu_id INTEGER NOT NULL,
      FOREIGN KEY (menu_id) REFERENCES Menu(id)
  )
`);

const express = require('express');
const employeesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');


const employeeChecker = (req, res, next) => {
  const name = req.body.employee.name;
  const position = req.body.employee.position;
  const wage = req.body.employee.wage;

  if (!name || !position || !wage) {
    return res.status(400).send();
  }

  let isCurrentEmployee = 0

  if (req.body.employee.isCurrentEmployee !== 0) {
    isCurrentEmployee = 1;
  }

  req.employee = {
    name: name,
    position: position,
    wage: wage,
    isCurrentEmployee: isCurrentEmployee
  };

  next()
};


employeesRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Employee WHERE is_current_employee = 1`, (err, employees) => {
    if (err) {
      throw err
    } else {
      return res.status(200).json({employees: employees})
    }
  })
});


employeesRouter.post('/', employeeChecker, (req, res, next) => {
  db.run(`INSERT INTO Employee
            (name, position, wage, is_current_employee)
          VALUES ($name, $position, $wage, $isCurrentEmployee)`,
    {
      $name: req.employee.name,
      $position: req.employee.position,
      $wage: req.employee.wage,
      $isCurrentEmployee: req.employee.isCurrentEmployee
    },
    function(err) {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Employee WHERE id=${this.lastID}`,
          (err, result) => {
            res.status(201).json({employee: result});
          }
        )
      }
    }
  )
});


employeesRouter.get('/:employeeId', (req, res, next) => {
  db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`,
    (err, employee) => {
      if (err) {
        throw err
      } else if (employee) {
        res.status(200).json({employee: employee});
      } else {
        res.status(404).send();
      }
    }
  )
});


employeesRouter.put('/:employeeId', employeeChecker, (req, res, next) => {
  db.run(`UPDATE Employee SET
            name = $name,
            position = $position,
            wage = $wage,
            is_current_employee = $isCurrentEmployee
          WHERE id = $employeeId`,
    {
      $name: req.employee.name,
      $position: req.employee.position,
      $wage: req.employee.wage,
      $isCurrentEmployee: req.employee.isCurrentEmployee,
      $employeeId: req.params.employeeId
    },
    function(err) {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Employee WHERE id=$employeeId`,
          {$employeeId: req.params.employeeId},
          (err, result) => {
            res.status(200).json({employee: result});
          }
        )
      }
    }
  )
});


employeesRouter.delete('/:employeeId', (req, res, next) => {
  db.get(`SELECT * FROM Employee WHERE id=$employeeId`,
    {$employeeId: req.params.employeeId},
    (err, result) => {
      if (err) {
        throw err
      } else if (!result) {
        res.status(404).send();
      } else {
        db.run(`UPDATE Employee SET is_current_employee = 0 WHERE id = $employeeId`,
          {$employeeId: req.params.employeeId},
          function(err) {
            if (err) {
              next(err);
            } else {
              db.get(`SELECT * FROM Employee WHERE id=$employeeId`,
                {$employeeId: req.params.employeeId},
                (err, result) => {
                  if (err) {
                    throw err
                  } else {
                    res.status(200).json({employee: result});
                  }
                }
              )
            }
          }
        )
      }
    }
  )
});


const timesheetsRouter = require('./timesheets');
employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);


module.exports = employeesRouter;

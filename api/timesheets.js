const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');


const timesheetChecker = (req, res, next) => {
  const hours = req.body.timesheet.hours;
  const rate = req.body.timesheet.rate;
  const date = req.body.timesheet.date;

  if (!hours || !rate || !date) {
    return res.status(400).send();
  }

  req.timesheet = {
    hours: hours,
    rate: rate,
    date: date
  };

  next()
};


const employeeExists = (req, res, next) => {
  db.get(`SELECT * FROM Employee WHERE id = $employeeId`,
    {$employeeId: req.params.employeeId},
    (err, result) => {
      if (err) {
        throw err
      } else if (!result) {
        res.status(404).send();
      } else {
        req.employeeId = req.params.employeeId
        next()
      }
    }
  )
};


const timesheetExists = (req, res, next) => {
  db.get(`SELECT * FROM Timesheet WHERE id = $timesheetId`,
    {$timesheetId: req.params.timesheetId},
    (err, result) => {
      if (err) {
        throw err
      } else if (!result) {
        res.status(404).send();
      } else {
        req.timesheetId = req.params.timesheetId
        next()
      }
    }
  )
};


timesheetsRouter.get('/', employeeExists, (req, res, next) => {
  db.all(`SELECT * FROM Timesheet WHERE employee_id = $employeeId`,
    {$employeeId: req.employeeId},
    (err, timesheets) => {
    if (err) {
      next(err)
    } else {
      return res.status(200).json({timesheets: timesheets})
    }
  })
});


timesheetsRouter.post('/', employeeExists, timesheetChecker, (req, res, next) => {
  db.run(`INSERT INTO Timesheet
            (hours, rate, date, employee_id)
          VALUES ($hours, $rate, $date, $employee_id)`,
    {
      $hours: req.timesheet.hours,
      $rate: req.timesheet.rate,
      $date: req.timesheet.date,
      $employee_id: req.employeeId
    },
    function(err) {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Timesheet WHERE id=${this.lastID}`,
          (err, result) => {
            res.status(201).json({timesheet: result});
          }
        )
      }
    }
  )
});


timesheetsRouter.put('/:timesheetId', employeeExists, timesheetExists, timesheetChecker, (req, res, next) => {
  db.run(`UPDATE Timesheet SET
            hours = $hours,
            rate = $rate,
            date = $date
          WHERE id = $timesheetId`,
    {
      $hours: req.timesheet.hours,
      $rate: req.timesheet.rate,
      $date: req.timesheet.date,
      $timesheetId: req.timesheetId
    },
    function(err) {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Timesheet WHERE id=$timesheetId`,
          {$timesheetId: req.timesheetId},
          (err, result) => {
            res.status(200).json({timesheet: result});
          }
        )
      }
    }
  )
});


timesheetsRouter.delete('/:timesheetId', employeeExists, timesheetExists, (req, res, next) => {
  db.run(`DELETE FROM Timesheet WHERE id = $timesheetId`,
    {$timesheetId: req.timesheetId}, function(err) {
      if(err) {
        next(err)
      } else {
        res.status(204).send();
      }
    }
  )
})


module.exports = timesheetsRouter;

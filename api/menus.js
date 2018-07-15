const express = require('express');
const menusRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');


const menuChecker = (req, res, next) => {
  const title = req.body.menu.title;

  if (!title) {
    return res.status(400).send();
  }

  req.menu = {
    title: title
  };

  next()
};


const menuExists = (req, res, next) => {
  db.get(`SELECT * FROM Menu WHERE id = ${req.params.menuId}`,
    (err, menu) => {
      if (err) {
        throw err
      } else if (menu) {
        req.menuId = req.params.menuId;
        req.menu = menu;
        next()
      } else {
        res.status(404).send();
      }
    }
  )
};


menusRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Menu`, (err, menus) => {
    if (err) {
      throw err
    } else {
      return res.status(200).json({menus: menus})
    }
  })
});


menusRouter.post('/', menuChecker, (req, res, next) => {
  db.run(`INSERT INTO Menu
            (title)
          VALUES ($title)`,
    {
      $title: req.menu.title
    },
    function(err) {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Menu WHERE id=${this.lastID}`,
          (err, result) => {
            res.status(201).json({menu: result});
          }
        )
      }
    }
  )
});


menusRouter.get('/:menuId', menuExists, (req, res, next) => {
  res.status(200).json({menu: req.menu});
});


menusRouter.put('/:menuId', menuExists, menuChecker, (req, res, next) => {
  db.run(`UPDATE Menu SET
            title = $title
          WHERE id = $menuId`,
    {
      $title: req.menu.title,
      $menuId: req.menuId
    },
    function(err) {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Menu WHERE id=$menuId`,
          {$menuId: req.menuId},
          (err, result) => {
            res.status(200).json({menu: result});
          }
        )
      }
    }
  )
});


menusRouter.delete('/:menuId', menuExists, (req, res, next) => {
  db.get(`SELECT * FROM MenuItem WHERE menu_id = $menuId`,
    {$menuId: req.menuId},
    (err, result) => {
      if (result) {
        res.status(400).send();
      } else {
        db.run(`DELETE FROM Menu WHERE id = $menuId`,
          {$menuId: req.menuId}, function(err) {
            if(err) {
              next(err)
            } else {
              res.status(204).send();
            }
          }
        )
      }
    }
  )
})


const menuItemsRouter = require('./menu-items');
menusRouter.use('/:menuId/menu-items', menuItemsRouter);


module.exports = menusRouter;

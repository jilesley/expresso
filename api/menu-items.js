const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');


const menuExists = (req, res, next) => {
  db.get(`SELECT * FROM Menu WHERE id = $menuId`,
    {$menuId: req.params.menuId},
    (err, result) => {
      if (err) {
        throw err
      } else if (!result) {
        res.status(404).send();
      } else {
        req.menuId = req.params.menuId
        next()
      }
    }
  )
};


const menuItemExists = (req, res, next) => {
  db.get(`SELECT * FROM MenuItem WHERE id = $menuItemId`,
    {$menuItemId: req.params.menuItemId},
    (err, result) => {
      if (err) {
        throw err
      } else if (!result) {
        res.status(404).send();
      } else {
        req.menuItemId = req.params.menuItemId
        next()
      }
    }
  )
};


const menuItemChecker = (req, res, next) => {
  const name = req.body.menuItem.name;
  const description = req.body.menuItem.description;
  const inventory = req.body.menuItem.inventory;
  const price = req.body.menuItem.price;

  if (!name || !description || !inventory || !price) {
    return res.status(400).send();
  }

  req.menuItem = {
    name: name,
    description: description,
    inventory: inventory,
    price: price
  };

  next()
};


menuItemsRouter.get('/', menuExists, (req, res, next) => {
  db.all(`SELECT * FROM MenuItem WHERE menu_id = $menuId`,
    {$menuId: req.menuId},
    (err, menuItems) => {
    if (err) {
      next(err)
    } else {
      return res.status(200).json({menuItems: menuItems})
    }
  })
});


menuItemsRouter.post('/', menuExists, menuItemChecker, (req, res, next) => {
  db.run(`INSERT INTO MenuItem
            (name, description, inventory, price, menu_id)
          VALUES ($name, $description, $inventory, $price, $menu_id)`,
    {
      $name: req.menuItem.name,
      $description: req.menuItem.description,
      $inventory: req.menuItem.inventory,
      $price: req.menuItem.price,
      $menu_id: req.menuId
    },
    function(err) {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM MenuItem WHERE id=${this.lastID}`,
          (err, result) => {
            res.status(201).json({menuItem: result});
          }
        )
      }
    }
  )
});


menuItemsRouter.put('/:menuItemId', menuExists, menuItemExists, menuItemChecker, (req, res, next) => {
  db.run(`UPDATE MenuItem SET
            name = $name,
            description = $description,
            inventory = $inventory,
            price = $price,
            menu_id = $menu_id
          WHERE id = $menuItemId`,
    {
      $name: req.menuItem.name,
      $description: req.menuItem.description,
      $inventory: req.menuItem.inventory,
      $price: req.menuItem.price,
      $menu_id: req.menuId,
      $menuItemId: req.menuItemId
    },
    function(err) {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM MenuItem WHERE id=$menuItemId`,
          {$menuItemId: req.menuItemId},
          (err, result) => {
            res.status(200).json({menuItem: result});
          }
        )
      }
    }
  )
});


menuItemsRouter.delete('/:menuItemId', menuExists, menuItemExists, (req, res, next) => {
  db.run(`DELETE FROM MenuItem WHERE id = $menuItemId`,
    {$menuItemId: req.menuItemId}, function(err) {
      if(err) {
        next(err)
      } else {
        res.status(204).send();
      }
    }
  )
});


module.exports = menuItemsRouter

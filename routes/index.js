var express = require('express')
var app = express()

app.get('/', function(req, res){
  if(req.session.login == undefined) {
    res.render('index_guest')
  } else {
    res.render('index_login')
  }
});

app.get('/about', function(req, res) {
  if(req.session.login == undefined) {
    res.render('about_guest')
  } else {
    res.render('about_login')
  }
});

app.get('/cal', function(req, res) {
  if(req.session.login == undefined){
    req.flash('error', 'You must login to view this page')
    res.redirect('/user/login')
  } else {
    res.redirect('cal/appointments');
  }
});

app.get('/cal/appointments', function(req, res) {
  if(req.session.login == undefined){
    req.flash('error', 'You must login to view this page')
    res.redirect('/user/login')
  } else {
    req.getConnection(function(error, conn) {
      var sqlQuery = 'SELECT startDateTime, eventID as id, DATE_FORMAT(startDateTime, "%l %p") as time, DATE_FORMAT(startDateTime, "%a %b %D %Y") as date, reason, description FROM sta.calendarEvents where username = "' + req.session.login + '" and startDateTime > NOW();';
      conn.query(sqlQuery, function(err, rows, fields) {
        if(err){
          req.flash('error', err);
          res.render('cal/appointments', { data: '' });
        } else {
          res.render('cal/appointments', {data: rows});
        }
      })
    })
  }
});

app.get('/cal/new', function(req, res) {
  if(req.session.login == undefined){
    req.flash('error', 'You must login to view this page')
    res.redirect('/user/login')
  } else {
    var sqlQuery = 'SELECT DATE_FORMAT(startDateTime, "%H") as hour, DATE_FORMAT(startDateTime, "%Y-%m-%d") as fullDate FROM sta.calendarEvents'
    req.getConnection(function(error, conn) {
      if(error) return next(error);
      conn.query(sqlQuery, function(err, rows, fields) {
        if(err) {
          req.flash('error', err)
          res.redirect('/cal')
        } else {
          console.log(rows);
          res.render('cal/new', {
            bookedTimes: rows
          });
        }
      })
    })
  }
});

app.post('/cal/new', function(req, res, next) {
  req.assert('date', 'Date is required').notEmpty();
  req.assert('time', 'Time is required').notEmpty();
  req.assert('reason', 'Reason for appointment is required').notEmpty();
  var errors = req.validationErrors();
  if(!errors){
    var userInput = {
      date: req.sanitize('date').escape().trim(),
      time: req.sanitize('time').escape().trim(),
      reason: req.sanitize('reason').escape().trim(),
      description: req.sanitize('description').escape().trim()
    }
    var sqlQuery = 'INSERT INTO sta.calendarEvents (username, startDateTime, reason, description) VALUES ("' + req.session.login + '", "' + userInput.date + ' ' + userInput.time + ':00:00", "' + userInput.reason + '", "' + userInput.description + '");'
    console.log(sqlQuery);
    req.getConnection(function(error, conn) {
      if (error) return next(error)
      conn.query(sqlQuery, function(err, rows, fields) {
        if(err) {
          req.flash('error', err);
          res.redirect('/cal/new');
        }else{
          req.flash('success', 'Appointment successfully scheduled!');
          res.redirect('/cal/appointments');
        }
      })
    })
  }else{
    var error_msg = ''
    errors.forEach(function(error){
      error_msg += error.msg + '<br>';
    });
    req.flash('error', error_msg);
    res.redirect('/cal/new');
  }
});

app.delete('/cal/cancel/(:id)', function(req, res, next){
  var sqlQuery = 'DELETE FROM sta.calendarEvents WHERE eventID = ' + req.params.id;
  req.getConnection(function(error, conn) {
    conn.query(sqlQuery, function(err, result){
      if(err){
        req.flash('error', err);
        res.redirect('/cal/appointments');
      }else{
        req.flash('success', 'Successfully deleted event!');
        res.redirect('/cal/appointments');
      }
    })
  })
})

app.get('/user/login', function(req, res) {
  res.render('user/login')
});

app.post('/user/login', function(req, res, next) {
  req.assert('username', 'Username is required').notEmpty();
  req.assert('password', 'Password is required').notEmpty();
  var errors = req.validationErrors();
  if(!errors){
    var userInput = {
      username: req.sanitize('username').escape().trim(),
      password: req.sanitize('password').escape().trim()
    }
    var sqlQuery = 'SELECT * FROM users WHERE username = "' + userInput.username + '"'
    req.getConnection(function(error, conn) {
      if (error) return next(error)
      conn.query(sqlQuery, function(err, rows, fields) {
        if(err){
          req.flash('error', err)
          res.render('user/login')
        }else{
          if(rows[0] == undefined){
            req.flash('error', 'Username not found')
            res.render('user/login')
          }else if(userInput.password == rows[0].userPassword){
            req.flash('success', 'Welcome, ' + userInput.username + '!')
            req.session.login = userInput.username
            res.redirect('/cal/appointments')
          }else{
            req.flash('error', 'Username & Password do not match')
            res.render('user/login')
          }
        }
      })
    })
  }else{
    var error_msg = ''
    errors.forEach(function(error){
      error_msg += error.msg + '<br>';
    });
    req.flash('error', error_msg);
    res.render('user/login');
  }
});

app.get('/user/newuser', function(req, res) {
  res.render('user/newuser')
});

app.post('/user/newuser', function(req, res, next){
  req.assert('firstname', 'First Name is required').notEmpty();
  req.assert('lastname', 'Last Name is required').notEmpty();
  req.assert('username', 'Username is required').notEmpty();
  req.assert('password', 'Password is required').notEmpty();
  var errors = req.validationErrors();
  if(!errors){
    var item = {
      firstname: req.sanitize('firstname').escape().trim(),
      lastname: req.sanitize('lastname').escape().trim(),
      username: req.sanitize('username').escape().trim(),
      password: req.sanitize('password').escape().trim()
    }
    req.getConnection(function(error, conn){
      conn.query("INSERT INTO users (`firstName`, `lastName`, `username`, `userPassword`) VALUES ('".concat(item.firstname, "', '", item.lastname, "', '", item.username, "', '", item.password, "');"), function(err, result) {
        if(err){
          req.flash('error', err)
          res.render('user/newuser')
        } else {
          req.session.login = item.username
          res.redirect('/cal/appointments');
        }
      });
    });
  } else {
    var error_msg = ''
    errors.forEach(function(error) {
      error_msg += 'Error: ' + error + '<br>';
    });
    req.flash('error', error_msg);
    res.render('user/newuser')
  }
})

app.get('/user/logout', function(req, res){
  req.session.login = undefined
  res.redirect('/')
});

module.exports = app

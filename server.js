const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

app.use(express.static('public'));

require('dotenv').config();

var db;
MongoClient.connect(process.env.DB_URL, function (error, client) {
  if (error) return console.log(error);

  db = client.db('todoapp');

  // db.collection('post').insertOne({name: 'Sona', age: 20}, function(error, result){
  //   console.log('저장 완료');
  // });

  app.listen(process.env.PORT, function () {
    console.log('listening on 8080');
  });
});


const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');

// 미들웨어: 요청-응답 중간에 뭔가 실행되는 코드
app.use(session({secret: 'secretcode', resave: true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function(req, res){
  res.render('login.ejs');
})

app.get('/fail', function(req, res){
  res.render('fail.ejs');
})

app.post('/login', passport.authenticate('local', {
  failureRedirect : '/fail'
}), function(req, res){
  res.redirect('/');
})

// 로그인시 계정 확인
passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (userid, userpw, done) {
  db.collection('login').findOne({ id: userid }, function (error, result) {
    if (error) return done(error)

    if (!result) return done(null, false, { message: 'Incorrect id' })
    if (userpw == result.pw) {
      return done(null, result)
    } else {
      return done(null, false, { message: 'Incorrect password' })
    }
  })
}));

// serializeUser : 사용자 정보 객체를 세션에 아이디로 저장
passport.serializeUser(function(user, done){
  done(null, user.id);
});
// deserializeUser: 세션에 저장한 아이디를 통해서 사용자 정보 객체를 불러옴
passport.deserializeUser(function(id, done){ // serializeUser 에 저장했던 id를 받음
  db.collection('login').findOne({id: id}, function(err, result){
    done(null, result);
  })
});

app.get('/logout', function(req, res, next){
  // req.logout(function(err){
  //   if(err) return next(err)
  //   res.redirect('/');
  // })
  req.session.destroy(function(err){
    if(err) return next(err)
    res.redirect('/');
  })
})

app.use(function(req, res, next){
  res.locals.login = req.isAuthenticated();
  if(req.session.passport) res.locals.name = req.user.id;
  next();
})

app.get('/mypage', validLogin, function(req, res){
  res.render('mypage.ejs', { myuser: req.user.id });
})

function validLogin(req, res, next){
  if(req.user){
    next()
  } else {
    res.send('Please sign in.')
  }
}

app.get('/join', function(req, res){
  res.render('join.ejs');
  // db.collection('login').findOne({ id: req.body.new_id }, function (error, result) {
  //   if(result != null) {
  //     res.render('join.ejs', { data: result });
  //   } else {
  //     res.render('join.ejs', { error: 'your id is already registered'});
  //     console.log('alreay')
  //   }
  // });
})

app.post('/join', function(req, res){
  db.collection('login').insertOne({ id: req.body.new_id, pw: req.body.new_pw }, function (error, result) {
    console.log('가입완료');
    res.redirect('/login');
  });
})

app.get('/', function (req, res) {
  res.render('home.ejs');
});

app.get('/write', function (req, res) {
  res.render('write.ejs');
});

app.get('/list', function (req, res) {
  db.collection('post').find().toArray(function (error, result) {
    res.render('list.ejs', { posts: result });
  });
});

app.get('/detail/:id', function (req, res) {
  db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (error, result) {
    res.render('detail.ejs', { data: result });
  })
});

app.delete('/delete', function(req, res){
  req.body._id = parseInt(req.body._id);
  db.collection('post').deleteOne(req.body, function(error, result){
    console.log("삭제완료");
    res.status(200).send({ message: "삭제에 성공했습니다"});
  })
});

app.post('/add', function (req, res) {
  // res.send("전송완료");
  res.redirect('/list');
  db.collection('counter').findOne({ name: '개시물갯수' }, function (error, result) {
    let totalCount = result.totalPost;
    db.collection('post').insertOne({ _id: totalCount + 1, title: req.body.title, date: req.body.date, detail: req.body.detail }, function (error, result) {
      console.log('저장완료');
      db.collection('counter').updateOne({ name: '개시물갯수' }, { $inc: { totalPost: 1 } }, function () {
      })
    });
  });
});

app.get('/edit/:id', function (req, res) {
  db.collection('post').findOne({ _id: parseInt(req.params.id) }, function(error, result){
    res.render('edit.ejs', { data: result });
  })
});

app.put('/edit', function(req, res) {
  db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set: {title: req.body.title, date: req.body.date, detail: req.body.detail} }, function(error, result){
    console.log("수정완료")
    res.redirect('/list');
  })
});


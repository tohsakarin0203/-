/**
 * 应用程序入口
 * 前面这一堆照搬原server.js的
 */
let fs = require('fs');
let express = require('express');
// 创建app应用
let app = express();
// 加载模板处理模块
let swig = require('swig');

let query = require('./lib/poolQuery.js')

let bodyParser = require('body-parser');
let phoneReg = /^1[3|4|5|7|8][0-9]{9}$/;
// 创建 application/x-www-form-urlencoded 编码解析
let urlencodedParser = bodyParser.urlencoded({
  extended: false
})
//const formidable = require('formidable');
let path = require('path');
app.use(bodyParser.json());
app.use('/static', express.static('static'));


app.engine('html', swig.renderFile);

app.set('views', './');
app.set('view engine', 'html');
app.set('view options', {
  layout: false
});

swig.setDefaults({
  cache: false
});
app.all('*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
})
app.get('/', function (req, res, next) {
  res.render('index');
})
app.get('/manage', function (req, res, next) {
  res.render('manage');
})
//获取查询结果
app.get('/search', function (req, res, next) {
    let sql;
    //单独收到selled信息时，默认查询销量高与selled的生鲜信息
    if(req.query.selled != undefined && req.query.name == undefined &&req.query.vip == undefined && req.query.cheap == undefined && req.query.cost == undefined){
     sql = `select *
          from sell
          where  selled >= ${req.query.selled}
          order by selled`
    }
    //单独收到name信息时，查询该生鲜信息
    else if(req.query.selled == undefined && req.query.name != undefined &&req.query.vip == undefined && req.query.cheap == undefined && req.query.cost == undefined){
       sql = `select *
      from sell
      where name = ${req.query.name}
      order by selled`
    }
    //单独收到vip信息时，查询会员才有特价的生鲜信息，若vip信息为0则查询会员特价外所有生鲜信息
    else if(req.query.selled == undefined && req.query.name == undefined &&req.query.vip != undefined && req.query.cheap == undefined && req.query.cost == undefined){
       sql = `select *
      from sell
      where vip = ${req.query.vip}
      order by selled`
    }
    //单独收到cheap或者cost信息时，默认查询cheap与cost比查询价格低的生鲜信息
    else if(req.query.selled == undefined && req.query.name == undefined &&req.query.vip == undefined && req.query.cheap != undefined && req.query.cost == undefined){
       sql = `select *
      from sell
      where cheap <= ${req.query.cheap}
      order by selled`
    }
    //单独收到cost
    else if(req.query.selled == undefined && req.query.name == undefined &&req.query.vip == undefined && req.query.cheap == undefined && req.query.cost != undefined){
       sql = `select *
      from sell
      where cost <= ${req.query.cost}
      order by selled`
    }
    //同时收到cheap和cost信息时，比较cheap与cost大小，若cheap等于cost则查询原价生鲜，否则查询打折生鲜
    else if(req.query.selled == undefined && req.query.name == undefined &&req.query.vip == undefined && req.query.cheap != undefined && req.query.cost != undefined){
      if(req.query.cheap == req.query.cost){
         sql = `select *
        from sell
        where cheap = cost
        order by selled`
      }
      else{
         sql = `select *
        from sell
        where cheap < cost
        order by selled`
      }
    }
    //同时收到vip与selled信息时
    else if(req.query.selled == undefined && req.query.name == undefined &&req.query.vip != undefined && req.query.cheap == undefined && req.query.cost == undefined){
       sql = `select *
      from sell
      where vip == ${req.query.vip}
      and selled >= ${req.query.selled}
      order by selled`
    }
    //同时收到vip与cheap信息时
    else if(req.query.selled == undefined && req.query.name == undefined &&req.query.vip != undefined && req.query.cheap != undefined && req.query.cost == undefined){
       sql = `select *
      from sell
      where vip == ${req.query.vip}
      and cheap <= ${req.query.cheap}
      order by selled`
    }
    //同时收到selled与cheap以及cost信息时,查询销量高于selled的打折或原价生鲜
    else if(req.query.selled != undefined && req.query.name == undefined &&req.query.vip == undefined && req.query.cheap != undefined && req.query.cost != undefined){
      if(req.query.cheap == req.query.cost){
         sql = `select *
        from sell
        where cheap = cost
        and selled >= ${req.query.selled}
        order by selled`
      }
      else{
         sql = `select *
        from sell
        where cheap < cost
        and selled >= ${req.query.selled}
        order by selled`
      }
    }
    //同时收到vip，cheap，cost信息时
    else if(req.query.selled == undefined && req.query.name == undefined &&req.query.vip != undefined && req.query.cheap != undefined && req.query.cost != undefined){
      if(req.query.cheap == req.query.cost){
         sql = `select *
        from sell
        where cheap = cost
        and vip = ${req.query.vip}
        order by selled`
      }
      else{
         sql = `select *
        from sell
        where cheap < cost
        and vip >= ${req.query.vip}
        order by selled`
      }
    }
    //同时收到selled,vip,cheap,cost信息时
    else if(req.query.selled == undefined && req.query.name == undefined &&req.query.vip != undefined && req.query.cheap != undefined && req.query.cost != undefined){
      if(req.query.cheap == req.query.cost){
         sql = `select *
        from sell
        where cheap = cost
        and vip = ${req.query.vip}
        and selled >= ${req.query.selled}
        order by selled`
      }
      else{
         sql = `select *
        from sell
        where cheap < cost
        and vip >= ${req.query.vip}
        and selled >= ${req.query.selled}
        order by selled`
      }
    }
    query(sql, function (qerr, value, field) {
      if (qerr) console.log(qerr)
      else {
        res.writeHead(200, {
          'Content-Type': 'text/html;charset=utf-8'
        });
        res.end(JSON.stringify(value));
      }
    })
  })
//注册代码先搬过来并修改，使注册信息符合现有数据库
app.post('/post/register', urlencodedParser, function (req, res, next) {
  let name = req.body.name;
  let password = req.body.password;
  let response = {
    message: '',
    status: '',
    user: {
      telephone: '',
      name: '',
      password: '',
      url:''
    }
  }
  let user = {
    name: name,
    password: password
  }
  let select;
  select = `select name
    from user
    where name = ${name}`
  query(select, function (qerr, value, field) {
    if (qerr) console.log(qerr)
    else {
      if (value[0] == null) {
        let insert;
        insert = `insert into user (telephone,name,password,url)
                          values('${req.body.telephone}','${name}','${password}','${req.body.url}')`
        query(insert, function (qerr, value, field) {
          if (qerr) console.log(qerr)
          else {
            response.message = '注册成功';
            response.status = 'success';
            response.user = user
            response.user.id = id
            res.writeHead(200, {
              'Content-Type': 'text/html;charset=utf-8'
            });
            res.end(JSON.stringify(response));
          }
        })
      } else {
        response.status = 'fail';
        response.message = '该用户已存在';
        res.writeHead(200, {
          'Content-Type': 'text/html;charset=utf-8'
        });
        res.end(JSON.stringify(response));
      }
    }
  })



})
//登录代码先搬过来了，并先对其内容进行了修改，使注册登录信息符合现在数据库的内容
  app.post('/post/login', urlencodedParser, function (req, res, next) {
    let username = req.body.name;
    let password = req.body.password;
    let response = {
      message: '',
      status: ''
    }
    let key;
    let select = `select *
      from user
      where name = '${username}' 
      and password = '${password}'`;
    query(select, function (qerr, value, field) {
      if (qerr) {
        console.log(qerr);
      } else {
        if (value[0] != null) {
          response.status = 'success';
          response.message = '登陆成功';
          response.user = value[0];
          let date = response.user.birthday;
          response.user.birthday = date;
          res.writeHead(200, {
            'Content-Type': 'text/html;charset=utf-8'
          });
          res.end(JSON.stringify(response));
        } else {
          response.status = 'fail'
          response.message = '用户名或密码错误'
          res.end(JSON.stringify(response));
        }
      }
    })
  })
  
  app.listen(8088, function () {
    console.log('http://127.0.0.1:8088/');
  })

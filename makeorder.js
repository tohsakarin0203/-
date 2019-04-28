let fs = require('fs');
let express = require('express');
let bodyParser = require('body-parser');
let urlencodedParser = bodyParser.urlencoded({
  extended: false
})
let app = express();
require('./util');
//添加购物车
app.post('/post/addshoppingcart', urlencodedParser, function (req, res, next) {
    let name = req.body.name;
    let url = req.body.url;
    let cheap = req.body.cheap;
    let cost = req.body.cost;
    let number = req.body.number;
    let price = parseFloat(cheap)*parseInt(number);
    let userid = req.body.userid;
//以下四行是随机生成订单号的函数
    let r1 = Math.floor(Math.random()*10); 
    let r2 = Math.floor(Math.random()*10); 
    let sysDate = new Date().Format('yyyyMMddhhmmss'); // 系统时间：年月日时分秒 
    let id = platform+r1+sysDate+r2; 
    let insert = `insert into shoppingcart(id, name,  url, cheap, cost, number, price, userid)
                       values('${id}', '${name}', '${url}', '${cheap}', '${cost}', '${number}', '${price}', '${userid}')`;
    query(insert,function(qerr,value,field){
        if(qerr) console.log(qerr)
        else{
            response.message = '添加成功';
            response.userid = userid;
            res.writeHead(200, {
              'Content-Type': 'text/html;charset=utf-8'
            });
            res.end(JSON.stringify(response));
        }
    })

})
//删除某条购物车,需接收将修改的菜名
app.get('/post/deleteshoppingcart', urlencodedParser, function (req, res, next){
    let name = req.body.name ;
    let sql = `delete from shoopingcart where name = ${name}`;
    query(sql, function(qerr, value, field){
        if(qerr) console.log(qerr);
        else {
            response.message = '删除成功';
            res.writeHead(200, {
                'Content-Type': 'text/html;charset=utf-8'
            });
            res.end(JSON.stringify(response));
        }
    })
})
//提交订单，并删除所有购物车内容,接收的信息为userid
app.post('/post/makeorder', urlencodedParser, function (req, res, next) {
    let userid = req.body.userid;
//sell表中的selled只因新提交的数据改变
    let sql = `insert into order(id, name, cheap, number, price, userid) (select id, name, cheap, number, price, userid from shoppingcart where userid = ${userid})
               delete from shoppingcart where userid = ${userid}
               update sell a, order b
               set a.selled = a.selled + b.number 
               where a.name = b.name and b.userid = ${userid}`;
    query(sql, function(qerr, value, field){
        if(qerr) console.log(qerr);
        else {
            response.message = '提交成功';
            res.writeHead(200, {
                'Content-Type': 'text/html;charset=utf-8'
            });
            res.end(JSON.stringify(response));
        }
    })
})
//订单查询，只支持id查询，菜名查询，用户名查询和默认查询
app.get('/post/search', urlencodedParser, function (req, res, next){
    let sql;
    if(req.query.id != undefined)
      sql = `select * from order where id = ${req.query.id}`;
        else if(req.query.name != undefined)
          sql = `select * from order where name = ${req.query.name}`;
            else if(req.query.userid != undefined)
              sql = `select * from order where userid = ${req.query.userid}`;
    else
      sql = 'select * from order';
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

const Koa = require('koa');
const serve = require("koa-static");
const koaRouter = require('koa-router');
const axios = require('axios');
const sha1 = require('node-sha1');
let qs = require('querystring')

let TOKEN = 'yezhenxu';

function checkSignature(params, token) {
    var key = [token, params.timestamp, params.nonce].sort().join('');
    //将token （自己设置的） 、timestamp（时间戳）、nonce（随机数）三个参数进行字典排序
    var sha1 = require('crypto').createHash('sha1');
    //将上面三个字符串拼接成一个字符串再进行sha1加密
    sha1.update(key);
    return sha1.digest('hex') == params.signature;
    //将加密后的字符串与signature进行对比，若成功，返回echostr
}

const app = new Koa();
const router = koaRouter();

app.use(router['routes']());
app.use(serve(__dirname + "/", {
    extensions: ['html']
}));


let userInfo = {}

router.get('/signature', function (ctx, next) {


    return new Promise(function (resolve, reject) {
        axios.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx76bdcf78e0e0265e&secret=87f6958bddd25626167956148c320d74').then(({
            data
        }) => {
            console.log('access_token', data.access_token)
            let globalaccess_token = data.access_token

            axios.get(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${data.access_token}&type=jsapi`).then(({
                data
            }) => {
                console.log('ticket', data.ticket)

                let noncestr = "Wm3WZYTPz0wzccnW" + Math.ceil(Math.random() * 1000)
                let jsapi_ticket = data.ticket
                let timestamp = Date.now()
                let iurl = 'http://ucdrn3.natappfree.cc/'

                console.log(`jsapi_ticket=${jsapi_ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${iurl}`)
                let string1 = `jsapi_ticket=${jsapi_ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${iurl}`
                let signature = sha1(string1)
                console.log('signature', signature)
                let result = {
                    timestamp: timestamp,
                    nonceStr: noncestr,
                    signature: signature,
                    globalaccess_token
                }
                ctx.body = JSON.stringify(result);
                resolve(next())
            })

        })

    });

});

router.get('/message', function (ctx, next) {


    var query = require('url').parse(ctx.request.url).query;
    var params = qs.parse(query);
    console.log(params)

    if (!checkSignature(params, TOKEN)) {
        //如果签名不对，结束请求并返回
        ctx.body = 'signature fail';
    }

    if (ctx.request.method == "GET") {
        //如果请求是GET，返回echostr用于通过服务器有效校验
        ctx.body = params.echostr
    } else {
        //否则是微信给开发者服务器的POST请求
        var postdata = '';
        ctx.request.addListener("data", function (postchunk) {
            postdata += postchunk;
        });
        //获取到了POST数据
        ctx.request.addListener("end", function () {
            console.log(postdata);
            ctx.body = 'success'
        });
    }

});

router.get('/userinfox', function (ctx, next) {


    return new Promise(function (resolve, reject) {


        let urlparam = () => { 
            var reg_url = /^[^\?]+\?([\w\W]+)$/,
                  reg_para = /([^&=]+)=([\w\W]*?)(&|$|#)/g,
                  arr_url = reg_url.exec(ctx.url),
                  ret = {}; 
            if (arr_url && arr_url[1]) {  
                var str_para = arr_url[1],
                    result;  
                while ((result = reg_para.exec(str_para)) != null) {   
                    ret[result[1]] = result[2];  
                } 
            } 
            return ret;
        }

        let code = urlparam().code


        axios.get(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx76bdcf78e0e0265e&secret=87f6958bddd25626167956148c320d74&code=${code}&grant_type=authorization_code`).then(({
            data
        }) => {

            axios.get(`https://api.weixin.qq.com/sns/userinfo?access_token=${data.access_token}&openid=${data.openid}&lang=zh_CN`).then(({
                data
            }) => {
                console.log('currentuserinfo==================', data)
                let userinfokey = Math.ceil(Math.random() * 100000000)

                ctx.response.redirect('/userinfo.html?code=' + userinfokey)
                Object.assign(userInfo, {
                    [userinfokey]: data
                })
                console.log('userinfo==================', userInfo)
                resolve(next())
            })


        })

    });

});

router.get('/getinfo', function (ctx, next) {


    var query = require('url').parse(ctx.request.url).query;
    var params = qs.parse(query);
    console.log(params.code)

    
    ctx.body = userInfo[params.code]

});



app.listen(8888);
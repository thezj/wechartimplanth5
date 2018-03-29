const Koa = require('koa');
const serve = require("koa-static");
const koaRouter = require('koa-router');
const axios = require('axios');
const sha1 = require('node-sha1');

const app = new Koa();
const router = koaRouter();

app.use(router['routes']());
app.use(serve(__dirname + "/", {
    extensions: ['html']
}));


router.get('/signature', function (ctx, next) {


    return new Promise(function (resolve, reject) {
        axios.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx76bdcf78e0e0265e&secret=87f6958bddd25626167956148c320d74').then(({
            data
        }) => {
            console.log('access_token', data.access_token)

            axios.get(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${data.access_token}&type=jsapi`).then(({
                data
            }) => {
                console.log('ticket', data.ticket)

                let noncestr = "Wm3WZYTPz0wzccnW" + Math.ceil(Math.random() * 1000)
                let jsapi_ticket = data.ticket
                let timestamp = Date.now()
                let iurl = 'http://wznkq4.natappfree.cc/'

                console.log(`jsapi_ticket=${jsapi_ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${iurl}`)
                let string1 = `jsapi_ticket=${jsapi_ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${iurl}`
                let signature = sha1(string1)
                console.log('signature',signature)
                let result = {
                    timestamp: timestamp,
                    nonceStr: noncestr,
                    signature: signature
                }
                ctx.body = JSON.stringify(result);
                resolve(next())
            })

        })

    });

});



app.listen(8888);
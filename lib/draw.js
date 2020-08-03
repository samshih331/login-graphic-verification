exports.drawPic = (options) => {
    let width = parseInt(options.width), height = parseInt(options.height);
    const Canvas = require('canvas');
    let codeImage = Canvas.createCanvas(width, height)
    // 獲取該canvas的2D繪圖環境對象
    let ctx = codeImage.getContext('2d');
    ctx.textBaseline = 'middle';
    // 繪製背景色，顏色若太深可能導致看不清
    ctx.fillStyle = randomColor(180, 255);
    // 畫出矩形，要記得ctx.fillStyle放在ctx.fillRect哦。
    ctx.fillRect(0, 0, width, height);
    // 繪製文字
    let pattern = options.pattern;
    let str = '123456789';
    if (pattern === '2') {
        str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    } else if (pattern === '3') {
        str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789'
    }
    let code = '';
    // 生成指定位數的驗證碼。
    for (let i = 0; i < options.number; i++) {
        // 隨機獲取str的一個元素。
        let txt = str[randomNum(0, str.length)];
        // 將元素加入到code里。
        code += txt;
        // 隨機生成字體顏色
        ctx.fillStyle = randomColor(50, 160);
        // 隨機生成字體大小
        ctx.font = randomNum(25, 30) + 'px SimHei';
        ctx.shadowOffsetY = randomNum(-3, 3);
        ctx.shadowBlur = randomNum(-3, 3);
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        let x = width / (parseInt(options.number) + 1) * (i + 1);
        let y = height / 2;
        // 隨機生成旋轉角度。
        let deg = randomNum(-30, 30);
        // 修改坐標原點和旋轉角度
        // 平移元素
        ctx.translate(x, y);
        // 旋轉元素
        ctx.rotate(deg * Math.PI / 180);
        ctx.fillText(txt, 0, 0);
        // 恢復坐標原點和旋轉角度
        ctx.rotate(-deg * Math.PI / 180);
        ctx.translate(-x, -y);
    }
    // 繪製干擾線
    for (let i = 0; i < randomNum(1, 4); i++) {
        // 干擾線顏色。
        ctx.strokeStyle = randomColor(40, 180);
        // 開始繪製。
        ctx.beginPath();
        // 起點位置
        ctx.moveTo(randomNum(0, width), randomNum(0, height));
        // 終點位置
        ctx.lineTo(randomNum(0, width), randomNum(0, height));
        ctx.stroke();
    }
    // 繪製干擾點
    for (let i = 0; i < width / 6; i++) {
        ctx.fillStyle = randomColor(0, 255);
        ctx.beginPath();
        ctx.arc(randomNum(0, width), randomNum(0, height), 1, 0, 2 * Math.PI);
        ctx.fill();
    }

    // 測試下載圖片到\Downloads
    const fs = require('fs');
    const path = require('path');
    const DOWNLOAD_DIR = path.join(process.env.HOME || process.env.USERPROFILE, 'downloads/');
    let out = fs.createWriteStream(DOWNLOAD_DIR + '/codeImg.png');
    let pngStream = codeImage.createPNGStream();
    pngStream.on('data', (chunk => out.write(chunk)))
    pngStream.on('end', () => console.log('saved png'))

    const {v4: uuidv4} = require('uuid');
    let key = uuidv4();
    // canvas to Base64
    console.log('png: ', codeImage.toDataURL())
    console.log('key: ', key)
    console.log('answer: ', code);

    // 回傳client端 header帶key(讓gateway去redis查答案) body帶DataURL(讓UI顯示圖片)

    // 放到redis => key: uuid, value: answer 並設定timeout時間，如果timeout gateway要再來拿圖片
    const redis = require("redis");
    // const client = redis.createClient();
    const client = redis.createClient('6379', '127.0.0.1');

    client.on("error", function (error) {
        console.error(error);
    });

    // 60秒 timeout
    client.set(key, code, 'EX', 60, redis.print);
    // client.set(key, code, redis.print);
    client.get(key, redis.print);

    client.quit(() => console.log('redis client close connection.'))
}

randomColor = (min, max) => {
    let r = randomNum(min, max);
    let g = randomNum(min, max);
    let b = randomNum(min, max);
    return "rgb(" + r + "," + g + "," + b + ")";
}

randomNum = (min, max) => {
    // 在max和min之間生成隨機數。
    return Math.floor(Math.random() * (max - min) + min);
}
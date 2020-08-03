const Canvas = require('canvas');
const {v4: uuidv4} = require('uuid');
const redis = require("redis");
const fs = require('fs');
const path = require('path');

exports.drawPic = (options) => {
    let width = parseInt(options.width);
    let height = parseInt(options.height);
    let pattern = options.pattern;
    let charPool = patternDecide(pattern);

    let codeImage = Canvas.createCanvas(width, height);
    // 獲取該canvas的2D繪圖環境對象
    let ctx = codeImage.getContext('2d');
    let code = drawContent(ctx, width, height, options.number, charPool);
    drawInterferenceLine(ctx, width, height);
    drawInterferenceDot(ctx, width, height);

    downloadImage(codeImage);

    saveRedis('6379', '127.0.0.1', code, 60);

    // TODO RESTFUL API 回傳client端 header帶key(讓gateway去redis查答案) body帶DataURL(讓UI顯示圖片)
    // canvas to Base64
    // console.log('png: ', codeImage.toDataURL())
}

/**
 * 將驗證碼放到redis，並設定timeout時間 => key: uuid, value: answer
 * @param port
 * @param host
 * @param code
 * @param expireTime int 單位:秒
 */
saveRedis = (port = '6379', host = '127.0.0.1', code, expireTime = 60) => {
    let key = uuidv4();
    console.log('key:', key);
    const client = redis.createClient(port, host);
    client.on("error", function (error) {
        console.error(error);
    });
    client.set(key, code, 'EX', expireTime, redis.print);
    client.get(key, redis.print);
    client.quit(() => console.log('redis client close connection.'))
}

/**
 * rgb各自在min與max之間產生隨機數，組成隨機顏色
 * @param min
 * @param max
 * @returns {string}
 */
randomColor = (min, max) => {
    let r = randomNum(min, max);
    let g = randomNum(min, max);
    let b = randomNum(min, max);
    return "rgb(" + r + "," + g + "," + b + ")";
}

/**
 * 在max和min之間生成隨機數
 * @param min
 * @param max
 * @returns {number}
 */
randomNum = (min, max) => {
    return Math.floor(Math.random() * (max - min) + min);
}

/**
 * 將產生的圖片放到downloads資料夾
 * @param codeImage
 */
downloadImage = (codeImage) => {
    const DOWNLOAD_DIR = path.join(process.env.HOME || process.env.USERPROFILE, 'downloads/');
    let out = fs.createWriteStream(DOWNLOAD_DIR + '/codeImg.png');
    let pngStream = codeImage.createPNGStream();
    pngStream.on('data', (chunk => out.write(chunk)))
    pngStream.on('end', () => console.log(`saved png to ${DOWNLOAD_DIR}`))
}

/**
 * 依據pattern產生驗證碼的charPool
 * @param pattern
 * @returns {string}
 */
patternDecide = (pattern) => {
    if (pattern === '2') {
        return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    } else if (pattern === '3') {
        return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789'
    } else {
        return '123456789';
    }
}

/**
 * 繪製主要內容，並回傳最終組成的驗證碼
 * @param ctx
 * @param width
 * @param height
 * @param number
 * @param charPool
 * @returns {string}
 */
drawContent = (ctx, width, height, number, charPool) => {
    ctx.textBaseline = 'middle';
    // 繪製背景色，顏色若太深可能導致看不清
    ctx.fillStyle = randomColor(180, 255);
    // 畫出矩形，要記得ctx.fillStyle放在ctx.fillRect哦。
    ctx.fillRect(0, 0, width, height);
    let code = '';
    // 生成指定位數的驗證碼。
    for (let i = 0; i < number; i++) {
        // 隨機獲取str的一個元素。
        let txt = charPool[randomNum(0, charPool.length)];
        // 將元素加入到code里。
        code += txt;
        // 隨機生成字體顏色
        ctx.fillStyle = randomColor(50, 160);
        // 隨機生成字體大小
        ctx.font = randomNum(25, 30) + 'px SimHei';
        ctx.shadowOffsetY = randomNum(-3, 3);
        ctx.shadowBlur = randomNum(-3, 3);
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        let x = width / (parseInt(number) + 1) * (i + 1);
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
    return code;
}

/**
 * 繪製干擾線
 * @param ctx
 * @param width
 * @param height
 */
drawInterferenceLine = (ctx, width, height) => {
    // 干擾線顏色
    ctx.strokeStyle = randomColor(40, 180);
    // 開始繪製
    ctx.beginPath();
    // 起點位置
    ctx.moveTo(randomNum(0, width), randomNum(0, height));
    // 終點位置
    ctx.lineTo(randomNum(0, width), randomNum(0, height));
    ctx.stroke();
}

/**
 * 繪製干擾點
 * @param ctx
 * @param width
 * @param height
 */
drawInterferenceDot = (ctx, width, height) => {
    for (let i = 0; i < width / 6; i++) {
        ctx.fillStyle = randomColor(0, 255);
        ctx.beginPath();
        ctx.arc(randomNum(0, width), randomNum(0, height), 1, 0, 2 * Math.PI);
        ctx.fill();
    }
}
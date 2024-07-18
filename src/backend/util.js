const axios = require('axios');
function formatString(template, obj, nullElement) {
    if (template == null) {return template;}
    return template.replace(/{([^}]+)}/g, (match, path) => {
        const keys = path.split('.');
        let value = obj;
        for (let key of keys) {
            value = value[key];
            if (value === undefined) {
                return nullElement; // 如果路径不存在，替换为nullElement
            }
        }
        return value;
    });
}

function evalString(template, ctx) {
    const safeEval = new Function('ctx', `return ${template}`);
    return safeEval(ctx);
}

function evalObject(obj, ctx) {
    if (typeof obj === 'string') {
        // 如果是字符串，尝试使用 evalString 处理
        try {
            return evalString(obj, ctx);
        } catch (error) {
            // 如果 evalString 失败，返回原始字符串
            return obj;
        }
    } else if (Array.isArray(obj)) {
        // 如果是数组，递归处理每个元素
        return obj.map(item => evalObject(item, ctx));
    } else if (obj !== null && typeof obj === 'object') {
        // 如果是对象，递归处理每个属性
        const result = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                result[key] = evalObject(obj[key], ctx);
            }
        }
        return result;
    } else {
        // 其他类型，直接返回
        return obj;
    }
}

async function checkBackend(url, timeout) {
    try {
        const response = await axios.get(url,{timeout: timeout});
        return {
            status: response.status,
            time: new Date().toLocaleString(),
            info: "",
        }
    } catch (errorInfo) {
        return {
            status: 500,
            time: new Date().toLocaleString(),
            info: errorInfo.message || "Unknown error",
        }
    }
}

module.exports = {
    formatString,
    evalString,
    evalObject,
    checkBackend
};
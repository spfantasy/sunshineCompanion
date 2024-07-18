const express = require('express');
const fs = require('fs');
const path = require("path");
const JSON5 = require('json5');
const {hasCycle} = require('./graphCheck.js');
const {graphWalk} = require("./graphWalk.js");
const {checkBackend} = require('./util.js');
const mysql = require('mysql2/promise');

console.log('server.js start');

// 获取 __filename 和 folder
const app = express();

const sqlEngines = {};

module.exports = async function startServer(folder, port) {
    const targetEnvJson = path.resolve(folder, 'config/targetEnv.json5');
    const targetEnv = JSON5.parse(fs.readFileSync(targetEnvJson, 'utf8'));
    for (const env of targetEnv) {
        for (const datasource of env.datasource || []) {
            const key = env.value + ":" + datasource.value;
            const params = datasource.params;
            console.log(`初始化数据库${key}：${params.username}@${params.host}:${params.port}-${params.database}`);
            sqlEngines[key] = await mysql.createConnection({
                database: params.database,
                user: params.username,
                password: params.password,
                host: params.host,
                port: params.port,
            });
        }
    }

    app.use(express.json());

    app.post('/api/json', async (req, res) => {
        try {
            const jsonEntity = path.resolve(folder, `config/${req.body.filename}`);
            const jsonObject = JSON5.parse(fs.readFileSync(jsonEntity, 'utf8'));
            res.json(jsonObject);
        } catch (error) {
            res.status(500).json({message: error.message});
        }
    });

    const flowMetaJson = path.resolve(folder, 'config/flowMeta.json5');
    let flowMeta = JSON5.parse(fs.readFileSync(flowMetaJson, 'utf8'));
    if (hasCycle(flowMeta)) {
        throw "flowMeta.json5 加载异常：数据成环";
    }
    app.post('/api/renderFlow', async (req, res) => {
        try {
            const newContext = await graphWalk(
                sqlEngines,
                req.body.env,
                JSON5.parse(req.body.query),
                req.body.focus,
                flowMeta);
            res.json(newContext);
        } catch (error) {
            console.log(`server.js ${error.message}`)
            res.status(500).json({message: error.message, name: error.name, stack: error.stack});
        }
    });

    app.post('/api/dumpFlow', async (req, res) => {
        try {
            fs.writeFileSync(flowMetaJson, JSON5.stringify(flowMeta, null, 2), 'utf8');
            res.status(200).json();
        } catch (error) {
            res.status(500).json({message: error.message});
        }
    })

    app.post('/api/deleteNode', async (req, res) => {
        try {
            flowMeta = flowMeta.filter(node => node.value.toLowerCase() !== req.body.nodeValue.toLowerCase());
            res.status(200).json();
        } catch (error) {
            res.status(500).json({message: error.message});
        }
    })

    app.post('/api/addOrUpdateNode', async (req, res) => {
        try {
            const newNode = JSON5.parse(req.body.node);
            flowMeta = flowMeta.filter(node => node.value.toLowerCase() !== newNode.value.toLowerCase());
            flowMeta.push(newNode);
            res.status(200).json();
        } catch (error) {
            res.status(500).json({message: error.message});
        }
    })

    app.post('/api/listNode', async (req, res) => {
        try {
            if (req.body.keyword == null || req.body.keyword === '') {
                res.json(flowMeta
                    .map(node => ({
                        value: node.value,
                        label: node.label,
                    }))
                );
            } else {
                res.json(flowMeta
                    .filter(
                        node => node.value.toLowerCase().includes(req.body.keyword.toLowerCase())
                            || node.label.toLowerCase().includes(req.body.keyword.toLowerCase())
                    ).map(node => ({
                        value: node.value,
                        label: node.label,
                    }))
                );
            }
        } catch (error) {
            res.status(500).json({message: error.message});
        }
    });

    app.post('/api/getNode', async (req, res) => {
        try {
            res.json(flowMeta.filter(node => node.value.toLowerCase() === req.body.keyword.toLowerCase())[0]);
        } catch (error) {
            res.status(500).json({message: error.message});
        }
    });

    app.post('/api/backendCheck', async (req, res) => {
        try {
            res.json(await checkBackend(req.body.url, req.body.timeout));
        } catch (error) {
            res.status(500).json({message: error.message});
        }
    });

    app.get('/health_check', async (req, res) => {
        try {
            res.status(200).json();
        } catch (error) {
            res.status(500).json({message: error.message});
        }
    });

    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    })
}
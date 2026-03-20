var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
var execFileAsync = promisify(execFile);
function proxyAtomicworkRequest(targetBaseUrl, req, body) {
    var _a, _b, _c, _d;
    var targetUrl = new URL((_a = req.url) !== null && _a !== void 0 ? _a : '/', targetBaseUrl);
    return execFileAsync('curl', [
        '-sS',
        '-X',
        (_b = req.method) !== null && _b !== void 0 ? _b : 'GET',
        '-H',
        "Content-Type: ".concat(((_c = req.headers['content-type']) === null || _c === void 0 ? void 0 : _c.toString()) || 'application/json'),
        '-H',
        "x-api-key: ".concat(((_d = req.headers['x-api-key']) === null || _d === void 0 ? void 0 : _d.toString()) || ''),
        '--data',
        body,
        '-w',
        '\n%{http_code}\n%{content_type}',
        targetUrl.toString(),
    ]).then(function (_a) {
        var stdout = _a.stdout;
        var lines = stdout.split('\n');
        var contentType = lines.pop() || 'application/json';
        var statusCode = Number(lines.pop() || '502');
        var responseBody = lines.join('\n');
        return {
            statusCode: statusCode,
            contentType: contentType,
            body: responseBody,
        };
    });
}
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [
            react(),
            {
                name: 'atomicwork-dev-proxy',
                configureServer: function (server) {
                    var _this = this;
                    server.middlewares.use(function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
                        var requestBody, upstreamResult, error_1;
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    if (!env.ATOMICWORK_PROXY_TARGET || !((_a = req.url) === null || _a === void 0 ? void 0 : _a.startsWith('/api/v1/'))) {
                                        next();
                                        return [2 /*return*/];
                                    }
                                    _c.label = 1;
                                case 1:
                                    _c.trys.push([1, 4, , 5]);
                                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                                            var chunks = [];
                                            req.on('data', function (chunk) { return chunks.push(Buffer.from(chunk)); });
                                            req.on('end', function () { return resolve(Buffer.concat(chunks).toString('utf8')); });
                                            req.on('error', reject);
                                        })];
                                case 2:
                                    requestBody = _c.sent();
                                    return [4 /*yield*/, proxyAtomicworkRequest(env.ATOMICWORK_PROXY_TARGET, __assign(__assign({}, req), { headers: __assign(__assign({}, req.headers), (env.ATOMICWORK_API_KEY
                                                ? {
                                                    'x-api-key': env.ATOMICWORK_API_KEY,
                                                }
                                                : {})) }), ['GET', 'HEAD'].includes((_b = req.method) !== null && _b !== void 0 ? _b : 'GET') ? '' : requestBody)];
                                case 3:
                                    upstreamResult = _c.sent();
                                    res.statusCode = upstreamResult.statusCode;
                                    res.setHeader('Content-Type', upstreamResult.contentType || 'application/json');
                                    res.end(upstreamResult.body);
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_1 = _c.sent();
                                    res.statusCode = 502;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.end(JSON.stringify({
                                        message: error_1 instanceof Error ? error_1.message : 'Atomicwork proxy failed.',
                                    }));
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                },
            },
        ],
        test: {
            environment: 'node',
        },
    };
});

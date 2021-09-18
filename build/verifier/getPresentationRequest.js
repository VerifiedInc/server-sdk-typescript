"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPresentationRequest = exports.getPresentationRequest = void 0;
var config_1 = require("../config");
var logger_1 = __importDefault(require("../logger"));
var networkRequestHelper_1 = require("../utils/networkRequestHelper");
function getPresentationRequest(authorization, id) {
    return __awaiter(this, void 0, void 0, function () {
        var receiptCallOptions, resp, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    receiptCallOptions = {
                        method: 'GET',
                        baseUrl: config_1.configData.SaaSUrl,
                        endPoint: "presentationRequestRepository/" + id,
                        header: { Authorization: authorization }
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, networkRequestHelper_1.makeNetworkRequest(receiptCallOptions)];
                case 2:
                    resp = _a.sent();
                    return [2 /*return*/, resp];
                case 3:
                    e_1 = _a.sent();
                    logger_1.default.error("Error getting PresentationRequest " + id + " from Unum ID SaaS, " + config_1.configData.SaaSUrl + ". Error " + e_1);
                    throw e_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.getPresentationRequest = getPresentationRequest;
// export function extractPresentationRequest (presentationRequestResponse: RESTResponse<PresentationRequestRepoDto>): WithVersion<PresentationRequest> {
function extractPresentationRequest(presentationRequestResponse) {
    var presentationRequestDto = presentationRequestResponse.body.presentationRequests['3.0.0'];
    // need to convert the times to Date objects for proto handling
    var result = __assign(__assign({}, presentationRequestDto), { presentationRequest: __assign(__assign({}, presentationRequestDto.presentationRequest), { createdAt: new Date(presentationRequestDto.presentationRequest.createdAt), updateAt: new Date(presentationRequestDto.presentationRequest.updatedAt), expiresAt: new Date(presentationRequestDto.presentationRequest.expiresAt) }) });
    return result;
}
exports.extractPresentationRequest = extractPresentationRequest;
//# sourceMappingURL=getPresentationRequest.js.map
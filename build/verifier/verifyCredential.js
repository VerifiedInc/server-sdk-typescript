"use strict";
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
exports.verifyCredentialHelper = exports.verifyCredential = void 0;
var library_crypto_1 = require("@unumid/library-crypto");
var lodash_1 = require("lodash");
var logger_1 = __importDefault(require("../logger"));
var types_1 = require("@unumid/types");
var didHelper_1 = require("../utils/didHelper");
var verify_1 = require("../utils/verify");
var __1 = require("..");
/**
 * Used to verify the credential signature after fetching the Did document's public key(s).
 * @param credential
 * @param authorization
 */
exports.verifyCredential = function (authorization, credential) { return __awaiter(void 0, void 0, void 0, function () {
    var proof, publicKeyInfoResponse, publicKeyInfoList, authToken, isVerified;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                proof = credential.proof;
                if (!proof) {
                    throw new __1.CustError(400, "Credential " + credential.id + " does not contain a proof attribute.");
                }
                return [4 /*yield*/, didHelper_1.getDidDocPublicKeys(authorization, proof.verificationMethod, 'secp256r1')];
            case 1:
                publicKeyInfoResponse = _a.sent();
                publicKeyInfoList = publicKeyInfoResponse.body;
                authToken = publicKeyInfoResponse.authToken;
                isVerified = exports.verifyCredentialHelper(credential, publicKeyInfoList);
                return [2 /*return*/, {
                        authToken: authToken,
                        body: isVerified
                    }];
        }
    });
}); };
/**
 * Used to verify the credential signature given the corresponding Did document's public key(s).
 * @param credential
 * @param authorization
 */
exports.verifyCredentialHelper = function (credential, publicKeyInfoList) {
    var proof = credential.proof;
    if (!proof) {
        throw new __1.CustError(400, "Credential " + credential.id + " does not contain a proof attribute.");
    }
    var data = lodash_1.omit(credential, 'proof');
    try {
        var bytes = types_1.UnsignedCredentialPb.encode(data).finish();
        var isVerified = false;
        // check all the public keys to see if any work, stop if one does
        for (var _i = 0, publicKeyInfoList_1 = publicKeyInfoList; _i < publicKeyInfoList_1.length; _i++) {
            var publicKeyInfo = publicKeyInfoList_1[_i];
            // verify the signature
            isVerified = verify_1.doVerify(proof.signatureValue, bytes, publicKeyInfo);
            if (isVerified)
                return true;
        }
        return false;
    }
    catch (e) {
        if (e instanceof library_crypto_1.CryptoError) {
            logger_1.default.error('Crypto error verifying the credential signature', e);
        }
        else {
            logger_1.default.error("Error verifying credential " + credential.id + " signature", e);
        }
        return false;
    }
};
//# sourceMappingURL=verifyCredential.js.map
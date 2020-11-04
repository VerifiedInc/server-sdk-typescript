"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
var library_issuer_verifier_utility_1 = require("library-issuer-verifier-utility");
var registerVerifier_1 = require("./registerVerifier");
var sendRequest_1 = require("./sendRequest");
var verifyPresentation_1 = require("./verifyPresentation");
var verifyNoPresentation_1 = require("./verifyNoPresentation");
var createVerifierApiKey_1 = require("./createVerifierApiKey");
var sendSms_1 = require("./sendSms");
var sendEmail_1 = require("./sendEmail");
var app = library_issuer_verifier_utility_1.initServer();
exports.app = app;
app.post('/api/register', registerVerifier_1.registerVerifier);
app.post('/api/sendRequest', sendRequest_1.sendRequest);
app.post('/api/verifyPresentation', verifyPresentation_1.verifyPresentation);
app.post('/api/verifyNoPresentation', verifyNoPresentation_1.verifyNoPresentation);
app.post('/api/createVerifierApiKey', createVerifierApiKey_1.createVerifierApiKey);
app.post('/api/sendSms', sendSms_1.sendSms);
app.post('/api/sendEmail', sendEmail_1.sendEmail);
app.use(function (err, req, res, next) {
    library_issuer_verifier_utility_1.customErrFormatter(err, res);
    next(err);
});

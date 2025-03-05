"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onNotificationCreated = exports.helloWorld = exports.deleteUser = exports.createUser = exports.setCustomClaims = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const nodemailer = __importStar(require("nodemailer"));
admin.initializeApp();
// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: functions.config().email.user,
        pass: functions.config().email.password
    }
});
exports.setCustomClaims = functions.https.onCall(async (data, context) => {
    // Check if request is made by an admin
    if (!context.auth || context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can set custom claims');
    }
    const { uid, claims } = data;
    try {
        await admin.auth().setCustomUserClaims(uid, claims);
        return { success: true };
    }
    catch (error) {
        console.error('Error setting custom claims:', error);
        throw new functions.https.HttpsError('internal', 'Error setting custom claims');
    }
});
exports.createUser = functions.firestore
    .document('users/{userId}')
    .onCreate(async (snap, context) => {
    const userData = snap.data();
    const password = userData.password;
    try {
        // Create user in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email: userData.email,
            password: password,
            displayName: userData.name,
        });
        // Set custom claims based on user role
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            role: userData.role
        });
        // Update the Firestore document with the user's UID and remove the password
        const userRef = snap.ref;
        const updatedData = Object.assign(Object.assign({}, userData), { uid: userRecord.uid });
        delete updatedData.password; // Remove password from Firestore
        await userRef.set(updatedData, { merge: true });
        return { success: true };
    }
    catch (error) {
        // If user creation fails, delete the Firestore document
        await snap.ref.delete();
        console.error('Error creating user:', error);
        throw error;
    }
});
exports.deleteUser = functions.firestore
    .document('users/{userId}')
    .onDelete(async (snap, context) => {
    const userId = context.params.userId;
    try {
        // Delete the user from Firebase Auth
        await admin.auth().deleteUser(userId);
        return { success: true };
    }
    catch (error) {
        console.error('Error deleting user from Firebase Auth:', error);
        throw error;
    }
});
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.json({
        message: 'Hello from Firebase!'
    });
});
// Handle notification creation and send emails
exports.onNotificationCreated = functions.firestore
    .document('notifications/{notificationId}')
    .onCreate(async (snap, context) => {
    try {
        const notification = snap.data();
        const recipientDoc = await admin.firestore()
            .collection('users')
            .doc(notification.recipientId)
            .get();
        if (!recipientDoc.exists) {
            console.error('Recipient not found:', notification.recipientId);
            return;
        }
        const recipient = recipientDoc.data();
        const preferencesDoc = await admin.firestore()
            .collection('notificationPreferences')
            .doc(notification.recipientId)
            .get();
        const preferences = preferencesDoc.data();
        // Check if user wants email notifications
        if (!(preferences === null || preferences === void 0 ? void 0 : preferences.emailNotifications)) {
            console.log('User has disabled email notifications');
            return;
        }
        // Check if user wants this type of notification
        if (!preferences.notificationTypes[notification.type]) {
            console.log('User has disabled this type of notification');
            return;
        }
        let subject = '';
        let text = '';
        switch (notification.type) {
            case 'article_approval':
                subject = `Article ${notification.data.status}: ${notification.data.articleTitle}`;
                text = notification.data.message;
                break;
            case 'holiday_request':
                subject = 'Holiday Request Update';
                text = notification.data.message;
                break;
            case 'task_assignment':
                subject = 'New Task Assignment';
                text = notification.data.message;
                break;
            case 'faq_response':
                subject = 'New Response to Your Question';
                text = notification.data.message;
                break;
        }
        await transporter.sendMail({
            from: '"CashSentinel CRM" <noreply@cashsentinel.com>',
            to: recipient.email,
            subject,
            text
        });
        console.log('Email sent successfully to:', recipient.email);
    }
    catch (error) {
        console.error('Error sending notification email:', error);
    }
});
//# sourceMappingURL=index.js.map